-- Migration: 16_blog_system.sql
-- Description: Create blog_posts table with multi-language support and RLS

CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title_en TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    content_en TEXT,
    content_ar TEXT,
    excerpt_en TEXT,
    excerpt_ar TEXT,
    featured_image TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
    category TEXT,
    meta_keywords TEXT[],
    author_id UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    published_at TIMESTAMPTZ,
    
    -- Advertising slots (optional metadata)
    ad_slots JSONB DEFAULT '{"top": true, "sidebar": true, "content": true}'::jsonb
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Public can view published posts
CREATE POLICY "Public can view published posts" ON public.blog_posts
    FOR SELECT
    USING (status = 'published');

-- 2. Admins can do anything
CREATE POLICY "Admins have full access to blog_posts" ON public.blog_posts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Function to set published_at when status changes to 'published'
CREATE OR REPLACE FUNCTION set_published_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status = 'draft') THEN
        NEW.published_at = now();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_blog_posts_published_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE PROCEDURE set_published_at_column();
