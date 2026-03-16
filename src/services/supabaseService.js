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

export const signUp = async (email, password, fullName) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
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
                redirectTo: `${window.location.origin}/dashboard`,
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
                redirectTo: `${window.location.origin}/dashboard`,
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
        // Add a timeout to prevent indefinite hanging
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Password update timed out (30s). Check your connection.')), 30000)
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
        // Fetch salon_config_id to link it properly
        const { data: salonConfigs } = await supabase
            .from('salon_configs')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        const salonConfigId = salonConfigs?.[0]?.id || null;

        // Check if an integration already exists
        const { data: existing } = await supabase
            .from('integrations')
            .select('id')
            .eq('user_id', userId)
            .eq('provider', provider)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase.from('integrations').update({
                salon_config_id: salonConfigId,
                credentials: credentials,
                status: 'connected',
                updated_at: new Date().toISOString()
            }).eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from('integrations').insert({
                user_id: userId,
                salon_config_id: salonConfigId,
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
            .from('platform_settings')
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
            .from('agents')
            .insert([
                {
                    name: agentData.name || 'AI Agent',
                    specialty: agentData.specialty || 'General',
                    avatar: agentData.avatar || '👩',
                    business_type: agentData.business_type || null,
                    platform: agentData.platform || (agentData.metadata?.platforms ? agentData.metadata.platforms.join(',') : null),
                    status: 'active',
                    user_id: user.id
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
        console.error('Create Agent Error:', error);
        return {
            success: false,
            error: error.message,
        };
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return {
            success: true,
            data: data,
        };
    } catch (error) {
        console.error('Get Agents Error:', error);
        return {
            success: false,
            error: error.message,
        };
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
        const { data, error } = await supabase
            .from('wallet_credits')
            .select('balance')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        return { success: true, balance: data?.balance || 0 };
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
    try {
        const { data, error } = await supabase
            .from('custom_requests')
            .insert([requestData])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ==================== SALON SETUP & N8N INTEGRATION ====================

export const saveSalonConfig = async (config) => {
    try {
        console.log("SupabaseService: Saving config:", config.id ? `UPDATE ${config.id}` : 'INSERT NEW');
        
        let query;
        if (config.id) {
            // Separate ID from data to avoid updating PK
            const { id, ...updateData } = config;
            console.log(`SupabaseService: Updating config ${id}`);
            query = supabase
                .from('salon_configs')
                .update(updateData)
                .eq('id', id);
        } else {
            // Explicit INSERT
            query = supabase
                .from('salon_configs')
                .insert([config]);
        }

        // Add a timeout to prevent indefinite hanging
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database operation timed out (30s). Check network or RLS.')), 30000)
        );

        const executeQuery = async () => {
            const { data, error } = await query.select().maybeSingle();
            if (error) throw error;
            return data;
        };

        const data = await Promise.race([executeQuery(), timeoutPromise]);
        
        console.log("SupabaseService: Save successful ✅");
        return { success: true, data };
    } catch (error) {
        console.error('Save Salon Config Exception:', error);
        return { success: false, error: error.message || 'Database connection error' };
    }
};

export const activateSalonAgent = async (salonId, calendarToken) => {
    try {
        // 1. Update status in DB
        const { error } = await supabase
            .from('salon_configs')
            .update({
                is_active: true,
                google_calendar_token: calendarToken
            })
            .eq('id', salonId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Activation Error:', error);
        return { success: false, error: error.message };
    }
};

// ==================== SERVICES MANAGEMENT ====================

export const getServices = async (salonConfigId) => {
    try {
        const { data, error } = await supabase
            .from('salon_services')
            .select('*')
            .eq('salon_config_id', salonConfigId)
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
            .from('salon_services')
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
            .from('salon_services')
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

export const deleteService = async (serviceId) => {
    try {
        // Soft delete by setting is_active to false
        const { error } = await supabase
            .from('salon_services')
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

export const getCustomers = async (salonConfigId) => {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('salon_config_id', salonConfigId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Get Customers Error:', error);
        return { success: false, error: error.message };
    }
};

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

export const searchCustomerByIdentity = async (salonConfigId, platform, identityValue) => {
    try {
        let query = supabase
            .from('customers')
            .select('*')
            .eq('salon_config_id', salonConfigId);

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

export const getBookings = async (salonConfigId, filters = {}) => {
    try {
        let query = supabase
            .from('bookings')
            .select(`
                *,
                service:salon_services(service_name, price, duration_minutes)
            `)
            .eq('salon_config_id', salonConfigId)
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

export const getAvailableSlots = async (salonConfigId, date) => {
    try {
        // Get all bookings for the specified date
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('booking_time, duration_minutes')
            .eq('salon_config_id', salonConfigId)
            .eq('booking_date', date)
            .in('status', ['pending', 'confirmed']);

        if (error) throw error;

        // Get salon working hours
        const { data: salonConfig } = await supabase
            .from('salon_configs')
            .select('working_hours')
            .eq('id', salonConfigId)
            .single();

        // Generate available slots
        const workingHours = salonConfig?.working_hours || { start: '10:00', end: '22:00' };
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
                service:salon_services(service_name, price)
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
