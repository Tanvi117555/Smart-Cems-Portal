const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cems_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4'
});

// Helper for executing queries
const query = async (sql, params = []) => {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('MySQL Query Error:', error.message, '\nSQL:', sql);
    throw error;
  }
};

// Check DB Connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database Connected Successfully to ' + (process.env.DB_NAME || 'cems_db'));
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL Connection Failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  query,
  testConnection
};
