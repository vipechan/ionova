use prometheus::{Encoder, IntCounter, IntGauge, Registry, TextEncoder};
use std::sync::Arc;
use warp::Filter;

/// Metrics for monitoring node performance
#[derive(Clone)]
pub struct Metrics {
    pub registry: Arc<Registry>,
    pub transactions_processed: IntCounter,
    pub transactions_per_second: IntGauge,
    pub current_mempool_size: IntGauge,
    pub avg_latency_ms: IntGauge,
    pub blocks_produced: IntCounter,
    pub batch_commitments: IntCounter,
}

impl Metrics {
    pub fn new(shard_id: u8) -> Self {
        let registry = Arc::new(Registry::new());
        
        let transactions_processed = IntCounter::new(
            format!("shard_{}_transactions_processed_total", shard_id),
            "Total number of transactions processed",
        )
        .unwrap();
        
        let transactions_per_second = IntGauge::new(
            format!("shard_{}_transactions_per_second", shard_id),
            "Current transactions per second",
        )
        .unwrap();
        
        let current_mempool_size = IntGauge::new(
            format!("shard_{}_mempool_size", shard_id),
            "Current mempool size",
        )
        .unwrap();
        
        let avg_latency_ms = IntGauge::new(
            format!("shard_{}_avg_latency_milliseconds", shard_id),
            "Average transaction latency in milliseconds",
        )
        .unwrap();
        
        let blocks_produced = IntCounter::new(
            format!("shard_{}_blocks_produced_total", shard_id),
            "Total number of blocks produced",
        )
        .unwrap();
        
        let batch_commitments = IntCounter::new(
            format!("shard_{}_batch_commitments_total", shard_id),
            "Total number of batch commitments",
        )
        .unwrap();

        registry.register(Box::new(transactions_processed.clone())).unwrap();
        registry.register(Box::new(transactions_per_second.clone())).unwrap();
        registry.register(Box::new(current_mempool_size.clone())).unwrap();
        registry.register(Box::new(avg_latency_ms.clone())).unwrap();
        registry.register(Box::new(blocks_produced.clone())).unwrap();
        registry.register(Box::new(batch_commitments.clone())).unwrap();

        Self {
            registry,
            transactions_processed,
            transactions_per_second,
            current_mempool_size,
            avg_latency_ms,
            blocks_produced,
            batch_commitments,
        }
    }

    /// Start metrics HTTP server
    pub async fn serve(self, port: u16) {
        let metrics = warp::path("metrics").map(move || {
            let encoder = TextEncoder::new();
            let metric_families = self.registry.gather();
            let mut buffer = Vec::new();
            encoder.encode(&metric_families, &mut buffer).unwrap();
            String::from_utf8(buffer).unwrap()
        });

        warp::serve(metrics)
            .run(([0, 0, 0, 0], port))
            .await;
    }
}
