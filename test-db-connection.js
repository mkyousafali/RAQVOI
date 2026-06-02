import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✓ Connected successfully!');
    
    const result = await client.query('SELECT NOW();');
    console.log('✓ Query successful! Server time:', result.rows[0]);
    
    const version = await client.query('SELECT version();');
    console.log('✓ PostgreSQL version:', version.rows[0].version.split(',')[0]);
    
  } catch (err) {
    console.error('✗ Connection error:', err.message);
  } finally {
    await client.end();
  }
}

testConnection();
