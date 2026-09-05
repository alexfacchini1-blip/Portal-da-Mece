import fs from 'fs';
let content = fs.readFileSync('src/components/WelcomeView.tsx', 'utf8');

// Remove LiderMissaCard from dashboard feed
const dashboardRegex = /\{\/\* Leader Cards \(Rendered for active unsubmitted upcoming mass where user is leader\) \*\/\}\s*\{activeLeaderAssignment && !hasCoordAccess\(user\) && \(\s*<LiderMissaCard\s*key=\{`lider-active-\$\{activeLeaderAssignment\.date\}-\$\{activeLeaderAssignment\.time \|\| activeLeaderAssignment\.horario\}`\}\s*user=\{user\}\s*assign=\{activeLeaderAssignment\}\s*onAlert=\{onAlert\}\s*onReportSubmitted=\{handleReportSubmitted\}\s*\/>\s*\)\}/g;

content = content.replace(dashboardRegex, '');

fs.writeFileSync('src/components/WelcomeView.tsx', content);
console.log('done dashboard removal');
