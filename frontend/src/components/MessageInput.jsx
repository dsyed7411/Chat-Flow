import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';

const QUICK_EMOJIS = ['😊', '😂', '👍', '❤️', '🔥', '🎉', '🚀', '👋'];

export const MessageInput = ({ onSendMessage, onTyping, onStopTyping }) => {
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (val.trim()) {
      onTyping();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping();
      }, 2000);
    } else {
      onStopTyping();
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSendMessage(text.trim());
    setText('');
    setShowEmojis(false);
    onStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleAddEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojis(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      {showEmojis && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '24px',
            marginBottom: '8px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)',
            zIndex: 10
          }}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleAddEmoji(emoji)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                transition: 'transform 0.15s ease'
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="input-container">
        <button
          type="button"
          onClick={() => setShowEmojis(!showEmojis)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px'
          }}
          title="Add emoji"
        >
          <Smile size={22} />
        </button>

        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={text}
          onChange={handleInputChange}
        />

        <button type="submit" className="send-btn" disabled={!text.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
