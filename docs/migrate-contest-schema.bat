@echo off
echo ====================================
echo Contest System - Database Migration
echo ====================================
echo.

echo Step 1: Checking Drizzle Kit...
call npx drizzle-kit --version
echo.

echo Step 2: Pushing schema changes to database...
echo This will apply the migration: 0004_chilly_starhawk.sql
echo.
pause

call npx drizzle-kit push

echo.
echo ====================================
echo Migration Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Seed questions: npm run seed:questions
echo 2. Setup Gmail: Configure EMAIL_SENDER_ADDRESS in .env
echo 3. Test invitation flow
echo.
pause
