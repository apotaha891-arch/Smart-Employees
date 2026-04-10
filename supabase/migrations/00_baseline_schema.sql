-- ============================================================
-- 00 Baseline Schema: Core Tables Initialization
-- ============================================================

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Auth Linked)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    subscription_tier TEXT DEFAULT 'basic',
    subscription_plan TEXT DEFAULT 'free_tier',
    subscription_period_end TIMESTAMPTZ,
    custom_domain TEXT UNIQUE,
    is_white_label_paid BOOLEAN DEFAULT false,
    white_label_sub_id TEXT,
    is_agency BOOLEAN DEFAULT false,
    agency_id UUID REFERENCES public.profiles(id),
    white_label_config JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Salon Configs (Core Entity)
CREATE TABLE IF NOT EXISTS public.salon_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT,
    business_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for salon_configs
ALTER TABLE public.salon_configs ENABLE ROW LEVEL SECURITY;

-- 4. Salon Services (Missing in Migrations)
CREATE TABLE IF NOT EXISTS public.salon_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    salon_config_id UUID REFERENCES public.salon_configs(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for salon_services
ALTER TABLE public.salon_services ENABLE ROW LEVEL SECURITY;

-- 5. Bookings Table (Missing in Migrations)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    salon_config_id UUID REFERENCES public.salon_configs(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.salon_services(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_notes TEXT,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT DEFAULT 'whatsapp_bot',
    CONSTRAINT unique_booking UNIQUE (salon_config_id, booking_date, booking_time)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_salon_date ON public.bookings(salon_config_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Enable RLS for bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 6. Agents Table (The missing piece)
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    salon_config_id UUID REFERENCES public.salon_configs(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    business_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage their own salon_configs" ON public.salon_configs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own salon_services" ON public.salon_services FOR ALL USING (
    salon_config_id IN (SELECT id FROM public.salon_configs WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage their own bookings" ON public.bookings FOR ALL USING (
    salon_config_id IN (SELECT id FROM public.salon_configs WHERE user_id = auth.uid())
);
CREATE POLICY "Allow public booking creation" ON public.bookings FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their own agents" ON public.agents FOR ALL USING (
    salon_config_id IN (SELECT id FROM public.salon_configs WHERE user_id = auth.uid())
);
