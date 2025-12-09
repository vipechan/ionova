// SECURITY FIX M-2: RPC Rate Limiting Module

use governor::{Quota, RateLimiter, state::{InMemoryState, NotKeyed}, clock::DefaultClock};
use std::num::NonZeroU32;
use std::sync::Arc;
use parking_lot::Mutex;
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

/// Rate limiter for RPC endpoints
pub struct RpcRateLimiter {
    /// Global rate limiter (100 requests/second)
    global: Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>>,
    
    /// Per-IP rate limiters (10 requests/second per IP)
    per_ip: Arc<Mutex<HashMap<String, RateLimiter<NotKeyed, InMemoryState, DefaultClock>>>>,
}

impl RpcRateLimiter {
    pub fn new() -> Self {
        let global_quota = Quota::per_second(NonZeroU32::new(100).unwrap());
        
        Self {
            global: Arc::new(RateLimiter::direct(global_quota)),
            per_ip: Arc::new(Mutex::new(HashMap::new())),
        }
    }
    
    /// Check if request is allowed
    pub fn check_rate_limit(&self, ip: Option<&str>) -> Result<(), String> {
        // Check global limit
        if self.global.check().is_err() {
            return Err("Global rate limit exceeded".to_string());
        }
        
        // Check per-IP limit if IP provided
        if let Some(ip_addr) = ip {
            let mut limiters = self.per_ip.lock();
            
            // Get or create limiter for this IP
            let limiter = limiters.entry(ip_addr.to_string()).or_insert_with(|| {
                let quota = Quota::per_second(NonZeroU32::new(10).unwrap());
                RateLimiter::direct(quota)
            });
            
            if limiter.check().is_err() {
                return Err(format!("Rate limit exceeded for IP: {}", ip_addr));
            }
        }
        
        Ok(())
    }
    
    /// Clean up old IP limiters (call periodically)
    pub fn cleanup_old_limiters(&self) {
        let mut limiters = self.per_ip.lock();
        
        // Remove limiters that haven't been used in 5 minutes
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        
        // Note: In production, track last access time
        // For now, just limit total number of tracked IPs
        if limiters.len() > 10000 {
            limiters.clear();
        }
    }
}

impl Default for RpcRateLimiter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread;
    use std::time::Duration;
    
    #[test]
    fn test_global_rate_limit() {
        let limiter = RpcRateLimiter::new();
        
        // Should allow first 100 requests
        for _ in 0..100 {
            assert!(limiter.check_rate_limit(None).is_ok());
        }
        
        // 101st should fail
        assert!(limiter.check_rate_limit(None).is_err());
        
        // Wait for quota to refill
        thread::sleep(Duration::from_secs(1));
        
        // Should work again
        assert!(limiter.check_rate_limit(None).is_ok());
    }
    
    #[test]
    fn test_per_ip_rate_limit() {
        let limiter = RpcRateLimiter::new();
        
        // IP1 gets 10 requests
        for _ in 0..10 {
            assert!(limiter.check_rate_limit(Some("192.168.1.1")).is_ok());
        }
        
        // 11th from IP1 should fail
        assert!(limiter.check_rate_limit(Some("192.168.1.1")).is_err());
        
        // But IP2 should still work
        assert!(limiter.check_rate_limit(Some("192.168.1.2")).is_ok());
    }
}
