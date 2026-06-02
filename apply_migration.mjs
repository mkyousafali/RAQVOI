#!/usr/bin/env node
/**
 * Apply specific migration file
 * Usage: node apply_migration.mjs supabase/migrations/filename.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node apply_migration.mjs <migration-file>');
  console.log('\nExamples:');
  console.log('  node apply_migration.mjs supabase/migrations/admin_rls_setup.sql');
  console.log('  node apply_migration.mjs admin_rls_setup.sql');
  console.log('  node apply_migration.mjs 20260602_admin_rls');
  process.exit(1);
}

async function applyMigration() {
  let migrationFile = args[0];
  
  // Resolve file path
  let fullPath;
  
  if (fs.existsSync(migrationFile)) {
    fullPath = migrationFile;
  } else if (fs.existsSync(path.join('supabase', 'migrations', migrationFile))) {
    fullPath = path.join('supabase', 'migrations', migrationFile);
  } else if (fs.existsSync(path.join('supabase', 'migrations', migrationFile + '.sql'))) {
    fullPath = path.join('supabase', 'migrations', migrationFile + '.sql');
  } else {
    console.error('❌ Migration file not found:', migrationFile);
    process.exit(1);
  }

  console.log('🔐 Database Migration');
  console.log('═'.repeat(70));
  console.log(`\n📂 Migration: ${path.basename(fullPath)}`);

  try {
    // Read SQL
    const sql = fs.readFileSync(fullPath, 'utf-8');
    console.log(`📖 Loaded ${sql.length} characters\n`);

    // Connect
    console.log('🔗 Connecting to Supabase...');
    
    // Get credentials from environment variables
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL environment variable not set');
      process.exit(1);
    }
    
    const client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ Connected\n');

    // Execute
    console.log('⚙️  Executing SQL...');
    await client.query(sql);
    console.log('✅ Executed\n');

    // Close
    await client.end();

    console.log('═'.repeat(70));
    console.log('\n✅ Migration Applied Successfully!\n');
    console.log('📝 Remember to:');
    console.log('  • Verify changes in Supabase Dashboard');
    console.log('  • Test your application');
    console.log('  • Commit migration file to git\n');

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Resource already exists - this is okay');
      console.log('✅ Migration completed\n');
    } else {
      console.error('\n❌ Error:', error.message);
      process.exit(1);
    }
  }
}

applyMigration();
