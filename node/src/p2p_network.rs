use libp2p::{
    gossipsub, identity, mdns, noise, swarm::NetworkBehaviour, swarm::SwarmEvent, tcp, yamux, PeerId,
    Swarm, Transport,
};
use libp2p::gossipsub::{Gossipsub, GossipsubEvent, IdentTopic};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::time::Duration;
use anyhow::Result;
use tokio::sync::mpsc;
use serde::{Serialize, Deserialize};

/// P2P Network Manager for Ionova
pub struct P2PNetwork {
    swarm: Swarm<IonovaBehaviour>,
    peer_id: PeerId,
    block_topic: IdentTopic,
    tx_topic: IdentTopic,
}

/// Network behavior combining gossipsub and mDNS
#[derive(NetworkBehaviour)]
struct IonovaBehaviour {
    gossipsub: Gossipsub,
    mdns: mdns::tokio::Behaviour,
}

/// Message types for P2P communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum P2PMessage {
    NewBlock {
        block_hash: String,
        block_data: Vec<u8>,
        validator_signature: Vec<u8>,
    },
    NewTransaction {
        tx_hash: String,
        tx_data: Vec<u8>,
    },
    BlockRequest {
        block_hash: String,
    },
    BlockResponse {
        block_hash: String,
        block_data: Vec<u8>,
    },
}

impl P2PNetwork {
    pub async fn new(port: u16) -> Result<Self> {
        // Generate keypair for peer identity
        let local_key = identity::Keypair::generate_ed25519();
        let peer_id = PeerId::from(local_key.public());
        
        println!("🌐 Local peer id: {:?}", peer_id);

        // Configure Gossipsub
        let gossipsub_config = gossipsub::ConfigBuilder::default()
            .heartbeat_interval(Duration::from_secs(1))
            .validation_mode(gossipsub::ValidationMode::Strict)
            .message_id_fn(|message: &gossipsub::Message| {
                let mut hasher = DefaultHasher::new();
                message.data.hash(&mut hasher);
                gossipsub::MessageId::from(hasher.finish().to_string())
            })
            .build()
            .expect("Valid gossipsub config");

        // Create gossipsub behavior
        let mut gossipsub = Gossipsub::new(
            gossipsub::MessageAuthenticity::Signed(local_key.clone()),
            gossipsub_config,
        )
        .expect("Gossipsub creation failed");

        // Create topics
        let block_topic = IdentTopic::new("ionova-blocks");
        let tx_topic = IdentTopic::new("ionova-transactions");

        // Subscribe to topics
        gossipsub.subscribe(&block_topic)?;
        gossipsub.subscribe(&tx_topic)?;

        // Create mDNS for peer discovery
        let mdns = mdns::tokio::Behaviour::new(mdns::Config::default(), peer_id)?;

        // Build behavior
        let behaviour = IonovaBehaviour { gossipsub, mdns };

        // Create transport
        let transport = tcp::tokio::Transport::default()
            .upgrade(libp2p::core::upgrade::Version::V1)
            .authenticate(noise::Config::new(&local_key)?)
            .multiplex(yamux::Config::default())
            .boxed();

        // Create swarm
        let swarm = Swarm::new(
            transport,
            behaviour,
            peer_id,
            libp2p::swarm::Config::with_tokio_executor()
                .with_idle_connection_timeout(Duration::from_secs(60)),
        );

        Ok(Self {
            swarm,
            peer_id,
            block_topic,
            tx_topic,
        })
    }

    /// Start listening on specified port
    pub async fn listen(&mut self, port: u16) -> Result<()> {
        let addr = format!("/ip4/0.0.0.0/tcp/{}", port).parse()?;
        self.swarm.listen_on(addr)?;
        Ok(())
    }

    /// Broadcast a new block to network
    pub async fn broadcast_block(&mut self, block_hash: String, block_data: Vec<u8>, signature: Vec<u8>) -> Result<()> {
        let message = P2PMessage::NewBlock {
            block_hash,
            block_data,
            validator_signature: signature,
        };
        
        let data = serde_json::to_vec(&message)?;
        self.swarm.behaviour_mut().gossipsub.publish(self.block_topic.clone(), data)?;
        Ok(())
    }

    /// Broadcast a new transaction to network
    pub async fn broadcast_transaction(&mut self, tx_hash: String, tx_data: Vec<u8>) -> Result<()> {
        let message = P2PMessage::NewTransaction { tx_hash, tx_data };
        let data = serde_json::to_vec(&message)?;
        self.swarm.behaviour_mut().gossipsub.publish(self.tx_topic.clone(), data)?;
        Ok(())
    }

    /// Process network events
    pub async fn handle_events(&mut self, block_tx: mpsc::Sender<P2PMessage>, tx_tx: mpsc::Sender<P2PMessage>) {
        loop {
            match self.swarm.select_next_some().await {
                SwarmEvent::Behaviour(IonovaBehaviourEvent::Mdns(event)) => {
                    self.handle_mdns_event(event);
                }
                SwarmEvent::Behaviour(IonovaBehaviourEvent::Gossipsub(event)) => {
                    self.handle_gossipsub_event(event, &block_tx, &tx_tx).await;
                }
                SwarmEvent::NewListenAddr { address, .. } => {
                    println!("📡 Listening on {:?}", address);
                }
                SwarmEvent::ConnectionEstablished { peer_id, .. } => {
                    println!("🤝 Connected to peer: {:?}", peer_id);
                }
                _ => {}
            }
        }
    }

    fn handle_mdns_event(&mut self, event: mdns::Event) {
        match event {
            mdns::Event::Discovered(peers) => {
                for (peer_id, _addr) in peers {
                    println!("🔍 Discovered peer: {:?}", peer_id);
                    self.swarm.behaviour_mut().gossipsub.add_explicit_peer(&peer_id);
                }
            }
            mdns::Event::Expired(peers) => {
                for (peer_id, _addr) in peers {
                    println!("👋 Peer expired: {:?}", peer_id);
                    self.swarm.behaviour_mut().gossipsub.remove_explicit_peer(&peer_id);
                }
            }
        }
    }

    async fn handle_gossipsub_event(
        &mut self,
        event: GossipsubEvent,
        block_tx: &mpsc::Sender<P2PMessage>,
        tx_tx: &mpsc::Sender<P2PMessage>,
    ) {
        if let GossipsubEvent::Message { propagation_source, message, .. } = event {
            if let Ok(p2p_message) = serde_json::from_slice::<P2PMessage>(&message.data) {
                match p2p_message {
                    P2PMessage::NewBlock { .. } => {
                        let _ = block_tx.send(p2p_message).await;
                    }
                    P2PMessage::NewTransaction { .. } => {
                        let _ = tx_tx.send(p2p_message).await;
                    }
                    _ => {}
                }
            }
        }
    }

    pub fn peer_count(&self) -> usize {
        self.swarm.behaviour().gossipsub.all_peers().count()
    }
}
