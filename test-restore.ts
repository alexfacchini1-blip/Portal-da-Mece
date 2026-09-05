import fs from 'fs';
const backup = JSON.parse(fs.readFileSync('backup_sistema_2026-04-02.json', 'utf8'));
console.log('Backup ministros:', backup.ministros.length);
