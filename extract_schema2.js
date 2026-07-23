const fs = require('fs');

const content = fs.readFileSync('src/types/database.types.ts', 'utf8');
const lines = content.split('\n');

let tables = {};
let currentTable = null;
let inTablesBlock = false;
let braceDepth = 0;
let tablesDepth = -1;
let rowDepth = -1;

for (let line of lines) {
  let trimmed = line.trim();
  
  // Count braces naively for this line
  let openBraces = (trimmed.match(/\{/g) || []).length;
  let closeBraces = (trimmed.match(/\}/g) || []).length;
  
  if (trimmed.startsWith('Tables: {')) {
    inTablesBlock = true;
    tablesDepth = braceDepth;
  }
  
  if (inTablesBlock && braceDepth === tablesDepth + 1 && trimmed.endsWith(': {') && !trimmed.startsWith('Row:') && !trimmed.startsWith('Insert:') && !trimmed.startsWith('Update:') && !trimmed.startsWith('Relationships:')) {
    currentTable = trimmed.replace(': {', '').replace(/['"]/g, '').trim();
    tables[currentTable] = [];
  }
  
  if (currentTable && trimmed.startsWith('Row: {')) {
    rowDepth = braceDepth;
  }
  
  if (currentTable && rowDepth !== -1 && braceDepth === rowDepth + 1 && !trimmed.startsWith('Row: {') && trimmed.includes(':')) {
    const colMatch = trimmed.match(/^['"]?([a-zA-Z0-9_]+)['"]?\??\s*:/);
    if (colMatch) {
       tables[currentTable].push(colMatch[1]);
    }
  }
  
  braceDepth += openBraces;
  braceDepth -= closeBraces;
  
  if (rowDepth !== -1 && braceDepth <= rowDepth) {
    rowDepth = -1;
  }
  
  if (inTablesBlock && braceDepth <= tablesDepth) {
    inTablesBlock = false;
  }
}

fs.writeFileSync('schema2.json', JSON.stringify(tables, null, 2));
console.log('Found tables:', Object.keys(tables).length);
