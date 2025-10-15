const fs = require('fs');
const path = require('path');

// Create .env.local file with the backend URL
const envFilePath = path.join(__dirname, '..', '.env.local');
const envContent = `NEXT_PUBLIC_BACKEND_URL=http://pm-dash-prod.eba-nq2ej32t.us-east-2.elasticbeanstalk.com
`;

fs.writeFileSync(envFilePath, envContent);
console.log(`Created .env.local file with backend URL`);

// Add a script to package.json for running with the deployed backend
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = require(packageJsonPath);

if (!packageJson.scripts['dev:remote']) {
  packageJson.scripts['dev:remote'] = 'next dev';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`Added 'dev:remote' script to package.json`);
}

console.log('\nTo run the frontend with the deployed backend:');
console.log('  cd pm-dashboard-frontend/ui');
console.log('  npm run dev:remote');
console.log('\nThe frontend will be available at http://localhost:3000');
