const fs = require('fs');
const schema = JSON.parse(fs.readFileSync('schema.json', 'utf8'));

const files = [
  'src/actions/announcement.actions.ts',
  'src/actions/expense.actions.ts',
  'src/actions/holiday.actions.ts',
  'src/actions/ledger.actions.ts',
  'src/actions/notification.actions.ts',
  'src/actions/payroll.actions.ts',
  'src/actions/payroll_workflow.actions.ts',
  'src/actions/reconciliation.actions.ts',
  'src/actions/storage.actions.ts',
  'src/app/receipts/[id]/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const selectMatch = lines[i].match(/\.select\((['"`])(.*?)\1\)/);
    if (selectMatch && selectMatch[2].includes('*')) {
      let table = null;
      // look back 15 lines for from
      for (let j = i; j >= Math.max(0, i - 15); j--) {
         const fromMatch = lines[j].match(/\.from\(['"`]([a-zA-Z_]+)['"`]\)/);
         if (fromMatch) {
            table = fromMatch[1];
            break;
         }
      }
      
      if (!table && file.includes('receipts')) {
         table = 'receipts'; // Hardcode known cases if necessary
      }
      if (!table && file.includes('ledger.actions.ts')) {
         table = 'employee_financial_ledger';
      }
      
      if (table && schema[table]) {
         let cols = schema[table];
         let newSelect = selectMatch[2];
         if (newSelect.startsWith('*,')) {
           newSelect = newSelect.replace('*,', cols.join(', ') + ',');
         } else if (newSelect === '*') {
           newSelect = cols.join(', ');
         }
         
         const relRegex = /([a-zA-Z0-9_]+)(?:![a-zA-Z0-9_]+)?\(\*\)/g;
         newSelect = newSelect.replace(relRegex, (relMatch, relName) => {
            const relCols = schema[relName];
            if (relCols) return relMatch.replace('*', relCols.join(', '));
            if (relName === 'creator' || relName === 'actor_profile' || relName === 'user_id' || relName === 'reconciled_by_profile' || relName === 'superseded_by_profile' || relName === 'uploaded_by_profile' || relName === 'posted_by_profile') return relMatch.replace('*', schema['profiles'] ? schema['profiles'].join(', ') : '*');
            if (relName === 'project') return relMatch.replace('*', schema['projects'] ? schema['projects'].join(', ') : '*');
            return relMatch;
         });
         
         lines[i] = lines[i].replace(selectMatch[0], `.select('${newSelect}')`);
         changed = true;
      } else {
         console.log('Could not find table for file', file, 'line', i);
      }
    }
  }
  
  if (changed) {
     fs.writeFileSync(file, lines.join('\n'), 'utf8');
     console.log('Fixed', file);
  }
}
