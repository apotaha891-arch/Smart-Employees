# RBAC SQL Migration - Step-by-Step Guide

## Step 1: Run SQL Migration in Supabase

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project: "Smart Employees"

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "+ New Query"

3. **Copy and Paste the Migration**
   - Paste the SQL below into the query editor
   - Click "Run" button (or press Ctrl+Enter)

```sql
-- Add role field to profiles table to enable proper RBAC
-- Run this migration to add role-based access control support

-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'customer';

-- Create admin role assignments
UPDATE profiles 
SET role = 'admin' 
WHERE email IN ('admin@example.com', 'admin@agentic.com');

-- Ensure all other users default to customer
UPDATE profiles 
SET role = 'customer' 
WHERE role IS NULL;

-- Add constraint to ensure only valid roles
ALTER TABLE profiles 
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'customer'));
```

4. **Expected Output**
   - If successful, you should see: "Query executed successfully"
   - No error messages should appear

---

## Step 2: Verify the Migration

1. **Check profiles table**
   - Go to "Database" → "Tables" in Supabase
   - Select "profiles" table
   - You should see a new "role" column added
   - Default value should be 'customer'

2. **Verify your admin account**
   - Look for your email in the profiles table
   - Your role should be set to 'admin'
   - Other users should have role = 'customer'

---

## Step 3: Update Admin Email List (if needed)

If your admin email is NOT in the list ('admin@example.com', 'admin@agentic.com'), you need to:

1. **Option A: Update database directly**
   - In Supabase Table Editor, find your user
   - Change their role column to 'admin'
   - Save

2. **Option B: Update the code to use your email**
   - Edit: `src/context/AuthContext.jsx`
   - Find this line:
     ```javascript
     const adminEmails = ['admin@example.com', 'admin@agentic.com'];
     ```
   - Add your email:
     ```javascript
     const adminEmails = ['admin@example.com', 'admin@agentic.com', 'your-email@example.com'];
     ```
   - Save the file

---

## Step 4: Test the Routing

### Test as Admin User

1. **Log in with admin account**
   - Email: admin@example.com (or your admin email)
   - Password: (your admin password)

2. **Test admin route access**
   - Navigate to: `http://localhost:5173/admin`
   - You should see: AdminDashboard loads successfully
   - No redirects should occur

3. **Verify role detection**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Type: `localStorage.getItem('appLanguage')`
   - Should show language preference

4. **Success Indicators**
   - ✅ AdminDashboard renders
   - ✅ Navigation shows admin menu items
   - ✅ Can access all admin panels

---

### Test as Customer User

1. **Log in with customer account**
   - Email: (customer test account)
   - Password: (customer password)
   - Or create a test customer account

2. **Test customer route access**
   - Navigate to: `http://localhost:5173/dashboard`
   - You should see: Dashboard loads successfully
   - ✅ This should work

3. **Test unauthorized admin access**
   - Navigate to: `http://localhost:5173/admin`
   - **Expected behavior: REDIRECT to `/dashboard`**
   - You should NOT see AdminDashboard
   - You SHOULD be redirected to customer dashboard

4. **Success Indicators**
   - ✅ Customer dashboard loads
   - ✅ Cannot access `/admin` route
   - ✅ Automatically redirected to appropriate dashboard

---

### Test as Unauthenticated User

1. **Log out completely**
   - Clear localStorage: DevTools → Application → localStorage → clear all

2. **Try accessing protected route**
   - Navigate to: `http://localhost:5173/admin`
   - **Expected behavior: REDIRECT to `/login`**

3. **Try accessing customer route**
   - Navigate to: `http://localhost:5173/dashboard`
   - **Expected behavior: REDIRECT to `/login`**

4. **Public routes should still work**
   - Navigate to: `http://localhost:5173/`
   - ✅ Home page should load without login

---

## Troubleshooting

### Migration Failed: "Column already exists"
- You may have already run this migration
- Check the profiles table - if "role" column exists, skip this step

### Role not being detected
1. Check browser console for errors
2. Verify Supabase is properly connected
3. Clear browser cache and refresh
4. Check that role field exists in profiles table

### Always redirects to login
1. Ensure you're logged in properly
2. Check that auth token is not expired
3. Verify getCurrentUser() is returning user correctly
4. Check browser DevTools Network tab for auth errors

### Stuck in redirect loop
1. Clear all app data: DevTools → Application → Storage → Clear site data
2. Log out and log back in
3. Refresh the page completely

---

## Quick Testing Checklist

Use this checklist to verify everything works:

- [ ] SQL migration ran successfully (no errors)
- [ ] role column exists in profiles table
- [ ] Your account has role = 'admin'
- [ ] Other accounts have role = 'customer'
- [ ] Admin user can access `/admin` route
- [ ] Admin user can access `/dashboard` route
- [ ] Customer user can access `/dashboard` route
- [ ] Customer user CANNOT access `/admin` (redirects)
- [ ] Non-logged-in user redirected to `/login` on protected routes
- [ ] Home page `/` accessible without login

---

## Next Steps After Testing

Once all tests pass:
1. ✅ RBAC is working correctly
2. Ready to consolidate dashboards (remove NouraReports duplication)
3. Ready to update navigation with role-based menu
4. Ready to create admin-specific components in `/src/components/admin/`
