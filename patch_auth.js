const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, 'apps/web/src/lib/auth.ts');
let authCode = fs.readFileSync(authPath, 'utf8');

// Reject suspended users in OAuth signIn
authCode = authCode.replace(
  `        if (!existingUser) {`,
  `        if (existingUser?.status === 'suspended') {
          return '/auth/login?error=AccountSuspended';
        }
        if (!existingUser) {`
);

// Include role in jwt token
authCode = authCode.replace(
  `          token.id = user.id;
          token.sessionVersion = (user as any).sessionVersion;`,
  `          const dbUser = await prisma.user.findUnique({ where: { id: user.id }});
          if (dbUser) {
            token.id = dbUser.id;
            token.sessionVersion = dbUser.sessionVersion;
            token.role = dbUser.role;
          }`
);

// OAuth branch also needs role
authCode = authCode.replace(
  `            if (dbUser) {
              token.id = dbUser.id;
              token.sessionVersion = dbUser.sessionVersion;
            }`,
  `            if (dbUser) {
              token.id = dbUser.id;
              token.sessionVersion = dbUser.sessionVersion;
              token.role = dbUser.role;
            }`
);

// Session check
authCode = authCode.replace(
  `          select: { sessionVersion: true }`,
  `          select: { sessionVersion: true, role: true, status: true }`
);

authCode = authCode.replace(
  `        if (!dbUser || dbUser.sessionVersion !== token.sessionVersion) {
          // Invalidate token by clearing it
          return { ...token, exp: 0 }; 
        }`,
  `        if (!dbUser || dbUser.sessionVersion !== token.sessionVersion || dbUser.status === 'suspended') {
          // Invalidate token by clearing it
          return { ...token, exp: 0 }; 
        }
        token.role = dbUser.role; // Keep role up to date`
);

// Map token.role to session
authCode = authCode.replace(
  `        session.user = {
          ...session.user,
          id: token.id as string,
        } as any;`,
  `        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
        } as any;`
);

fs.writeFileSync(authPath, authCode);
console.log('auth.ts updated');
