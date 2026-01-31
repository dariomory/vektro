import React, { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';

export function ChatWindow({ 
  messages, 
  onSend, 
  onRegenerate,
  isLoading, 
  error,
  isConnected 
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat-window">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h2>Start a conversation</h2>
            <p>Send a message to begin chatting with the AI assistant</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <MessageBubble
                key={msg.id || index}
                message={msg}
                isLast={index === messages.length - 1}
                onRegenerate={onRegenerate}
                canRegenerate={!isLoading && messages.length >= 2}
              />
            ))}
          </>
        )}
        
        {isLoading && (
          <div className="message-wrapper assistant">
            <div className="message-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <InputArea 
        onSend={onSend} 
        isLoading={isLoading}
        isConnected={isConnected}
      />
    </div>
  );
}
