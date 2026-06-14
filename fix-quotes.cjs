const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Find instances of: fetch(`${import.meta.env.VITE_API_URL || ""}/api/something"
  // And replace the trailing " with a `
  // Use [^\n"]* to ensure we don't cross newlines
  let newContent = content.replace(/(fetch\(`\$\{import\.meta\.env\.VITE_API_URL \|\| ""\}\/api[^\n"]*)"/g, '$1`');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Fixed ' + file);
  }
});
