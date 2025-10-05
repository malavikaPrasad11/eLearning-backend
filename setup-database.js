require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');
    await sql.connect(config);
    
    // Create Users table
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
      CREATE TABLE Users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        phone NVARCHAR(20),
        password_hash NVARCHAR(255) NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    
    // Create Feedbacks table
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Feedbacks' AND xtype='U')
      CREATE TABLE Feedbacks (
        feedback_id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        image NVARCHAR(500),
        rating INT NOT NULL,
        comment NVARCHAR(1000),
        date DATETIME2 DEFAULT GETDATE()
      )
    `);
    
    console.log('✅ Database tables created successfully!');
    await sql.close();
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
  }
}

setupDatabase();