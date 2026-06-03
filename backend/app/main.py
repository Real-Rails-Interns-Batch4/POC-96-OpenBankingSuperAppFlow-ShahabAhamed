import json
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="POC-96 Intelligence Platform API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Centralized DATA_FILE handling
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE_DIR, "mock_data", "transactions.json")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "POC-96 Open Banking + Payments Super-App Flow API is running."}

@app.get("/api/transactions")
def get_transactions():
    try:
        with open(DATA_FILE, "r") as f:
            transactions = json.load(f)
        return {
            "source_mode": "MOCK",
            "transactions": transactions
        }
    except FileNotFoundError:
        return {
            "source_mode": "MOCK",
            "transactions": [],
            "error": "Data file not found"
        }
