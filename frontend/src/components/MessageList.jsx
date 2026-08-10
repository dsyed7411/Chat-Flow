import React, { useEffect, useRef } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { TypingIndicator } from './TypingIndicator';

export const MessageList = ({ messages, currentUser, typingUsers, isGlobal }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const formatMessageTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return format(date, 'h:mm a');
    } catch {
      return '';
    }
  };

  const groupMessagesByDate = (msgs) => {
    const groups = {};
    const validMsgs = (msgs || []).filter((msg) => msg && msg.id && msg.sender_id);

    validMsgs.forEach((msg) => {
      let dateKey = 'Unknown Date';
      try {
        const d = new Date(msg.timestamp);
        if (isToday(d)) {
          dateKey = 'Today';
        } else if (isYesterday(d)) {
          dateKey = 'Yesterday';
        } else {
          dateKey = format(d, 'MMMM d, yyyy');
        }
      } catch (e) {}

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });
    return groups;
  };

  const grouped = groupMessagesByDate(messages);

  return (
    <div className="messages-container">
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>No messages yet</p>
          <p style={{ fontSize: '0.85rem' }}>Send a message to kick off the conversation!</p>
        </div>
      ) : (
        Object.entries(grouped).map(([dateLabel, msgs]) => (
          <React.Fragment key={dateLabel}>
            <div style={{ textAlign: 'center', margin: '12px 0' }}>
              <span style={{
                background: 'var(--bg-input)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                padding: '4px 12px',
                borderRadius: '9999px',
                border: '1px solid var(--border-color)',
                fontWeight: '500'
              }}>
                {dateLabel}
              </span>
            </div>

            {msgs.map((msg) => {
              const isSentByMe = msg.sender_id === (currentUser?.id || '');

              return (
                <div
                  key={msg.id}
                  className={`message-wrapper ${isSentByMe ? 'sent' : 'received'}`}
                >
                  {!isSentByMe && (
                    <img
                      src={msg.sender_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender_name || 'User'}`}
                      alt={msg.sender_name || 'User'}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', marginTop: '4px' }}
                    />
                  )}

                  <div>
                    {!isSentByMe && isGlobal && (
                      <div className="message-sender">{msg.sender_name || 'User'}</div>
                    )}
                    <div className="message-bubble">
                      <div>{msg.content}</div>
                      <div className="message-footer">
                        <span>{formatMessageTime(msg.timestamp)}</span>
                        {isSentByMe && (
                          <span style={{ marginLeft: '4px' }}>
                            {msg.status === 'read' ? (
                              <CheckCheck size={14} style={{ color: '#38bdf8' }} />
                            ) : (
                              <Check size={14} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))
      )}

      <TypingIndicator typingUsers={typingUsers} />
      <div ref={bottomRef} />
    </div>
  );
};
