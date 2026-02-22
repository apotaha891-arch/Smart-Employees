-- Create the integrations table
CREATE TABLE public.integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- e.g., 'google_calendar', 'whatsapp', 'n8n'
    credentials JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g., { "access_token": "...", "refresh_token": "...", "api_key": "..." }
    status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own integrations"
    ON public.integrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
    ON public.integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
    ON public.integrations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
    ON public.integrations FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER handle_integrations_updated_at
    BEFORE UPDATE ON public.integrations
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Add index on user_id for faster lookups
CREATE INDEX idx_integrations_user_id ON public.integrations(user_id);
