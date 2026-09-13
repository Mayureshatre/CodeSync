const fs = require('fs');
const path = require('path');

function replaceFile(filepath, replacements) {
  let content = fs.readFileSync(filepath, 'utf8');
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(filepath, content);
}

const base = path.join(__dirname, 'apps/web/app/api/v1/admin');

replaceFile(path.join(base, 'config', 'route.ts'), [
  ['../../../../../../src', '../../../../../src'],
  ['session.user.role', '(session.user as any).role']
]);

replaceFile(path.join(base, 'reports', 'route.ts'), [
  ['../../../../../../src', '../../../../../src'],
  ['session.user.role', '(session.user as any).role']
]);

replaceFile(path.join(base, 'skills', 'route.ts'), [
  ['../../../../../../src', '../../../../../src'],
  ['session.user.role', '(session.user as any).role']
]);

replaceFile(path.join(base, 'reports/[id]/resolve', 'route.ts'), [
  ['session.user.role', '(session.user as any).role']
]);

replaceFile(path.join(base, 'skills/[id]/resolve', 'route.ts'), [
  ['session.user.role', '(session.user as any).role']
]);

replaceFile(path.join(base, 'users/[id]/suspend', 'route.ts'), [
  ['session.user.role', '(session.user as any).role']
]);

replaceFile(path.join(base, 'projects/[id]/moderate', 'route.ts'), [
  ['session.user.role', '(session.user as any).role']
]);

replaceFile(path.join(__dirname, 'apps/web/app/(admin)/layout.tsx'), [
  ['session.user.role', '(session.user as any).role']
]);

console.log('Fixed typings and imports');
