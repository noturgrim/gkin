const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const config = require('../config/config');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Read schema SQL files
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    const passcodesSchemaSQL = fs.readFileSync(path.join(__dirname, 'passcodes_schema.sql'), 'utf8');
    const assignmentsSchemaSQL = fs.readFileSync(path.join(__dirname, 'assignments_schema.sql'), 'utf8');
    
    // Execute schema SQL
    await db.query(schemaSQL);
    await db.query(passcodesSchemaSQL);
    await db.query(assignmentsSchemaSQL);
    console.log('Database schema created successfully');
    
    // Check if role_passcodes table is empty
    const passcodesCount = await db.query('SELECT COUNT(*) FROM role_passcodes');
    
    // If no passcodes exist, add default passcodes
    if (parseInt(passcodesCount.rows[0].count) === 0) {
      console.log('Adding default passcodes to database...');
      
      // Insert default passcodes
      const defaultPasscodes = {
        liturgy: 'liturgy123',
        pastor: 'pastor123',
        translation: 'translation123',
        beamer: 'beamer123',
        music: 'music123',
        treasurer: 'treasurer123',
        admin: 'admin2025'
      };
      
      for (const [role, passcode] of Object.entries(defaultPasscodes)) {
        await db.query(
          'INSERT INTO role_passcodes (role, passcode) VALUES ($1, $2)',
          [role, passcode]
        );
        console.log(`Added default passcode for role: ${role}`);
      }
      
      console.log('Default passcodes added');
    }
    
    // Check if users table is empty
    const userCount = await db.query('SELECT COUNT(*) FROM users');
    
    // If no users exist, create default users for each role
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('Creating default users...');
      
      // Get roles from database
      const roleResults = await db.query('SELECT role FROM role_passcodes');
      const roles = [
        { id: 'liturgy', name: 'Liturgy Maker' },
        { id: 'pastor', name: 'Pastor' },
        { id: 'translation', name: 'Translator' },
        { id: 'beamer', name: 'Beamer Team' },
        { id: 'music', name: 'Musicians' },
        { id: 'treasurer', name: 'Treasurer' }
      ];
      
      for (const role of roles) {
        await db.query(
          'INSERT INTO users (username, role, avatar_url) VALUES ($1, $2, $3)',
          [`Default ${role.name}`, role.id, `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`]
        );
      }
      
      console.log('Default users created successfully');
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export the function to be called from server.js
module.exports = { initializeDatabase };

// If this script is run directly, execute the initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization script completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}
