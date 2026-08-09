const { dbAsync } = require('../config/db');

// Helper to generate custom user IDs
const generateId = () => 'usr_' + Math.random().toString(36).substring(2, 10);

exports.login = async (req, res) => {
  try {
    const { username, avatar } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const cleanUsername = username.trim();
    const defaultAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`;

    // Check if user already exists
    let user = await dbAsync.get('SELECT * FROM users WHERE username = ?', [cleanUsername]);

    const now = new Date().toISOString();

    if (user) {
      // Update status to online and refresh avatar if provided
      await dbAsync.run(
        'UPDATE users SET status = ?, avatar = ?, last_seen = ? WHERE id = ?',
        ['online', avatar || user.avatar, now, user.id]
      );
      user = await dbAsync.get('SELECT * FROM users WHERE id = ?', [user.id]);
    } else {
      // Create new user
      const id = generateId();
      await dbAsync.run(
        'INSERT INTO users (id, username, avatar, status, last_seen, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, cleanUsername, defaultAvatar, 'online', now, now]
      );
      user = await dbAsync.get('SELECT * FROM users WHERE id = ?', [id]);
    }

    res.status(200).json({
      message: 'Login successful',
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await dbAsync.all('SELECT id, username, avatar, status, last_seen, created_at FROM users ORDER BY username ASC');
    res.status(200).json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};
