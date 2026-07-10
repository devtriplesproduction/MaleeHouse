const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if(key && val) acc[key.trim()] = val.join('=').trim().replace(/\"/g, '');
  return acc;
}, {});

if (env.DATABASE_URL) {
  try {
    execSync('psql "' + env.DATABASE_URL + '" -f supabase/migrations/56_add_bank_to_payments.sql', { stdio: 'inherit' });
    console.log('Migration applied!');
  } catch (err) {
    console.error('Error applying migration via psql:', err.message);
  }
} else {
  console.error('No DATABASE_URL in .env.local');
}
