const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getFiles(fullPath));
    } else if (entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = getFiles('tests/unit');
for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  
  if (c.includes("vi.mock('../../apps/web/src/server/db'")) {
    c = c.replace(/vi\.mock\('\.\.\/\.\.\/apps\/web\/src\/server\/db',\s*\(\)\s*=>\s*\(\{\s*(.*?)\s*\}\)\);/s, (match, p1) => {
      return `vi.mock('@codesync/core', async () => {\n  const actual = await vi.importActual<any>('@codesync/core');\n  return {\n    ...actual,\n    enqueueMatchRecompute: vi.fn(),\n    ${p1}\n  };\n});`;
    });
    
    // Also remove the queue mock if it exists so we don't double-mock @codesync/core if they had one
    c = c.replace(/vi\.mock\('\.\.\/\.\.\/apps\/web\/src\/server\/jobs\/queue',\s*\(\)\s*=>\s*\(\{\s*(.*?)\s*\}\)\);/s, "");
    
    fs.writeFileSync(file, c);
  }
}
