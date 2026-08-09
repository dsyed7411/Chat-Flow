const { dbAsync } = require('../config/db');

// Map of userId -> Set of socketIds
const onlineUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Register user socket
    socket.on('user_connected', async (userData) => {
      if (!userData || !userData.id) return;

      const userId = userData.id;
      socket.userId = userId;

      // Add socket ID to user's set of active sockets
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      // Join socket room corresponding to user ID for targeted messages
      socket.join(userId);

      // Update SQLite user status to online
      const now = new Date().toISOString();
      await dbAsync.run(
        'UPDATE users SET status = ?, last_seen = ? WHERE id = ?',
        ['online', now, userId]
      );

      // Broadcast user online status update to all connected clients
      io.emit('user_status_changed', {
        userId,
        status: 'online',
        last_seen: now
      });

      console.log(`User registered: ${userData.username} (${userId})`);
    });

    // Real-time message handler
    socket.on('send_message', async (data) => {
      try {
        const { sender_id, receiver_id = 'global', content } = data;

        if (!sender_id || !content || !content.trim()) return;

        const sender = await dbAsync.get('SELECT * FROM users WHERE id = ?', [sender_id]);
        if (!sender) return;

        const id = 'msg_' + Math.random().toString(36).substring(2, 12);
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
          sender_name: sender.username,
          sender_avatar: sender.avatar
        };

        if (receiver_id === 'global') {
          io.emit('receive_message', fullMessage);
        } else {
          // Emit to both sender and recipient user rooms
          io.to(receiver_id).to(sender_id).emit('receive_message', fullMessage);
        }
      } catch (err) {
        console.error('Socket send_message error:', err);
        socket.emit('error_message', { message: 'Failed to send message' });
      }
    });

    // Typing status events
    socket.on('typing_start', (data) => {
      const { sender_id, sender_name, receiver_id = 'global' } = data;
      if (receiver_id === 'global') {
        socket.broadcast.emit('user_typing', { sender_id, sender_name, receiver_id });
      } else {
        io.to(receiver_id).emit('user_typing', { sender_id, sender_name, receiver_id });
      }
    });

    socket.on('typing_stop', (data) => {
      const { sender_id, receiver_id = 'global' } = data;
      if (receiver_id === 'global') {
        socket.broadcast.emit('user_stopped_typing', { sender_id, receiver_id });
      } else {
        io.to(receiver_id).emit('user_stopped_typing', { sender_id, receiver_id });
      }
    });

    // Read receipt events
    socket.on('mark_read', async (data) => {
      const { sender_id, receiver_id } = data;
      if (sender_id && receiver_id) {
        await dbAsync.run(
          `UPDATE messages SET status = 'read' WHERE sender_id = ? AND receiver_id = ? AND status != 'read'`,
          [sender_id, receiver_id]
        );
        io.to(sender_id).emit('messages_read', { by_user: receiver_id });
      }
    });

    // Handle client disconnect gracefully
    socket.on('disconnect', async () => {
      const userId = socket.userId;
      console.log(`Client disconnected: ${socket.id} (user: ${userId || 'anonymous'})`);

      if (userId && onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          const now = new Date().toISOString();
          
          await dbAsync.run(
            'UPDATE users SET status = ?, last_seen = ? WHERE id = ?',
            ['offline', now, userId]
          );

          io.emit('user_status_changed', {
            userId,
            status: 'offline',
            last_seen: now
          });
        }
      }
    });
  });
};
