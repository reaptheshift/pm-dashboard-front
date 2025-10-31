# Procore Refresh Token Usage

## Overview

When the Procore access token expires (typically after `expires_in` seconds, usually around 1.5 hours), you need to use the refresh token to get a new access token.

## How to Use Refresh Token

### 1. Automatic Token Refresh (Recommended)

Create a wrapper function that automatically refreshes the token when it expires:

```typescript
import { getProcoreAuthToken, refreshProcoreToken } from "./_actions";

async function getValidProcoreToken(): Promise<string | null> {
  let token = await getProcoreAuthToken();
  
  if (!token) {
    // No token available, user needs to reconnect
    return null;
  }

  // Check if token is expired (optional - you might want to track expiry)
  // If expired or about to expire, refresh it
  try {
    // Attempt to use the token - if it fails with 401, refresh
    // Or check expiry time if you're tracking it
    const refreshed = await refreshProcoreToken();
    token = refreshed.access_token || null;
  } catch (error) {
    // Refresh failed, user needs to reconnect
    return null;
  }

  return token;
}
```

### 2. Manual Refresh Before Making API Calls

Call `refreshProcoreToken()` before making Procore API calls if you suspect the token might be expired:

```typescript
import { refreshProcoreToken } from "./_actions";

// Before making Procore API calls
try {
  const refreshed = await refreshProcoreToken();
  const accessToken = refreshed.access_token;
  
  // Use accessToken for Procore API calls
  const response = await fetch("https://api.procore.com/...", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
} catch (error) {
  // Token refresh failed - user needs to reconnect
}
```

### 3. Token Expiry Tracking

If you want to track token expiry and refresh proactively:

```typescript
// Store expiry time when token is received
const expiryTime = Date.now() + (expires_in * 1000);

// Before making API calls, check if expired
if (Date.now() >= expiryTime - 60000) { // Refresh 1 minute before expiry
  await refreshProcoreToken();
}
```

## Token Storage

- **Access Token**: Stored in cookie `procoreAuthToken` (httpOnly, secure)
- **Refresh Token**: Stored in cookie `procoreRefreshToken` (httpOnly, secure, 1 year expiry)

## Error Handling

If `refreshProcoreToken()` fails:
- The refresh token may have expired (typically after 1 year)
- User needs to reconnect through the OAuth flow again
- Call `authorizeProcore()` to start a new authorization flow

## Example: Using Procore Token in API Calls

```typescript
import { getProcoreAuthToken, refreshProcoreToken } from "./_actions";

async function fetchProcoreData() {
  let token = await getProcoreAuthToken();
  
  if (!token) {
    throw new Error("Procore not connected");
  }

  // Try the API call
  let response = await fetch("https://api.procore.com/v1/projects", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // If token expired (401), refresh and retry
  if (response.status === 401) {
    const refreshed = await refreshProcoreToken();
    token = refreshed.access_token;
    
    response = await fetch("https://api.procore.com/v1/projects", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return response.json();
}
```

