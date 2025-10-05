// db.js
const sql = require("mssql");
require("dotenv").config();

const dbConfig = {
  server: process.env.DB_SERVER, // 'elearningapp.database.windows.net'
  database: process.env.DB_NAME, // 'E-Learning DB'
  user: process.env.DB_USER,     // 'Malavika'
  password: process.env.DB_PASSWORD, // 'Azure@2005'
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true, // MUST be true for Azure
    trustServerCertificate: false, // Should be false for Azure
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

console.log('Database configuration:', {
  server: dbConfig.server,
  database: dbConfig.database,
  user: dbConfig.user,
  port: dbConfig.port
});

const poolPromise = new sql.ConnectionPool(dbConfig) // Fixed: changed 'config' to 'dbConfig'
  .connect()
  .then((pool) => {
    console.log("✅ Connected to Azure SQL Database successfully!");
    
    // Test the connection with a simple query
    return pool.request().query("SELECT 1 as test")
      .then(() => pool)
      .catch(err => {
        console.error("❌ Test query failed:", err);
        throw err;
      });
  })
  .catch((err) => {
    console.error("❌ Database Connection Failed:", err.message);
    console.log("\nTroubleshooting tips:");
    console.log("1. Check if database exists in Azure portal");
    console.log("2. Verify username/password in .env file");
    console.log("3. Add your IP to Azure SQL Server firewall");
    console.log("4. Check if database server is running");
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise,
};