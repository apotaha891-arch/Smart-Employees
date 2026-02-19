import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// ==================== AGENTS ====================

export const createAgent = async (agentData) => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .insert([
                {
                    name: agentData.name || 'AI Agent',
                    specialty: agentData.specialty || 'General',
                    status: 'active',
                    cost_per_request: agentData.costPerMessage || 1, // Store the cost
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

export const getAgents = async () => {
    try {
        const { data, error } = await supabase
            .from('agents')
            .select('*')
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
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(); // Use maybeSingle to avoid 406 error on missing row

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const checkAndDeductCredit = async (userId, cost = 1) => {
    try {
        // 1. Try to get existing profile
        const { data: profile, error: getError } = await supabase
            .from('profiles')
            .select('subscription_tier, total_credits, credits_used')
            .eq('id', userId)
            .maybeSingle();

        if (getError) throw getError;

        let activeProfile = profile;

        // 2. If no profile exists, create a default one
        if (!profile) {
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([{
                    id: userId,
                    subscription_tier: 'trial',
                    total_credits: 50,
                    credits_used: 0
                }])
                .select()
                .single();

            if (createError) throw createError;
            activeProfile = newProfile;
        }

        // 3. Enterprise has unlimited credits
        if (activeProfile.subscription_tier === 'enterprise') {
            return { success: true, remaining: Infinity };
        }

        const remaining = (activeProfile.total_credits || 0) - (activeProfile.credits_used || 0);

        if (remaining < cost) {
            return {
                success: false,
                error: 'لقد انتهى رصيد الموظف الرقمي. يرجى تجديد العقد لمواصلة العمل.',
                errorCode: 'OUT_OF_CREDITS'
            };
        }

        // 4. Deduct credit
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ credits_used: (activeProfile.credits_used || 0) + cost })
            .eq('id', userId);

        return {
            success: true,
            remaining: remaining - cost,
            isLow: (remaining - cost) <= 5
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
        const { data, error } = await supabase
            .from('salon_configs')
            .upsert([config])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Save Salon Config Error:', error);
        return { success: false, error: error.message };
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

        // 2. Trigger n8n Webhook
        const N8N_WEBHOOK_URL = 'https://primary-production-4375.up.railway.app/webhook/activate-salon';

        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                salon_id: salonId,
                google_calendar_token: calendarToken
            })
        });

        if (!response.ok) {
            throw new Error(`n8n Trigger Failed: ${response.statusText}`);
        }

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
