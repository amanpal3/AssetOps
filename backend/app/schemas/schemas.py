from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class TransferRequest(BaseModel):
    asset_address: str
    from_address: str
    to_address: str
    amount: int = Field(gt=0, description="Amount to transfer (integer/base units)")

class CreateActionRequest(BaseModel):
    action_reference: str = Field(description="Human reference, e.g. CA-001")
    asset_address: str
    action_type: str = Field(description="COUPON, INTEREST, or REDEMPTION")
    rate_bps: Optional[int] = Field(default=None, description="Rate in basis points (e.g. 500 = 5%)")
    amount_per_token: Optional[int] = Field(default=None, description="Redemption principal per token (e.g. 1)")
    payable_date: Optional[str] = None
    document_hash: Optional[str] = "ipfs://QmDefault"

class CreateVersionRequest(BaseModel):
    new_rate_bps: Optional[int] = Field(default=None, description="New rate in basis points (e.g. 400 = 4%)")
    new_amount_per_token: Optional[int] = None
    payable_date: Optional[str] = None
    document_hash: Optional[str] = "ipfs://QmAmended"

class ExecutePaymentRequest(BaseModel):
    action_id: str

class ExecuteRedemptionRequest(BaseModel):
    action_id: str

class HolderResponse(BaseModel):
    address: str
    asset_address: str
    balance: int
    is_whitelisted: bool

class AssetResponse(BaseModel):
    address: str
    name: str
    symbol: str
    decimals: int
    total_supply: int
    status: str

class ActionVersionResponse(BaseModel):
    version_id: str
    action_id: str
    version_number: int
    rate_bps: Optional[int]
    display_rate: Optional[str]
    amount_per_token: Optional[str]
    supersedes_version_id: Optional[str]
    document_hash: Optional[str]
    status: str
    created_at: str

class CorporateActionResponse(BaseModel):
    action_id: str
    action_reference: str
    asset_address: str
    action_type: str
    active_version_id: str
    status: str
    versions: List[ActionVersionResponse] = []

class PreviewHolder(BaseModel):
    holder_address: str
    balance: int
    entitled_amount: int

class PaymentPreviewResponse(BaseModel):
    action_id: str
    version_id: str
    version_number: int
    action_type: str
    rate_bps: Optional[int]
    total_payment: int
    holder_count: int
    holders: List[PreviewHolder]
