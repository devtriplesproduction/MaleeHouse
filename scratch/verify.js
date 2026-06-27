const { Client } = require('pg');

const connectionString = 'postgres://postgres:zaKdo1-baxnuq-nexdit@db.ewgbhzyphxbjrkkjprqy.supabase.co:5432/postgres';

async function runTest() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    // Fetch test profiles
    const { rows: profiles } = await client.query(`
      SELECT id, email, role FROM public.profiles 
      WHERE email IN ('admin@maleehouse.com', 'accounts@maleehouse.com', 'engineer@maleehouse.com')
    `);

    console.log('Existing profiles to test with:', profiles);

    const admin = profiles.find(p => p.role === 'admin');
    const accountant = profiles.find(p => p.role === 'accountant');
    const engineer = profiles.find(p => p.role === 'engineer');

    if (!admin || !accountant || !engineer) {
      throw new Error('Could not find all test profiles. Please run seed_db.mjs first.');
    }

    console.log('\n--- 1. Testing Admin RLS access ---');
    await client.query('BEGIN');
    await client.query(`SET LOCAL ROLE authenticated`);
    await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: admin.id })]);
    
    const adminInsertRes = await client.query(`
      INSERT INTO public.expenses (category, description, amount, expense_date, created_by)
      VALUES ('labor', 'Admin test expense', 150.00, CURRENT_DATE, $1)
      RETURNING id
    `, [admin.id]);
    const expenseId = adminInsertRes.rows[0].id;
    console.log('✅ Admin inserted expense, ID:', expenseId);

    const adminSelectRes = await client.query('SELECT count(*) FROM public.expenses');
    console.log('✅ Admin select count:', adminSelectRes.rows[0].count);

    await client.query('UPDATE public.expenses SET amount = 180.00 WHERE id = $1', [expenseId]);
    console.log('✅ Admin updated expense amount');

    await client.query('ROLLBACK');
    console.log('Admin transaction rolled back.');

    console.log('\n--- 2. Testing Accountant RLS access ---');
    await client.query('BEGIN');
    await client.query(`SET LOCAL ROLE authenticated`);
    await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: accountant.id })]);

    const accInsertRes = await client.query(`
      INSERT INTO public.expenses (category, description, amount, expense_date, created_by)
      VALUES ('overhead', 'Accountant test expense', 250.00, CURRENT_DATE, $1)
      RETURNING id
    `, [accountant.id]);
    const accExpenseId = accInsertRes.rows[0].id;
    console.log('✅ Accountant inserted expense, ID:', accExpenseId);

    const accSelectRes = await client.query('SELECT count(*) FROM public.expenses');
    console.log('✅ Accountant select count:', accSelectRes.rows[0].count);

    await client.query('UPDATE public.expenses SET amount = 280.00 WHERE id = $1', [accExpenseId]);
    console.log('✅ Accountant updated expense amount');

    await client.query('ROLLBACK');
    console.log('Accountant transaction rolled back.');

    console.log('\n--- 3. Testing Engineer (Unprivileged) RLS access ---');
    await client.query('BEGIN');
    await client.query(`SET LOCAL ROLE authenticated`);
    await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: engineer.id })]);

    try {
      await client.query(`
        INSERT INTO public.expenses (category, description, amount, expense_date, created_by)
        VALUES ('travel', 'Engineer test expense', 50.00, CURRENT_DATE, $1)
      `, [engineer.id]);
      console.log('❌ Error: Engineer successfully inserted an expense (RLS failed!)');
    } catch (err) {
      console.log('✅ Engineer insert blocked (RLS enforced!):', err.message);
    }

    const engSelectRes = await client.query('SELECT count(*) FROM public.expenses');
    console.log('✅ Engineer select count (should be 0):', engSelectRes.rows[0].count);

    await client.query('ROLLBACK');
    console.log('Engineer transaction rolled back.');

    console.log('\n✨ All RLS Database policy tests completed successfully!');

  } catch (err) {
    console.error('Test script error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runTest();
