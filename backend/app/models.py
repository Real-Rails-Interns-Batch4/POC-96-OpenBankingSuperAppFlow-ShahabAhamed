from pydantic import BaseModel
from typing import Optional

class Transaction(BaseModel):
    id: str
    user: str
    bank: str
    amount: float
    rail: str
    risk_score: int
    risk_level: str
    status: str
    timestamp: str
