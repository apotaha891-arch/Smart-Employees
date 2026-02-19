# RBAC Routing Test Guide

## Route Access Matrix

This matrix shows which routes are accessible by which user roles:

```
┌─────────────────────────────────────┬────────────┬──────────┬────────────┐
│ Route                               │ Public     │ Customer │ Admin      │
├─────────────────────────────────────┼────────────┼──────────┼────────────┤
│ /                                   │ ✅ YES     │ ✅ YES   │ ✅ YES     │
│ /login                              │ ✅ YES     │ ✅ YES   │ ✅ YES     │
│ /custom-request                     │ ✅ YES     │ ✅ YES   │ ✅ YES     │
│ /interview                          │ ✅ YES     │ ✅ YES   │ ✅ YES     │
│ /reports                            │ ✅ YES     │ ✅ YES   │ ✅ YES     │
│ /dashboard                          │ ❌ LOGIN   │ ✅ YES   │ ✅ YES     │
│ /setup                              │ ❌ LOGIN   │ ✅ YES   │ ✅ YES     │
│ /salon-setup                        │ ❌ LOGIN   │ ✅ YES   │ ✅ YES     │
│ /templates                          │ ❌ LOGIN   │ ✅ YES   │ ✅ YES     │
│ /pricing                            │ ❌ LOGIN   │ ✅ YES   │ ✅ YES     │
│ /bookings                           │ ❌ LOGIN   │ ✅ YES   │ ✅ YES     │
│ /customers                          │ ❌ LOGIN   │ ✅ YES   │ ✅ YES     │
│ /admin                              │ ❌ LOGIN   │ ❌ DASH* │ ✅ YES     │
└─────────────────────────────────────┴────────────┴──────────┴────────────┘

✅ YES = Route loads normally
❌ LOGIN = Redirects to /login if not authenticated
❌ DASH* = Redirects to /dashboard (customer tries /admin)
```

---

## Expected Routing Behavior

### Scenario 1: Unauthenticated User
```
User: Not logged in
Action: Try to access /dashboard
Route Check:
  1. ProtectedRoute checks: isAuthenticated?
  2. Result: NO
  3. Action: Redirect to /login
Expected Result: ✅ User on /login page
```

### Scenario 2: Customer User Accessing Customer Route
```
User: Email 'customer@example.com', role = 'customer'
Action: Go to /dashboard
Route Check:
  1. ProtectedRoute checks: isAuthenticated?
  2. Result: YES (logged in)
  3. ProtectedRoute checks: requiredRole === userRole?
  4. Required: 'customer', User has: 'customer'
  5. Result: MATCH
Expected Result: ✅ Dashboard loads normally
```

### Scenario 3: Customer User Accessing Admin Route (MAIN TEST)
```
User: Email 'customer@example.com', role = 'customer'
Action: Try to access /admin
Route Check:
  1. ProtectedRoute checks: isAuthenticated?
  2. Result: YES (logged in)
  3. ProtectedRoute checks: requiredRole === userRole?
  4. Required: 'admin', User has: 'customer'
  5. Result: MISMATCH
  6. Action: Redirect to /dashboard (customer appropriate dashboard)
Expected Result: ✅ User redirected to /dashboard
```

### Scenario 4: Admin User Accessing All Routes
```
User: Email 'admin@example.com', role = 'admin'
Action: Try to access /admin
Route Check:
  1. ProtectedRoute checks: isAuthenticated?
  2. Result: YES (logged in)
  3. ProtectedRoute checks: requiredRole === userRole?
  4. Required: 'admin', User has: 'admin'
  5. Result: MATCH
Expected Result: ✅ AdminDashboard loads
```

---

## Manual Testing Steps

### Test 1: Unauthenticated Access
```
1. Open browser DevTools (F12)
2. Go to "Application" tab
3. Clear all localStorage and sessionStorage
4. Navigate to: http://localhost:5173/dashboard
5. Expected: Redirected to /login page
6. ✅ PASS if you see login form
```

### Test 2: Customer Cannot Access Admin
```
1. Log in with customer account (any non-admin user)
2. Navigate to: http://localhost:5173/admin
3. Wait 2-3 seconds for auth check
4. Expected: Browser redirects to /dashboard
5. ✅ PASS if you see customer dashboard, NOT admin panel
```

### Test 3: Admin Can Access Admin
```
1. Log in with admin account
   - Email: admin@example.com (or configured admin email)
   - Verify role in database is 'admin'
2. Navigate to: http://localhost:5173/admin
3. Wait 2-3 seconds for auth check
4. Expected: AdminDashboard loads without redirect
5. ✅ PASS if you see admin control panel
```

### Test 4: Customer Can Access Customer Routes
```
1. Log in with customer account
2. Navigate to: http://localhost:5173/dashboard
3. Expected: Dashboard loads normally
4. ✅ PASS if dashboard renders
```

### Test 5: Admin Can Access Customer Routes
```
1. Log in with admin account
2. Navigate to: http://localhost:5173/dashboard
3. Expected: Dashboard loads (admins have access to customer routes too)
4. ✅ PASS if dashboard renders
```

---

## Browser DevTools Testing

### Check Authentication Status
```javascript
// In browser console, run:
await fetch('/auth/session').then(r => r.json()).then(console.log)
```

### Check Auth Context Value (if exposed)
```javascript
// In browser console:
window.__AUTH_DEBUG__ // (if debugging is enabled)
```

### Monitor Redirects
```javascript
1. Open DevTools → Network tab
2. Filter by Fetch/XHR
3. Try to access protected route
4. Watch network requests and URL changes
5. Look for the redirect behavior
```

### Check Console for Errors
```
1. Open DevTools → Console tab
2. Look for any red error messages
3. Common errors:
   - "useAuth must be used within AuthProvider"
   - "Cannot read property 'user' of undefined"
   - "Auth check error: ..."
```

---

## Debugging Common Issues

### Issue: Always Redirected to /login
```
Possible Causes:
1. getCurrentUser() is not returning user correctly
   - Check that Supabase auth is configured
   - Verify login actually set session

2. useAuth hook is not getting context
   - Ensure <AuthProvider> wraps entire app
   - Check for missing context provider in App.jsx

Solution:
- Add console.log in AuthContext to debug:
  console.log('User:', authUser, 'Role:', role);
- Restart app: npm run dev
- Check browser console for logs
```

### Issue: Role Always 'customer'
```
Possible Causes:
1. Role column not added to database
   - Check profiles table in Supabase
   - Run SQL migration again if needed

2. Email not in admin list
   - Database role is not 'admin'
   - Email is not in adminEmails array

Solution:
- Verify role column exists: SELECT * FROM profiles LIMIT 1
- Check your user's role: SELECT email, role FROM profiles WHERE email = 'your-email'
- Update role in database to 'admin' if needed
- Or add your email to adminEmails in AuthContext.jsx
```

### Issue: Redirect Loop
```
Possible Causes:
1. Session data is corrupt
2. useAuth hook being called in AuthProvider itself

Solution:
- Click → Application → Local Storage → Clear All
- Log out and log in again
- Clear browser cache: Ctrl+Shift+Delete
- Restart development server: npm run dev
```

---

## Expected Console Output When Working Correctly

When routing is set up correctly, you should see in the browser console:
```
✅ Auth context initialized
✅ User loaded: user@example.com
✅ Role determined: customer
✅ Loading: false
```

---

## Quick Test URLs

Use these URLs to quickly test different scenarios:

```
Public Routes (always work):
- http://localhost:5173/
- http://localhost:5173/login

Customer Routes (need login + customer role):
- http://localhost:5173/dashboard
- http://localhost:5173/setup
- http://localhost:5173/salon-setup
- http://localhost:5173/templates
- http://localhost:5173/pricing
- http://localhost:5173/bookings
- http://localhost:5173/customers

Admin Routes (need login + admin role):
- http://localhost:5173/admin

⚠️ Important: After changing roles in database, you may need to:
1. Log out (click logout button)
2. Log back in
3. This refreshes the auth context with new role
```

---

## Success Criteria

All of these must be true for RBAC to be working:

- [ ] SQL migration completed without errors
- [ ] role column exists in profiles table
- [ ] Your admin account has role = 'admin'
- [ ] Unauthenticated user → /login redirects to `/login`
- [ ] Customer accessing /admin → redirects to `/dashboard`
- [ ] Customer accessing /dashboard → shows dashboard
- [ ] Admin accessing /admin → shows AdminDashboard
- [ ] Admin accessing /dashboard → shows dashboard
- [ ] Public routes work without login
- [ ] No console errors related to AuthContext or useAuth

Once all criteria are met: ✅ **RBAC IS WORKING CORRECTLY**
