import fs from 'fs';
const backup = JSON.parse(fs.readFileSync('restore_data.json.applied', 'utf8'));
console.log('Restore applied ministros:', backup.ministros.length);
