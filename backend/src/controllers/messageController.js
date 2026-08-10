const { dbAsync } = require('../config/db');

const generateId = () => 'msg_' + Math.random().toString(36).substring(2, 12);

exports.getMessages = async (req, res) => {
  try {
    const { receiver_id = 'global', sender_id } = req.query;

    let messages;
    if (receiver_id === 'global') {
      messages = await dbAsync.all(
        `SELECT m.*, COALESCE(u.username, 'User') as sender_name, COALESCE(u.avatar, '') as sender_avatar 
         FROM messages m 
         LEFT JOIN users u ON m.sender_id = u.id 
         WHERE m.receiver_id = 'global' 
         ORDER BY m.timestamp ASC`
      );
    } else if (sender_id) {
      // Direct messages between sender_id and receiver_id
      messages = await dbAsync.all(
        `SELECT m.*, COALESCE(u.username, 'User') as sender_name, COALESCE(u.avatar, '') as sender_avatar 
         FROM messages m 
         LEFT JOIN users u ON m.sender_id = u.id 
         WHERE (m.sender_id = ? AND m.receiver_id = ?) 
            OR (m.sender_id = ? AND m.receiver_id = ?) 
         ORDER BY m.timestamp ASC`,
        [sender_id, receiver_id, receiver_id, sender_id]
      );
    } else {
      return res.status(400).json({ error: 'sender_id is required for direct messages' });
    }

    res.status(200).json({ messages: messages || [] });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to retrieve message history' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id = 'global', content, sender_name, sender_avatar } = req.body;

    if (!sender_id || !content || !content.trim()) {
      return res.status(400).json({ error: 'sender_id and content are required' });
    }

    let sender = await dbAsync.get('SELECT * FROM users WHERE id = ?', [sender_id]);
    if (!sender) {
      const now = new Date().toISOString();
      const defaultName = sender_name || 'User';
      const defaultAvatar = sender_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(sender_id)}`;
      await dbAsync.run(
        'INSERT INTO users (id, username, avatar, status, last_seen, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [sender_id, defaultName, defaultAvatar, 'online', now, now]
      );
      sender = await dbAsync.get('SELECT * FROM users WHERE id = ?', [sender_id]);
    }

    const id = generateId();
    const timestamp = new Date().toISOString();
    const status = 'sent';

    await dbAsync.run(
      'INSERT INTO messages (id, sender_id, receiver_id, content, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, sender_id, receiver_id, content.trim(), timestamp, status]
    );

    const fullMessage = {
      id,
      sender_id,
      receiver_id,
      content: content.trim(),
      timestamp,
      status,
      sender_name: sender ? sender.username : (sender_name || 'User'),
      sender_avatar: sender ? sender.avatar : (sender_avatar || '')
    };

    const io = req.app.get('io');
    if (io) {
      if (receiver_id === 'global') {
        io.emit('receive_message', fullMessage);
      } else {
        io.to(receiver_id).to(sender_id).emit('receive_message', fullMessage);
      }
    }

    res.status(201).json({ message: fullMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body;

    if (!sender_id || !receiver_id) {
      return res.status(400).json({ error: 'sender_id and receiver_id are required' });
    }

    await dbAsync.run(
      `UPDATE messages SET status = 'read' WHERE sender_id = ? AND receiver_id = ? AND status != 'read'`,
      [sender_id, receiver_id]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(sender_id).emit('messages_read', { by_user: receiver_id });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to update message status' });
  }
};
