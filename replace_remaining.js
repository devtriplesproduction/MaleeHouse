const fs = require('fs');
const schema = JSON.parse(fs.readFileSync('schema.json', 'utf8'));

const usages = JSON.parse(fs.readFileSync('select_usages.json', 'utf8'));

for (const u of usages) {
  let content = fs.readFileSync(u.file, 'utf8');
  let lines = content.split('\n');
  const lineIdx = u.line - 1;
  
  if (lines[lineIdx].includes('.select(') && lines[lineIdx].includes('*')) {
     // Search backwards for .from(
     let table = null;
     for (let i = lineIdx; i >= 0; i--) {
        const match = lines[i].match(/\.from\(['"`]([a-zA-Z_]+)['"`]\)/);
        if (match) {
           table = match[1];
           break;
        }
     }
     
     if (table && schema[table]) {
        let cols = schema[table];
        
        // Find the select content
        const selectMatch = lines[lineIdx].match(/\.select\((['"`])(.*?)\1\)/);
        if (selectMatch) {
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
           
           lines[lineIdx] = lines[lineIdx].replace(selectMatch[0], `.select('${newSelect}')`);
           
           fs.writeFileSync(u.file, lines.join('\n'), 'utf8');
           console.log('Fixed', u.file, 'line', u.line);
        }
     }
  }
}
