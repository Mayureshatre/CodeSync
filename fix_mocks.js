const fs = require('fs');
const glob = require('glob');

const files = glob.sync('tests/unit/**/*.test.ts');
for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  
  // Find vi.mock('../../apps/web/src/server/db', () => ({ ... }));
  // Since it can span multiple lines, we'll parse it out carefully.
  // We'll replace the first line of the db mock and the queue mock.
  
  if (c.includes("vi.mock('../../apps/web/src/server/db'")) {
    c = c.replace(/vi\.mock\('\.\.\/\.\.\/apps\/web\/src\/server\/db',\s*\(\)\s*=>\s*\(\{/, 
      "vi.mock('@codesync/core', async () => ({\n  ...(await vi.importActual<any>('@codesync/core')),\n  enqueueMatchRecompute: vi.fn(),\n");
    fs.writeFileSync(file, c);
  }
}
