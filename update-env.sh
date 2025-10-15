#!/bin/bash

# Create or update .env.local file for frontend
cat > .env.local << EOL
# Backend API URL
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8080
EOL

echo "Frontend environment file updated."
