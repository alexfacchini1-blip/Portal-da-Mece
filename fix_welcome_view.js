import fs from 'fs';
let content = fs.readFileSync('src/components/WelcomeView.tsx', 'utf8');

// Change setShowLiderModal(true) to onSetView("lider_painel")
content = content.replace(/setShowLiderModal\(true\);/g, 'onSetView("lider_painel");');

// Remove showLiderModal state
content = content.replace(/const \[showLiderModal, setShowLiderModal\] = useState\(false\);\n/g, '');

// Remove the render of showLiderModal
const modalRegex = /\{showLiderModal && \(\s*<div className="fixed inset-0 bg-slate-900\/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">[\s\S]*?\{showWeekendReminder/g;
content = content.replace(modalRegex, '{showWeekendReminder');

fs.writeFileSync('src/components/WelcomeView.tsx', content);
console.log('done');
