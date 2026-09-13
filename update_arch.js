const fs = require('fs');
const path = require('path');

const archPath = path.join(__dirname, 'ARCHITECTURE.md');
let arch = fs.readFileSync(archPath, 'utf8');

arch = arch.replace(
  '**None remaining.** The three items',
  `**Explicit MVP Exception: i18n Readiness.** SRS §21 requires i18n readiness, but the repository-wide abstraction was missed during M1–M11. Retrofitting the entire application during final hardening creates disproportionate regression risk. We have explicitly decided to DEFER i18n to Phase 2. M12 does not satisfy the i18n requirement of SRS §21.

**None remaining.** The three items`
);

fs.writeFileSync(archPath, arch);
console.log('Updated ARCHITECTURE.md with i18n exception.');
