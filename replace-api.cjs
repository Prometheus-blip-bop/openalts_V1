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
  let newContent = content
    .replace(/fetch\("\/api/g, 'fetch(`${import.meta.env.VITE_API_URL || ""}/api')
    .replace(/fetch\(`\/api/g, 'fetch(`${import.meta.env.VITE_API_URL || ""}/api');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Updated ' + file);
  }
});
