'use client';

import { useState, useRef, useEffect } from 'react';

export default function AIChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm **crm.ai** — your intelligent CRM assistant. I can help you:\n\n• **Find customers** — \"Show me VIP customers from Mumbai\"\n• **Create segments** — \"Create a segment of women aged 25-35\"\n• **Draft campaigns** — \"Draft a WhatsApp for churning customers\"\n• **Send & analyze** — \"Send this campaign\" or \"How did last campaign perform?\"\n\nWhat would you like to do?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleOpenChat = (e) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        setInput(e.detail.prompt);
        setTimeout(() => {
          document.getElementById('ai-chat-input')?.focus();
        }, 100);
      }
    };
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `⚠️ ${data.error}`
        }]);
      } else {
        let content = data.response || 'I processed your request.';
        if (data.functionCall) {
          content = `🔧 *Executed: ${data.functionCall.name}*\n\n${content}`;
        }
        setMessages(prev => [...prev, {
          role: 'assistant',
          content,
          provider: data.provider
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Failed to connect to AI service. Please check your API keys.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simple markdown-like rendering
  const renderContent = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
      .replace(/• /g, '&bull; ');
  };

  return (
    <>
      <button
        className="ai-chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="AI Assistant"
        aria-label="Toggle AI Chat"
      >
        {isOpen ? '✕' : '✨'}
      </button>

      <div className={`ai-chat-panel ${isOpen ? 'open' : ''}`}>
        <div className="ai-chat-header">
          <div className="ai-chat-header-title">
            <div className="ai-dot"></div>
            crm.ai Assistant
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setMessages([messages[0]]);
            }}
            title="Clear chat"
          >
            🗑️
          </button>
        </div>

        <div className="ai-chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`ai-message ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="msg-label">
                  ✨ crm.ai {msg.provider && <span style={{ opacity: 0.5 }}>via {msg.provider}</span>}
                </div>
              )}
              <div dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
            </div>
          ))}

          {isLoading && (
            <div className="ai-message assistant">
              <div className="msg-label">✨ crm.ai</div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chat-input-area">
          <input
            id="ai-chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your customers..."
            disabled={isLoading}
          />
          <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            {isLoading ? <span className="spinner" style={{ width: 16, height: 16 }}></span> : '→'}
          </button>
        </div>
      </div>
    </>
  );
}
