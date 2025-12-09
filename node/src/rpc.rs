use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::convert::Infallible;
use std::sync::Arc;
use tokio::sync::mpsc;
use warp::{Filter, Rejection, Reply};

// Import new transaction module with PQ signature support
use crate::transaction::Transaction as PQTransaction;
use crate::sequencer::Transaction as SequencerTransaction;

#[derive(Debug, Deserialize)]
struct RpcRequest {
    jsonrpc: String,
    method: String,
    params: Vec<Value>,
    id: Value,
}

#[derive(Debug, Serialize)]
struct RpcResponse {
    jsonrpc: String,
    result: Option<Value>,
    error: Option<RpcError>,
    id: Value,
}

#[derive(Debug, Serialize)]
struct RpcError {
    code: i32,
    message: String,
}

pub async fn start_rpc_server(
    port: u16,
    shard_id: u8,
    tx_sender: mpsc::Sender<Transaction>,
) {
    let tx_sender = Arc::new(tx_sender);
    let shard_id = Arc::new(shard_id);

    let rpc_route = warp::post()
        .and(warp::path::end())
        .and(warp::body::json())
        .and(with_state(tx_sender))
        .and(with_state(shard_id))
        .and_then(handle_request);

    tracing::info!("RPC server starting on port {}", port);
    warp::serve(rpc_route).run(([0, 0, 0, 0], port)).await;
}

fn with_state<T: Clone + Send + Sync>(
    state: Arc<T>,
) -> impl Filter<Extract = (Arc<T>,), Error = Infallible> + Clone {
    warp::any().map(move || state.clone())
}

async fn handle_request(
    req: RpcRequest,
    tx_sender: Arc<mpsc::Sender<Transaction>>,
    shard_id: Arc<u8>,
) -> Result<impl Reply, Rejection> {
    let response = match req.method.as_str() {
        "web3_clientVersion" => success_response(req.id, "Ionova/v0.1.0"),
        "eth_chainId" => success_response(req.id, format!("0x{:x}", 31337 + *shard_id as u64)),
        "eth_sendRawTransaction" => {
            // Accept PQ signature transactions!
            // Supports: ECDSA, Dilithium, SPHINCS+, Hybrid (4 types)
            
            let tx_result = if let Some(tx_obj) = req.params.get(0).and_then(|v| v.as_object()) {
                serde_json::from_value::<PQTransaction>(serde_json::Value::Object(tx_obj.clone()))
                    .map_err(|e| format!("Failed to parse transaction: {}", e))
            } else if let Some(tx_str) = req.params.get(0).and_then(|v| v.as_str()) {
                serde_json::from_str::<PQTransaction>(tx_str)
                    .map_err(|e| format!("Failed to parse transaction JSON: {}", e))
            } else {
                Err("Invalid transaction format".to_string())
            };

            match tx_result {
                Ok(pq_tx) => {
                    // Verify PQ signature before accepting
                    match pq_tx.verify_signature() {
                        Ok(true) => {
                            // Convert to sequencer transaction format
                            // In production, we'd do proper conversion here
                            tracing::info!(
                                "Accepted {} signature transaction from {:?}",
                                match pq_tx.signature.algorithm() {
                                    crate::crypto::SignatureAlgorithm::ECDSA => "ECDSA",
                                    crate::crypto::SignatureAlgorithm::Dilithium => "Dilithium (PQ)",
                                    crate::crypto::SignatureAlgorithm::SPHINCSPlus => "SPHINCS+ (PQ)",
                                    crate::crypto::SignatureAlgorithm::Hybrid => "Hybrid (ECDSA+PQ)",
                                },
                                pq_tx.from
                            );
                            
                            // For devnet, just return success
                            // In production, convert and send to sequencer
                            success_response(req.id, "0x1") // Success
                        }
                        Ok(false) => {
                            error_response(req.id, -32000, "Invalid signature")
                        }
                        Err(e) => {
                            error_response(req.id, -32000, &format!("Signature verification failed: {}", e))
                        }
                    }
                }
                Err(err) => error_response(req.id, -32602, &format!("Invalid transaction: {}", err)),
            }
        }
        _ => error_response(req.id, -32601, "Method not found"),
    };

    Ok(warp::reply::json(&response))
}

fn success_response<T: Serialize>(id: Value, result: T) -> RpcResponse {
    RpcResponse {
        jsonrpc: "2.0".to_string(),
        result: Some(serde_json::to_value(result).unwrap_or(Value::Null)),
        error: None,
        id,
    }
}

fn error_response(id: Value, code: i32, message: &str) -> RpcResponse {
    RpcResponse {
        jsonrpc: "2.0".to_string(),
        result: None,
        error: Some(RpcError {
            code,
            message: message.to_string(),
        }),
        id,
    }
}
