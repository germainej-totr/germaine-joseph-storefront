// validate-routes.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appDir = path.join(__dirname, 'app');

function validateAppDir(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  let hasValidEntry = false;
  let hasSubRoutes = false;

  // Check if current directory has page.tsx or route.ts
  const entryFiles = items.filter(item => 
    item.name === 'page.tsx' || item.name === 'route.ts'
  );
  
  if (entryFiles.length > 0) hasValidEntry = true;

  // Recursively check subdirectories
  items.forEach(item => {
    if (item.isDirectory()) {
      // Ignore hidden folders like .git or node_modules
      if (item.name.startsWith('.')) return;
      
      const subResult = validateAppDir(path.join(dir, item.name));
      if (subResult) hasSubRoutes = true;
    }
  });

  // If it's a folder, doesn't have an entry, and isn't a route group (starts with '(')
  // we flag it as an orphan/inactive route
  if (!hasValidEntry && !dir.endsWith('app') && !path.basename(dir).startsWith('(')) {
    console.warn(`[WARNING] Orphan folder detected (no page.tsx/route.ts): ${dir.replace(appDir, 'app')}`);
  }

  return hasValidEntry || hasSubRoutes;
}

console.log('--- Starting Route Validation ---\n');
validateAppDir(appDir);
console.log('\n--- Validation Complete ---');