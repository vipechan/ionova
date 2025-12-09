"""RPC Client for Ionova blockchain"""

import requests
from typing import Any, Dict, Optional
from decimal import Decimal


class RpcClient:
    """JSON-RPC client for Ionova network"""
    
    def __init__(self, url: str = "http://localhost:27000"):
        self.url = url
        self.session = requests.Session()
        
    def _call(self, method: str, params: list = None) -> Any:
        """Make RPC call"""
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or [],
            "id": 1,
        }
        
        response = self.session.post(self.url, json=payload)
        response.raise_for_status()
        
        result = response.json()
        if "error" in result:
            raise Exception(f"RPC error: {result['error']}")
        
        return result.get("result")
    
    def get_balance(self, address: str) -> Decimal:
        """Get account balance"""
        result = self._call("eth_getBalance", [address, "latest"])
        # Convert from hex to Decimal
        balance_wei = int(result, 16)
        return Decimal(balance_wei) / Decimal(10**18)
    
    def get_transaction_count(self, address: str) -> int:
        """Get transaction count (nonce)"""
        result = self._call("eth_getTransactionCount", [address, "latest"])
        return int(result, 16)
    
    def send_transaction(self, tx_dict: Dict[str, Any]) -> str:
        """Send raw transaction"""
        result = self._call("eth_sendRawTransaction", [tx_dict])
        return result
    
    def get_chain_id(self) -> int:
        """Get chain ID"""
        result = self._call("eth_chainId")
        return int(result, 16)
