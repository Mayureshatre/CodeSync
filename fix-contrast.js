const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const newContent = content
        .replace(/bg-accent text-primary/g, 'bg-accent text-white')
        .replace(/bg-surface hover:bg-surface-elevated text-primary/g, 'bg-surface hover:bg-surface-elevated text-primary')
        .replace(/text-primary text-white/g, 'text-white')
        .replace(/bg-accent hover:opacity-90 text-white/g, 'bg-accent text-white hover:opacity-90');
        
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Fixed contrast in ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'apps/web/src/components'));
processDir(path.join(__dirname, 'packages/ui'));
