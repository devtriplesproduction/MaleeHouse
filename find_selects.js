const fs = require('fs');
const path = require('path');

function findSelectWildcards(dir, results = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findSelectWildcards(fullPath, results);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.match(/\.select\(\s*['"`]\*/)) {
          results.push({ file: fullPath, line: i + 1, content: line.trim() });
        }
      }
    }
  }
  return results;
}

const results = findSelectWildcards('./src');
fs.writeFileSync('select_usages.json', JSON.stringify(results, null, 2));
console.log(`Found ${results.length} usages.`);
