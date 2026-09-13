const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'apps/web/src/server/services/adminService.ts');
let code = fs.readFileSync(p, 'utf8');

code = code.replace(/\\\`/g, '\`');
code = code.replace(/\\\$/g, '$');

fs.writeFileSync(p, code);
console.log('Fixed backslashes');
