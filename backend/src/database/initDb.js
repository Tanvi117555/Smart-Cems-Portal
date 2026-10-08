const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function initDatabase() {
  console.log('🔄 Initializing CEMS Database...');

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'cems_db';

  let connection;
  try {
    // 1. Connect without selecting database to create database if not exists
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Database \`${dbName}\` verified/created.`);

    await connection.changeUser({ database: dbName });

    // 2. Read and run schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await connection.query(schemaSql);
    console.log('✅ Database Schema (16 tables) created successfully.');

    // 3. Read and run seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    await connection.query(seedSql);
    console.log('✅ Realistic sample seed data imported successfully.');

    // 4. Update passwords to ensure exact bcrypt match for demo credentials
    const adminHash = await bcrypt.hash('Admin@123', 10);
    const facultyHash = await bcrypt.hash('Faculty@123', 10);
    const studentHash = await bcrypt.hash('Student@123', 10);

    await connection.query('UPDATE users SET password_hash = ? WHERE role = "admin"', [adminHash]);
    await connection.query('UPDATE users SET password_hash = ? WHERE role = "faculty"', [facultyHash]);
    await connection.query('UPDATE users SET password_hash = ? WHERE role = "student"', [studentHash]);
    console.log('✅ Verified & secured passwords for demo accounts (Admin@123, Faculty@123, Student@123).');

    console.log('🎉 CEMS Database Initialization Complete!');
  } catch (error) {
    console.error('❌ Database Initialization Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
