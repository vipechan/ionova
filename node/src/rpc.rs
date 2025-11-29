use anyhow::Result;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::convert::Infallible;
use std::sync::Arc;
use tokio::sync::mpsc;
use warp::{Filter, Rejection, Reply};

use crate::sequencer::Transaction;

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

fn with_state<T: Clone + Send>(
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
            // In a real implementation, we would decode the RLP encoded transaction
            // For this devnet, we'll accept a JSON object directly if passed as a string
            // or handle the raw hex if we implemented RLP decoding
            
            // Simplified: Expecting params[0] to be a JSON string of our Transaction struct
            // This is a hack for the devnet to avoid implementing full RLP decoding right now
            if let Some(tx_str) = req.params.get(0).and_then(|v| v.as_str()) {
                // Try to parse as our Transaction struct (if sent as JSON string)
                // Or if it's actual raw hex, we would need to decode it
                
                // For now, let's assume the client sends a JSON object directly for simplicity in this fix
                // If the client sends a hex string, we'd return an error saying "RLP not supported in devnet"
                
                // Actually, let's try to parse the JSON directly if it's an object
                let tx_result = if let Some(tx_obj) = req.params.get(0).and_then(|v| v.as_object()) {
                    serde_json::from_value::<Transaction>(serde_json::Value::Object(tx_obj.clone()))
                } else if let Ok(tx) = serde_json::from_str::<Transaction>(tx_str) {
                    Ok(tx)
                } else {
                    Err("Invalid transaction format")
                };

                match tx_result {
                    Ok(mut tx) => {
                        // Override shard_id to match current shard
                        tx.shard_id = *shard_id;
                        
                        match tx_sender.send(tx).await {
                            Ok(_) => success_response(req.id, "0x1"), // Success
                            Err(_) => error_response(req.id, -32603, "Internal error: channel closed"),
                        }
                    }
                    Err(_) => error_response(req.id, -32602, "Invalid params: expected Transaction JSON"),
                }
            } else {
                error_response(req.id, -32602, "Invalid params")
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
