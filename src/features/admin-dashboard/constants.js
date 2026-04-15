import { 
    Mail, MessageSquare, Bell, Zap, Globe, Bot, Users, Calendar 
} from 'lucide-react';

export const ICON_MAP = { Mail, MessageSquare, Bell, Zap, Globe, Bot, Users, Calendar };

export const DEFAULT_SECTORS = {
    telecom_it: { l: 'اتصالات وتقنية', e: '📡', c: '#EF4444', on: true },
    banking: { l: 'بنوك ومالية', e: '🏦', c: '#8B5CF6', on: true },
    retail_ecommerce: { l: 'تجزئة ومتاجر', e: '🛍', c: '#10B981', on: true },
    call_center: { l: 'خدمات العملاء', e: '🎧', c: '#06B6D4', on: true },
    medical: { l: 'طبي وصحي', e: '🩺', c: '#3B82F6', on: true },
    beauty: { l: 'تجميل وعناية', e: '🌸', c: '#EC4899', on: true },
    restaurant: { l: 'مطاعم وضيافة', e: '🍽', c: '#F59E0B', on: true },
    real_estate: { l: 'عقارات', e: '🏠', c: '#D946EF', on: true },
    general: { l: 'عام', e: '🏢', c: '#6B7280', on: true }
};

export const DEFAULT_ROLES = {
    booking: { l: 'منسقة حجوزات', c: '#8B5CF6' },
    support: { l: 'خدمة عملاء', c: '#10B981' },
    sales: { l: 'مبيعات', c: '#F59E0B' },
    hr: { l: 'موارد بشرية', c: '#3B82F6' },
    email: { l: 'منسق بريد', c: '#EC4899' },
    followup: { l: 'متابعة', c: '#06B6D4' }
};

export const DEFAULT_AGENT_APPS = [
    { id: 'email_notify', icon: 'Mail', label: 'إشعار بريد إلكتروني', desc: 'تنبيه للمدير عند الحجوزات أو المحادثات الجديدة' },
    { id: 'sms_notify', icon: 'MessageSquare', label: 'إشعار SMS', desc: 'رسالة نصية للعميل بتأكيد حجزه' },
    { id: 'reminder', icon: 'Bell', label: 'تذكير قبل الموعد', desc: 'تذكير آلي قبل الموعد بساعة' },
    { id: 'followup', icon: 'Zap', label: 'متابعة بعد الخدمة', desc: 'رسالة متابعة بعد 24 ساعة من الموعد' },
];

export const STATUS_CONFIG = {
    pending: { bg: '#F59E0B20', t: '#F59E0B', l: 'معلق' },
    confirmed: { bg: '#10B98120', t: '#10B981', l: 'مؤكد' },
    completed: { bg: '#3B82F620', t: '#3B82F6', l: 'مكتمل' },
    cancelled: { bg: '#EF444420', t: '#EF4444', l: 'ملغي' }
};

export const DEFAULT_INTERVIEW_AGENTS = [
    { id: 'support-agent',          nameAr: 'عبدالرحمن', nameEn: 'Adam',          gender: 'male',   avatar: '🧑‍💼', tone: 'friendly',     titleAr: 'ممثل خدمة العملاء',  titleEn: 'Customer Support Agent' },
    { id: 'sales-lead-gen',         nameAr: 'أستاذ فهد',  nameEn: 'Mr. James',    gender: 'male',   avatar: '🤵',    tone: 'professional', titleAr: 'أخصائي مبيعات',        titleEn: 'Sales Specialist' },
    { id: 'dental-receptionist',    nameAr: 'د. سارة',   nameEn: 'Dr. Sarah',    gender: 'female', avatar: '👩‍⚕️', tone: 'professional', titleAr: 'موظفة استقبال',        titleEn: 'Receptionist' },
    { id: 'medical-clinic',         nameAr: 'د. هند',    nameEn: 'Dr. Emily',    gender: 'female', avatar: '👩‍⚕️', tone: 'professional', titleAr: 'مستقبِلة عيادة',       titleEn: 'Clinic Receptionist' },
    { id: 'beauty-salon',           nameAr: 'نورة',      nameEn: 'Emma',         gender: 'female', avatar: '💅',    tone: 'luxury',       titleAr: 'منسقة مواعيد',         titleEn: 'Appointment Coordinator' },
    { id: 'real-estate-marketing',  nameAr: 'أستاذ طارق', nameEn: 'Mr. Robert',  gender: 'male',   avatar: '🏢',    tone: 'professional', titleAr: 'مسوّق عقاري',          titleEn: 'Real Estate Marketer' },
    { id: 'restaurant-reservations',nameAr: 'أحمد',      nameEn: 'Alex',         gender: 'male',   avatar: '🍽️',   tone: 'friendly',     titleAr: 'مسؤول حجوزات',         titleEn: 'Reservations Officer' },
    { id: 'gym-coordinator',        nameAr: 'كابتن خالد',nameEn: 'Coach Chris',  gender: 'male',   avatar: '💪',    tone: 'enthusiastic', titleAr: 'منسق اشتراكات',        titleEn: 'Memberships Coordinator' },
];
