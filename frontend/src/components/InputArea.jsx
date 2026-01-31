import React, { useState, useRef, useEffect } from 'react';

export function InputArea({ onSend, isLoading, isConnected }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading && isConnected) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="input-area" onSubmit={handleSubmit}>
      <div className="input-container">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? "Type your message..." : "Waiting for connection..."}
          disabled={isLoading || !isConnected}
          rows={1}
        />
        <button 
          type="submit" 
          disabled={!message.trim() || isLoading || !isConnected}
          className="send-button"
        >
          {isLoading ? (
            <div className="loading-spinner" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          )}
        </button>
      </div>
      <p className="input-hint">Press Enter to send, Shift+Enter for new line</p>
    </form>
  );
}
