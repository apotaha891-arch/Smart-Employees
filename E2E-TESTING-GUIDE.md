# End-to-End Testing Guide

## Overview

This document provides comprehensive testing procedures to validate all implemented features across the Smart Employees platform. Tests are organized by feature area with step-by-step instructions and expected outcomes.

---

## 1. RBAC (Role-Based Access Control) Testing

### 1.1 Admin User Access

**Setup:**
- Have an admin user account ready (from RBAC SQL migration)
- Ensure database has `user_role` column and proper admin assignments

**Test Steps:**
1. Login with admin account (email in `admin_emails`)
2. Verify sidebar shows admin navigation items:
   - ⚙️ إدارة النظام (System Administration)
   - Users (Users)
   - Stores (متاجر)
   - Analytics (التحليلات)
   - Automation (أتمتة)
   - Security (أمان)
   - Settings (إعدادات)
3. Click on each admin route - should render without errors
4. Verify role badge shows "👤 مدير" (Admin)
5. Check browser console - no 403 or auth errors

**Expected Outcome:** ✅ Admin sees all admin routes, proper navigation, correct role badge

---

### 1.2 Customer User Access

**Setup:**
- Have a regular customer account (non-admin)
- Ensure database has `user_role = 'customer'`

**Test Steps:**
1. Login with customer account
2. Verify sidebar shows customer navigation items:
   - 📊 أدوات العمل (Work Tools)
   - Dashboard (لوحة التحكم)
   - My Agents (موظفيني الرقميين)
   - Bookings (الحجوزات)
   - Customers (العملاء)
   - Settings (الإعدادات)
3. Try to manually navigate to `/admin` - should redirect to `/dashboard`
4. Verify role badge shows "👨‍💼 مستخدم" (User)
5. Check localStorage for correct role assignment

**Expected Outcome:** ✅ Customer sees only customer routes, cannot access admin, correct role badge

---

### 1.3 Unauthenticated User Access

**Test Steps:**
1. Clear authentication (logout)
2. Try to access `/dashboard` - should redirect to `/login`
3. Try to access `/admin` - should redirect to `/login`
4. Verify ProtectedRoute component handles loading state gracefully
5. Login and verify proper route resolution

**Expected Outcome:** ✅ Unauthenticated users blocked from protected routes

---

## 2. Dashboard Tab Navigation Testing

### 2.1 Tab Switching

**Test Steps:**
1. Login as customer
2. Navigate to `/dashboard`
3. Verify three tabs are visible: 
   - 🤖 موظفوك الرقميون (My Agents)
   - 📊 الأداء والإحصائيات (Performance)
   - 📈 التقارير الاستراتيجية (Reports)
4. Click "My Agents" tab:
   - Should show AgentManagement component
   - Display agent list (if any agents exist)
5. Click "Performance" tab:
   - Should show Executive Command card
   - Display credit usage progress bar
   - Show stats (tasks, agent status, last update)
6. Click "Reports" tab:
   - Should show ExecutiveReports component
   - Display activity feed table
7. Verify tab content changes without page reload

**Expected Outcome:** ✅ Tabs switch smoothly, content updates, buttons responsive

---

### 2.2 Data Persistence

**Test Steps:**
1. Stay on "My Agents" tab
2. Switch to another tab
3. Return to "My Agents" tab
4. Verify data hasn't changed (no unwanted re-renders)
5. Check browser Network tab - confirm data requested only once

**Expected Outcome:** ✅ Tab state preserved, data not re-fetched unnecessarily

---

## 3. Language Toggle Testing (English/Arabic)

### 3.1 Language Switch Functionality

**Test Steps:**
1. Login to any page
2. Look for Globe 🌍 icon in navbar
3. Click the language toggle button
4. Verify interface switches from Arabic to English:
   - Navigation menu items change to English
   - Dashboard title changes to English
   - Buttons and labels change language
5. Check localStorage for language preference persistence
6. Refresh page - verify language remains English
7. Click toggle again - switch back to Arabic
8. Refresh page - verify Arabic persists

**Expected Outcome:** ✅ Language switches globally, persists across page refreshes

---

### 3.2 Translation Completeness

**Test Steps:**
1. Switch to English
2. Navigate through all main pages:
   - Home
   - Dashboard (all 3 tabs)
   - Login
   - Setup
3. Check for any untranslated Arabic text (should be none)
4. Check browser Network tab - verify i18n files load correctly
5. Open DevTools Console - check for i18n related errors

**Expected Outcome:** ✅ No untranslated text, no console errors, all strings render

---

## 4. UI Component Library Testing

### 4.1 Button Component

**Test Steps:**
1. Open any page with buttons
2. Test button variants:
   - Click primary button - responsive, feedback provided
   - Hover over secondary button - color/style changes
   - Test disabled button - not clickable
   - Test loading state (if available) - shows spinner
3. Expected rendered HTML should contain proper styling

**Expected Outcome:** ✅ All variants render, states work correctly

---

### 4.2 Card Component

**Test Steps:**
1. Locate card elements (Dashboard stats, etc.)
2. Verify card styling matches design:
   - Background color correct
   - Border visible
   - Padding appropriate
3. Test hoverable card (if any):
   - Hover effect applies
   - Transform works
   - Smooth transition
4. Check shadow rendering on elevated cards

**Expected Outcome:** ✅ Cards styled correctly, hover effects work

---

### 4.3 Badge Component

**Test Steps:**
1. Find badge elements (status indicators, tags)
2. Verify badge styling:
   - Color matches variant (success=green, danger=red)
   - Text readable
   - Size appropriate
3. Test dismissible badge if any:
   - Click × button
   - Badge disappears
   - No console errors

**Expected Outcome:** ✅ Badges display correctly, dismissible ones work

---

### 4.4 Table Component

**Test Steps:**
1. Navigate to page with table data (Dashboard activity feed, etc.)
2. Test sorting (if enabled):
   - Click column header
   - Data sorts
   - Chevron indicator changes (up/down)
3. Test pagination (if enabled):
   - Click next/prev buttons
   - Page indicator updates
   - Row count matches pageSize
4. Test row hover effect:
   - Hover row - background highlights
   - Color change visible
   - Smooth transition
5. Test row click (if onRowClick defined):
   - Click row - action triggers
   - Log entry or navigation occurs

**Expected Outcome:** ✅ Table sorting/pagination/hover all work

---

### 4.5 FormInput Component

**Test Steps:**
1. Navigate to setup/form page
2. Test input types:
   - Text input: Type text, verify display
   - Email input: Type email, check format
   - Password input: Type text, verify masked
   - Select dropdown: Choose option, verify update
   - Textarea: Type multiple lines, verify wrap
3. Test validation:
   - Enter error condition
   - Error message displays in red
   - Helper text shows when valid
4. Test disabled input:
   - Cannot type
   - Visual disabled state shows

**Expected Outcome:** ✅ All input types work, validation displays correctly

---

### 4.6 Modal Component

**Test Steps:**
1. Trigger modal open (LowCreditModal, confirmation dialog, etc.)
2. Verify overlay renders:
   - Dark background displayed
   - Blur effect applied
   - Modal centered
3. Test modal content:
   - Title displays
   - Body content visible
   - Footer buttons present
4. Test close button:
   - Click × or "Cancel"
   - Modal closes
   - Overlay disappears
5. Test backdrop click close (if enabled):
   - Click outside modal
   - Modal closes
   - No content underneath clicked

**Expected Outcome:** ✅ Modal renders, closes properly, backdrop works

---

## 5. Agent Lifecycle UI Testing

### 5.1 Agent Lifecycle Component

**Test Steps:**
1. Navigate to Dashboard → "My Agents" tab
2. Locate AgentLifecycle component
3. Verify 4-step workflow displays:
   - 🔍 Browse - should show completed/active state
   - 🎤 Interview - should show completed/active/pending
   - ✅ Hire - current step indicator
   - ⚙️ Customize - pending state indicator
4. Check visual elements:
   - Circles colored appropriately
   - Connector lines between steps
   - Text labels clear
5. Verify responsive behavior:
   - Desktop: 4 steps in row
   - Tablet: Adjust layout gracefully
   - Mobile: Stack vertically or horizontal scroll

**Expected Outcome:** ✅ Lifecycle displays 4 steps, colors correct, responsive

---

## 6. Navigation Role-Based Filtering

### 6.1 Menu Rendering Based on Role

**Test Steps:**
1. Login as admin
2. Verify admin menu items visible:
   - "⚙️ إدارة النظام" label shows
   - 7 admin routes listed
3. Logout and login as customer
4. Verify customer menu items visible:
   - "📊 أدوات العمل" label shows
   - 5 customer routes listed
   - Admin routes NOT visible
5. Verify active route styling:
   - Current page menu item highlighted
   - Purple accent color applied
   - Border indicator visible

**Expected Outcome:** ✅ Menu items correctly filtered by role, active states work

---

## 7. Service Layer Integration Testing

### 7.1 Agent Service Functions

**To test in browser console:**
```javascript
// Test getting templates
const templates = await window.agentService.getAgentTemplates();
console.log('Templates:', templates);

// Test hiring agent
const agent = await window.agentService.hireAgent({
  templateId: 'template-1',
  customName: 'Test Agent'
});
console.log('Hired agent:', agent);

// Test getting user's agents
const userAgents = await window.agentService.getUserAgents();
console.log('User agents:', userAgents);
```

**Expected Outcome:** ✅ Service functions return data without errors

---

### 7.2 Credit Service Functions

```javascript
// Test getting credit balance
const balance = await window.creditService.getCreditBalance();
console.log('Credit balance:', balance);

// Test deducting credits
const result = await window.creditService.checkAndDeductCredits(10);
console.log('Deduction result:', result); // true/false

// Test getting credit history
const history = await window.creditService.getCreditHistory();
console.log('Credit history:', history);
```

**Expected Outcome:** ✅ Credit operations work, balances update correctly

---

## 8. Translation System Testing

### 8.1 Translation Key Resolution

**In browser console:**
```javascript
// Test translation key with dot notation
const t = window.useLanguage().t;
console.log(t('nav.home')); // Should return Arabic
console.log(t('nav.dashboard'));
console.log(t('agent.hire'));
console.log(t('common.save'));

// Switch language and test
window.changeLanguage('en');
console.log(t('nav.home')); // Should return English
```

**Expected Outcome:** ✅ All keys resolve to correct translations

---

### 8.2 Missing Translation Fallback

**Test Steps:**
1. Try accessing non-existent translation key: `t('nonexistent.key')`
2. Should return fallback (usually the key itself)
3. Check console - should have warning about missing translation
4. Interface doesn't break

**Expected Outcome:** ✅ Fallback works, graceful degradation

---

## 9. Performance Testing

### 9.1 Dashboard Load Time

**Test Steps:**
1. Open DevTools → Performance tab
2. Navigate to Dashboard
3. Record performance:
   - Page load time: Should be < 3 seconds
   - Tab switching: Should be instant (< 500ms)
   - Data loading: Spinner shows while loading
4. Check Network tab:
   - i18n files loaded once
   - API calls batched appropriately
   - No unnecessary re-fetches

**Expected Outcome:** ✅ Performance acceptable, smooth transitions

---

### 9.2 Memory Leaks Check

**Test Steps:**
1. Open DevTools → Memory tab
2. Take heap snapshot
3. Perform actions:
   - Switch tabs 10+ times
   - Open/close modals
   - Change language
4. Take another heap snapshot
5. Compare - memory should not increase significantly
6. Cleanup should occur (especially for subscriptions)

**Expected Outcome:** ✅ No memory leaks detected

---

## 10. Error Handling Testing

### 10.1 Network Error Handling

**Test Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to load data
4. Verify:
   - Error message displays (not blank screen)
   - Retry button available
   - User can recover
5. Resume network - retry should work

**Expected Outcome:** ✅ Graceful error handling, recovery possible

---

### 10.2 Invalid Data Handling

**Test Steps:**
1. Manually modify localStorage/cookies
2. Corrupt user role or authentication state
3. Try to access protected route
4. Should redirect to login (not crash)
5. Error handling log should show in console

**Expected Outcome:** ✅ App doesn't crash, appropriate redirect

---

## Test Checklist

- [ ] Admin user can access all admin routes
- [ ] Customer user blocked from admin routes
- [ ] Unauthenticated user redirected to login
- [ ] Dashboard tabs switch smoothly
- [ ] Language toggle works (AR ↔ EN)
- [ ] All translations complete (no missing keys)
- [ ] Button variants render correctly
- [ ] Cards display with proper styling
- [ ] Tables sort/paginate correctly
- [ ] Form inputs validate
- [ ] Modals open/close properly
- [ ] Agent lifecycle displays 4 steps
- [ ] Navigation menu role-filtered
- [ ] Service functions work correctly
- [ ] No console errors
- [ ] No memory leaks
- [ ] Performance acceptable
- [ ] Error handling graceful

---

## Automated Testing (Optional Future Enhancement)

For production deployment, consider adding:
- Jest unit tests for components
- React Testing Library for integration tests
- Cypress for E2E test automation
- Visual regression testing

---

## Known Issues & Workarounds

(Update as issues are discovered during testing)

1. **Issue**: Language toggle sometimes doesn't update immediately
   - **Workaround**: Refresh page (data persists)

2. **Issue**: Modal backdrop click may not work on mobile
   - **Workaround**: Use close button instead

---

## Testing Environment Setup

1. **Fresh Database:**
   ```bash
   npm run db:reset
   npm run db:seed
   ```

2. **Clear Local Storage:**
   - Open DevTools → Application → Clear Site Data

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

4. **Test Account Credentials:**
   - Admin: admin@example.com / password
   - Customer: user@example.com / password

---

## Sign-Off

- Tested By: ________________
- Date: ________________
- Notes: ________________
- Status: ✅ Ready for Production / ⚠️ Issues Found

---

**Last Updated:** 2024
**Version:** 1.0
