// Script to update frontend configuration to connect to AWS backend
const fs = require('fs');
const path = require('path');

// AWS backend URL
const AWS_BACKEND_URL = 'http://pm-dash-prod.eba-nq2ej32t.us-east-2.elasticbeanstalk.com';

// Create .env.local file with AWS backend URL
const envContent = `NEXT_PUBLIC_BACKEND_URL=${AWS_BACKEND_URL}\n`;
fs.writeFileSync(path.join(__dirname, '.env.local'), envContent);

console.log(`✅ Frontend configured to connect to AWS backend at: ${AWS_BACKEND_URL}`);
console.log('To start the frontend with this configuration, run:');
console.log('cd pm-dashboard-frontend/ui && npm run dev');
