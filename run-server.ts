import { spawn } from 'child_process';
const child = spawn('npx', ['tsx', 'server.ts'], { stdio: 'inherit' });
setTimeout(() => {
  console.log('Timeout reached, killing server...');
  child.kill();
  process.exit(0);
}, 10000);
