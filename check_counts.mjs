import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'supabase', 'migrations');
const dbUrl = "postgresql://postgres:RacDojdInV7cqMb2@db.ewgbhzyphxbjrkkjprqy.supabase.co:5432/postgres";

async function checkCounts() {
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    
    try {
        // 1. Local Migration Files Count
        const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
        console.log(`Local migration files count: ${files.length}`);

        // 2. Global Database Migrations Count
        const migrationsRes = await client.query('SELECT count(*) FROM supabase_migrations.schema_migrations');
        console.log(`Global DB applied migrations count: ${migrationsRes.rows[0].count}`);

        // 3. Global Database Table Count (Public Schema)
        const tablesRes = await client.query(`
            SELECT count(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);
        console.log(`Global DB tables count (public schema): ${tablesRes.rows[0].count}`);
        
        // List of tables for reference
        const tableListRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);
        console.log(`Tables in Global DB: ${tableListRes.rows.map(r => r.table_name).join(', ')}`);

    } catch (err) {
        console.error("Error checking counts:", err.message);
    } finally {
        await client.end();
    }
}

checkCounts().catch(console.error);
