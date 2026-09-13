const fs = require('fs');
const path = require('path');

function replaceFile(filepath, replacements) {
  let content = fs.readFileSync(filepath, 'utf8');
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(filepath, content);
}

const p = (str) => path.join(__dirname, 'apps/web/app/api/v1', str);

replaceFile(p('projects/[id]/workspace/route.ts'), [
  ['../../../../../../../src', '../../../../../../src']
]);

replaceFile(p('projects/[id]/workspace/tasks/route.ts'), [
  ['../../../../../../../../src', '../../../../../../../src'],
  ['error.errors', '(error as any).errors']
]);

replaceFile(p('projects/[id]/workspace/tasks/[taskId]/route.ts'), [
  ['../../../../../../../../../src', '../../../../../../../../src'],
  ['error.errors', '(error as any).errors']
]);

replaceFile(p('projects/[id]/workspace/milestones/route.ts'), [
  ['../../../../../../../../src', '../../../../../../../src'],
  ['error.errors', '(error as any).errors']
]);

replaceFile(p('projects/[id]/workspace/milestones/[milestoneId]/route.ts'), [
  ['../../../../../../../../../src', '../../../../../../../../src'],
  ['error.errors', '(error as any).errors']
]);

replaceFile(p('projects/[id]/workspace/links/route.ts'), [
  ['../../../../../../../../src', '../../../../../../../src'],
  ['error.errors', '(error as any).errors']
]);

replaceFile(p('projects/[id]/workspace/links/[linkId]/route.ts'), [
  ['../../../../../../../../../src', '../../../../../../../../src']
]);

replaceFile(p('projects/[id]/workspace/activity/route.ts'), [
  ['../../../../../../../../src', '../../../../../../../src']
]);

replaceFile(p('projects/[id]/reviews/route.ts'), [
  ['../../../../../../../src', '../../../../../../src'],
  ['error.errors', '(error as any).errors']
]);

replaceFile(p('profiles/[username]/reviews/route.ts'), [
  ['../../../../../../../../src', '../../../../../../src']
]);

console.log('Fixed imports.');
