# RBAC Quick Reference Card

## 🎯 What Needs to Happen

You are here: ← **YOU ARE HERE**

```
1. Run SQL Migration (in Supabase)
        ↓
2. Set Admin Users (in database)
        ↓  
3. Test Routes (in browser)
        ↓
4. RBAC Complete ✅
```

---

## 📝 Step 1: Run SQL Migration (5 minutes)

**Location:** Supabase Dashboard → SQL Editor

**Copy and paste this SQL:**
```sql
ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'customer';
UPDATE profiles SET role = 'admin' WHERE email IN ('admin@example.com', 'admin@agentic.com');
UPDATE profiles SET role = 'customer' WHERE role IS NULL;
ALTER TABLE profiles ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'customer'));
```

**Click:** Run button
**Expected:** ✅ Query executed successfully

---

## 👤 Step 2: Set Admin Users (2 minutes)

**In Supabase Table Editor:**
1. Go: Database → Tables → profiles
2. Find your row
3. Edit role cell from 'customer' to 'admin'
4. Save

**Or use SQL:**
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## 🧪 Step 3: Test Routes (10 minutes)

### Test 3A: Unauthenticated User
- Open new incognito tab
- Go: `http://localhost:5173/dashboard`
- Expected: Redirect to `/login` ✅

### Test 3B: Customer Accessing Admin (Main Test)
- Log in as: any customer (role='customer' in DB)
- Go: `http://localhost:5173/admin`
- Expected: Redirect to `/dashboard` ✅

### Test 3C: Admin Accessing Admin
- Log in as: admin account (role='admin' in DB)
- Go: `http://localhost:5173/admin`
- Expected: AdminDashboard loads ✅

---

## ✅ Success Criteria

- [ ] SQL ran without errors
- [ ] role column added to profiles table
- [ ] Admin account has role='admin'
- [ ] Customer can't access /admin (redirects)
- [ ] Admin can access /admin (loads)
- [ ] Unauthenticated users redirected to /login

---

## 🔗 Related Files

```
src/
├── context/
│   └── AuthContext.jsx              ← Role logic here
├── components/
│   ├── shared/
│   │   └── ProtectedRoute.jsx       ← Route protection here
│   └── App.jsx                      ← Routes configured here
└── i18n/
    ├── ar.json
    └── en.json
```

---

## 🚨 If Something Goes Wrong

### "Always redirected to /login"
- Clear browser cache: DevTools → Clear site data
- Restart: `npm run dev`
- Log in again

### "Customer can access /admin"
- Check database: `SELECT email, role FROM profiles`
- Verify customer has role='customer'
- Update if needed: `UPDATE profiles SET role='customer' WHERE email='...';`

### "Admin can't access /admin"
- Check database: role should be 'admin'
- Update: `UPDATE profiles SET role='admin' WHERE email='...';`
- Log out and back in

### "Page stuck in redirect loop"
- Stop dev server: Ctrl+C
- Clear cache: DevTools → Clear all
- Restart: `npm run dev`

---

## 📖 Full Documentation

For detailed information, see:
- `RBAC-COMPLETE-GUIDE.md` - Full setup and testing guide
- `RBAC-SQL-MIGRATION-GUIDE.md` - SQL migration steps
- `RBAC-ROUTING-TEST-GUIDE.md` - Detailed test scenarios

---

## ⏱️ Time Estimate

- SQL Migration: **5 minutes**
- Admin Setup: **2 minutes**
- Testing: **10-15 minutes**
- **Total: ~20 minutes**

---

## 📞 Key Commands

```bash
npm run dev              # Start development server
npm run build           # Build for production
# Then test routing as described above
```

---

## 🎉 When Complete

After all 3 steps pass, move to next task:
**Consolidate dashboards** (remove NouraReports duplication)

---

**Created:** Feb 19, 2026  
**Status:** Ready for Testing  
**Estimated Time:** 20 minutes
