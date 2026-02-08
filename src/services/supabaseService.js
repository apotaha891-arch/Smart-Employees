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
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const checkAndDeductCredit = async (userId) => {
    try {
        const { data: profile, error: getError } = await supabase
            .from('profiles')
            .select('subscription_tier, total_credits, credits_used')
            .eq('id', userId)
            .single();

        if (getError) throw getError;

        // Enterprise has unlimited credits
        if (profile.subscription_tier === 'enterprise') {
            return { success: true, remaining: Infinity };
        }

        const remaining = (profile.total_credits || 0) - (profile.credits_used || 0);

        if (remaining <= 0) {
            return {
                success: false,
                error: 'لقد انتهى رصيد الموظف الرقمي. يرجى تجديد العقد لمواصلة العمل.',
                errorCode: 'OUT_OF_CREDITS'
            };
        }

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ credits_used: (profile.credits_used || 0) + 1 })
            .eq('id', userId);

        if (updateError) throw updateError;

        return {
            success: true,
            remaining: remaining - 1,
            isLow: (remaining - 1) <= 5
        };
    } catch (error) {
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
