/**
 * RBAC Testing Helper
 * 
 * This file contains helper functions to test RBAC routing
 * Copy and paste the code snippets into your browser console to test
 */

// ============================================
// TEST 1: Check if AuthProvider is working
// ============================================
console.log(['=== RBAC TEST HELPER ===', '']);

// Test if AuthContext is available through context
const testAuthContext = () => {
    try {
        console.log('✅ Testing Auth Context Availability...');
        // This will throw if not available in a component that uses useAuth
        console.log('Status: Check if <AuthProvider> wraps App in App.jsx');
        return true;
    } catch (e) {
        console.error('❌ AuthContext Error:', e.message);
        return false;
    }
};

// ============================================
// TEST 2: Check localStorage and session
// ============================================
const testAuthSession = () => {
    console.log(['', '✅ Testing Auth Session...']);
    
    const appLanguage = localStorage.getItem('appLanguage');
    console.log('- appLanguage:', appLanguage);
    
    const supabaseSession = localStorage.getItem('sb-{project-id}-auth-token'); // Supabase stores here
    console.log('- Session exists:', !!supabaseSession);
    
    return {
        language: appLanguage,
        hasSession: !!supabaseSession
    };
};

// ============================================
// TEST 3: Test route redirect behavior
// ============================================
const testRouteAccess = async (routePath) => {
    console.log(['', `✅ Testing route access: ${routePath}`]);
    
    const currentUrl = window.location.href;
    const lastUrl = currentUrl;
    
    // Navigate to route
    window.location.href = routePath;
    
    // Wait and log where we ended up
    setTimeout(() => {
        const newUrl = window.location.href;
        console.log(`- Navigated to: ${routePath}`);
        console.log(`- Ended up at: ${newUrl}`);
        console.log(`- Redirected: ${newUrl !== routePath}`);
    }, 2000);
};

// ============================================
// TEST 4: Test authentication status
// ============================================
const testAuthStatus = async () => {
    console.log(['', '✅ Testing Authentication Status...']);
    
    try {
        // This assumes getCurrentUser is available
        // In real scenario, this would be called from AuthContext
        console.log('Check console logs for:');
        console.log('- User: { id, email, ... }');
        console.log('- Role: admin or customer');
        console.log('- Loading: false');
        console.log('');
        console.log('Note: Best tested from a component using useAuth hook');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
};

// ============================================
// TEST 5: Simulate route scenarios
// ============================================
const testScenarios = {
    customerAccessAdmin: () => {
        console.log(['', '📋 Scenario: Customer accessing /admin']);
        console.log('Expected: Redirect to /dashboard');
        console.log('How to test:');
        console.log('1. Log in as: customer@example.com');
        console.log('2. Go to URL: /admin');
        console.log('3. Should redirect to: /dashboard');
    },
    
    adminAccessAdmin: () => {
        console.log(['', '📋 Scenario: Admin accessing /admin']);
        console.log('Expected: AdminDashboard loads');
        console.log('How to test:');
        console.log('1. Log in as: admin@example.com');
        console.log('2. Go to URL: /admin');
        console.log('3. Should load: AdminDashboard component');
    },
    
    unauthenticatedAccess: () => {
        console.log(['', '📋 Scenario: Unauthenticated user accessing /dashboard']);
        console.log('Expected: Redirect to /login');
        console.log('How to test:');
        console.log('1. Log out from app');
        console.log('2. Go to URL: /dashboard');
        console.log('3. Should redirect to: /login');
    }
};

// ============================================
// TEST 6: Debug RBAC state (console only)
// ============================================
const debugRBACState = () => {
    console.log(['', '🔍 RBAC Debug Information:']);
    console.log('');
    console.log('Checklist:');
    console.log('□ profiles table has "role" column');
    console.log('□ Your user has role = "admin" or "customer"');
    console.log('□ AuthProvider wraps entire App in App.jsx');
    console.log('□ ProtectedRoute is imported correctly');
    console.log('□ Routes have requiredRole parameter set');
    console.log('');
    console.log('To verify manually:');
    console.log('1. Check src/context/AuthContext.jsx exists');
    console.log('2. Check src/components/shared/ProtectedRoute.jsx exists');
    console.log('3. Check App.jsx has AuthProvider wrapper');
    console.log('4. Run: npm run dev');
    console.log('5. Log in and test routes');
};

// ============================================
// MAIN TEST RUNNER
// ============================================
const runAllRBACTests = () => {
    console.clear();
    console.log('╔════════════════════════════════════════╗');
    console.log('║     RBAC ROUTING TEST SUITE            ║');
    console.log('║     Smart Employees Platform           ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    
    testAuthSession();
    testAuthContext();
    debugRBACState();
    
    console.log(['', '📋 Available Test Scenarios:']);
    console.log('Run: testScenarios.customerAccessAdmin()');
    console.log('Run: testScenarios.adminAccessAdmin()');
    console.log('Run: testScenarios.unauthenticatedAccess()');
    console.log('');
    console.log('Try accessing routes:');
    console.log('- testRouteAccess("/dashboard")');
    console.log('- testRouteAccess("/admin")');
};

// Run tests automatically on script load
if (typeof window !== 'undefined') {
    window.rbacTestHelper = {
        runAll: runAllRBACTests,
        scenarios: testScenarios,
        session: testAuthSession,
        testRoute: testRouteAccess,
        debug: debugRBACState
    };
    
    console.log('');
    console.log('💡 RBAC Test Helper Loaded!');
    console.log('');
    console.log('Run in console: rbacTestHelper.runAll()');
}

export { runAllRBACTests, testScenarios, testAuthSession, testRouteAccess, debugRBACState };
