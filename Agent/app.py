from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from intent_model import predict_intent
from slot_model import extract_slots
from rag_pipeline import rag_pipeline  
app = FastAPI(title="University Admission Chatbot API")

class UserQuery(BaseModel):
    query: str

class RAGRequest(BaseModel):
    userId: str
    user_query: str
    slots: Dict[str, Any] 
    intent: str
    logs: str

@app.post("/predict_intent")
def predict_intent_api(user_query: UserQuery):
    try:
        intent_result = predict_intent(user_query.query)
        return {"success": True, "intent": intent_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract_slots")
def extract_slots_api(user_query: UserQuery):
    try:
        slots_result = extract_slots(user_query.query)
        return {"success": True, "slots": slots_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
def query_rag(payload: RAGRequest):
    """
    Call this API with pre-extracted slots, intent, logs, and user query.
    """
    try:
        session_data = {
            "slots": payload.slots,
            "intent": payload.intent,
            "logs": payload.logs
            
        }

        response = rag_pipeline(payload.user_query, session_data)

        return {
            "userId": payload.userId,
            "answer": response["answer"],
            "context_used": response["context_used"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok"}
