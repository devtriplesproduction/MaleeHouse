const fs = require('fs');

const schema = JSON.parse(fs.readFileSync('schema.json', 'utf8'));

// Get all files
const usages = JSON.parse(fs.readFileSync('select_usages.json', 'utf8'));
const filesToProcess = [...new Set(usages.map(u => u.file))];

for (const file of filesToProcess) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // We want to replace supabase.from('table_name').select('*, rel(*)')
  // Regex to find table name and select clause
  // We'll just look for .from('table').select('...', 
  // But wait, there might be newlines. Let's do a simple replace
  
  // Find all .from('table')...select('*')
  const fromRegex = /\.from\(['"`]([a-zA-Z_]+)['"`]\)[\s\S]*?\.select\((['"`])(.*?)(['"`])/g;
  
  content = content.replace(fromRegex, (match, table, quote1, selectContent, quote2) => {
    // If the select content contains *, we need to replace the * with the table's columns
    if (selectContent.includes('*')) {
      const cols = schema[table];
      if (cols) {
        // replace just the standalone * or *,
        // Actually, it's safer to just replace * with the cols.join(', ') but only if it's a table wildcard.
        // If it's a relation wildcard like `profiles(*)`, we'll try to handle it.
        let newSelect = selectContent;
        
        // Replace top-level *
        if (newSelect.startsWith('*,')) {
           newSelect = newSelect.replace('*,', cols.join(', ') + ',');
        } else if (newSelect === '*') {
           newSelect = cols.join(', ');
        }
        
        // Replace relation wildcards: relation_name(*) or relation_name!fk(*)
        const relRegex = /([a-zA-Z0-9_]+)(?:![a-zA-Z0-9_]+)?\(\*\)/g;
        newSelect = newSelect.replace(relRegex, (relMatch, relName) => {
           // We might not know the exact relation table if it's aliased, but usually it matches the table name
           const relCols = schema[relName];
           if (relCols) {
              return relMatch.replace('*', relCols.join(', '));
           } else {
              // Try to find if it's profiles
              if (relName === 'creator' || relName === 'actor_profile' || relName === 'user_id') {
                 return relMatch.replace('*', schema['profiles'] ? schema['profiles'].join(', ') : '*');
              }
              if (relName === 'project') return relMatch.replace('*', schema['projects'] ? schema['projects'].join(', ') : '*');
              
              // We couldn't safely determine the table, we'll leave it as * or replace with just id if we must. 
              // Leaving as * for unmapped relations to avoid breaking.
              return relMatch;
           }
        });
        
        changed = true;
        return match.replace(selectContent, newSelect);
      }
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
