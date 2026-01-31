import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';

const STORAGE_KEY = 'huggingchat_conversations';

export function useChat() {
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [currentConversationId, setCurrentConversationId] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    const ids = Object.keys(parsed);
    return ids.length > 0 ? ids[0] : generateId();
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await api.healthCheck();
        setIsConnected(true);
      } catch (err) {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const currentMessages = conversations[currentConversationId]?.messages || [];

  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return;

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setConversations(prev => ({
      ...prev,
      [currentConversationId]: {
        id: currentConversationId,
        title: prev[currentConversationId]?.title || content.slice(0, 30) + '...',
        messages: [...(prev[currentConversationId]?.messages || []), userMessage],
        updatedAt: new Date().toISOString(),
      },
    }));

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.sendMessage(content, currentConversationId);
      
      const assistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
      };

      setConversations(prev => ({
        ...prev,
        [currentConversationId]: {
          ...prev[currentConversationId],
          messages: [...prev[currentConversationId].messages, assistantMessage],
          updatedAt: new Date().toISOString(),
        },
      }));
    } catch (err) {
      setError(err.message);
      setConversations(prev => ({
        ...prev,
        [currentConversationId]: {
          ...prev[currentConversationId],
          messages: prev[currentConversationId].messages.slice(0, -1),
        },
      }));
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId]);

  const regenerateLastResponse = useCallback(async () => {
    if (currentMessages.length < 2) return;

    setConversations(prev => ({
      ...prev,
      [currentConversationId]: {
        ...prev[currentConversationId],
        messages: prev[currentConversationId].messages.slice(0, -1),
      },
    }));

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.regenerateResponse(currentConversationId);
      
      const assistantMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
      };

      setConversations(prev => ({
        ...prev,
        [currentConversationId]: {
          ...prev[currentConversationId],
          messages: [...prev[currentConversationId].messages, assistantMessage],
          updatedAt: new Date().toISOString(),
        },
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId, currentMessages.length]);

  const createNewConversation = useCallback(() => {
    const newId = generateId();
    setCurrentConversationId(newId);
    return newId;
  }, []);

  const switchConversation = useCallback((id) => {
    setCurrentConversationId(id);
    setError(null);
  }, []);

  const deleteConversation = useCallback(async (id) => {
    setConversations(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    try {
      await api.clearHistory(id);
    } catch (err) {
      console.error('Failed to clear server history:', err);
    }

    if (id === currentConversationId) {
      const remainingIds = Object.keys(conversations).filter(cId => cId !== id);
      if (remainingIds.length > 0) {
        setCurrentConversationId(remainingIds[0]);
      } else {
        createNewConversation();
      }
    }
  }, [currentConversationId, conversations, createNewConversation]);

  const clearCurrentConversation = useCallback(async () => {
    setConversations(prev => ({
      ...prev,
      [currentConversationId]: {
        ...prev[currentConversationId],
        messages: [],
      },
    }));

    try {
      await api.clearHistory(currentConversationId);
    } catch (err) {
      console.error('Failed to clear server history:', err);
    }
  }, [currentConversationId]);

  const exportConversation = useCallback((format = 'json') => {
    const conversation = conversations[currentConversationId];
    if (!conversation) return;

    let content;
    let filename;
    let type;

    if (format === 'json') {
      content = JSON.stringify(conversation, null, 2);
      filename = `chat-${currentConversationId}.json`;
      type = 'application/json';
    } else {
      content = conversation.messages
        .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
        .join('\n\n');
      filename = `chat-${currentConversationId}.txt`;
      type = 'text/plain';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentConversationId, conversations]);

  return {
    conversations,
    currentConversationId,
    currentMessages,
    isLoading,
    error,
    isConnected,
    sendMessage,
    regenerateLastResponse,
    createNewConversation,
    switchConversation,
    deleteConversation,
    clearCurrentConversation,
    exportConversation,
  };
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
