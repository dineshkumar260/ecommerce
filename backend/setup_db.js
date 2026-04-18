const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    console.log("Connecting to MySQL server to set up database...");
    let connection;
    try {
        // Connect to mysql without specifying DB name first
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log("Successfully connected to MySQL! Creating database if it doesn't exist...");
        
        // Create DB
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        
        // Use the DB
        await connection.query(`USE \`${process.env.DB_NAME}\`;`);
        
        console.log(`Database '${process.env.DB_NAME}' created/selected. Applying schema tables...`);

        // Read schema
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute all schema script blocks
        await connection.query(schema);

        console.log("✅ Success! Database and all tables are perfectly connected and setup.");

    } catch (err) {
        console.error("❌ Failed to set up the database. Please make sure XAMPP / MySQL is running on your system.");
        console.error("Error details:", err.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();
