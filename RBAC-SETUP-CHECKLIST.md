# RBAC Setup & Testing Checklist

## Phase 1: SQL Migration Setup ☐

### Pre-Migration
- [ ] Supabase project is accessible
- [ ] You can access SQL Editor
- [ ] Current time: ______ (for timing)

### Run Migration
- [ ] Log into Supabase dashboard
- [ ] Navigate to: SQL Editor
- [ ] Click: "+ New Query"
- [ ] Copy SQL from `db-update-v8-rbac.sql`
- [ ] Paste into editor
- [ ] Click: Run button
- [ ] See message: "Query executed successfully"
- [ ] No error messages appeared

### Verify Migration
- [ ] Go to: Database → Tables → profiles
- [ ] Look for: "role" column in table
- [ ] Verify: Default value is 'customer'
- [ ] Column type is: VARCHAR(50) or text

**Phase 1 Complete Time: ________**

---

## Phase 2: Admin User Configuration ☐

### Identify Admin Account
- [ ] Decide which email will be admin
- [ ] Admin email: ___________________________
- [ ] Verify admin account exists in Supabase

### Update Role in Database (Method 1: Table Editor)
- [ ] Go to: Database → Tables → profiles
- [ ] Find row with admin email
- [ ] Click: role cell
- [ ] Change value to: admin
- [ ] Press: Enter
- [ ] Verify: It saved

**OR**

### Update Role in Database (Method 2: SQL)
- [ ] Open: SQL Editor → "+ New Query"
- [ ] Copy SQL:
  ```sql
  UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL_HERE';
  ```
- [ ] Replace: YOUR_EMAIL_HERE with admin email
- [ ] Click: Run
- [ ] Verify result

### Verify Setup
- [ ] Run SQL: `SELECT email, role FROM profiles;`
- [ ] See admin email has role: 'admin'
- [ ] See other users have role: 'customer'

**Phase 2 Complete Time: ________**

---

## Phase 3: Development Setup ☐

### Start Development Server
- [ ] Open terminal in project directory
- [ ] Run: `npm run dev`
- [ ] Dev server starts successfully
- [ ] See message: "Local: http://localhost:5173"
- [ ] No build errors

### Verify Code Files Exist
- [ ] File exists: `src/App.jsx`
- [ ] File exists: `src/context/AuthContext.jsx`
- [ ] File exists: `src/components/shared/ProtectedRoute.jsx`

### Check Code Configuration
- [ ] Open: `src/App.jsx`
- [ ] Verify: `<AuthProvider>` wraps `<Router>`
- [ ] Verify: Routes use `<ProtectedRoute requiredRole="...">`

**Phase 3 Complete Time: ________**

---

## Phase 4: Routing Tests ☐

### Test 4A: Unauthenticated User
**Setup:**
- [ ] Open new private/incognito browser tab
- [ ] Make sure you're completely logged out

**Action:**
- [ ] Navigate to: `http://localhost:5173/dashboard`

**Verification:**
- [ ] Page loads
- [ ] URL changes to: `/login`
- [ ] Login form appears
- [ ] You were NOT on dashboard

**Result:** ☐ PASS ☐ FAIL

**Notes:** _________________________________

---

### Test 4B: Customer Accessing Admin Panel (MAIN TEST)
**Setup:**
- [ ] Log in with customer account
  - Email: (non-admin account)
  - Verified in DB: role = 'customer'
- [ ] Verify logged in successfully

**Action:**
- [ ] Navigate to: `http://localhost:5173/admin`
- [ ] Wait 2-3 seconds for redirect
- [ ] Observe what happens

**Verification:**
- [ ] URL changed to: `/dashboard` (not '/admin')
- [ ] You see: Customer Dashboard
- [ ] You see: Navigation sidebar (not admin tabs)
- [ ] You do NOT see: Admin tabs (Manager AI, Templates, Users)
- [ ] Page did NOT show admin panel

**Expected Behavior:**
```
Customer tries /admin 
    ↓
ProtectedRoute checks role
    ↓
role = 'customer', needs 'admin'
    ↓
Redirect to /dashboard
    ↓
Customer dashboard loads
```

**Result:** ☐ PASS ☐ FAIL

**Notes:** _________________________________

---

### Test 4C: Admin Accessing Admin Panel
**Setup:**
- [ ] Log out from previous test
  - Click logout button, or
  - Clear localStorage manually
- [ ] Log in with admin account
  - Email: (admin account)
  - Verified in DB: role = 'admin'

**Action:**
- [ ] Navigate to: `http://localhost:5173/admin`
- [ ] Wait for page to load

**Verification:**
- [ ] Page loads without redirect
- [ ] URL stays at: `/admin`
- [ ] You see: Admin Dashboard with tabs:
  - [ ] 🤖 Manager AI tab visible
  - [ ] 💼 Templates tab visible
  - [ ] 👥 Customers tab visible
  - [ ] ⚙️ Settings tab visible
  - [ ] 📊 Operations tab visible
  - [ ] 📈 Boardroom tab visible
- [ ] No redirect occurred

**Expected Behavior:**
```
Admin tries /admin
    ↓
ProtectedRoute checks role
    ↓
role = 'admin', needs 'admin'
    ↓
Match! Render AdminDashboard
    ↓
Admin panel displays
```

**Result:** ☐ PASS ☐ FAIL

**Notes:** _________________________________

---

### Test 4D: Customer Accessing Customer Routes
**Setup:**
- [ ] Already logged in as customer (from Test 4B)

**Action:**
- [ ] Navigate to: `http://localhost:5173/dashboard`

**Verification:**
- [ ] Page loads normally
- [ ] You see: Customer Dashboard
- [ ] No redirect occurred

**Result:** ☐ PASS ☐ FAIL

**Notes:** _________________________________

---

### Test 4E: Admin Accessing Customer Routes
**Setup:**
- [ ] Already logged in as admin (from Test 4C)

**Action:**
- [ ] Navigate to: `http://localhost:5173/dashboard`

**Verification:**
- [ ] Page loads normally
- [ ] You see: Customer Dashboard
- [ ] Admin can view customer routes
- [ ] No redirect occurred

**Result:** ☐ PASS ☐ FAIL

**Notes:** _________________________________

---

## Phase 5: Troubleshooting ☐

### If Test 4B Failed (Customer accessing /admin)
- [ ] Check role in database:
  ```sql
  SELECT email, role FROM profiles WHERE email = 'customer@email.com';
  ```
- [ ] Role shows: _____________ (should be 'customer')
- [ ] If showing 'admin', update:
  ```sql
  UPDATE profiles SET role = 'customer' WHERE email = '...';
  ```
- [ ] Clear browser cache and try again
- [ ] Log out and log back in
- [ ] Retry Test 4B

**Fixed:** ☐ YES ☐ NO

---

### If Test 4C Failed (Admin can't access /admin)
- [ ] Check role in database:
  ```sql
  SELECT email, role FROM profiles WHERE email = 'admin@email.com';
  ```
- [ ] Role shows: _____________ (should be 'admin')
- [ ] If showing 'customer', update:
  ```sql
  UPDATE profiles SET role = 'admin' WHERE email = '...';
  ```
- [ ] Check if email in `src/context/AuthContext.jsx` adminEmails array
- [ ] Clear browser cache and try again
- [ ] Log out and log back in
- [ ] Restart dev server: Ctrl+C then `npm run dev`
- [ ] Retry Test 4C

**Fixed:** ☐ YES ☐ NO

---

### If Always Redirected to /login
- [ ] Stop dev server: Ctrl+C
- [ ] Clear browser completely:
  - [ ] DevTools → Application → Clear site data
  - [ ] Or: Ctrl+Shift+Delete → Clear all
- [ ] Delete cache: `rm -rf node_modules/.cache`
- [ ] Restart: `npm run dev`
- [ ] Try logging in fresh in new incognito window
- [ ] Retry tests

**Fixed:** ☐ YES ☐ NO

---

## Final Verification ✅

### Overall Status
- [ ] All 5 routing tests PASSED
- [ ] No console errors related to Auth
- [ ] No infinite redirect loops
- [ ] Language toggle still works (EN/AR)

### Database Status
- [ ] profiles table has "role" column
- [ ] Admin account has role = 'admin'
- [ ] Customer accounts have role = 'customer'

### Code Status
- [ ] App.jsx has AuthProvider wrapper
- [ ] ProtectedRoute component working
- [ ] AuthContext detecting roles correctly

### Final Result
```
☐ ☐ ☐ ☐ ☐ RBAC FULLY IMPLEMENTED AND WORKING ✅
(Check if all tests passed)
```

---

## 🎉 Completion Summary

**Date Completed:** ________________

**Time Spent:**
- Phase 1 (SQL): ________ minutes
- Phase 2 (Admin Setup): ________ minutes
- Phase 3 (Dev Setup): ________ minutes
- Phase 4 (Testing): ________ minutes
- Phase 5 (Troubleshooting): ________ minutes
- **Total: ________ minutes**

**Tests Passed:** ____ / 5

**Issues Encountered:** _______________

**Resolution:** _______________________

---

## 📋 Post-Completion

Once RBAC is complete, next tasks are:

1. ☐ Consolidate dashboards (remove NouraReports duplication)
2. ☐ Update navigation with role-based menu
3. ☐ Create admin-specific components
4. ☐ Extract hardcoded strings and finalize translations
5. ☐ Create UI component library for consistency

---

**Checklist Version:** 1.0  
**Date:** Feb 19, 2026  
**Status:** Ready for Use  

✨ Good luck with your testing! ✨
