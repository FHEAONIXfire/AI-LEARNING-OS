import fs from 'fs';
import path from 'path';

function replaceInFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/blue-/g, 'purple-');
  content = content.replace(/neon-glow-blue/g, 'neon-glow-purple');
  fs.writeFileSync(filePath, content, 'utf-8');
}

function walkDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('./src');
console.log('Done replacing blue with purple.');
