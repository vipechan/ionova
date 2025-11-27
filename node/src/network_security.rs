use std::collections::HashMap;
use std::net::IpAddr;
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};

/// Network security module for DDoS protection and peer management
/// Protects against network-level attacks and malicious peers

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkSecurityConfig {
    /// Maximum connections per IP
    pub max_connections_per_ip: usize,
    
    /// Maximum requests per second per IP
    pub max_requests_per_sec: u32,
    
    /// Ban duration in seconds
    pub ban_duration: u64,
    
    /// Maximum failed connection attempts
    pub max_failed_attempts: u32,
    
    /// Enable IP whitelisting
    pub enable_whitelist: bool,
    
    /// Enable IP blacklisting
    pub enable_blacklist: bool,
    
    /// Maximum peer connections
    pub max_peer_connections: usize,
    
    /// Minimum peer reputation score
    pub min_peer_reputation: i32,
}

impl Default for NetworkSecurityConfig {
    fn default() -> Self {
        Self {
            max_connections_per_ip: 10,
            max_requests_per_sec: 1000,
            ban_duration: 3600, // 1 hour
            max_failed_attempts: 5,
            enable_whitelist: false,
            enable_blacklist: true,
            max_peer_connections: 100,
            min_peer_reputation: -10,
        }
    }
}

#[derive(Debug, Clone)]
pub struct PeerInfo {
    pub ip: IpAddr,
    pub reputation: i32,
    pub connection_count: usize,
    pub request_count: u32,
    pub last_request: u64,
    pub failed_attempts: u32,
    pub banned_until: Option<u64>,
}

impl PeerInfo {
    pub fn new(ip: IpAddr) -> Self {
        Self {
            ip,
            reputation: 0,
            connection_count: 0,
            request_count: 0,
            last_request: 0,
            failed_attempts: 0,
            banned_until: None,
        }
    }

    pub fn is_banned(&self) -> bool {
        if let Some(banned_until) = self.banned_until {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
            
            now < banned_until
        } else {
            false
        }
    }
}

#[derive(Debug)]
pub struct NetworkSecurity {
    config: NetworkSecurityConfig,
    peers: HashMap<IpAddr, PeerInfo>,
    whitelist: Vec<IpAddr>,
    blacklist: Vec<IpAddr>,
}

impl NetworkSecurity {
    pub fn new(config: NetworkSecurityConfig) -> Self {
        Self {
            config,
            peers: HashMap::new(),
            whitelist: Vec::new(),
            blacklist: Vec::new(),
        }
    }

    /// Check if connection is allowed
    pub fn allow_connection(&mut self, ip: IpAddr) -> Result<(), NetworkSecurityError> {
        // Check whitelist
        if self.config.enable_whitelist && !self.whitelist.contains(&ip) {
            return Err(NetworkSecurityError::NotWhitelisted);
        }

        // Check blacklist
        if self.config.enable_blacklist && self.blacklist.contains(&ip) {
            return Err(NetworkSecurityError::Blacklisted);
        }

        // Get or create peer info
        let peer = self.peers.entry(ip).or_insert_with(|| PeerInfo::new(ip));

        // Check if banned
        if peer.is_banned() {
            return Err(NetworkSecurityError::Banned);
        }

        // Check connection limit
        if peer.connection_count >= self.config.max_connections_per_ip {
            return Err(NetworkSecurityError::TooManyConnections);
        }

        // Check reputation
        if peer.reputation < self.config.min_peer_reputation {
            return Err(NetworkSecurityError::LowReputation);
        }

        // Increment connection count
        peer.connection_count += 1;

        Ok(())
    }

    /// Check if request is allowed (rate limiting)
    pub fn allow_request(&mut self, ip: IpAddr) -> Result<(), NetworkSecurityError> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let peer = self.peers.entry(ip).or_insert_with(|| PeerInfo::new(ip));

        // Check if banned
        if peer.is_banned() {
            return Err(NetworkSecurityError::Banned);
        }

        // Reset counter if more than 1 second has passed
        if now - peer.last_request >= 1 {
            peer.request_count = 0;
            peer.last_request = now;
        }

        // Check rate limit
        if peer.request_count >= self.config.max_requests_per_sec {
            // Auto-ban for excessive requests
            self.ban_peer(ip, "Rate limit exceeded");
            return Err(NetworkSecurityError::RateLimitExceeded);
        }

        peer.request_count += 1;

        Ok(())
    }

    /// Record failed connection attempt
    pub fn record_failed_attempt(&mut self, ip: IpAddr) {
        let peer = self.peers.entry(ip).or_insert_with(|| PeerInfo::new(ip));
        peer.failed_attempts += 1;

        // Auto-ban after too many failed attempts
        if peer.failed_attempts >= self.config.max_failed_attempts {
            self.ban_peer(ip, "Too many failed attempts");
        }

        // Decrease reputation
        peer.reputation -= 1;
    }

    /// Record successful connection
    pub fn record_success(&mut self, ip: IpAddr) {
        let peer = self.peers.entry(ip).or_insert_with(|| PeerInfo::new(ip));
        peer.failed_attempts = 0;
        
        // Increase reputation
        if peer.reputation < 100 {
            peer.reputation += 1;
        }
    }

    /// Ban peer
    pub fn ban_peer(&mut self, ip: IpAddr, reason: &str) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        let peer = self.peers.entry(ip).or_insert_with(|| PeerInfo::new(ip));
        peer.banned_until = Some(now + self.config.ban_duration);

        println!("Banned peer {} for: {}", ip, reason);
    }

    /// Unban peer
    pub fn unban_peer(&mut self, ip: IpAddr) {
        if let Some(peer) = self.peers.get_mut(&ip) {
            peer.banned_until = None;
            peer.failed_attempts = 0;
        }
    }

    /// Add to whitelist
    pub fn add_to_whitelist(&mut self, ip: IpAddr) {
        if !self.whitelist.contains(&ip) {
            self.whitelist.push(ip);
        }
    }

    /// Add to blacklist
    pub fn add_to_blacklist(&mut self, ip: IpAddr) {
        if !self.blacklist.contains(&ip) {
            self.blacklist.push(ip);
        }
    }

    /// Remove from whitelist
    pub fn remove_from_whitelist(&mut self, ip: &IpAddr) {
        self.whitelist.retain(|x| x != ip);
    }

    /// Remove from blacklist
    pub fn remove_from_blacklist(&mut self, ip: &IpAddr) {
        self.blacklist.retain(|x| x != ip);
    }

    /// Disconnect peer
    pub fn disconnect_peer(&mut self, ip: IpAddr) {
        if let Some(peer) = self.peers.get_mut(&ip) {
            if peer.connection_count > 0 {
                peer.connection_count -= 1;
            }
        }
    }

    /// Get peer reputation
    pub fn get_reputation(&self, ip: &IpAddr) -> i32 {
        self.peers.get(ip).map(|p| p.reputation).unwrap_or(0)
    }

    /// Update peer reputation
    pub fn update_reputation(&mut self, ip: IpAddr, delta: i32) {
        let peer = self.peers.entry(ip).or_insert_with(|| PeerInfo::new(ip));
        peer.reputation += delta;

        // Clamp reputation between -100 and 100
        if peer.reputation > 100 {
            peer.reputation = 100;
        } else if peer.reputation < -100 {
            peer.reputation = -100;
        }
    }

    /// Get active peer count
    pub fn active_peer_count(&self) -> usize {
        self.peers.values().filter(|p| p.connection_count > 0).count()
    }

    /// Get banned peer count
    pub fn banned_peer_count(&self) -> usize {
        self.peers.values().filter(|p| p.is_banned()).count()
    }

    /// Cleanup old peer data
    pub fn cleanup(&mut self) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();

        // Remove peers that are not banned and have no connections
        self.peers.retain(|_, peer| {
            peer.connection_count > 0 || peer.is_banned()
        });

        // Unban peers whose ban has expired
        for peer in self.peers.values_mut() {
            if let Some(banned_until) = peer.banned_until {
                if now >= banned_until {
                    peer.banned_until = None;
                    peer.failed_attempts = 0;
                }
            }
        }
    }

    /// Get network statistics
    pub fn get_stats(&self) -> NetworkStats {
        NetworkStats {
            total_peers: self.peers.len(),
            active_peers: self.active_peer_count(),
            banned_peers: self.banned_peer_count(),
            whitelisted_ips: self.whitelist.len(),
            blacklisted_ips: self.blacklist.len(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStats {
    pub total_peers: usize,
    pub active_peers: usize,
    pub banned_peers: usize,
    pub whitelisted_ips: usize,
    pub blacklisted_ips: usize,
}

#[derive(Debug, Clone)]
pub enum NetworkSecurityError {
    NotWhitelisted,
    Blacklisted,
    Banned,
    TooManyConnections,
    RateLimitExceeded,
    LowReputation,
}

impl std::fmt::Display for NetworkSecurityError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            NetworkSecurityError::NotWhitelisted => write!(f, "IP not whitelisted"),
            NetworkSecurityError::Blacklisted => write!(f, "IP is blacklisted"),
            NetworkSecurityError::Banned => write!(f, "IP is banned"),
            NetworkSecurityError::TooManyConnections => write!(f, "Too many connections from IP"),
            NetworkSecurityError::RateLimitExceeded => write!(f, "Rate limit exceeded"),
            NetworkSecurityError::LowReputation => write!(f, "Peer reputation too low"),
        }
    }
}

impl std::error::Error for NetworkSecurityError {}

#[cfg(test)]
mod tests {
    use super::*;
    use std::net::{IpAddr, Ipv4Addr};

    #[test]
    fn test_connection_limit() {
        let mut config = NetworkSecurityConfig::default();
        config.max_connections_per_ip = 2;
        let mut security = NetworkSecurity::new(config);

        let ip = IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1));

        // First two connections should succeed
        assert!(security.allow_connection(ip).is_ok());
        assert!(security.allow_connection(ip).is_ok());

        // Third should fail
        assert!(security.allow_connection(ip).is_err());
    }

    #[test]
    fn test_rate_limiting() {
        let mut config = NetworkSecurityConfig::default();
        config.max_requests_per_sec = 2;
        let mut security = NetworkSecurity::new(config);

        let ip = IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1));

        // First two requests should succeed
        assert!(security.allow_request(ip).is_ok());
        assert!(security.allow_request(ip).is_ok());

        // Third should fail and ban
        assert!(security.allow_request(ip).is_err());
    }

    #[test]
    fn test_reputation_system() {
        let config = NetworkSecurityConfig::default();
        let mut security = NetworkSecurity::new(config);

        let ip = IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1));

        // Initial reputation should be 0
        assert_eq!(security.get_reputation(&ip), 0);

        // Increase reputation
        security.update_reputation(ip, 10);
        assert_eq!(security.get_reputation(&ip), 10);

        // Decrease reputation
        security.update_reputation(ip, -5);
        assert_eq!(security.get_reputation(&ip), 5);
    }

    #[test]
    fn test_ban_system() {
        let config = NetworkSecurityConfig::default();
        let mut security = NetworkSecurity::new(config);

        let ip = IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1));

        // Ban peer
        security.ban_peer(ip, "Test ban");

        // Connection should be rejected
        assert!(security.allow_connection(ip).is_err());

        // Unban peer
        security.unban_peer(ip);

        // Connection should succeed
        assert!(security.allow_connection(ip).is_ok());
    }

    #[test]
    fn test_failed_attempts() {
        let mut config = NetworkSecurityConfig::default();
        config.max_failed_attempts = 3;
        let mut security = NetworkSecurity::new(config);

        let ip = IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1));

        // Record failed attempts
        security.record_failed_attempt(ip);
        security.record_failed_attempt(ip);
        security.record_failed_attempt(ip);

        // Should be banned after 3 attempts
        assert!(security.allow_connection(ip).is_err());
    }
}
