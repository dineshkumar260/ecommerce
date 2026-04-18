const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = {
  // Wrap to partially mimic pg driver return format
  query: async (text, params) => {
      const [rows, fields] = await pool.execute(text, params);
      return { 
          rows: Array.isArray(rows) ? rows : [rows], 
          insertId: rows.insertId,
          affectedRows: rows.affectedRows
      };
  },
  getConnection: () => pool.getConnection()
};
