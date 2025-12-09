"""Type definitions for Ionova SDK"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional
from decimal import Decimal


class SignatureType(Enum):
    """Supported signature algorithms"""
    ECDSA = "ecdsa"
    DILITHIUM = "dilithium"
    SPHINCS_PLUS = "sphincs"
    HYBRID = "hybrid"


@dataclass
class Transaction:
    """Ionova transaction"""
    nonce: int
    from_address: str
    to_address: str
    value: Decimal
    gas_limit: int
    gas_price: Decimal
    data: bytes = b""
    signature: Optional[bytes] = None
    expiry: Optional[int] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "nonce": self.nonce,
            "from": self.from_address,
            "to": self.to_address,
            "value": str(self.value),
            "gasLimit": self.gas_limit,
            "gasPrice": str(self.gas_price),
            "data": self.data.hex(),
            "signature": self.signature.hex() if self.signature else None,
            "expiry": self.expiry,
        }
