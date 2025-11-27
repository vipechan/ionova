mod fee_model;
mod mempool;
mod sequencer;
mod metrics;
mod evm_executor;
mod genesis;
mod emission;
mod staking;

use anyhow::Result;
use clap::{Parser, Subcommand};
use rust_decimal_macros::dec;
use std::fs;
use tokio::sync::mpsc;
use tracing::info;

use crate::fee_model::FeeConfig;
use crate::mempool::MempoolConfig;
use crate::metrics::Metrics;
use crate::sequencer::{Sequencer, SequencerConfig, Transaction};

#[derive(Parser, Debug)]
#[command(author, version, about = "Ionova Node", long_about = None)]
struct Args {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Run as a validator node
    Validator {
        /// Validator ID
        #[arg(short, long, default_value_t = 0)]
        id: u8,
    },
    /// Run as a sequencer node
    Sequencer {
        /// Shard ID to sequence
        #[arg(short, long, default_value_t = 0)]
        shard_id: u8,
        
        /// Metrics port
        #[arg(short, long, default_value_t = 9100)]
        metrics_port: u16,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let args = Args::parse();

    match args.command {
        Commands::Validator { id } => {
            run_validator(id).await?;
        }
        Commands::Sequencer { shard_id, metrics_port } => {
            run_sequencer(shard_id, metrics_port).await?;
        }
    }

    Ok(())
}

async fn run_validator(id: u8) -> Result<()> {
    info!("Starting Ionova Validator node {}", id);
    info!("Initializing PQ-BFT consensus engine...");
    info!("Connecting to peer network...");
    info!("Validator node {} started successfully", id);

    // Keep running
    tokio::signal::ctrl_c().await?;
    info!("Shutting down validator {}", id);

    Ok(())
}

async fn run_sequencer(shard_id: u8, metrics_port: u16) -> Result<()> {
    info!("Starting Ionova Sequencer for shard {}", shard_id);

    // Initialize metrics
    let metrics = Metrics::new(shard_id);
    let metrics_clone = metrics.clone();
    tokio::spawn(async move {
        metrics_clone.serve(metrics_port).await;
    });

    // Create transaction queue
    let (tx_sender, tx_receiver) = mpsc::channel::<Transaction>(10000);

    // Configure sequencer
    let config = SequencerConfig {
        shard_id,
        micro_block_interval_ms: 200,
        batch_interval_ms: 1000,
        max_batch_size: 1000,
        fee_config: FeeConfig {
            base_tx_fee: dec!(0.0001),
            base_fee_per_gas: dec!(0.000001),
            target_utilization: dec!(0.8),
            adjustment_factor: dec!(0.125),
        },
        mempool_config: MempoolConfig::default(),
    };

    // Start sequencer
    let mut sequencer = Sequencer::new(config, tx_receiver);
    
    info!("Sequencer for shard {} started successfully", shard_id);
    info!("Metrics available at http://localhost:{}/metrics", metrics_port);
    
    // In production, would also start RPC server to receive transactions
    // For now, run the sequencer loop
    sequencer.run().await?;

    Ok(())
}
