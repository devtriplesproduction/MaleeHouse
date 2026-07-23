const fs = require('fs');
const content = fs.readFileSync('src/types/database.types.ts', 'utf8');

const tables = {};
let currentTable = null;
let inRow = false;

const lines = content.split('\n');
for (const line of lines) {
  const trimmed = line.trim();
  
  if (trimmed.endsWith(': {') && !trimmed.startsWith('Row:') && !trimmed.startsWith('Insert:') && !trimmed.startsWith('Update:') && !trimmed.startsWith('Relationships:') && !trimmed.startsWith('public:') && !trimmed.startsWith('Tables:') && !trimmed.startsWith('Enums:') && !trimmed.startsWith('Views:') && !trimmed.startsWith('Functions:')) {
    currentTable = trimmed.replace(': {', '').replace(/['"]/g, '').trim();
  } else if (trimmed === 'Row: {') {
    inRow = true;
    tables[currentTable] = [];
  } else if (trimmed === '}' && inRow) {
    inRow = false;
  } else if (inRow && currentTable) {
    const colMatch = trimmed.match(/^([a-zA-Z0-9_]+)(\??)\s*:/);
    if (colMatch) {
      tables[currentTable].push(colMatch[1]);
    } else {
      const colMatchStr = trimmed.match(/^"([a-zA-Z0-9_]+)"(\??)\s*:/);
      if (colMatchStr) {
         tables[currentTable].push(colMatchStr[1]);
      }
    }
  }
}

fs.writeFileSync('schema.json', JSON.stringify(tables, null, 2));
console.log('Schema extracted successfully with ' + Object.keys(tables).length + ' tables.');
