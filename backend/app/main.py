from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import logging
import os

from .model import ChatModel
from .conversation import ConversationManager
from .schemas import (
    ChatRequest,
    ChatResponse,
    ConversationHistory,
    HealthResponse,
    Message
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# initialize model and conversation manager
MODEL_NAME = os.getenv("MODEL_NAME", "HuggingFaceTB/SmolLM2-360M-Instruct")
chat_model = ChatModel(model_name=MODEL_NAME)
conversation_manager = ConversationManager(max_history=10)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the model on startup."""
    logger.info("Starting up - loading model...")
    chat_model.load()
    logger.info("Model loaded successfully!")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Huggingface Chat API",
    description="A chat API powered by a small Huggingface model",
    version="1.0.0",
    lifespan=lifespan
)

# configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check the health of the API and model status."""
    return HealthResponse(
        status="healthy",
        model_loaded=chat_model.is_loaded(),
        model_name=MODEL_NAME
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send a message and get a response from the model."""
    if not chat_model.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    
    try:
        conversation_manager.add_message(
            request.conversation_id,
            "user",
            request.message
        )
        
        messages = conversation_manager.format_for_model(request.conversation_id)
        
        response = chat_model.generate_response(messages)
        
        conversation_manager.add_message(
            request.conversation_id,
            "assistant",
            response
        )
        
        return ChatResponse(
            response=response,
            conversation_id=request.conversation_id,
            timestamp=datetime.now()
        )
    
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat/history/{conversation_id}", response_model=ConversationHistory)
async def get_history(conversation_id: str):
    """Get the conversation history for a specific conversation."""
    messages = conversation_manager.get_history(conversation_id)
    return ConversationHistory(
        conversation_id=conversation_id,
        messages=messages
    )


@app.post("/chat/clear/{conversation_id}")
async def clear_history(conversation_id: str):
    """Clear the conversation history for a specific conversation."""
    conversation_manager.clear_history(conversation_id)
    return {"status": "cleared", "conversation_id": conversation_id}


@app.get("/chat/conversations")
async def list_conversations():
    """List all active conversation IDs."""
    return {"conversations": conversation_manager.get_all_conversation_ids()}


@app.post("/chat/regenerate/{conversation_id}", response_model=ChatResponse)
async def regenerate_response(conversation_id: str):
    """Regenerate the last assistant response."""
    if not chat_model.is_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded yet")
    
    history = conversation_manager.get_history(conversation_id)
    
    if len(history) < 2:
        raise HTTPException(
            status_code=400,
            detail="Not enough history to regenerate"
        )
    
    if history[-1].role == "assistant":
        conversation_manager.conversations[conversation_id] = history[:-1]
    
    try:
        messages = conversation_manager.format_for_model(conversation_id)
        
        response = chat_model.generate_response(messages)
        
        conversation_manager.add_message(
            conversation_id,
            "assistant",
            response
        )
        
        return ChatResponse(
            response=response,
            conversation_id=conversation_id,
            timestamp=datetime.now()
        )
    
    except Exception as e:
        logger.error(f"Error regenerating response: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
