from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
from dotenv import load_dotenv

from db_api_client import DBApiClient
from aura_voice_engine import AuraVoiceEngine

load_dotenv()

app = FastAPI(title="AURA Voice Agent Test Server")

# Enable CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys and Clients
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not set in .env")

db_client = DBApiClient()
voice_engine = AuraVoiceEngine(api_key=GEMINI_API_KEY, db_client=db_client)

# In-memory session store (session_id -> dict state)
sessions = {}

class ChatRequest(BaseModel):
    message: str
    session_id: str
    table_id: int = 1

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    # Get or initialize session
    session_state = sessions.get(request.session_id, {
        "current_order": [],
        "table_id": request.table_id,
        "conversation_history": []
    })
    
    # Process message via AURA Engine
    reply, updated_state = await voice_engine.process_message(request.message, session_state)
    
    # Save state
    sessions[request.session_id] = updated_state
    
    return {
        "reply": reply,
        "order_state": updated_state["current_order"]
    }

@app.get("/api/menu")
async def get_menu_proxy():
    """Proxy menu endpoint to avoid CORS issues if testing purely locally"""
    menu = await db_client.get_menu()
    return {"menu": menu}

@app.get("/api/tables")
async def get_tables_proxy():
    tables = await db_client.get_tables()
    return {"tables": tables}

@app.post("/api/session/reset")
async def reset_session(session_id: str):
    if session_id in sessions:
        sessions[session_id] = {
            "current_order": [],
            "table_id": sessions[session_id].get("table_id", 1),
            "conversation_history": []
        }
    return {"status": "success"}

# Serve static files for the UI
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
