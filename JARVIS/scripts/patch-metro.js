const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const searchDirs = [
  path.join(rootDir, 'node_modules'),
  path.join(rootDir, 'apps', 'mobile', 'node_modules'),
];

for (const dir of searchDirs) {
  if (!fs.existsSync(dir)) continue;
  try {
    const entries = fs.readdirSync(dir);
    for (const name of entries) {
      if (name.startsWith('metro')) {
        const pkgJson = path.join(dir, name, 'package.json');
        if (fs.existsSync(pkgJson)) {
          const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
          if (pkg.exports) {
            delete pkg.exports;
            fs.writeFileSync(pkgJson, JSON.stringify(pkg, null, 2));
            console.log(`[patch-metro] Unlocked exports for ${name}`);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[patch-metro] Error scanning', dir, err.message);
  }
}
