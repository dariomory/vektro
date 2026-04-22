// In Docker, nginx proxies /api to backend; locally, use direct connection
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' && window.location.port === '3000' 
    ? '/api'  // Docker: use nginx proxy
    : 'http://localhost:8000'  // Local dev: direct backend
);

export const api = {
  async sendMessage(message, conversationId = 'default', model = null) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        ...(model ? { model } : {}),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || 'Failed to send message');
    }

    return response.json();
  },

  async getModels() {
    const response = await fetch(`${API_BASE_URL}/models`);

    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }

    return response.json();
  },

  async getHistory(conversationId) {
    const response = await fetch(`${API_BASE_URL}/chat/history/${conversationId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }

    return response.json();
  },

  async clearHistory(conversationId) {
    const response = await fetch(`${API_BASE_URL}/chat/clear/${conversationId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to clear history');
    }

    return response.json();
  },

  async regenerateResponse(conversationId) {
    const response = await fetch(`${API_BASE_URL}/chat/regenerate/${conversationId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || 'Failed to regenerate response');
    }

    return response.json();
  },

  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error('Backend not available');
    }

    return response.json();
  },

  async getConversations() {
    const response = await fetch(`${API_BASE_URL}/chat/conversations`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }

    return response.json();
  },
};
