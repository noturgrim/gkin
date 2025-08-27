const db = require('../config/db');

/**
 * Get recent chat messages
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getMessages = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const messages = await db.query(
      `SELECT m.id, m.content, m.created_at, m.mentions,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'role', u.role,
          'avatar_url', u.avatar_url
        ) as sender
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      ORDER BY m.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    res.status(200).json(messages.rows.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

/**
 * Create a new message
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const createMessage = async (req, res) => {
  try {
    const { content, mentions } = req.body;
    const userId = req.user.id;
    
    // Validate request
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Insert the message
    const result = await db.query(
      'INSERT INTO messages (sender_id, content, mentions) VALUES ($1, $2, $3) RETURNING *',
      [userId, content, JSON.stringify(mentions || [])]
    );
    
    // Get the complete message with sender info
    const messageWithSender = await db.query(
      `SELECT m.id, m.content, m.created_at, m.mentions,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'role', u.role,
          'avatar_url', u.avatar_url
        ) as sender
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1`,
      [result.rows[0].id]
    );
    
    res.status(201).json(messageWithSender.rows[0]);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Error creating message' });
  }
};

/**
 * Get mentions for a user or role
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getMentions = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    // Get mentions for this user (by ID or role)
    const mentions = await db.query(
      `SELECT mm.id, mm.is_read, mm.created_at,
        m.id as message_id, m.content, m.created_at as message_created_at,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'role', u.role,
          'avatar_url', u.avatar_url
        ) as sender
      FROM message_mentions mm
      JOIN messages m ON mm.message_id = m.id
      JOIN users u ON m.sender_id = u.id
      WHERE (mm.mentioned_user_id = $1 OR mm.mentioned_role = $2)
      ORDER BY mm.created_at DESC
      LIMIT $3 OFFSET $4`,
      [userId, userRole, limit, offset]
    );
    
    res.status(200).json(mentions.rows);
  } catch (error) {
    console.error('Error fetching mentions:', error);
    res.status(500).json({ message: 'Error fetching mentions' });
  }
};

/**
 * Mark mentions as read
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const markMentionsAsRead = async (req, res) => {
  try {
    const { mentionIds } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (!mentionIds || !Array.isArray(mentionIds) || mentionIds.length === 0) {
      return res.status(400).json({ message: 'Mention IDs are required' });
    }
    
    // Only allow updating mentions that belong to this user
    await db.query(
      `UPDATE message_mentions 
      SET is_read = TRUE 
      WHERE id = ANY($1) AND (mentioned_user_id = $2 OR mentioned_role = $3)`,
      [mentionIds, userId, userRole]
    );
    
    res.status(200).json({ message: 'Mentions marked as read' });
  } catch (error) {
    console.error('Error marking mentions as read:', error);
    res.status(500).json({ message: 'Error marking mentions as read' });
  }
};

/**
 * Get unread mention count
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const getUnreadMentionCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const result = await db.query(
      `SELECT COUNT(*) FROM message_mentions 
      WHERE (mentioned_user_id = $1 OR mentioned_role = $2) AND is_read = FALSE`,
      [userId, userRole]
    );
    
    res.status(200).json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error fetching unread mention count:', error);
    res.status(500).json({ message: 'Error fetching unread mention count' });
  }
};

module.exports = {
  getMessages,
  createMessage,
  getMentions,
  markMentionsAsRead,
  getUnreadMentionCount
};
