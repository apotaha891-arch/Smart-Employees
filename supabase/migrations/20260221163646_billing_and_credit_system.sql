-- Create wallet_credits table to store user balances
CREATE TABLE IF NOT EXISTS wallet_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Keep updated_at accurate
CREATE TRIGGER set_updated_at_wallet_credits
BEFORE UPDATE ON wallet_credits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on wallet_credits
ALTER TABLE wallet_credits ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own wallet balance
CREATE POLICY "Users can view their own wallet balance"
ON wallet_credits FOR SELECT
USING (auth.uid() = user_id);


-- Create token_usage_logs table to track AI expenses
CREATE TABLE IF NOT EXISTS token_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    tokens_used INT NOT NULL,
    cost_deducted INT NOT NULL,
    action_type TEXT DEFAULT 'chat_message',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on token_usage_logs
ALTER TABLE token_usage_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own token usage logs
CREATE POLICY "Users can view their own token usage"
ON token_usage_logs FOR SELECT
USING (auth.uid() = user_id);

-- Only admins/service role can insert into logs (handled by Edge Functions)
