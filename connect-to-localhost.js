// Script to update frontend configuration to connect to localhost backend
const fs = require('fs');
const path = require('path');

// Localhost backend URL
const LOCALHOST_BACKEND_URL = 'http://localhost:8080';

// Create .env.local file with localhost backend URL
const envContent = `NEXT_PUBLIC_BACKEND_URL=${LOCALHOST_BACKEND_URL}\n`;
fs.writeFileSync(path.join(__dirname, '.env.local'), envContent);

console.log(`✅ Frontend configured to connect to localhost backend at: ${LOCALHOST_BACKEND_URL}`);
console.log('To start the frontend with this configuration, run:');
console.log('cd pm-dashboard-frontend/ui && npm run dev');
