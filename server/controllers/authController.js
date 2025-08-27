const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/db');

/**
 * Handle user login with role-based authentication
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const login = async (req, res) => {
  try {
    const { username, role, passcode } = req.body;

    // Validate request body
    if (!username || !role || !passcode) {
      return res.status(400).json({ message: 'Username, role, and passcode are required' });
    }

    // Check if role is valid
    if (!config.passcodes[role]) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if passcode is correct for the role
    if (passcode !== config.passcodes[role]) {
      return res.status(401).json({ message: 'Invalid passcode for this role' });
    }
    
    // Check if user exists or create a new one
    let user;
    const existingUser = await db.query('SELECT * FROM users WHERE username = $1 AND role = $2', [username, role]);
    
    if (existingUser.rows.length > 0) {
      // User exists, use this user
      user = existingUser.rows[0];
      
      // Update last active
      await db.query('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    } else {
      // Create new user
      const avatar_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`;
      const result = await db.query(
        'INSERT INTO users (username, role, avatar_url) VALUES ($1, $2, $3) RETURNING *',
        [username, role, avatar_url]
      );
      user = result.rows[0];
    }

    // Generate JWT token with the user's actual ID
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiration }
    );

    // Return user info and token
    res.status(200).json({
      id: user.id,
      username: user.username,
      role: user.role,
      avatar_url: user.avatar_url,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Verify if token is valid
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const verifyAuth = (req, res) => {
  res.status(200).json({ user: req.user });
};

module.exports = {
  login,
  verifyAuth
};
