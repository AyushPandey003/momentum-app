# Scripts

This folder contains utility scripts for managing your Momentum app.

## Seeding Contest Questions

You have two options to seed contest questions:

### Option 1: TypeScript Seed Script (Recommended)

**Prerequisites:**
- Make sure your `.env` file has the correct database connection string
- Get a valid user ID from your database

**Steps:**

1. **Get a user ID:**
   ```sql
   SELECT id FROM "user" LIMIT 1;
   ```
   
   Or create a seed admin user:
   ```sql
   INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
   VALUES ('seed_admin', 'Question Admin', 'admin@momentum.app', true, NOW(), NOW());
   ```

2. **Edit the seed script:**
   Open `seed-questions.ts` and replace:
   ```typescript
   const ADMIN_USER_ID = "admin_user_id";
   ```
   With your actual user ID:
   ```typescript
   const ADMIN_USER_ID = "seed_admin"; // or your user ID
   ```

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

4. **Run the seed script:**
   ```bash
   pnpm run seed:questions
   ```

**What it does:**
- Adds 30 sample questions across 4 categories
- Programming (15), Math (6), Logic (4), General Knowledge (5)
- Each category has easy, medium, and hard questions
- Shows detailed progress and statistics

### Option 2: SQL Seed Script (Alternative)

If you prefer SQL or have database access issues:

**Steps:**

1. **Edit the SQL file:**
   Open `seed-questions.sql` and replace all instances of:
   ```sql
   'YOUR_USER_ID_HERE'
   ```
   With your actual user ID.

2. **Run the SQL script:**
   
   Using psql:
   ```bash
   psql -U your_username -d your_database -f scripts/seed-questions.sql
   ```
   
   Or copy and paste the SQL into your database client (pgAdmin, DataGrip, etc.)

**What it includes:**
- Same 25 questions as TypeScript script
- Verification queries at the end
- Can be easily modified

## Verifying Questions

After seeding, verify questions were added:

```sql
-- Count total questions
SELECT COUNT(*) FROM problem_set;

-- Count by category and difficulty
SELECT 
    category,
    difficulty,
    COUNT(*) as count
FROM problem_set
GROUP BY category, difficulty
ORDER BY category, difficulty;

-- View first few questions
SELECT id, question, category, difficulty, points 
FROM problem_set 
LIMIT 10;
```

## Adding More Questions

To add more questions, you can:

1. **Extend the TypeScript seed script:**
   - Edit `seed-questions.ts`
   - Add more objects to the `sampleQuestions` array
   - Run `pnpm run seed:questions` again

2. **Add via SQL:**
   - Copy the INSERT format from `seed-questions.sql`
   - Modify with your questions
   - Execute in your database

3. **Use the API:**
   ```typescript
   import { createProblemSet } from "@/server/contests";
   
   const question = await createProblemSet({
     question: "Your question here?",
     options: ["Option 1", "Option 2", "Option 3", "Option 4"],
     correctAnswer: "Option 1",
     explanation: "Why this is correct...",
     difficulty: "medium",
     type: "multiple_choice",
     category: "Programming",
     tags: ["javascript", "react"],
     points: 10,
     timeAllocationSeconds: 60
   });
   ```

## Next Steps

After seeding questions:

1. ✅ Verify questions in database
2. ✅ Create a test contest via `/dashboard/contest`
3. ✅ Test the complete contest flow
4. ✅ Add more questions as needed

For more details, see `docs/CONTEST_QUESTIONS_SETUP.md`
