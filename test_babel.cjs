const fs = require('fs');

const code = fs.readFileSync('src/app/admin/page.tsx', 'utf-8');

const babel = require('@babel/core');

try {
  babel.transformSync(code, {
    presets: ['@babel/preset-react', '@babel/preset-typescript'],
    filename: 'page.tsx'
  });
  console.log("Compiled successfully!");
} catch (e) {
  console.error("Syntax Error:", e.message);
}
