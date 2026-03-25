import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import { useLanguage } from '../LanguageContext';
import { 
    Calendar, User, Clock, ChevronLeft, ChevronRight, 
    Share2, Facebook, Twitter, Link as LinkIcon,
    ArrowRight, MessageSquare, Briefcase, Zap, MessageCircle
} from 'lucide-react';
import NewsletterSignup from './NewsletterSignup';

const BlogPost = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { isEnglish, t } = useLanguage();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bannerSettings, setBannerSettings] = useState(null);
    const [recentPosts, setRecentPosts] = useState([]);

    useEffect(() => {
        fetchPost();
        fetchSettings();
        fetchRecentPosts();
    }, [slug]);

    const fetchRecentPosts = async () => {
        const { data } = await supabase
            .from('blog_posts')
            .select('id, title_en, title_ar, slug, featured_image, created_at')
            .eq('status', 'published')
            .neq('slug', slug)
            .order('created_at', { ascending: false })
            .limit(3);
        if (data) setRecentPosts(data);
    };

    const fetchSettings = async () => {
        const { data } = await supabase.from('blog_settings').select('*').eq('id', 1).single();
        if (data && data.is_active) setBannerSettings(data);
    };

    const fetchPost = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .eq('status', 'published')
            .single();
        
        if (error || !data) {
            setError('Post not found');
        } else {
            setPost(data);
            // Dynamic Meta Tags (Simplified)
            document.title = (isEnglish ? data.title_en : data.title_ar) + " | 24Shift Blog";
        }
        setLoading(false);
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070B14' }}>
            <div style={{ color: 'white', fontSize: '1.2rem' }} className="animate-pulse">Loading Article...</div>
        </div>
    );

    if (error || !post) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#070B14', color: 'white', padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{isEnglish ? 'Post Not Found' : 'المقال غير موجود'}</h1>
            <Link to="/blog" style={{ color: '#A78BFA', fontWeight: 700, textDecoration: 'none' }}>{isEnglish ? '← Back to Blog' : '← العودة للمدونة'}</Link>
        </div>
    );

    const title = isEnglish ? post.title_en : post.title_ar;
    const content = isEnglish ? post.content_en : post.content_ar;
    const excerpt = isEnglish ? post.excerpt_en : post.excerpt_ar;

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert(isEnglish ? 'Link copied!' : 'تم نسخ الرابط!');
    };

    return (
        <div style={{ minHeight: '100vh', background: '#070B14', color: 'white', direction: isEnglish ? 'ltr' : 'rtl' }}>
             {/* 1. TOP AD SLOT */}
             {post.ad_slots?.top && bannerSettings?.top_is_active && (
                <div style={{ padding: '2rem 1rem 0', maxWidth: '1200px', margin: '0 auto' }}>
                    <Link to={bannerSettings.top_banner_link || "/salon-setup"} style={{ textDecoration: 'none' }}>
                        <div style={{ background: 'linear-gradient(135deg, #1E1B4B, #312E81)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '300px' }}>
                                <div style={{ color: '#A78BFA', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                                    {isEnglish ? 'Special Offer' : 'عرض خاص'}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', margin: '0 0 0.5rem' }}>
                                    {isEnglish ? bannerSettings.top_banner_text_en : bannerSettings.top_banner_text_ar}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#9CA3AF', margin: 0 }}>
                                    {isEnglish ? bannerSettings.top_banner_subtext_en : bannerSettings.top_banner_subtext_ar}
                                </p>
                            </div>
                            <div style={{ background: 'white', color: '#1E1B4B', padding: '10px 20px', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isEnglish ? 'Get Started' : 'ابدأ الآن'} <Zap size={16} fill="#1E1B4B" />
                            </div>
                        </div>
                    </Link>
                </div>
            )}

            {/* Banner Section */}
            <div style={{ padding: '3rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
                <Link to="/blog" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    {isEnglish ? <ChevronLeft size={16} /> : <ChevronRight size={16} />} 
                    {isEnglish ? 'Back to Blog' : 'العودة للمدونة'}
                </Link>

                <div style={{ color: '#8B5CF6', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {t(`sectors.${post.category.toLowerCase().replace(' ', '_')}`) || post.category}
                </div>
                <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '2rem', lineHeight: '1.2' }}>{title}</h1>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', color: '#9CA3AF', fontSize: '0.9rem', marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> {new Date(post.published_at || post.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'ar-SA')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={16} /> 24Shift Expert</div>
                </div>

                {post.featured_image && (
                    <img 
                        src={post.featured_image} 
                        alt={title} 
                        style={{ width: '100%', borderRadius: '24px', marginBottom: '3rem', border: '1px solid rgba(255,255,255,0.05)' }} 
                    />
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '3rem' }}>
                    
                    {/* Main Content */}
                    <div className="blog-content">
                        <div 
                            style={{ 
                                fontSize: '1.15rem', 
                                lineHeight: '1.8', 
                                color: '#D4D4D8',
                                whiteSpace: 'pre-wrap' // For simple text, though usually we want HTML
                            }}
                            dangerouslySetInnerHTML={{ __html: content }}
                        />

                        {/* Social Share */}
                        <div style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem' }}>{isEnglish ? 'Share Article:' : 'شارك المقال:'}</span>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={copyLink} style={{ background: '#1F2937', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LinkIcon size={18} /></button>
                                <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${window.location.href}&text=${title}`)} style={{ background: '#1F2937', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Twitter size={18} /></button>
                                <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`)} style={{ background: '#1F2937', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Facebook size={18} /></button>
                                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + window.location.href)}`)} style={{ background: '#1F2937', color: '#25D366', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageCircle size={18} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar CTA & ADS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        
                        {/* 2. SIDEBAR AD SLOT */}
                        {post.ad_slots?.sidebar && bannerSettings?.sidebar_is_active && (
                            <Link to={bannerSettings.sidebar_banner_link || "/salon-setup"} style={{ textDecoration: 'none' }}>
                                <div style={{ background: 'linear-gradient(135deg, #4C1D95, #1E1B4B)', borderRadius: '24px', padding: '1.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Zap size={32} color="#F59E0B" style={{ marginBottom: '1rem' }} />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.75rem', lineHeight: '1.3', color: 'white' }}>
                                        {isEnglish ? bannerSettings.sidebar_banner_text_en : bannerSettings.sidebar_banner_text_ar}
                                    </h3>
                                    <p style={{ fontSize: '0.85rem', color: '#D1D5DB', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                        {isEnglish ? bannerSettings.sidebar_banner_subtext_en : bannerSettings.sidebar_banner_subtext_ar}
                                    </p>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '8px', 
                                        width: '100%', 
                                        padding: '12px', 
                                        background: 'white', 
                                        color: '#4C1D95', 
                                        borderRadius: '10px', 
                                        fontWeight: 800, 
                                        fontSize: '0.9rem' 
                                    }}>
                                        {isEnglish ? 'Get Started' : 'ابدأ الآن'} <ArrowRight size={16} />
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* Recent Articles Sidebar Widget */}
                        {recentPosts.length > 0 && (
                            <div style={{ background: '#111827', borderRadius: '24px', padding: '1.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem' }}>
                                    {isEnglish ? 'Recent Articles' : 'أحدث المقالات'}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    {recentPosts.map(rp => (
                                        <Link key={rp.id} to={`/blog/${rp.slug}`} style={{ textDecoration: 'none', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#0B0F19' }}>
                                                {rp.featured_image && <img src={rp.featured_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', margin: '0 0 4px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {isEnglish ? rp.title_en : rp.title_ar}
                                                </h4>
                                                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                                                    {new Date(rp.created_at).toLocaleDateString(isEnglish ? 'en-US' : 'ar-SA')}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                         {/* Categories Sidebar Widget */}
                         <div style={{ background: '#111827', borderRadius: '24px', padding: '1.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem' }}>
                                {isEnglish ? 'Explore Topics' : 'استكشف المواضيع'}
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {[
                                    'telecom_it', 
                                    'medical', 
                                    'real_estate', 
                                    'beauty', 
                                    'restaurant', 
                                    'fitness', 
                                    'retail_ecommerce', 
                                    'banking', 
                                    'call_center', 
                                    'general'
                                ].map(cat => (
                                    <Link 
                                        key={cat} 
                                        to={`/blog?category=${cat}`} 
                                        style={{ 
                                            padding: '6px 12px', 
                                            background: 'rgba(139, 92, 246, 0.1)', 
                                            color: '#A78BFA', 
                                            borderRadius: '20px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 700, 
                                            textDecoration: 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {t(`sectors.${cat.toLowerCase().replace(' ', '_')}`) || cat}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Newsletter Sidebar */}
                        <NewsletterSignup source="blog_post" />

                         <div style={{ background: '#111827', borderRadius: '24px', padding: '1.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
                                {isEnglish ? 'Need Help?' : 'تحتاج مساعدة؟'}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#9CA3AF' }}>
                                    <MessageSquare size={16} />
                                    <span>{isEnglish ? '24/7 Live Support' : 'دعم مباشر 24/7'}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#9CA3AF' }}>
                                    <Briefcase size={16} />
                                    <span>{isEnglish ? 'Expert Consultation' : 'استشارة خبراء'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. FOOTER AD SLOT (CONTENT) */}
            {post.ad_slots?.content && bannerSettings?.content_is_active && (
                <div style={{ padding: '0 1rem 4rem', maxWidth: '800px', margin: '0 auto' }}>
                    <Link to={bannerSettings.content_banner_link || "/salon-setup"} style={{ textDecoration: 'none' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '2rem', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '0.5rem' }}>
                                {isEnglish ? bannerSettings.content_banner_text_en : bannerSettings.content_banner_text_ar}
                            </h3>
                            <p style={{ color: '#9CA3AF', marginBottom: '1.5rem' }}>
                                {isEnglish ? bannerSettings.content_banner_subtext_en : bannerSettings.content_banner_subtext_ar}
                            </p>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#8B5CF6', color: 'white', padding: '10px 25px', borderRadius: '10px', fontWeight: 800 }}>
                                {isEnglish ? 'Explore Now' : 'استكشف الآن'} <ArrowRight size={18} />
                            </div>
                        </div>
                    </Link>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{ __html: `
                .blog-content h2 { font-size: 2rem; font-weight: 800; margin: 2.5rem 0 1.5rem; color: white; }
                .blog-content p { margin-bottom: 1.5rem; }
                .blog-content ul, .blog-content ol { margin-bottom: 2rem; padding-left: 1.5rem; padding-right: 1.5rem; }
                .blog-content li { margin-bottom: 0.75rem; }
                .blog-content strong { color: #A78BFA; }
                .blog-content blockquote { border-left: 4px solid #8B5CF6; padding-left: 1.5rem; margin: 2rem 0; font-style: italic; color: #9CA3AF; }
            `}} />
        </div>
    );
};

export default BlogPost;
