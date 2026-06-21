const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:zaKdo1-baxnuq-nexdit@db.ewgbhzyphxbjrkkjprqy.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkDb() {
  try {
    await client.connect();

    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'profiles';
    `);
    console.log("Profiles columns:", res.rows.map(r => r.column_name));

  } catch (err) {
    console.error("Database error:", err.message);
  } finally {
    await client.end();
  }
}

checkDb();
