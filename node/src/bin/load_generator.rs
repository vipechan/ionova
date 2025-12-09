use anyhow::Result;
use clap::Parser;
use futures::future::join_all;
use rand::Rng;
use rand::SeedableRng;
use rust_decimal::Decimal;
use rust_decimal_macros::dec;
use std::sync::Arc;
use std::time::Duration;
use tokio::time::Instant;
use tracing::info;

/// Transaction structure for load testing
#[derive(Debug, Clone)]
struct TestTransaction {
    from: String,
    to: String,
    amount: Decimal,
    gas_limit: u64,
    tip: Decimal,
    shard_id: u8,
    nonce: u64,
}

/// CLI arguments for load generator
#[derive(Parser, Debug)]
#[command(author, version, about = "Ionova Load Generator", long_about = None)]
struct Args {
    /// Number of shards to test
    #[arg(short, long, default_value_t = 8)]
    shards: u8,

    /// Target TPS per shard
    #[arg(short, long, default_value_t = 5000)]
    tps_per_shard: u64,

    /// Duration of test in seconds
    #[arg(short, long, default_value_t = 60)]
    duration: u64,

    /// Number of concurrent workers per shard
    #[arg(short, long, default_value_t = 100)]
    workers: usize,

    /// Starting RPC port for shards
    #[arg(long, default_value_t = 27000)]
    rpc_port_start: u16,
}

struct LoadGenerator {
    args: Args,
    start_time: Instant,
    total_sent: Arc<tokio::sync::Mutex<u64>>,
    total_success: Arc<tokio::sync::Mutex<u64>>,
    total_failed: Arc<tokio::sync::Mutex<u64>>,
    latencies: Arc<tokio::sync::Mutex<Vec<u64>>>,
}

impl LoadGenerator {
    fn new(args: Args) -> Self {
        Self {
            args,
            start_time: Instant::now(),
            total_sent: Arc::new(tokio::sync::Mutex::new(0)),
            total_success: Arc::new(tokio::sync::Mutex::new(0)),
            total_failed: Arc::new(tokio::sync::Mutex::new(0)),
            latencies: Arc::new(tokio::sync::Mutex::new(Vec::new())),
        }
    }

    async fn run(&self) -> Result<()> {
        info!(
            "Starting load test: {} shards, {} TPS/shard, {} seconds",
            self.args.shards, self.args.tps_per_shard, self.args.duration
        );

        let mut tasks = Vec::new();

        // Start workers for each shard
        for shard_id in 0..self.args.shards {
            let task = self.spawn_shard_workers(shard_id);
            tasks.push(task);
        }

        // Start metrics reporter in background
        let _ = self.spawn_metrics_reporter();

        // Wait for all tasks to complete
        join_all(tasks).await;

        self.print_final_report().await;

        Ok(())
    }

    async fn spawn_shard_workers(&self, shard_id: u8) -> Result<()> {
        let workers = self.args.workers;
        let tps_target = self.args.tps_per_shard;
        let duration = self.args.duration;
        
        // Calculate delay between transactions
        let tx_per_worker_per_sec = tps_target / workers as u64;
        let delay_micros = if tx_per_worker_per_sec > 0 {
            1_000_000 / tx_per_worker_per_sec
        } else {
            1000
        };

        let mut handles = Vec::new();

        for _worker_id in 0..workers {
            let total_sent = self.total_sent.clone();
            let total_success = self.total_success.clone();
            let total_failed = self.total_failed.clone();
            let latencies = self.latencies.clone();
            let start_time = self.start_time;

            let handle = tokio::spawn(async move {
                let mut rng = rand::rngs::StdRng::from_entropy();
                let end_time = start_time + Duration::from_secs(duration);

                while Instant::now() < end_time {
                    let tx_start = Instant::now();

                    // Generate random transaction
                    let tx = TestTransaction {
                        from: format!("addr_{}", rng.gen::<u64>()),
                        to: format!("addr_{}", rng.gen::<u64>()),
                        amount: dec!(1.0),
                        gas_limit: 50000,
                        tip: dec!(0.0),
                        shard_id,
                        nonce: rng.gen(),
                    };

                    // Simulate sending transaction (in production, send to RPC)
                    let success = simulate_send_tx(&tx).await;

                    let latency_us = tx_start.elapsed().as_micros() as u64;

                    // Update metrics
                    {
                        let mut sent = total_sent.lock().await;
                        *sent += 1;
                    }

                    if success {
                        let mut succ = total_success.lock().await;
                        *succ += 1;

                        let mut lats = latencies.lock().await;
                        lats.push(latency_us);
                    } else {
                        let mut failed = total_failed.lock().await;
                        *failed += 1;
                    }

                    // Rate limiting
                    tokio::time::sleep(Duration::from_micros(delay_micros)).await;
                }
            });

            handles.push(handle);
        }

        // Wait for all workers to complete
        for handle in handles {
            handle.await?;
        }

        Ok(())
    }

    fn spawn_metrics_reporter(&self) {
        let total_sent = self.total_sent.clone();
        let total_success = self.total_success.clone();
        let total_failed = self.total_failed.clone();
        let latencies = self.latencies.clone();
        let start_time = self.start_time;

        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(5));

            loop {
                interval.tick().await;

                let sent = *total_sent.lock().await;
                let success = *total_success.lock().await;
                let failed = *total_failed.lock().await;
                let elapsed = start_time.elapsed().as_secs_f64();

                let current_tps = sent as f64 / elapsed;

                let lats = latencies.lock().await;
                let avg_latency_ms = if !lats.is_empty() {
                    lats.iter().sum::<u64>() as f64 / lats.len() as f64 / 1000.0
                } else {
                    0.0
                };

                info!(
                    "Progress: {:.1}s | Sent: {} | Success: {} | Failed: {} | TPS: {:.0} | Avg Latency: {:.2}ms",
                    elapsed, sent, success, failed, current_tps, avg_latency_ms
                );
            }
        });
    }

    async fn print_final_report(&self) {
        let sent = *self.total_sent.lock().await;
        let success = *self.total_success.lock().await;
        let failed = *self.total_failed.lock().await;
        let elapsed = self.start_time.elapsed().as_secs_f64();

        let lats = self.latencies.lock().await;
        let mut sorted_lats = lats.clone();
        sorted_lats.sort();

        let avg_latency_ms = if !sorted_lats.is_empty() {
            sorted_lats.iter().sum::<u64>() as f64 / sorted_lats.len() as f64 / 1000.0
        } else {
            0.0
        };

        let p50 = percentile(&sorted_lats, 0.50);
        let p95 = percentile(&sorted_lats, 0.95);
        let p99 = percentile(&sorted_lats, 0.99);

        println!("\n===== FINAL REPORT =====");
        println!("Total Duration: {:.2}s", elapsed);
        println!("Total Transactions Sent: {}", sent);
        println!("Successful: {}", success);
        println!("Failed: {}", failed);
        println!("Average TPS: {:.0}", sent as f64 / elapsed);
        println!("Success Rate: {:.2}%", (success as f64 / sent as f64) * 100.0);
        println!("\nLatency Statistics:");
        println!("  Average: {:.2}ms", avg_latency_ms);
        println!("  p50: {:.2}ms", p50 / 1000.0);
        println!("  p95: {:.2}ms", p95 / 1000.0);
        println!("  p99: {:.2}ms", p99 / 1000.0);
        println!("========================\n");
    }
}

async fn simulate_send_tx(_tx: &TestTransaction) -> bool {
    // Simulate network delay
    tokio::time::sleep(Duration::from_micros(100)).await;
    
    // 99% success rate
    rand::thread_rng().gen_bool(0.99)
}

fn percentile(sorted_data: &[u64], p: f64) -> f64 {
    if sorted_data.is_empty() {
        return 0.0;
    }
    let idx = ((sorted_data.len() as f64 - 1.0) * p) as usize;
    sorted_data[idx] as f64
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let args = Args::parse();
    let generator = LoadGenerator::new(args);
    generator.run().await?;

    Ok(())
}
