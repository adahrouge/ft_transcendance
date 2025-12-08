# Google Sign-In Implementation Guide

## Overview
This implementation adds "Continue with Google" authentication to the Transcendence application. It uses Google's OAuth 2.0 Identity Services library for secure authentication.

## Architecture

### Client-Side (Vue/TypeScript)
- **`client/src/pages/auth.ts`**: Main authentication page with Google Sign-In button
- **`client/src/services/auth.ts`**: Authentication service with `googleAuth()` method
- **`client/src/utils/google-oauth.ts`**: Google OAuth configuration and utilities

### Server-Side (Node.js/Fastify)
- **`server/routes/users.js`**: New `/api/users/google-auth` endpoint to:
  - Verify Google ID tokens
  - Create or retrieve user accounts
  - Generate JWT tokens

## Setup Instructions

### 1. Get Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Identity Service API**
4. Create OAuth 2.0 Credentials (OAuth Client ID for Web Application)
5. Set authorized redirect URIs:
   - `http://localhost:5173` (local development)
   - `http://localhost:3000` (production frontend)
   - Your actual domain in production
6. Copy the **Client ID**

### 2. Configure Environment Variables

#### Client (.env file)
Create `client/.env.local`:
```
VITE_GOOGLE_CLIENT_ID=your_client_id_from_google_console
```

Or copy from template:
```bash
cp client/.env.example client/.env.local
# Then edit and add your Google Client ID
```

### 3. How It Works

#### Authentication Flow:
1. User clicks "Continue with Google" button
2. Client-side initializes Google Sign-In
3. Google shows sign-in dialog
4. User authenticates with Google
5. Google returns an ID Token to the client
6. Client sends ID Token to backend `/api/users/google-auth`
7. Backend verifies the token with Google's servers
8. Backend creates/retrieves user and returns JWT
9. Client stores JWT and redirects to home

#### Token Verification:
- Server uses `https.request` to verify tokens with Google's tokeninfo endpoint
- Ensures email is verified by Google
- Creates new user accounts automatically on first sign-in
- Generates unique usernames from email/name

## Files Modified/Created

### Created Files:
- `client/src/utils/google-oauth.ts` - Google OAuth utilities
- `client/.env.example` - Environment variables template

### Modified Files:
- `client/src/pages/auth.ts` - Added Google Sign-In button handler
- `client/src/services/auth.ts` - Added `googleAuth()` method
- `server/routes/users.js` - Added `/api/users/google-auth` endpoint

## API Endpoint

### POST `/api/users/google-auth`

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ...",
  "email": "user@gmail.com",
  "name": "John Doe",
  "googleId": "1234567890"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "user@gmail.com",
    "display_name": "John Doe",
    "avatar_url": null,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Error):**
```json
{
  "error": "Google email not verified"
}
```

## Security Considerations

1. **Token Verification**: Server verifies Google tokens directly with Google's servers (not client-provided claims)
2. **Email Verification**: Only verified Google emails are accepted
3. **Password Security**: Google users get random passwords (they won't use password login)
4. **JWT Expiration**: All tokens expire after 7 days
5. **CORS**: Ensure proper CORS configuration for your domains

## Troubleshooting

### Google Sign-In button is disabled
- `VITE_GOOGLE_CLIENT_ID` environment variable is not set
- Solution: Create `.env.local` with your Google Client ID

### "Google authentication failed" error
1. Check that Client ID is correct in environment variables
2. Verify the domain is in Google Cloud Console authorized URIs
3. Check browser console for detailed error messages
4. Ensure Google's ID Services library loaded: check for `window.google` object

### Token verification fails on server
- Google ID Services library may be outdated
- Check server logs for detailed error messages
- Ensure the environment has internet access to verify with Google

## Testing

To test locally:
1. Set up environment variable with Google Client ID
2. Run both client and server
3. Navigate to auth page
4. Click "Continue with Google"
5. Complete Google sign-in flow
6. Should redirect to home page with active session

## Future Improvements

- [ ] Store Google ID for linking social accounts
- [ ] Support linking Google account to existing account
- [ ] Add Google refresh token handling
- [ ] Implement account recovery/linking UI
- [ ] Add support for other OAuth providers
