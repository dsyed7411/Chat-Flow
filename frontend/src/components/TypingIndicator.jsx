import React from 'react';

export const TypingIndicator = ({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  const text = typingUsers.length === 1
    ? `${typingUsers[0]} is typing...`
    : `${typingUsers.join(', ')} are typing...`;

  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
      <span>{text}</span>
    </div>
  );
};
