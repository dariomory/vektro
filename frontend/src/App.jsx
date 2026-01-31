import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { Settings } from './components/Settings';
import { useChat } from './hooks/useChat';

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
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
  } = useChat();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className={`app ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <button 
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={createNewConversation}
        onSelectConversation={switchConversation}
        onDeleteConversation={deleteConversation}
        onExport={exportConversation}
        onClear={clearCurrentConversation}
        isConnected={isConnected}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="main-content">
        <ChatWindow
          messages={currentMessages}
          onSend={sendMessage}
          onRegenerate={regenerateLastResponse}
          isLoading={isLoading}
          error={error}
          isConnected={isConnected}
        />
      </main>

      <Settings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}

export default App;
