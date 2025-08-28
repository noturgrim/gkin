const db = require('../config/db');

/**
 * Admin controller for administrative operations
 */
const adminController = {
  /**
   * Clear all messages and related data (mentions, etc.)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response with status
   */
  async clearAllMessages(req, res) {
    try {
      // Start a database transaction to ensure all operations succeed or fail together
      const client = await db.getClient();
      
      try {
        await client.query('BEGIN');
        
        // Delete all mentions first (due to foreign key constraints)
        await client.query('DELETE FROM mentions');
        
        // Delete all messages
        await client.query('DELETE FROM messages');
        
        // Commit the transaction
        await client.query('COMMIT');
        
        return res.status(200).json({
          success: true,
          message: 'All messages and related data have been cleared'
        });
      } catch (error) {
        // If anything fails, roll back the transaction
        await client.query('ROLLBACK');
        throw error;
      } finally {
        // Release the client back to the pool
        client.release();
      }
    } catch (error) {
      console.error('Error clearing messages:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to clear messages',
        error: error.message
      });
    }
  },
  
  /**
   * Get message statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<Object>} Response with stats
   */
  async getMessageStats(req, res) {
    try {
      // Get message count
      const messageCountResult = await db.query('SELECT COUNT(*) as count FROM messages');
      const messageCount = parseInt(messageCountResult.rows[0].count);
      
      // Get mention count
      const mentionCountResult = await db.query('SELECT COUNT(*) as count FROM mentions');
      const mentionCount = parseInt(mentionCountResult.rows[0].count);
      
      // Get user message counts
      const userMessageCountsResult = await db.query(`
        SELECT u.username, COUNT(m.id) as message_count
        FROM users u
        LEFT JOIN messages m ON m.user_id = u.id
        GROUP BY u.username
        ORDER BY message_count DESC
        LIMIT 5
      `);
      
      return res.status(200).json({
        success: true,
        stats: {
          messageCount,
          mentionCount,
          topUsers: userMessageCountsResult.rows
        }
      });
    } catch (error) {
      console.error('Error getting message stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get message statistics',
        error: error.message
      });
    }
  }
};

module.exports = adminController;
