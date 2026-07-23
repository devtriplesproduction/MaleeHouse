const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let out = '';
walkDir('./src', (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(".select('*')") || content.includes('.select("*")')) {
      out += `\n=== ${filePath} ===\n`;
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(".select('*')") || lines[i].includes('.select("*")')) {
          out += `Line ${i + 1}: ${lines[i].trim()}\n`;
          out += lines.slice(i + 1, i + 20).join('\n') + '\n---\n';
        }
      }
    }
  }
});

fs.writeFileSync('scratch_audit.txt', out);
console.log('Done!');
