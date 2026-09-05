import fs from 'fs';
let content = fs.readFileSync('src/components/WelcomeView.tsx', 'utf8');

// The modal at the bottom is {showLiderModal && ( ... )}
const modalEndRegex = /\{\/\* Leader Portal Modal \*\/\}\s*\{showLiderModal && \([\s\S]*?\}\s*<\/motion\.div>\s*\)\s*;\s*\}\s*export default WelcomeView;/;

content = content.replace(modalEndRegex, '    </motion.div>\n  );\n}\n\nexport default WelcomeView;');

fs.writeFileSync('src/components/WelcomeView.tsx', content);
console.log('done');
