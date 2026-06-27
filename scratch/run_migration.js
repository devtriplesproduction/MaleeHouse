const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgres://postgres:zaKdo1-baxnuq-nexdit@db.ewgbhzyphxbjrkkjprqy.supabase.co:5432/postgres';

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/50_expenses.sql');
    console.log(`Reading migration from: ${migrationPath}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Connecting to database...');
    await client.connect();

    console.log('Running migration...');
    await client.query(sql);

    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Error running migration:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
