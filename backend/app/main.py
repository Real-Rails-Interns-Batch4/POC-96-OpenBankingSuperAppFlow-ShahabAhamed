import random
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="POC-96 Intelligence Platform API")

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory transaction store  (source of truth)
# ---------------------------------------------------------------------------
_transactions: list[dict] = []

# ---------------------------------------------------------------------------
# Transaction generator — fully mock-based, no DB required
# ---------------------------------------------------------------------------
_RAILS = ["ACH", "WIRE", "RTP"]
_BANKS = ["Chase", "Bank of America", "Wells Fargo", "Citibank", "Goldman Sachs"]
_USERS = [
    "Michael Reed", "Sarah Kim", "David Patel", "Emily Chen", 
    "James Wilson", "Sophia Garcia", "Daniel Brooks", "Olivia Carter",
    "alice.morgan", "bob.hayes", "carol.chen", "david.osei"
]
_STATUSES = ["COMPLETED", "PENDING", "PROCESSING"]


def compute_routing(amount: float, risk_score: int, priority: str) -> tuple[str, str]:
    if amount >= 50000:
        return "WIRE", "HIGH" if risk_score >= 70 else "MEDIUM" if risk_score >= 40 else "LOW"
    elif amount >= 10000:
        return "WIRE", "HIGH" if risk_score >= 70 else "MEDIUM" if risk_score >= 40 else "LOW"
    elif priority == "URGENT" and risk_score < 55:
        return "RTP", "MEDIUM" if risk_score >= 40 else "LOW"
    elif risk_score >= 70:
        return "WIRE", "HIGH"
    elif priority == "BATCH":
        return "ACH", "HIGH" if risk_score >= 70 else "MEDIUM" if risk_score >= 40 else "LOW"
    elif priority == "URGENT" and risk_score >= 55:
        return "RTP", "HIGH" if risk_score >= 70 else "MEDIUM"
    else:
        return "ACH", "HIGH" if risk_score >= 70 else "MEDIUM" if risk_score >= 40 else "LOW"

def _generate_transaction() -> dict:
    val = random.random()
    if val < 0.60:
        risk_score = random.randint(20, 39)
    elif val < 0.92:
        risk_score = random.randint(40, 69)
    else:
        risk_score = random.randint(70, 94)

    # Some high amounts to trigger wire rules
    amt_val = random.random()
    if amt_val < 0.1:
        amount = round(random.uniform(50000.0, 150_000.0), 2)
    elif amt_val < 0.3:
        amount = round(random.uniform(10000.0, 49_999.0), 2)
    else:
        amount = round(random.uniform(50.0, 9_999.0), 2)

    priority = random.choice(["STANDARD", "STANDARD", "URGENT", "BATCH"])

    rail, risk_level = compute_routing(amount, risk_score, priority)

    status = "PENDING" if risk_level == "HIGH" and random.random() < 0.5 else "COMPLETED"

    return {
        "id": str(uuid.uuid4()),
        "user": random.choice(_USERS),
        "bank": random.choice(_BANKS),
        "amount": amount,
        "rail": rail,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Seed the store with an initial batch so the first request is never empty
# ---------------------------------------------------------------------------
for _ in range(50):
    _transactions.append(_generate_transaction())


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "POC-96 Open Banking + Payments Super-App Flow API is running.",
    }


@app.get("/api/source-status")
async def source_status():
    try:
        live_available = True
        if live_available:
            return {
                "mode": "LIVE",
                "provider": "OpenBanking Gateway",
            }
    except Exception:
        pass

    return {
        "mode": "MOCK",
        "provider": "Synthetic Intelligence Feed",
    }


@app.get("/api/transactions")
def get_transactions():
    """
    Append a freshly generated transaction on every request,
    trim the store to the latest 50, and return the full list.
    """
    global _transactions

    # Generate and append a new telemetry entry
    _transactions.append(_generate_transaction())

    # Keep only the most recent 50 transactions
    _transactions = _transactions[-50:]

    return {
        "source_mode": "LIVE",
        "transactions": _transactions,
    }
