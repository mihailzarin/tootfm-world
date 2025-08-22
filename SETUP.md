# tootFM v2.0 Setup Guide

## 🚨 Current Issues Fixed

### 1. Google OAuth Authentication Issues
- ✅ Added proper error handling and logging to NextAuth
- ✅ Fixed environment variable validation
- ✅ Added detailed debugging information
- ✅ Improved session and JWT callbacks

### 2. Database Connection Issues
- ✅ Enhanced Prisma client with better error handling
- ✅ Added connection testing scripts
- ✅ Improved error messages for common database issues

### 3. Missing Error Handling
- ✅ Added try-catch blocks throughout the codebase
- ✅ Improved API route error responses
- ✅ Added proper TypeScript types

## 🔧 Setup Instructions

### Step 1: Environment Variables Setup

1. **Generate a secure NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

2. **Update your `.env` file with real values:**
   ```env
   # Database (Choose one)
   # Option A: Local PostgreSQL
   DATABASE_URL="postgresql://username:password@localhost:5432/tootfm"
   
   # Option B: Supabase (Recommended for development)
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   
   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-generated-secret-here"
   
   # Google OAuth (Required)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

### Step 2: Google OAuth Setup

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google+ API:**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

4. **Copy the credentials to your `.env` file**

### Step 3: Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE tootfm;
CREATE USER tootfm_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tootfm TO tootfm_user;
\q
```

#### Option B: Supabase (Recommended)
1. Go to https://supabase.com/
2. Create a new project
3. Copy the connection string from Settings > Database
4. Update your `.env` file

### Step 4: Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Test database connection
npm run db:test
```

### Step 5: Test Environment Variables

```bash
# Check if all required env vars are set
npm run env:check
```

### Step 6: Start the Application

```bash
# Development mode
npm run dev
```

## 🐛 Troubleshooting

### Database Connection Issues

**Error: "Can't reach database server"**
```bash
# Test database connection
npm run db:test

# Check if PostgreSQL is running
sudo systemctl status postgresql

# For Supabase, check your connection string
```

### Google OAuth Issues

**Error: "Google hasn't verified this app"**
- This is normal for development
- Click "Advanced" > "Go to [Your App] (unsafe)"

**Error: "Failed to sign in"**
```bash
# Check environment variables
npm run env:check

# Check browser console for detailed errors
# Look for NextAuth debug logs in terminal
```

### Common Issues

1. **Missing Environment Variables:**
   - Run `npm run env:check` to verify all required vars are set
   - Make sure no placeholder values remain in `.env`

2. **Database Schema Issues:**
   ```bash
   # Reset database (WARNING: This will delete all data)
   npm run db:reset
   
   # Or push schema changes
   npm run db:push
   ```

3. **Port Conflicts:**
   - Make sure port 3000 is available
   - Check if another Next.js app is running

## 🔍 Debugging

### Enable Debug Logging

The app now includes comprehensive logging. Check your terminal for:
- 🔐 SignIn callback logs
- 🔄 Session callback logs
- 🎫 JWT callback logs
- ❌ Error messages with details

### Database Debugging

```bash
# Test database connection
npm run db:test

# Open Prisma Studio to view data
npm run db:studio
```

### Environment Variable Debugging

```bash
# Check environment variables
npm run env:check

# Verify .env file is loaded
cat .env
```

## 🚀 Production Deployment

### Vercel Deployment

1. **Set Environment Variables in Vercel:**
   - Go to your Vercel project settings
   - Add all environment variables from `.env`
   - Update `NEXTAUTH_URL` to your production domain

2. **Update Google OAuth Redirect URIs:**
   - Add your production domain to Google Cloud Console
   - Format: `https://yourdomain.com/api/auth/callback/google`

3. **Database:**
   - Use Supabase or another PostgreSQL provider
   - Update `DATABASE_URL` in Vercel environment variables

### Environment Variables for Production

```env
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-production-secret"
DATABASE_URL="your-production-database-url"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 📞 Support

If you encounter issues:

1. **Check the logs:** Look for detailed error messages in terminal
2. **Verify environment variables:** Run `npm run env:check`
3. **Test database connection:** Run `npm run db:test`
4. **Check browser console:** Look for client-side errors

The app now includes comprehensive error handling and logging to help identify and fix issues quickly.