from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = "default"


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    timestamp: datetime


class ConversationHistory(BaseModel):
    conversation_id: str
    messages: List[Message]


class HealthResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    status: str
    model_loaded: bool
    model_name: str
