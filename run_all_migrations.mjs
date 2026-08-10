import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Client } = pkg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'supabase', 'migrations');
const dbUrl = "postgresql://postgres:RacDojdInV7cqMb2@db.ewgbhzyphxbjrkkjprqy.supabase.co:5432/postgres";

async function runMigrations() {
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    
    console.log("Connected to remote DB.");

    try {
        const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        console.log(`Found ${files.length} migrations. Applying them...`);
        for (const file of files) {
            console.log(`Applying: ${file}`);
            const sql = readFileSync(join(migrationsDir, file), 'utf8');
            try {
                await client.query(sql);
                console.log(`  -> Success: ${file}`);
            } catch (err) {
                console.error(`  -> Failed: ${file} | ${err.message}`);
                // Continue running other migrations
            }
        }
    } finally {
        await client.end();
        console.log("Migration execution finished.");
    }
}

runMigrations().catch(console.error);
