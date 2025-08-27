const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const config = require('../config/config');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Read schema SQL file
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // Execute schema SQL
    await db.query(schemaSQL);
    console.log('Database schema created successfully');
    
    // Check if users table is empty
    const userCount = await db.query('SELECT COUNT(*) FROM users');
    
    // If no users exist, create default users for each role
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('Creating default users...');
      
      const roles = [
        { id: 'liturgy', name: 'Liturgy Maker', passcode: config.passcodes.liturgy },
        { id: 'pastor', name: 'Pastor', passcode: config.passcodes.pastor },
        { id: 'translation', name: 'Translator', passcode: config.passcodes.translation },
        { id: 'beamer', name: 'Beamer Team', passcode: config.passcodes.beamer },
        { id: 'music', name: 'Musicians', passcode: config.passcodes.music },
        { id: 'treasurer', name: 'Treasurer', passcode: config.passcodes.treasurer }
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
