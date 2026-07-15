const fs = require('fs');
const html = fs.readFileSync('temp.html', 'utf8');
const match = html.match(/<body[^>]*class="([^"]*)"/);
console.log(match ? match[1] : 'no match');
