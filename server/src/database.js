import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ES modules __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading .env from different locations
console.log('Current directory:', __dirname);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

console.log('=== DEBUG INFO ===');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL value:', process.env.DATABASE_URL);
console.log('==================');

// Test with a simple connection first
const testConnection = async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false
    });
    
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Database time:', result.rows[0].now);
    
    client.release();
    return pool;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('Full error:', error);
    return null;
  }
};

export const pool = await testConnection();