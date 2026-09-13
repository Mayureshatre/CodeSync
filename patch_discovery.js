const fs = require('fs');
const path = require('path');

const discoveryPath = path.join(__dirname, 'apps/web/src/server/services/discoveryService.ts');
let code = fs.readFileSync(discoveryPath, 'utf8');

// Remove the incorrect moderationHidden from searchDevelopers
code = code.replace(
  `    Prisma.sql\`u.status != 'suspended'\`,
    Prisma.sql\`p."profileVisibility" = 'public'\`,
    Prisma.sql\`p."moderationHidden" = false\`
  ];`,
  `    Prisma.sql\`u.status != 'suspended'\`,
    Prisma.sql\`p."profileVisibility" = 'public'\`
  ];`
);

// Add it to searchProjects
code = code.replace(
  `  // Hide projects of suspended users
  conditions.push(Prisma.sql\`p."ownerId" NOT IN (SELECT id FROM "User" WHERE status = 'suspended')\`);`,
  `  // Hide projects of suspended users
  conditions.push(Prisma.sql\`p."ownerId" NOT IN (SELECT id FROM "User" WHERE status = 'suspended')\`);
  
  // Hide moderated projects
  conditions.push(Prisma.sql\`p."moderationHidden" = false\`);`
);

fs.writeFileSync(discoveryPath, code);
console.log('discoveryService patched');
