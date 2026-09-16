const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /bg-\[#181c24\]/g, replacement: 'bg-surface' },
  { regex: /bg-\[#141822\]/g, replacement: 'bg-surface' },
  { regex: /bg-\[#0a0e16\]/g, replacement: 'bg-background' },
  { regex: /bg-\[#1e2433\]/g, replacement: 'bg-surface-elevated' },
  { regex: /border-\[#263042\]/g, replacement: 'border-border' },
  { regex: /border-\[#334155\]/g, replacement: 'border-border' },
  { regex: /text-\[#f1f5f9\]/g, replacement: 'text-primary' },
  { regex: /text-\[#94a3b8\]/g, replacement: 'text-secondary' },
  { regex: /text-\[#64748b\]/g, replacement: 'text-muted' },
  { regex: /text-\[#06b6d4\]/g, replacement: 'text-accent' },
  { regex: /bg-\[#06b6d4\]\/10/g, replacement: 'bg-accent/10' },
  { regex: /bg-\[#06b6d4\]/g, replacement: 'bg-accent' },
  { regex: /border-\[#06b6d4\]/g, replacement: 'border-accent' },
  { regex: /hover:border-\[#06b6d4\]/g, replacement: 'hover:border-accent' },
  { regex: /hover:text-\[#06b6d4\]/g, replacement: 'hover:text-accent' },
  { regex: /hover:bg-\[#06b6d4\]/g, replacement: 'hover:bg-accent' },
  { regex: /hover:bg-\[#263042\]/g, replacement: 'hover:bg-surface-elevated' },
  { regex: /text-\[#10b981\]/g, replacement: 'text-success' },
  { regex: /bg-\[#10b981\]\/10/g, replacement: 'bg-success/10' },
  { regex: /border-\[#10b981\]/g, replacement: 'border-success' },
  { regex: /text-\[#ef4444\]/g, replacement: 'text-error' },
  { regex: /bg-\[#ef4444\]\/10/g, replacement: 'bg-error/10' },
  { regex: /border-\[#ef4444\]/g, replacement: 'border-error' },
  { regex: /text-white/g, replacement: 'text-primary' },
  // Adding "Premium Minimal" styles: removing neon borders
  { regex: /hover:border-accent/g, replacement: 'hover:shadow-elevation-low transition-all duration-200' }, // Subtle hover lift instead of neon border
  { regex: /rounded-\[12px\]/g, replacement: 'rounded-xl' },
  { regex: /rounded-\[8px\]/g, replacement: 'rounded-lg' },
  { regex: /rounded-md/g, replacement: 'rounded-lg' },
  // Removing heavy neon shadows if they exist
  { regex: /shadow-\[.*?\]/g, replacement: 'shadow-elevation-flat' }
];

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'apps/web/src/components'));
processDir(path.join(__dirname, 'packages/ui'));
