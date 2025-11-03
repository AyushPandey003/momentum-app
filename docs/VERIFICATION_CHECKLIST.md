# ✅ Integration Verification Checklist

Use this checklist to verify that your contest flow integration is working correctly.

## 📋 Pre-Flight Checks

### Environment Setup
- [ ] `.env.local` exists in root directory
- [ ] `webSocket/.env` exists in webSocket directory
- [ ] `QUIZ_JWT_SECRET` in `.env.local` matches `JWT_SECRET` in `webSocket/.env`
- [ ] `NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8080` is set
- [ ] `GO_WEBSOCKET_SERVICE_URL=http://localhost:8080` is set
- [ ] Database URL is configured in both `.env.local` and `webSocket/.env`

### Dependencies Installed
- [ ] Run `pnpm install` in root directory (no errors)
- [ ] Run `go mod download` in webSocket directory (no errors)
- [ ] Node.js version is 18+ (`node --version`)
- [ ] Go version is 1.23+ (`go version`)
- [ ] PostgreSQL is accessible
- [ ] Redis is installed

### Database Setup
- [ ] PostgreSQL database exists
- [ ] Tables created (run `webSocket/schema.sql`)
- [ ] Questions table has data
- [ ] Can connect to database from both services

## 🚀 Service Startup Verification

### Step 1: Start Redis
```bash
redis-server
```
- [ ] Redis starts without errors
- [ ] Run `redis-cli ping` → Returns `PONG`
- [ ] Redis is listening on port 6379

### Step 2: Start Go WebSocket Service
```bash
cd webSocket
go run ./cmd/server/main.go
```
- [ ] Service starts without errors
- [ ] Console shows "HTTP server listening on port 8080"
- [ ] Console shows "Database connection established"
- [ ] Console shows "Redis connection established"
- [ ] Console shows "Contest manager initialized"

### Step 3: Test Go Service Health
```bash
curl http://localhost:8080/health
```
- [ ] Returns JSON: `{"status":"healthy","active_contests":0}`
- [ ] No errors in Go service console

### Step 4: Start Next.js
```bash
pnpm dev
```
- [ ] Service starts without errors
- [ ] Console shows "Ready in Xms"
- [ ] No TypeScript compilation errors
- [ ] No runtime errors

### Step 5: Test Next.js
```bash
curl http://localhost:3000
```
- [ ] Returns HTML
- [ ] Can open http://localhost:3000 in browser
- [ ] Page loads successfully

## 🔐 Authentication Testing

### Next.js Authentication
- [ ] Can access http://localhost:3000/login
- [ ] Can log in with credentials
- [ ] Session cookie is set
- [ ] Redirects to dashboard after login
- [ ] Dashboard shows user name

### Go Service Authentication
Test JWT token generation:
```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test"}'
```
- [ ] Returns JSON with `token` field
- [ ] Token is a valid JWT string
- [ ] Response includes `user_id` and `username`
- [ ] Token doesn't expire immediately

### Token API Route
Test from browser console (after logging in):
```javascript
fetch('/api/contest/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contestId: 'test123' })
}).then(r => r.json()).then(console.log)
```
- [ ] Returns `token` field
- [ ] No errors in console
- [ ] Token is valid JWT

## 🎮 Contest Flow Testing

### Step 1: Create Contest (UI)
- [ ] Navigate to http://localhost:3000/dashboard/leaderboard
- [ ] "Create Contest" button is visible
- [ ] Click "Create Contest"
- [ ] Form opens with all fields
- [ ] Can select "Quick Fire" contest type
- [ ] Can fill in all required fields
- [ ] Click "Create" - no errors
- [ ] Contest appears in list

### Step 2: Contest Lobby
- [ ] Click on created contest
- [ ] Redirects to `/dashboard/contest/{id}/lobby`
- [ ] Contest details are shown correctly
- [ ] "Start Contest" button is visible
- [ ] No console errors

### Step 3: Start Contest
- [ ] Click "Start Contest" button
- [ ] Console shows API call to `/api/contest/create-realtime`
- [ ] No errors in browser console
- [ ] No errors in Next.js terminal
- [ ] No errors in Go service terminal
- [ ] Redirects to `/dashboard/contest/{new-id}/game`

### Step 4: WebSocket Connection
Check browser console for:
- [ ] Console shows "WebSocket connected"
- [ ] WebSocket URL is `ws://localhost:8080/ws/contests/{id}`
- [ ] WebSocket state is "OPEN" (readyState = 1)
- [ ] No WebSocket errors
- [ ] Status shows "Waiting for Players"

### Step 5: Waiting Room
- [ ] Shows player list
- [ ] Shows current user in list
- [ ] If first player, shows "Host" badge
- [ ] If host, "Start Game" button is enabled
- [ ] If not host, shows "Waiting for host..."

### Step 6: Multiple Players (Optional)
Open incognito window:
- [ ] Login with different account
- [ ] Join same contest URL
- [ ] Both windows show both players
- [ ] Player count updates in real-time
- [ ] No connection errors

### Step 7: Start Game
As host:
- [ ] Click "Start Game" button
- [ ] Toast notification shows "Starting Game..."
- [ ] Both players receive "Contest Started!" notification
- [ ] Status changes to "in_progress"
- [ ] First question appears

### Step 8: Question Display
- [ ] Question text is visible
- [ ] All 4 options are shown
- [ ] Can select an option
- [ ] "Submit Answer" button is enabled after selection
- [ ] Progress bar shows current question number
- [ ] Question counter shows "Question 1 of X"

### Step 9: Submit Answer
- [ ] Select an option (radio button)
- [ ] Click "Submit Answer"
- [ ] Button becomes disabled
- [ ] Shows "Answer Submitted" state
- [ ] Waits for result

### Step 10: Answer Result
If correct:
- [ ] Toast shows "Correct! 🎉"
- [ ] Shows points earned
- [ ] Score updates in sidebar
- [ ] All players see score update
- [ ] Next question appears automatically

If incorrect:
- [ ] Toast shows "Incorrect ❌"
- [ ] No points awarded
- [ ] Waits for next question
- [ ] Next question appears when someone answers correctly or timeout

### Step 11: Live Scoreboard
- [ ] Sidebar shows all players
- [ ] Scores update in real-time
- [ ] Players sorted by score
- [ ] Current user is highlighted
- [ ] Rank numbers are shown

### Step 12: Game Progression
- [ ] Questions progress correctly
- [ ] Progress bar updates
- [ ] Question counter increments
- [ ] Timer resets for each question
- [ ] No skipped questions

### Step 13: Game End
- [ ] After last question, "Game Over!" notification
- [ ] Shows final results screen
- [ ] Final scoreboard is displayed
- [ ] Shows your rank
- [ ] Shows all players with final scores

### Step 14: Post-Game
- [ ] After 5 seconds, redirects to leaderboard
- [ ] Leaderboard shows contest results
- [ ] Can see all player scores
- [ ] Can navigate back to dashboard

## 🔍 Error Handling

### WebSocket Disconnection
Simulate by stopping Go service:
- [ ] Frontend shows "Connection Lost" message
- [ ] Attempts to reconnect
- [ ] Shows reconnection attempts
- [ ] After max attempts, redirects to lobby

### Invalid JWT Token
Modify token in browser console:
- [ ] Go service rejects connection
- [ ] Frontend shows error message
- [ ] User can retry

### Network Errors
Disconnect internet briefly:
- [ ] Frontend handles gracefully
- [ ] Shows appropriate error message
- [ ] Reconnects when network restored

## 🎯 Performance Testing

### Load Test (Optional)
Use automated test scripts:
```bash
cd webSocket
node test_contest.js --auto
```
- [ ] 4 AI players can join
- [ ] All players receive questions
- [ ] Answers are processed correctly
- [ ] Scores update properly
- [ ] Game completes successfully

### Concurrent Contests
Create multiple contests:
- [ ] Multiple contests can run simultaneously
- [ ] Each contest has separate hub
- [ ] No interference between contests
- [ ] Go service handles multiple rooms
- [ ] Redis pub/sub works correctly

## 📊 Data Verification

### Database After Game
Check PostgreSQL:
```sql
SELECT * FROM contest_results WHERE contest_id = 'your-contest-id';
SELECT * FROM player_answers WHERE contest_id = 'your-contest-id';
```
- [ ] Contest results are saved
- [ ] All player answers are recorded
- [ ] Scores match what was shown
- [ ] Timestamps are correct

### Redis During Game
```bash
redis-cli
> KEYS contest:*
```
- [ ] Keys exist during active game
- [ ] Keys are cleaned up after game ends
- [ ] Pub/sub messages are flowing

## 🐛 Common Issues Resolution

### Issue: "Failed to connect to game server"
**Check:**
- [ ] Go service is running on port 8080
- [ ] `NEXT_PUBLIC_WEBSOCKET_URL` is correct
- [ ] Firewall allows WebSocket connections
- [ ] No other service using port 8080

**Fix:** Restart Go service, check URL

### Issue: "Failed to authenticate with contest service"
**Check:**
- [ ] `QUIZ_JWT_SECRET` in `.env.local`
- [ ] `JWT_SECRET` in `webSocket/.env`
- [ ] Both secrets are identical
- [ ] Both services restarted after changing secrets

**Fix:** Ensure secrets match exactly

### Issue: "Redis connection error"
**Check:**
- [ ] Redis is running: `redis-cli ping`
- [ ] `REDIS_ADDR` in `webSocket/.env` is correct
- [ ] Default is `localhost:6379`

**Fix:** Start Redis server

### Issue: "Database connection failed"
**Check:**
- [ ] PostgreSQL is running
- [ ] `DATABASE_URL` is correct in both `.env` files
- [ ] Database exists
- [ ] User has permissions

**Fix:** Check connection string, restart database

### Issue: WebSocket immediately disconnects
**Check:**
- [ ] JWT token is valid
- [ ] Token not expired
- [ ] Contest ID exists
- [ ] Go service logs for errors

**Fix:** Generate new token, check Go logs

## ✅ Final Verification

All checks passed? Congratulations! Your system is working correctly! 🎉

### System Health Summary
- [ ] ✅ Redis running
- [ ] ✅ Go service running and healthy
- [ ] ✅ Next.js running
- [ ] ✅ Database accessible
- [ ] ✅ Authentication working
- [ ] ✅ WebSocket connections established
- [ ] ✅ Game flow works end-to-end
- [ ] ✅ Scores calculated correctly
- [ ] ✅ Data saved properly

## 📝 Testing Notes

Document any issues found:

```
Date: __________
Tester: __________

Issues Found:
1. 
2. 
3. 

Resolution:
1. 
2. 
3. 

Additional Notes:


```

## 🎓 Next Steps After Verification

Once all checks pass:
1. [ ] Test with real users
2. [ ] Add more questions to database
3. [ ] Customize game settings
4. [ ] Deploy to production
5. [ ] Set up monitoring
6. [ ] Configure backups

---

**Verification Complete!** You're ready to deploy! 🚀

For production deployment, see `RUNNING_SERVICES.md` for detailed instructions.
