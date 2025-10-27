# Procore Integration

This module provides OAuth 2.0 integration with Procore's API for authentication and data synchronization.

## Setup

To use this integration, you need to:

1. **Create a Procore Developer Account**

   - Go to https://developers.procore.com
   - Sign up for a developer account
   - Register your application

2. **Configure OAuth Settings**

   - Set redirect URI to: `https://your-domain.com/integrations/procore/callback`
   - Note your Client ID and Client Secret

3. **Configure Backend API**
   - Add Procore credentials to your backend environment variables:
     - `PROCORE_CLIENT_ID`
     - `PROCORE_CLIENT_SECRET`
     - `PROCORE_REDIRECT_URI`

## Available Actions

### `initiateProcoreConnection()`

Initiates the OAuth flow by generating an authorization URL.

### `completeProcoreConnection(code, state)`

Completes the OAuth callback with the authorization code.

### `getProcoreConnection()`

Retrieves the current user's Procore connection status.

### `disconnectProcore()`

Disconnects the user's Procore account.

### `refreshProcoreToken()`

Refreshes the Procore access token when it expires.

### `getProcoreCompanies()`

Retrieves the list of Procore companies the user has access to.

## OAuth Flow

1. User clicks "Connect to Procore"
2. `initiateProcoreConnection()` generates an OAuth URL with state parameter
3. User is redirected to Procore's authorization page
4. User approves the connection
5. Procore redirects to callback URL with authorization code
6. `completeProcoreConnection()` exchanges code for access/refresh tokens
7. Tokens are stored securely in the database

## Security

- All tokens are encrypted and stored securely
- Refresh tokens are used to automatically renew access tokens
- State parameter prevents CSRF attacks
- User authentication required for all operations

## Reference

- [Procore Developer Documentation](https://developers.procore.com/documentation)
- [Procore API Overview](https://procore.github.io/documentation/rest-api-overview)
- [Procore API Support](https://support.procore.com/products/procore-api)
