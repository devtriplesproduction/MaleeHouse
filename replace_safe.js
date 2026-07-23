const fs = require('fs');

const schema = JSON.parse(fs.readFileSync('schema.json', 'utf8'));
const usages = JSON.parse(fs.readFileSync('select_usages.json', 'utf8'));
const filesToProcess = [...new Set(usages.map(u => u.file))];

for (const file of filesToProcess) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const fromRegex = /\.from\(['"`]([a-zA-Z_]+)['"`]\)([\s\S]*?)\.select\((['"`])(.*?)(['"`])/g;
  
  content = content.replace(fromRegex, (match, table, inBetween, quote1, selectContent, quote2) => {
    if (selectContent.includes('*')) {
      const cols = schema[table];
      if (cols) {
        let newSelect = selectContent;
        if (newSelect.startsWith('*,')) {
           newSelect = newSelect.replace('*,', cols.join(', ') + ',');
        } else if (newSelect === '*') {
           newSelect = cols.join(', ');
        }
        
        const relRegex = /([a-zA-Z0-9_]+)(?:![a-zA-Z0-9_]+)?\(\*\)/g;
        newSelect = newSelect.replace(relRegex, (relMatch, relName) => {
           const relCols = schema[relName];
           if (relCols) return relMatch.replace('*', relCols.join(', '));
           if (['creator', 'actor_profile', 'user_id', 'reconciled_by_profile', 'superseded_by_profile', 'uploaded_by_profile', 'posted_by_profile', 'author_profile'].includes(relName)) {
               return relMatch.replace('*', schema['profiles'] ? schema['profiles'].join(', ') : '*');
           }
           if (relName === 'project') return relMatch.replace('*', schema['projects'] ? schema['projects'].join(', ') : '*');
           return relMatch;
        });
        
        changed = true;
        
        // Reconstruct the match instead of simple replace
        return `.from('${table}')${inBetween}.select('${newSelect}'`;
      }
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
