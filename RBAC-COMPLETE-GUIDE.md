# RBAC Implementation - Complete Setup & Testing Guide

## 📋 Table of Contents
1. [SQL Migration Setup](#sql-migration-setup)
2. [Admin User Configuration](#admin-user-configuration)
3. [Routing Test Plan](#routing-test-plan)
4. [Troubleshooting](#troubleshooting)

---

## 🔧 SQL Migration Setup

### Step 1: Access Supabase SQL Editor

1. Open [https://app.supabase.com](https://app.supabase.com)
2. Select your project: **Smart Employees**
3. In the left sidebar, click: **SQL Editor**
4. Click the blue **+ New Query** button

### Step 2: Copy & Run Migration SQL

**Copy the entire SQL block below:**

```sql
-- Add role field to profiles table to enable proper RBAC
-- Run this migration to add role-based access control support

-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'customer';

-- Create admin role assignments
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (apotaha981@gmail.com);

-- Ensure all other users default to customer
UPDATE profiles 
SET role = 'customer' 
WHERE role IS NULL;

-- Add constraint to ensure only valid roles
ALTER TABLE profiles 
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'customer'));
```

**Steps:**
1. Paste the SQL into the editor
2. Click the **Run** button (blue play icon)
3. Wait for completion message

**Expected Result:**
```
✅ Query executed successfully
```

If you see an error like `Column already exists`, that's fine - the migration was previously run.

### Step 3: Verify Migration Success

1. Go to **Database** → **Tables** in Supabase
2. Click on the **profiles** table
3. Look for the **role** column in the fields list
4. Verify the default value is set to **'customer'**

---

## 👨‍💼 Admin User Configuration

### Option 1: Via Supabase Table Editor (Recommended)

1. In Supabase, go to: **Database** → **Tables** → **profiles**
2. Find your user row (search by email)
3. Click on the **role** cell to edit
4. Change the value from `'customer'` to `'admin'`
5. Press Enter to save

**Your profile should now show:**
```
email              | role
your-email@...     | admin
```

### Option 2: Via SQL Update Query

If you want to make multiple admins, run this SQL:

```sql
-- Update specific email to admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Or update multiple admins at once
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
    'admin@example.com',
    'your-email@example.com',
    'another-admin@example.com'
);

-- Verify it worked
SELECT email, role FROM profiles WHERE role = 'admin';
```

### Option 3: Update Code (Alternative)

If you manually set roles in the database, you can skip this. But if you want the app to recognize emails as admin automatically:

1. Edit: `src/context/AuthContext.jsx`
2. Find this line (around line 32):
   ```javascript
   const adminEmails = ['admin@example.com', 'admin@agentic.com'];
   ```
3. Add your admin email:
   ```javascript
   const adminEmails = ['admin@example.com', 'admin@agentic.com', 'your-email@example.com'];
   ```
4. Save the file
5. Restart dev server: `npm run dev`

---

## 🧪 Routing Test Plan

### Pre-Test Checklist

- [ ] SQL migration has been run successfully
- [ ] role column exists in profiles table
- [ ] Your admin account has role = 'admin'
- [ ] Development server is running: `npm run dev`
- [ ] App is accessible at `http://localhost:5173`

### Test 1: Unauthenticated User Redirect

**Goal:** Verify unauthenticated users cannot access protected routes

**Steps:**
1. Open a new **private/incognito browser tab**
   - Windows: Ctrl + Shift + N
   - Mac: Cmd + Shift + N

2. Navigate to: `http://localhost:5173/dashboard`

3. **Expected Result:** 
   - ✅ Automatically redirects to `/login`
   - ✅ See login form

4. **If you see something else:**
   - ❌ You might already be logged in
   - ❌ Try clearing cookies: DevTools → Application → Cookies → Clear All
   - ❌ Close incognito and open a new one

**Status:** ✅ PASS if redirected to login

---

### Test 2: Customer Cannot Access Admin Panel (Main Test)

**Goal:** Customers redirected away from `/admin` route

**Steps:**
1. **Log in as customer account:**
   - Open: `http://localhost:5173/login`
   - Enter: any non-admin email
   - Click: Sign Up or Login
   - Verify your role in database is `'customer'`

2. **Try to access admin route:**
   - Navigate to: `http://localhost:5173/admin`
   - Or manually type the URL

3. **Expected Behavior:**
   - ✅ Automatic redirect happens
   - ✅ Browser URL changes to `/dashboard`
   - ✅ You see: Customer Dashboard (NOT AdminDashboard)
   - ✅ AdminDashboard components NOT visible

4. **Verify it's really a redirect:**
   - Check the URL bar - it should now show `/dashboard`
   - Check for AdminDashboard tabs (Manager AI, Templates, Users) - should NOT exist
   - If you see admin tabs, the redirect didn't work

**Status:** ✅ PASS if redirected to `/dashboard` (not admin panel)

---

### Test 3: Admin Can Access Admin Panel

**Goal:** Admin users can access `/admin` without redirect

**Steps:**
1. **Log out from previous test:**
   - Click the Logout button (or clear localStorage)

2. **Log in as admin account:**
   - Open: `http://localhost:5173/login`
   - Enter: admin email (from database with role='admin')
   - Click: Sign In

3. **Navigate to admin route:**
   - Go to: `http://localhost:5173/admin`
   - Or manually type the URL

4. **Expected Behavior:**
   - ✅ NO redirect happens
   - ✅ URL stays at `/admin`
   - ✅ See: Admin Dashboard with tabs:
     - Manager AI
     - Templates
     - Customers
     - Settings
     - Operations
     - Boardroom

5. **Verify admin panel loaded:**
   - Look for tab navigation at top of admin panel
   - Admin tabs should be visible
   - No redirect should have occurred

**Status:** ✅ PASS if AdminDashboard displays without redirect

---

### Test 4: Customer Can Access Customer Routes

**Goal:** Customer users can access `/dashboard` and other routes

**Steps:**
1. **Log in as customer** (if not already)

2. **Navigate to:** `http://localhost:5173/dashboard`

3. **Expected Behavior:**
   - ✅ Dashboard loads normally
   - ✅ See: Dashboard content visible
   - ✅ No redirect

**Status:** ✅ PASS if dashboard displays

---

### Test 5: Admin Can Access Customer Routes

**Goal:** Admin users have access to customer routes too

**Steps:**
1. **Log in as admin account** (from Test 3)

2. **Navigate to:** `http://localhost:5173/dashboard`

3. **Expected Behavior:**
   - ✅ Dashboard loads normally
   - ✅ Admin can view customer routes
   - ✅ No redirect

**Status:** ✅ PASS if dashboard displays for admin

---

## 📊 Test Results Matrix

Fill in as you complete each test:

```
Test Case                           | Expected    | Result | Status
─────────────────────────────────────────────────────────────────────
1. Unauthenticated → /dashboard    | Redirect to | [ ]    | ___
                                   | /login      |        |
─────────────────────────────────────────────────────────────────────
2. Customer → /admin               | Redirect to | [ ]    | ___
                                   | /dashboard  |        |
─────────────────────────────────────────────────────────────────────
3. Admin → /admin                  | Load admin  | [ ]    | ___
                                   | panel       |        |
─────────────────────────────────────────────────────────────────────
4. Customer → /dashboard           | Load        | [ ]    | ___
                                   | dashboard   |        |
─────────────────────────────────────────────────────────────────────
5. Admin → /dashboard              | Load        | [ ]    | ___
                                   | dashboard   |        |
─────────────────────────────────────────────────────────────────────

If ALL tests mark ✅: RBAC IS WORKING CORRECTLY
```

---

## 🐛 Troubleshooting

### Issue: Test 2 Failed - Customer CAN access /admin
**Problem:** Customer accessed admin panel instead of being redirected

**Possible Causes:**
1. Role column not added to database
2. Customer's role is set to 'admin' in database
3. ProtectedRoute not working correctly

**Solution:**
1. Check profiles table:
   ```sql
   SELECT email, role FROM profiles WHERE email = 'your-test-customer@example.com';
   ```
2. Verify result shows: `'customer'` role (not 'admin')
3. If role is 'admin', update it:
   ```sql
   UPDATE profiles SET role = 'customer' WHERE email = 'test@example.com';
   ```
4. Log out and log back in
5. Try Test 2 again

---

### Issue: Test 3 Failed - Admin CANNOT access /admin
**Problem:** Admin was redirected to /dashboard instead of seeing admin panel

**Possible Causes:**
1. Admin account doesn't have role = 'admin' in database
2. Email not recognized as admin
3. AuthContext not detecting admin role

**Solution:**
1. Check admin user's role in database:
   ```sql
   SELECT email, role FROM profiles WHERE email = 'admin@example.com';
   ```
2. Verify result shows: `'admin'` role
3. If not, update it:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@example.com';
   ```
4. Also check `src/context/AuthContext.jsx`:
   ```javascript
   const adminEmails = ['admin@example.com', 'admin@agentic.com'];
   ```
5. Make sure your admin email is in that list
6. Log out, clear cache, and log back in
7. Try Test 3 again

---

### Issue: Always Redirected to /login
**Problem:** Every protected route redirects to login, even when logged in

**Possible Causes:**
1. AuthProvider not wrapping app
2. Supabase not properly configured
3. Session token expired

**Solution:**
1. Check `src/App.jsx` - verify AuthProvider wraps Router:
   ```jsx
   <LanguageProvider>
       <AuthProvider>
           <Router>
   ```
2. Clear all app data:
   - Open DevTools (F12)
   - Go to Application tab
   - Click: Clear site data
3. Restart dev server:
   - Stop: Ctrl+C
   - Start: `npm run dev`
4. Log in again
5. Test again

---

### Issue: Redirect Loop - Page keeps refreshing
**Problem:** Page keeps redirecting and reloading indefinitely

**Possible Causes:**
1. Corrupted session data
2. AuthContext logic error

**Solution:**
1. **Clear everything:**
   - Stop dev server: Ctrl+C
   - In terminal: `rm -rf node_modules/.cache`
   - Clear browser cache: DevTools → Network → Disable cache
   - Clear local storage: DevTools → Application → Clear all
2. **Restart:**
   - `npm run dev`
3. **Test:**
   - Go to fresh incognito window
   - Log in fresh
   - Try routes again

---

### Issue: Role Shows as 'customer' When Should Be 'admin'
**Problem:** Admin account shows role = 'customer' in database

**Possible Causes:**
1. Role not updated in database
2. Migration didn't run completely
3. SQL UPDATE query didn't execute

**Solution:**
1. **Manually verify and update in Supabase:**
   - Open Database → profiles table
   - Find your row
   - Click role cell → change to 'admin'
   - Click elsewhere to save

2. **Or update via SQL:**
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   
   -- Verify
   SELECT * FROM profiles WHERE email = 'your-email@example.com';
   ```

3. **Log out, clear cache, log back in**
4. **Try admin route again**

---

## ✅ Final Verification Checklist

Before declaring RBAC as "working", verify all of these:

- [ ] SQL migration ran without errors
- [ ] role column visible in profiles table (Supabase UI)
- [ ] Admin account has role = 'admin' in database
- [ ] Customer account has role = 'customer' in database
- [ ] Unauthenticated user redirected to /login from /dashboard
- [ ] Customer redirected from /admin to /dashboard
- [ ] Admin can access /admin without redirect
- [ ] Admin can access /dashboard without redirect
- [ ] Customer can access /dashboard without redirect
- [ ] No console errors related to Auth or useAuth
- [ ] No infinite redirect loops
- [ ] Language toggle still works (EN/AR)
- [ ] All translation keys load correctly

**If ALL are checked:** 🎉 **RBAC IS FULLY IMPLEMENTED AND WORKING**

---

## 🚀 Next Steps After Testing

Once RBAC tests all pass:

1. ✅ **RBAC Implementation Complete**
2. 📌 **Next Task:** Consolidate dashboards (remove NouraReports duplication)
3. 📌 **Following:** Update navigation with role-based menu
4. 📌 **Then:** Create admin-specific components in `src/components/admin/`
5. 📌 **Finally:** Extract hardcoded strings and finalize translations

---

## 📞 Quick Reference

**Key Files:**
- `src/App.jsx` - Main routes with ProtectedRoute wrappers
- `src/context/AuthContext.jsx` - Role determination logic
- `src/components/shared/ProtectedRoute.jsx` - Route protection component
- `db-update-v8-rbac.sql` - SQL migration file

**Commands:**
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview build
```

**Supabase URLs:**
- Dashboard: https://app.supabase.com
- SQL Editor: https://app.supabase.com/project/[project-id]/sql
- Database Tables: https://app.supabase.com/project/[project-id]/editor

Good luck with your RBAC testing! 🎯
