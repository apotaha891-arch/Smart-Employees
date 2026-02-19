# Role-Based Access Control (RBAC) Implementation Guide

## Overview
This app now implements role-based access control to separate admin and customer functionality. Two roles are supported:
- **admin** - Full platform control, user management, settings
- **customer** - Individual business account, agent management

## Architecture

### 1. Authentication Context (`src/context/AuthContext.jsx`)
The `AuthContext` provides role information to the entire app:

```javascript
const { user, userRole, loading, isAuthenticated, isAdmin, isCustomer } = useAuth();
```

**Exported values:**
- `user` - Current authenticated Supabase user object
- `userRole` - 'admin' or 'customer'
- `loading` - Boolean indicating if auth check is in progress
- `isAuthenticated` - Boolean, true if user is logged in
- `isAdmin` - Boolean shortcut for `userRole === 'admin'`
- `isCustomer` - Boolean shortcut for `userRole === 'customer'`

### 2. Protected Routes (`src/components/shared/ProtectedRoute.jsx`)
The `ProtectedRoute` component wraps routes to enforce role-based access:

```jsx
<Route 
    path="/admin" 
    element={
        <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
        </ProtectedRoute>
    } 
/>
```

**Behavior:**
- If user is not authenticated → redirects to `/login`
- If user doesn't have required role → redirects to appropriate dashboard (admin → /admin, customer → /dashboard)
- If user has correct role → renders children component

### 3. Route Structure (Updated in `src/App.jsx`)

#### Public Routes (No Authentication Required)
- `/` - Home page
- `/login` - Login/signup page
- `/custom-request` - Custom request form
- `/interview` - Interview room (for exploration)
- `/reports` - Public reports (if available to non-authenticated users)

#### Admin Routes (admin role required)
- `/admin` - Admin control panel with tabs for templates, users, analytics, integrations, settings

#### Customer Routes (customer role required)
- `/dashboard` - Main productivity dashboard
- `/setup` - Business setup configuration
- `/salon-setup` - Agent setup and customization (individual)
- `/templates` - Agent template browser
- `/pricing` - Subscription plans
- `/bookings` - Customer booking management
- `/customers` - Customer database management

## Setting Up Roles

### Database Setup
Run the migration script to add role support:
```bash
# Copy db-update-v8-rbac.sql content and run in Supabase SQL Editor
```

This adds:
- `role` column to profiles table (default: 'customer')
- Constraint ensuring only 'admin' or 'customer' values
- Admin assignments for admin emails

### Manual Role Assignment
In Supabase dashboard:
1. Go to `profiles` table
2. For admin users: set `role = 'admin'`
3. For regular users: set `role = 'customer'` (or leave default)

### Code-Based Role Determination
Currently (temporary), roles are determined by:
1. **Email-based check** - If user email is in `adminEmails` array → 'admin'
2. **Profile database** - Fetches role from profiles table if available
3. **Default** - All other users → 'customer'

**Location:** `src/context/AuthContext.jsx` in `determineUserRole()` function

To modify admin email list:
```javascript
const adminEmails = ['admin@example.com', 'admin@agentic.com'];
```

## Using Roles in Components

### Check User Role
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
    const { isAdmin, isCustomer, userRole } = useAuth();
    
    if (isAdmin) {
        // Show admin content
    }
    
    if (isCustomer) {
        // Show customer content
    }
}
```

### Conditional Rendering
```javascript
{isAdmin && <AdminControls />}
{isCustomer && <CustomerDashboard />}
```

### Role-Specific Routes
```javascript
<Route 
    path="/admin/users" 
    element={
        <ProtectedRoute requiredRole="admin">
            <UserManagement />
        </ProtectedRoute>
    } 
/>
```

## Security Considerations

1. **Backend Validation Required**
   - Current RBAC is client-side only
   - Always validate permissions on backend/Supabase
   - Never trust client-side role information for sensitive operations

2. **Token Validation**
   - Supabase automatically validates JWT tokens
   - Use Row-Level Security (RLS) policies on tables

3. **Sensitive Data**
   - Admin-only data should be restricted via RLS policies
   - Don't expose admin-only data in API responses to non-admin users

## Future Enhancements

1. **Implement RLS Policies** - Add Supabase Row-Level Security policies:
   ```sql
   -- Only admins can view all users
   CREATE POLICY admin_can_view_all_users
   ON profiles
   FOR SELECT
   USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
   ```

2. **Additional Role Tiers** - Support for:
   - `superadmin` - Platform owner
   - `manager` - Team/department manager
   - `agent_admin` - Can manage agents within their business

3. **Permission System** - Move beyond simple roles to granular permissions:
   ```javascript
   canViewUsers: isAdmin,
   canEditSettings: isAdmin || isManager,
   canViewReports: isAdmin || isManager || isCustomer,
   ```

4. **Audit Logging** - Track admin actions for compliance

## Testing RBAC

### Test as Customer
1. Create a regular user account
2. Navigate to `/dashboard` - should work
3. Navigate to `/admin` - should redirect to `/dashboard`

### Test as Admin
1. Set your user role to 'admin' in database
2. Navigate to `/admin` - should display admin panel
3. Navigate to `/dashboard` - should work (admins can view customer routes)
4. Admin redirects should work properly

### Test Edge Cases
1. Non-authenticated user accessing `/admin` - should redirect to `/login`
2. Non-authenticated user accessing `/dashboard` - should redirect to `/login`
3. Loading state - should show loading message briefly

## Troubleshooting

### User stays logged in but routes not working
- Check browser console for auth errors
- Verify user object is being fetched in `getCurrentUser()`
- Check that role field exists in profiles table

### Role always shows as 'customer'
- Check if role is in profiles table
- Verify admin email list includes user's email
- Check browser console for profile fetch errors

### Routes redirect to wrong page
- Verify `requiredRole` is set correctly in route definition
- Check that user's actual role matches what's expected
- Clear browser cache and try again

## File Structure
```
src/
├── context/
│   └── AuthContext.jsx          # Role-based authentication context
├── components/
│   ├── shared/
│   │   └── ProtectedRoute.jsx   # Route protection wrapper
│   ├── admin/                   # Admin-only components
│   ├── customer/                # Customer-only components
│   └── App.jsx                  # Updated with protected routes
└── i18n/                        # Translations
```
