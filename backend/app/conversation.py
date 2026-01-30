from typing import Dict, List
from datetime import datetime
from .schemas import Message


class ConversationManager:
    """Manages conversation history for contextual continuity."""
    
    def __init__(self, max_history: int = 10):
        self.conversations: Dict[str, List[Message]] = {}
        self.max_history = max_history
    
    def add_message(self, conversation_id: str, role: str, content: str) -> None:
        """Add a message to the conversation history."""
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []
        
        message = Message(
            role=role,
            content=content,
            timestamp=datetime.now()
        )
        self.conversations[conversation_id].append(message)
        
        # keep only the last max_history messages to prevent context overflow
        if len(self.conversations[conversation_id]) > self.max_history * 2:
            self.conversations[conversation_id] = self.conversations[conversation_id][-self.max_history * 2:]
    
    def get_history(self, conversation_id: str) -> List[Message]:
        """Get the conversation history."""
        return self.conversations.get(conversation_id, [])
    
    def clear_history(self, conversation_id: str) -> None:
        """Clear a specific conversation history."""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
    
    def clear_all(self) -> None:
        """Clear all conversation histories."""
        self.conversations.clear()
    
    def get_all_conversation_ids(self) -> List[str]:
        """Get all conversation IDs."""
        return list(self.conversations.keys())
    
    def format_for_model(self, conversation_id: str) -> List[Dict[str, str]]:
        """Format conversation history for the model."""
        history = self.get_history(conversation_id)
        return [{"role": msg.role, "content": msg.content} for msg in history]
