const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if(key && val) acc[key.trim()] = val.join('=').trim().replace(/\"/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  const banks = [
    { bank_name: 'HDFC Bank', account_name: 'MaleeHouse Pvt Ltd', account_number: '50200000000001', ifsc_code: 'HDFC0001234', branch_name: 'MG Road, Bangalore', is_default: true },
    { bank_name: 'ICICI Bank', account_name: 'MaleeHouse Pvt Ltd', account_number: '0001050000002', ifsc_code: 'ICIC0000001', branch_name: 'Indiranagar, Bangalore', is_default: false },
    { bank_name: 'State Bank of India', account_name: 'MaleeHouse Pvt Ltd', account_number: '30000000003', ifsc_code: 'SBIN0000001', branch_name: 'Koramangala, Bangalore', is_default: false },
    { bank_name: 'Axis Bank', account_name: 'MaleeHouse Pvt Ltd', account_number: '91000000000004', ifsc_code: 'UTIB0000001', branch_name: 'Whitefield, Bangalore', is_default: false },
    { bank_name: 'Kotak Mahindra', account_name: 'MaleeHouse Pvt Ltd', account_number: '5000000005', ifsc_code: 'KKBK0000001', branch_name: 'Jayanagar, Bangalore', is_default: false }
  ];

  const { error } = await supabase.from('bank_accounts').insert(banks);
  if(error) {
    console.error('Error seeding banks:', error);
  } else {
    console.log('Successfully seeded 5 banks!');
  }
}
seed();
