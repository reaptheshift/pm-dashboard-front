// Run-locally script for PM Dashboard Frontend
const fs = require('fs');
const path = require('path');

// Create .env.local file
const envContent = `# Local development environment configuration
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
`;

try {
  fs.writeFileSync(path.join(__dirname, '../.env.local'), envContent);
  console.log('✅ Created .env.local with local backend URL');
} catch (error) {
  console.error('❌ Failed to create .env.local file:', error);
}

// Create startup script
const startupScript = `#!/bin/bash
echo "🚀 Starting PM Dashboard in local mode..."
echo "📝 Environment: Development"
echo "🌐 Backend URL: http://localhost:8080"
echo "🖥️ Frontend URL: http://localhost:3000"
echo ""
echo "Starting frontend..."
npm run dev
`;

try {
  fs.writeFileSync(path.join(__dirname, '../start-local.sh'), startupScript);
  fs.chmodSync(path.join(__dirname, '../start-local.sh'), '755');
  console.log('✅ Created start-local.sh script');
} catch (error) {
  console.error('❌ Failed to create startup script:', error);
}

// Create or update package.json to include local development script
try {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add local development script if it doesn't exist
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts['dev:local'] = 'NEXT_PUBLIC_BACKEND_URL=http://localhost:8080 next dev --turbo -p 3000';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json with local development script');
} catch (error) {
  console.error('❌ Failed to update package.json:', error);
}

console.log(`
✨ Setup Complete! ✨

To run the PM Dashboard locally:

1. Start the backend server in one terminal:
   cd ../pm-dashboard-backend
   npm run dev

2. Start the frontend in another terminal:
   cd ./
   npm run dev:local
   
   OR use the startup script:
   ./start-local.sh

Your frontend will connect to the backend running at http://localhost:8080
`);
