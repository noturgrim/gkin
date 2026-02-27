const db = require('../config/db');
const crypto = require('crypto');

// Simple encryption for sensitive data (in production, use better encryption)
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || 'gkin_email_settings_key_change_in_production';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

// Create a consistent key from the password
const createKey = (password) => {
  return crypto.scryptSync(password, 'salt', 32);
};

const encrypt = (text) => {
  try {
    const key = createKey(ENCRYPTION_KEY);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Return as-is if encryption fails
  }
};

const decrypt = (encryptedText) => {
  try {
    if (!encryptedText || !encryptedText.includes(':')) {
      return encryptedText; // Return as-is if not properly encrypted
    }
    
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedData = textParts.join(':');
    const key = createKey(ENCRYPTION_KEY);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText; // Return as-is if decryption fails
  }
};

/**
 * Email Settings controller for managing SMTP configuration
 */
const emailSettingsController = {
  /**
   * Get all email settings (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEmailSettings(req, res) {
    try {
      const result = await db.query(`
        SELECT setting_name, setting_value, is_encrypted, updated_at 
        FROM email_settings 
        ORDER BY setting_name
      `);

      // Decrypt encrypted values; always mask password fields regardless of is_encrypted flag
      const settings = result.rows.map(setting => ({
        ...setting,
        setting_value: setting.setting_name.includes('password')
          ? '••••••••'
          : (setting.is_encrypted ? decrypt(setting.setting_value) : setting.setting_value)
      }));

      return res.status(200).json({
        success: true,
        settings
      });
    } catch (error) {
      console.error('Error fetching email settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch email settings',
        error: error.message
      });
    }
  },

  /**
   * Update email settings (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateEmailSettings(req, res) {
    try {
      const { settings } = req.body;
      const userId = req.user.id;

      if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({
          success: false,
          message: 'Settings array is required'
        });
      }

      // Start transaction
      const client = await db.getClient();
      try {
        await client.query('BEGIN');

        for (const setting of settings) {
          const { setting_name, setting_value } = setting;

          if (!setting_name || setting_value === undefined) {
            throw new Error('setting_name and setting_value are required');
          }

          // Password fields: skip if unchanged (masked value sent back), always encrypt
          const isPasswordField = setting_name.includes('password');
          if (isPasswordField && setting_value === '••••••••') {
            continue; // Admin didn't change the password — leave it as-is
          }

          // Determine encryption server-side; never trust the client flag for passwords
          const shouldEncrypt = isPasswordField;
          const finalValue = shouldEncrypt ? encrypt(setting_value) : setting_value;

          await client.query(`
            INSERT INTO email_settings (setting_name, setting_value, is_encrypted, updated_by)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (setting_name) 
            DO UPDATE SET 
              setting_value = EXCLUDED.setting_value,
              is_encrypted = EXCLUDED.is_encrypted,
              updated_by = EXCLUDED.updated_by,
              updated_at = CURRENT_TIMESTAMP
          `, [setting_name, finalValue, shouldEncrypt, userId]);
        }

        await client.query('COMMIT');

        return res.status(200).json({
          success: true,
          message: 'Email settings updated successfully'
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error updating email settings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update email settings',
        error: error.message
      });
    }
  },

  /**
   * Test email configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async testEmailSettings(req, res) {
    try {
      const { testEmail } = req.body;

      if (!testEmail) {
        return res.status(400).json({
          success: false,
          message: 'Test email address is required'
        });
      }

      // Get current email settings
      const settingsResult = await db.query('SELECT setting_name, setting_value, is_encrypted FROM email_settings');
      const settings = {};
      
      settingsResult.rows.forEach(row => {
        settings[row.setting_name] = row.is_encrypted ? decrypt(row.setting_value) : row.setting_value;
      });

      // Create transporter with current settings
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: settings.smtp_host,
        port: parseInt(settings.smtp_port),
        secure: settings.smtp_secure === 'true',
        auth: {
          user: settings.smtp_user,
          pass: settings.smtp_password,
        },
      });

      // Send test email
      await transporter.sendMail({
        from: `"${settings.from_name}" <${settings.from_email}>`,
        to: testEmail,
        subject: 'GKIN Email Configuration Test',
        text: 'This is a test email to verify your SMTP configuration is working correctly.',
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p><strong>Test sent at:</strong> ${new Date().toLocaleString()}</p>
          <p><em>GKIN Admin System</em></p>
        `
      });

      return res.status(200).json({
        success: true,
        message: 'Test email sent successfully'
      });
    } catch (error) {
      console.error('Error testing email settings:', error);

      // Translate SMTP error codes into human-friendly messages
      let friendlyMessage = 'Failed to send test email';
      if (error.code === 'EAUTH' || error.responseCode === 535) {
        friendlyMessage = 'Authentication failed — check your SMTP username and password.';
      } else if (error.code === 'ECONNREFUSED') {
        friendlyMessage = 'Connection refused — check the SMTP host and port.';
      } else if (error.code === 'ENOTFOUND') {
        friendlyMessage = `SMTP host not found — "${error.hostname || 'unknown'}" could not be resolved.`;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        friendlyMessage = 'Connection timed out — check the host, port, and firewall settings.';
      } else if (error.code === 'ESOCKET') {
        friendlyMessage = 'Socket error — verify the port and SSL/TLS setting (secure on/off).';
      } else if (error.responseCode) {
        friendlyMessage = `SMTP error ${error.responseCode}: ${error.response || error.message}`;
      } else if (error.message) {
        friendlyMessage = error.message;
      }

      return res.status(500).json({
        success: false,
        message: friendlyMessage
      });
    }
  },

  /**
   * Get email settings for internal use (returns decrypted values)
   * @returns {Object} Settings object
   */
  async getEmailSettingsInternal() {
    try {
      const result = await db.query('SELECT setting_name, setting_value, is_encrypted FROM email_settings');
      const settings = {};
      
      result.rows.forEach(row => {
        settings[row.setting_name] = row.is_encrypted ? decrypt(row.setting_value) : row.setting_value;
      });

      return settings;
    } catch (error) {
      console.error('Error fetching internal email settings:', error);
      // Return defaults if database fails
      return {
        smtp_host: 'smtp.privateemail.com',
        smtp_port: '465',
        smtp_secure: 'true',
        smtp_user: 'user2003@andrewscreem.com',
        smtp_password: '$DANdan2003$',
        from_name: 'GKIN System',
        from_email: 'user2003@andrewscreem.com'
      };
    }
  }
};

module.exports = emailSettingsController;