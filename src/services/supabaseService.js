import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        // Use localStorage explicitly (avoids IndexedDB lock contention)
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Bypass the Web Locks API — prevents AbortError when multiple
        // Supabase client instances compete for the same lock (e.g. during HMR)
        lock: (_name, _acquireTimeout, fn) => fn(),
    }
});

// ==================== AUTHENTICATION ====================

export const signUp = async (email, password, fullName, isAgency = false) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName, is_agency: isAgency },
                emailRedirectTo: `${window.location.origin}/dashboard`
            }
        });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const signIn = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const signInWithGoogle = async () => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                scopes: 'email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/spreadsheets',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                redirectTo: `${window.location.origin}/`,
            },
        });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const signInWithApple = async () => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const getCurrentUser = async () => {
    try {
        // IMPERSONATION: Check if agency is managing a client
        // This makes ALL components impersonation-aware without individual changes
        const impersonatedRaw = sessionStorage.getItem('impersonated_user');
        if (impersonatedRaw) {
            const impersonatedUser = JSON.parse(impersonatedRaw);
            if (impersonatedUser?.id) {
                return { success: true, user: impersonatedUser };
            }
        }
        
        // Normal flow: return the real authenticated user
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== PASSWORD RECOVERY ====================

export const sendPasswordResetEmail = async (email) => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updatePassword = async (newPassword) => {
    try {
        console.log("SupabaseService: Updating password...");
        // Add a timeout to prevent indefinite hanging (increased to 60s for stability)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Password update timed out (60s). Check your connection.')), 60000)
        );

        const updatePromise = supabase.auth.updateUser({
            password: newPassword
        });

        const { data, error } = await Promise.race([updatePromise, timeoutPromise]);

        if (error) {
            console.error("SupabaseService: Update password error:", error);
            throw error;
        }
        console.log("SupabaseService: Password updated successfully");
        return { success: true, data };
    } catch (error) {
        console.error("SupabaseService: Update password exception:", error);
        return { success: false, error: error.message };
    }
};

export const resendConfirmationEmail = async (email) => {
    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/dashboard`
            }
        });
        if (error) throw error;
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== INTEGRATIONS (OAUTH) ====================

export const linkGoogleAccount = async () => {
    try {
        const { data, error } = await supabase.auth.linkIdentity({
            provider: 'google',
            options: {
                scopes: 'email profile https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/spreadsheets',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                redirectTo: `${window.location.origin}/setup?integration=google`,
            },
        });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error linking Google account:', error);
        return { success: false, error: error.message };
    }
};

export const saveIntegrationCredentials = async (userId, provider, credentials) => {
    try {
        // Fetch entity_id to link it properly
        const { data: entityConfigs } = await supabase
            .from('entities')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        const entityId = entityConfigs?.[0]?.id || null;

        // Check if an integration already exists
        const { data: existing } = await supabase
            .from('integrations')
            .select('id')
            .eq('user_id', userId)
            .eq('provider', provider)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase.from('integrations').update({
                entity_id: entityId,
                credentials: credentials,
                status: 'connected',
                updated_at: new Date().toISOString()
            }).eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('integrations').insert({
                user_id: userId,
                entity_id: entityId,
                provider: provider,
                credentials: credentials,
                status: 'connected',
                updated_at: new Date().toISOString()
            });
            if (error) throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('Error saving integration:', error);
        return { success: false, error: error.message };
    }
};

export const connectMetaBYOT = async (params) => {
    try {
        const { data, error } = await supabase.functions.invoke('meta-connection-handler', {
            body: params
        });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('connectMetaBYOT error:', error);
        return { success: false, error: error.message };
    }
};

export const getIntegrations = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('integrations')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message, data: [] };
    }
};

// ==================== BUSINESS PROFILE ====================

export const updateBusinessProfile = async (userId, profileData) => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                ...profileData,
                updated_at: new Date()
            });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const invokeMultiFileWorkflow = async (files, urls) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second safety timeout

    try {
        const formData = new FormData();

        if (files && files.length > 0) {
            files.forEach(file => {
                formData.append('files', file);
            });
        }

        if (urls && urls.length > 0) {
            formData.append('urls', JSON.stringify(urls));
        }

        console.log("SupabaseService: Invoking multi-file-workflow...");
        const { data, error } = await supabase.functions.invoke('multi-file-workflow', {
            body: formData,
            // signal: controller.signal // Signal is not directly supported in invoke options, but we can catch the hang
        });

        clearTimeout(timeoutId);

        if (error) {
            console.error("Edge function returned error object:", error);
            let contextMsg = error.message;
            if (error.context) {
                try {
                    const ctxText = await error.context.text();
                    contextMsg = `${error.message} - Details: ${ctxText}`;
                } catch (e) { /* ignore */ }
            }
            throw new Error(contextMsg);
        }

        if (!data) throw new Error("Empty response from extraction engine");

        return { success: true, data };
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error invoking multi-file-workflow:', error);
        const isTimeout = error.name === 'AbortError' || error.message.includes('timeout');
        return {
            success: false,
            error: isTimeout ? "The analysis engine timed out. Please try with fewer links or smaller files." : error.message
        };
    }
};

// ==================== AGENT TEMPLATES & SETTINGS (CLIENT FACING) ====================

export const getPublicTemplates = async () => {
    try {
        const { data, error } = await supabase
            .from('agent_templates')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error fetching public templates:', error);
        return { success: false, error: error.message };
    }
};

export const getAgentApps = async () => {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('settings')
            .eq('key', 'agent_apps')
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
        // Return default apps if none found in DB
        return { success: true, data: data?.settings || [] };
    } catch (error) {
        console.error('Error fetching agent apps:', error);
        return { success: false, error: error.message };
    }
};


// ==================== AGENTS ====================

export const createAgent = async (agentData) => {
    try {
        // Use getCurrentUser to support impersonation
        const { user } = await getCurrentUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('agents')
            .insert([{
                name: agentData.name || 'AI Agent',
                specialty: agentData.specialty || 'General',
                avatar: agentData.avatar || '👩',
                business_type: agentData.business_type || null,
                platform: agentData.platform || (agentData.metadata?.platforms ? agentData.metadata.platforms.join(',') : null),
                status: 'active',
                user_id: user.id
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Create Agent Error:', error);
        return { success: false, error: error.message };
    }
};

export const updateAgent = async (agentId, agentData) => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .update(agentData)
            .eq('id', agentId)
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error('Update Agent Error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

export const getAgents = async () => {
    try {
        // Use getCurrentUser to support impersonation
        const { user } = await getCurrentUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Get Agents Error:', error);
        return { success: false, error: error.message };
    }
};

export const updateAgentStatus = async (agentId, status) => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .update({ status: status })
            .eq('id', agentId)
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error('Update Agent Status Error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

// ==================== CONTRACTS ====================

export const saveContract = async (agentId, businessRules) => {
    try {
        const { data, error } = await supabase
            .from('contracts')
            .insert([
                {
                    agent_id: agentId,
                    business_rules: businessRules,
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error('Save Contract Error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

export const getContract = async (agentId) => {
    try {
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error('Get Contract Error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

// ==================== TASKS ====================

export const createTask = async (taskData) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .insert([
                {
                    agent_id: taskData.agentId,
                    task_type: taskData.taskType,
                    task_data: taskData.taskData,
                }
            ])
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error('Create Task Error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

export const getTasks = async (agentId, limit = 50) => {
    try {
        let query = supabase
            .from('tasks')
            .select('*')
            .order('completed_at', { ascending: false });

        if (agentId) {
            query = query.eq('agent_id', agentId);
        }

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error('Get Tasks Error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

export const getTaskStats = async (agentId) => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('task_type, completed_at')
            .eq('agent_id', agentId);

        if (error) throw error;

        // Calculate statistics
        const totalTasks = data.length;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tasksToday = data.filter(task => {
            const taskDate = new Date(task.completed_at);
            return taskDate >= today;
        }).length;

        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());

        const tasksThisWeek = data.filter(task => {
            const taskDate = new Date(task.completed_at);
            return taskDate >= thisWeekStart;
        }).length;

        const tasksByType = data.reduce((acc, task) => {
            acc[task.task_type] = (acc[task.task_type] || 0) + 1;
            return acc;
        }, {});

        return {
            success: true,
            data: {
                totalTasks,
                tasksToday,
                tasksThisWeek,
                tasksByType,
            },
        };
    } catch (error) {
        console.error('Get Task Stats Error:', error);
        return {
            success: false,
            error: error.message,
        };
    }
};

// ==================== REAL-TIME UPDATES ====================

export const subscribeToTasks = (agentId, callback) => {
    const channel = supabase
        .channel('tasks-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'tasks',
                filter: agentId ? `agent_id=eq.${agentId}` : undefined,
            },
            (payload) => {
                callback(payload);
            }
        )
        .subscribe();

    return channel;
};


// ==================== CUSTOMERS & BROADCASTS ====================

export const getCustomers = async (entityId = null) => {
    try {
        let query = supabase.from('customers').select('*');
        if (entityId) query = query.eq('entity_id', entityId);
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('getCustomers error:', error);
        return { success: false, error: error.message };
    }
};

export const createBroadcast = async (broadcastData) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('customer_broadcasts')
            .insert([{ ...broadcastData, user_id: user.id }])
            .select()
            .single();
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('createBroadcast error:', error);
        return { success: false, error: error.message };
    }
};

export const sendCustomerMessage = async (params) => {
    try {
        const { data, error } = await supabase.functions.invoke('send-customer-message', {
            body: params
        });
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('sendCustomerMessage error:', error);
        return { success: false, error: error.message };
    }
};

export const unsubscribeFromTasks = (channel) => {
    if (channel) {
        supabase.removeChannel(channel);
    }
};

// ==================== DATABASE SETUP SQL ====================

export const getDatabaseSetupSQL = () => {
    return `
-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  business_rules JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  task_data JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_agent_id ON contracts(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at DESC);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now, customize based on your needs)
CREATE POLICY "Allow all operations on agents" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all operations on contracts" ON contracts FOR ALL USING (true);
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true);
`;
};

// ==================== PROFILES & CREDITS ====================

export const getProfile = async (userId) => {
    try {
        // Try to get all extended fields
        const { data, error } = await supabase
            .from('profiles')
            .select('role, total_credits, credits_used, subscription_tier, message_limit, subscription_plan, business_type, business_name, phone, email, position')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.warn("Extended profile fetch failed, falling back to basic:", error.message);
            // Fallback to minimal fields if some columns are missing
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('id', userId)
                .maybeSingle();

            if (fallbackError) throw fallbackError;
            return { success: true, data: fallbackData };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Profile fetch error:", error);
        return { success: false, error: error.message };
    }
};

export const getWalletBalance = async (userId) => {
    try {
        const { data, error } = await supabase.rpc('get_user_wallet_balance', { p_user_id: userId });

        if (error) throw error;
        return { 
            success: true, 
            balance: data?.balance || 0,
            package_balance: data?.package_balance || 0,
            topup_balance: data?.topup_balance || 0
        };
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        return { success: false, balance: 0, error: error.message };
    }
};

export const checkAndDeductCredit = async (userId, cost = 1) => {
    try {
        // Use wallet_credits system
        const { data: wallet, error: getError } = await supabase
            .from('wallet_credits')
            .select('balance')
            .eq('user_id', userId)
            .maybeSingle();

        if (getError) {
            console.warn('Wallet fetch error:', getError);
            // Don't block chat on a read error, but don't deduct either
            return { success: true, remaining: 100, isLow: false };
        }

        let currentBalance = wallet?.balance !== undefined ? wallet.balance : 50; // Default to 50 for legacy users

        if (currentBalance < cost && wallet !== null) {
            return {
                success: false,
                error: 'لقد انتهى رصيد الموظف الرقمي. يرجى المتابعة لترقية باقتك.',
                errorCode: 'OUT_OF_CREDITS'
            };
        }

        const newBalance = currentBalance - cost;

        if (wallet) {
            // Only update if wallet exists
            const { error: updateError } = await supabase
                .from('wallet_credits')
                .update({ balance: newBalance })
                .eq('user_id', userId);

            if (updateError) console.warn('Credit deduction update error (RLS?):', updateError);
        } else {
            // Attempt to create wallet safely, suppress RLS failures
            const { error: insertError } = await supabase
                .from('wallet_credits')
                .insert([{ user_id: userId, balance: newBalance }]);

            if (insertError) console.warn('Credit wallet insert error (RLS?):', insertError);
        }

        return {
            success: true,
            remaining: newBalance,
            isLow: newBalance <= 5
        };
    } catch (error) {
        console.error('Credit Check Error:', error);
        return { success: false, error: error.message };
    }
};

// ==================== CUSTOM REQUESTS ====================

export const submitCustomRequest = async (requestData) => {
    // DIAGNOSTIC LOGGING - Check this in your browser console!
    console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("Using Anon Key (First 10 chars):", import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10));

    try {
        const { error } = await supabase
            .from('custom_requests')
            .insert([requestData]);

        if (error) throw error;

        // Trigger an admin notification
        try {
            await supabase.from('platform_notifications').insert([{
                title: 'طلب موظف مخصص جديد ⚡',
                message: `طلب جديد من ${requestData.contact_name} لقطاع ${requestData.business_type}`,
                type: 'custom_request',
                is_read: false
            }]);
        } catch (notifErr) {
            console.warn('Failed to create notification:', notifErr.message);
        }

        return { success: true };
    } catch (error) {
        console.error('Submit Custom Request Error:', error);
        return { success: false, error: error.message };
    }
};

// ==================== ENTITY SETUP & N8N INTEGRATION ====================

export const saveEntityConfig = async (config) => {
    try {
        console.log("SupabaseService: Preparing save for entity config:", config.id ? `UPDATE ${config.id}` : 'INSERT NEW');

        let query;
        if (config.id) {
            const { id, ...updateData } = config;
            query = supabase
                .from('entities')
                .update(updateData)
                .eq('id', id);
        } else {
            const { id, ...insertData } = config;
            query = supabase
                .from('entities')
                .insert([insertData]);
        }

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database operation timed out (30s). Check network or RLS.')), 30000)
        );

        const executeQuery = async () => {
            const { data, error } = await query.select().maybeSingle();
            if (error) throw error;
            if (!data) throw new Error('No rows affected. Please check your permissions (RLS) or if the record exists.');
            return data;
        };

        const data = await Promise.race([executeQuery(), timeoutPromise]);

        console.log("SupabaseService: Save successful ✅", data.id);
        return { success: true, data };
    } catch (error) {
        console.error('Save Entity Config Exception:', error);
        return { success: false, error: error.message || 'Database connection error' };
    }
};

export const getUserEntities = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('entities')
            .select('*')
            .eq('user_id', userId);
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('getUserEntities error:', error);
        return { success: false, error: error.message, data: [] };
    }
};

export const activateEntityAgent = async (entityId, calendarToken) => {
    try {
        // 1. Update status in DB
        const { error } = await supabase
            .from('entities')
            .update({
                is_active: true,
                google_calendar_token: calendarToken
            })
            .eq('id', entityId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Activation Error:', error);
        return { success: false, error: error.message };
    }
};

// ==================== SERVICES MANAGEMENT ====================

export const getServices = async (entityId) => {
    try {
        const { data, error } = await supabase
            .from('entity_services')
            .select('*')
            .eq('entity_id', entityId)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Get Services Error:', error);
        return { success: false, error: error.message };
    }
};

export const addService = async (serviceData) => {
    try {
        const { data, error } = await supabase
            .from('entity_services')
            .insert([serviceData])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Add Service Error:', error);
        return { success: false, error: error.message };
    }
};

export const updateService = async (serviceId, updates) => {
    try {
        const { data, error } = await supabase
            .from('entity_services')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', serviceId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Update Service Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Specifically for the AI Manager to update prices
 */
export const updateServicePrice = async (entityId, serviceName, newPrice) => {
    try {
        const priceValue = parseFloat(newPrice);
        if (isNaN(priceValue)) throw new Error('Invalid price format');

        const { data, error } = await supabase
            .from('entity_services')
            .update({ price: priceValue, updated_at: new Date().toISOString() })
            .eq('entity_id', entityId)
            .ilike('service_name', `%${serviceName}%`) // Flexible naming
            .select();

        if (error) throw error;
        if (!data || data.length === 0) throw new Error(`Service "${serviceName}" not found.`);

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Update Service Price Error:', error);
        return { success: false, error: error.message };
    }
};

export const deleteService = async (serviceId) => {
    try {
        // Soft delete by setting is_active to false
        const { error } = await supabase
            .from('entity_services')
            .update({ is_active: false })
            .eq('id', serviceId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Delete Service Error:', error);
        return { success: false, error: error.message };
    }
};

// ==================== CUSTOMERS MANAGEMENT ====================

export const upsertCustomer = async (customerData) => {
    try {
        const { data, error } = await supabase
            .from('customers')
            .upsert(customerData)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Upsert Customer Error:', error);
        return { success: false, error: error.message };
    }
};

export const searchCustomerByIdentity = async (entityId, platform, identityValue) => {
    try {
        let query = supabase
            .from('customers')
            .select('*')
            .eq('entity_id', entityId);

        if (platform === 'phone') {
            query = query.eq('customer_phone', identityValue);
        } else if (platform === 'instagram') {
            query = query.eq('instagram_id', identityValue);
        } else if (platform === 'telegram') {
            query = query.eq('telegram_id', identityValue);
        }

        const { data, error } = await query.maybeSingle();
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Search Customer Error:', error);
        return { success: false, error: error.message };
    }
};

// ==================== BOOKINGS MANAGEMENT ====================

export const getBookings = async (entityId, filters = {}) => {
    try {
        let query = supabase
            .from('bookings')
            .select(`
                *,
                service:entity_services(service_name, price, duration_minutes)
            `)
            .eq('entity_id', entityId)
            .order('booking_date', { ascending: true })
            .order('booking_time', { ascending: true });

        // Apply filters
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.date) {
            query = query.eq('booking_date', filters.date);
        }
        if (filters.phone) {
            query = query.ilike('customer_phone', `%${filters.phone}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Get Bookings Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Reporting for Manager/Boss
 */
export const getTodayBookings = async (entityId) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('bookings')
            .select('customer_name, customer_phone, booking_time, status, service_requested')
            .eq('entity_id', entityId)
            .eq('booking_date', todayStr)
            .order('booking_time', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Get Today Bookings Error:', error);
        return { success: false, error: error.message };
    }
};

export const getAvailableSlots = async (entityId, date) => {
    try {
        // Get all bookings for the specified date
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('booking_time, duration_minutes')
            .eq('entity_id', entityId)
            .eq('booking_date', date)
            .in('status', ['pending', 'confirmed']);

        if (error) throw error;

        // Get entity working hours
        const { data: entityConfig } = await supabase
            .from('entities')
            .select('working_hours')
            .eq('id', entityId)
            .single();

        // Generate available slots
        const workingHours = entityConfig?.working_hours || { start: '10:00', end: '22:00' };
        const bookedSlots = bookings.map(b => b.booking_time);

        return { success: true, data: { workingHours, bookedSlots } };
    } catch (error) {
        console.error('Get Available Slots Error:', error);
        return { success: false, error: error.message };
    }
};

export const createBooking = async (bookingData) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select(`
                *,
                service:entity_services(service_name, price)
            `)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Create Booking Error:', error);
        return { success: false, error: error.message };
    }
};

export const updateBooking = async (bookingId, updates) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', bookingId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Update Booking Error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Enhanced booking update for AI tool (can handle sending confirmation logic later)
 */
export const updateBookingDetails = async (bookingId, details) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .update({
                ...details,
                updated_at: new Date().toISOString()
            })
            .eq('id', bookingId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Update Booking Details Error:', error);
        return { success: false, error: error.message };
    }
};

export const cancelBooking = async (bookingId) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', bookingId)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Cancel Booking Error:', error);
        return { success: false, error: error.message };
    }
};

// ==================== CLIENT NOTIFICATIONS ====================

export const getClientNotifications = async (userId, isAgency = false) => {
    try {
        let query = supabase
            .from('client_notifications')
            .select('*');

        if (isAgency) {
            // If agency, get all notifications for their clients
            query = query.eq('agency_id', userId);
        } else {
            // Normal client view
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('getClientNotifications error:', error);
        return { success: false, error: error.message };
    }
};

export const markClientNotificationRead = async (id) => {
    try {
        const { error } = await supabase
            .from('client_notifications')
            .update({ is_read: true })
            .eq('id', id);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('markClientNotificationRead error:', error);
        return { success: false, error: error.message };
    }
};

export const subscribeToClientNotifications = (userId, isAgency = false, callback) => {
    const filter = isAgency ? `agency_id=eq.${userId}` : `user_id=eq.${userId}`;
    
    return supabase
        .channel(`client_notifications_${userId}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'client_notifications',
            filter: filter 
        }, callback)
        .subscribe();
};
export const getUserAgentCount = async (userId) => {
    try {
        const { count, error } = await supabase
            .from('agents')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'active');
        
        if (error) throw error;
        return { success: true, count: count || 0 };
    } catch (error) {
        console.error('getUserAgentCount error:', error);
        return { success: false, error: error.message };
    }
};

// ==================== UNIFIED BILLING & CREDITS ====================

/**
 * Deducts credits from user wallet using the unified RPC.
 * This handles balance checking and ledger logging in one transaction.
 */
export const deductCredits = async (userId, amount, reason, platform = null, metadata = {}) => {
    try {
        const { data, error } = await supabase.rpc('deduct_wallet_credits', {
            p_user_id: userId,
            p_amount: amount,
            p_reason: reason,
            p_platform: platform,
            p_metadata: metadata
        });

        if (error) throw error;
        return data; // returns { success: boolean, remaining_balance: number, error?: string }
    } catch (error) {
        console.error('deductCredits service error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Fetches the current billing rates from platform settings.
 */
export const getBillingRates = async () => {
    try {
        const { data, error } = await supabase
            .from('platform_settings')
            .select('value')
            .eq('key', 'billing_rates')
            .maybeSingle();

        if (error) throw error;
        return { success: true, data: data?.value };
    } catch (error) {
        console.error('getBillingRates service error:', error);
        return { success: false, error: error.message };
    }
};

// ==================== STORAGE & ASSETS ====================

/**
 * Uploads an agency logo to the 'agency_branding' bucket.
 * Returns the public URL on success.
 */
export const uploadAgencyLogo = async (userId, file) => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/logo_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        // 1. Upload file
        const { error: uploadError } = await supabase.storage
            .from('agency_branding')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 2. Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('agency_branding')
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error('uploadAgencyLogo error:', error);
        return { success: false, error: error.message };
    }
};

// ==================== WHITE LABEL REQUESTS ====================

export const getWhiteLabelRequest = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('white_label_requests')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('getWhiteLabelRequest error:', error);
        return { success: false, error: error.message };
    }
};

export const submitWhiteLabelRequest = async (userId, requestData) => {
    try {
        // Check if one already exists
        const { data: existing } = await supabase
            .from('white_label_requests')
            .select('id, status')
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            // Update only if pending or rejected
            if (existing.status === 'approved') throw new Error("Request already approved");
            const { data, error } = await supabase
                .from('white_label_requests')
                .update({
                    ...requestData,
                    status: 'pending',
                    updated_at: new Date()
                })
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } else {
            const { data, error } = await supabase
                .from('white_label_requests')
                .insert([{
                    user_id: userId,
                    ...requestData,
                    status: 'pending'
                }])
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        }
    } catch (error) {
        console.error('submitWhiteLabelRequest error:', error);
        return { success: false, error: error.message };
    }
};
