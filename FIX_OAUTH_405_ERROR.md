# Fixing 405 Method Not Allowed Error for Google Sign-In

## Changes Made

### 1. Updated `lib/auth.ts`
- Added `organization` plugin to match client configuration
- Added production domain to `trustedOrigins`
- This ensures Better Auth recognizes requests from your Vercel deployment

### 2. Updated `lib/auth-client.ts`
- Fixed `baseURL` to dynamically use `window.location.origin` in the browser
- This ensures the client always connects to the correct domain (localhost or production)
- Fallback to environment variable for server-side rendering

### 3. Updated `app/api/auth/[...all]/route.ts`
- Added explicit runtime configuration
- Added OPTIONS handler for CORS preflight requests
- This fixes cross-origin issues during authentication

### 4. Updated `next.config.js`
- Added headers configuration for `/api/auth/:path*` routes
- Enabled proper CORS headers for authentication endpoints

### 5. Updated `.env.example`
- Added `NEXT_PUBLIC_AUTH_URL` environment variable documentation

## Required Environment Variables

Make sure these environment variables are set in your Vercel deployment:

```bash
BETTER_AUTH_URL=https://momentum003.vercel.app
NEXT_PUBLIC_AUTH_URL=https://momentum003.vercel.app
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
BETTER_AUTH_SECRET=your_secret_key
DATABASE_URL=your_database_connection_string
```

## Important: Google OAuth Configuration

Make sure your Google OAuth credentials are configured correctly:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Add these to **Authorized JavaScript origins**:
   - `https://momentum003.vercel.app`
   - `http://localhost:3000` (for local development)
6. Add these to **Authorized redirect URIs**:
   - `https://momentum003.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for local development)

## Deployment Steps

1. Commit all changes:
   ```bash
   git add .
   git commit -m "Fix 405 error for Google OAuth sign-in"
   git push
   ```

2. Verify environment variables in Vercel:
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Ensure `NEXT_PUBLIC_AUTH_URL` and `BETTER_AUTH_URL` are set to `https://momentum003.vercel.app`
   - Verify all other required variables are present

3. Redeploy or wait for automatic deployment

4. Test the sign-in flow

## Testing

After deployment, test:
1. `/api/health` - Should return 200 OK
2. `/api/auth/session` - Should return session info or 401
3. Google Sign-In button - Should redirect to Google OAuth and back successfully

## What Was Fixed

The 405 error occurred because:
- The auth client wasn't using the correct baseURL in production
- CORS headers weren't properly configured for the auth routes
- The organization plugin was missing on the server side but present on the client
- Production domain wasn't in the trusted origins list

These changes ensure Better Auth correctly handles OAuth flows in production with proper CORS and routing configuration.
