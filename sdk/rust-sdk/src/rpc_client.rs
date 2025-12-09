use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::{Transaction, Address};
use rust_decimal::Decimal;

#[derive(Clone)]
pub struct RpcClient {
    client: Client,
    url: String,
    chain_id: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct RpcRequest {
    jsonrpc: String,
    method: String,
    params: Vec<Value>,
    id: u64,
}

#[derive(Debug, Deserialize)]
struct RpcResponse {
    result: Option<Value>,
    error: Option<RpcError>,
}

#[derive(Debug, Deserialize)]
struct RpcError {
    code: i32,
    message: String,
}

impl RpcClient {
    pub fn new(url: String) -> Self {
        Self {
            client: Client::new(),
            url,
            chain_id: 31337, // Default testnet
        }
    }

    pub async fn get_balance(&self, address: &Address) -> Result<Decimal> {
        let response = self
            .call("eth_getBalance", vec![
                json!(format!("{:?}", address)),
                json!("latest")
            ])
            .await?;
        
        // Parse balance from hex
        Ok(Decimal::new(0, 0)) // Placeholder
    }

    pub async fn send_transaction(&self, tx: &Transaction) -> Result<String> {
        let tx_json = serde_json::to_value(tx)?;
        let response = self
            .call("eth_sendRawTransaction", vec![tx_json])
            .await?;
        
        Ok(response.as_str().unwrap_or("").to_string())
    }

    pub async fn get_transaction_count(&self, address: &Address) -> Result<u64> {
        let response = self
            .call("eth_getTransactionCount", vec![
                json!(format!("{:?}", address)),
                json!("latest")
            ])
            .await?;
        
        Ok(0) // Placeholder
    }

    async fn call(&self, method: &str, params: Vec<Value>) -> Result<Value> {
        let request = RpcRequest {
            jsonrpc: "2.0".to_string(),
            method: method.to_string(),
            params,
            id: 1,
        };

        let response: RpcResponse = self
            .client
            .post(&self.url)
            .json(&request)
            .send()
            .await?
            .json()
            .await?;

        if let Some(error) = response.error {
            return Err(anyhow::anyhow!("RPC error: {}", error.message));
        }

        response.result.ok_or_else(|| anyhow::anyhow!("No result in RPC response"))
    }
}
