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
        .replace(/hover:shadow-elevation-low transition-all duration-200 transition-colors/g, 'hover:shadow-elevation-low transition-all duration-200')
        .replace(/bg-surface-elevated hover:bg-surface-elevated/g, 'bg-surface hover:bg-surface-elevated')
        .replace(/bg-accent hover:bg-accent/g, 'bg-accent hover:opacity-90 text-white')
        .replace(/bg-accent text-primary hover:opacity-90/g, 'bg-accent text-white hover:opacity-90');
        
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Fixed ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'apps/web/src/components'));
processDir(path.join(__dirname, 'packages/ui'));
