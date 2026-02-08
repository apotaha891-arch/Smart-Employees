-- Database migration for Admin Dashboard and Dynamic Templates

-- 1. Table for Agent Templates (Dynamic Roles)
CREATE TABLE IF NOT EXISTS agent_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  specialty TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  base_price DECIMAL(10, 2) DEFAULT 29.00,
  features JSONB, -- Array of services/features
  working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}',
  appointment_duration INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table for Business Inquiries (Leads for marketing)
CREATE TABLE IF NOT EXISTS platform_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT,
  subject TEXT,
  message TEXT,
  ai_response TEXT,
  status TEXT DEFAULT 'new', -- new, responded, archived
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Platform Settings
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Initial Platform Settings for the Super Manager AI
INSERT INTO platform_settings (key, value)
VALUES ('manager_ai_config', '{
  "name": "Elite Manager",
  "role": "مدير المنصة الذكي",
  "knowledge": "منصة Elite Agents متخصصة في توفير موظفين رقميين مدعومين بذكاء اصطناعي (Gemini 3 Flash). الميزة الكبرى هي تقليل التكاليف التشغيلية بنسبة 80% وتغطية العمل 24/7. يمكن توظيف الموظفين عبر ثلاث باقات: Starter ($29), Pro ($79), Enterprise ($199). عملية التوظيف تبدأ بمقابلة تجريبية ثم تدريب الموظف عبر قاعدة المعرفة."
}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Enable RLS
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Simple Admin Check (Assumes a 'role' column in profiles)
-- For now, allowing authenticated users for demo, but in production, we'd check profile.role = 'admin'
CREATE POLICY "Admin access to templates" ON agent_templates FOR ALL USING (true);
CREATE POLICY "Admin access to inquiries" ON platform_inquiries FOR ALL USING (true);
CREATE POLICY "Admin access to settings" ON platform_settings FOR ALL USING (true);
