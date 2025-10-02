// debug-env.js
import dotenv from 'dotenv';

// Load .env from root directory
dotenv.config({ path: '../.env' });  // Adjust path if needed

console.log('DATABASE_URL exists?', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length);
console.log('First 50 chars:', process.env.DATABASE_URL?.substring(0, 50) + '...');