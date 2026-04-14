import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { useLanguage } from '../LanguageContext';
import { Search, Calendar, User, ArrowRight, BookOpen, Star, TrendingUp, Tag } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import NewsletterSignup from './NewsletterSignup';

const BlogList = () => {
    const { isEnglish, t } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [bannerSettings, setBannerSettings] = useState(null);

    const category = searchParams.get('category') || 'all';

    useEffect(() => {
        fetchPosts();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const { data } = await supabase.from('blog_settings').select('*').eq('id', 1).single();
        if (data && data.is_active) setBannerSettings(data);
    };

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false });
        
        if (!error) setPosts(data || []);
        setLoading(false);
    };

    const handleCategoryChange = (cat) => {
        if (cat === 'all') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', cat);
        }
        setSearchParams(searchParams);
    };

    const filteredPosts = posts.filter(p => {
        const title = isEnglish ? p.title_en : p.title_ar;
        const matchesSearch = title.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === 'all' || p.category === category;
        return matchesSearch && matchesCategory;
    });

    // Updated categories to match industryData keys
    const categories = [
        'all', 
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
    ];

    const featuredPost = posts[0];

    if (loading) return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-base)', color: 'var(--color-text-main)' }}>
            <div className="animate-pulse">Loading Articles...</div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-base)', color: 'var(--color-text-main)', padding: '4rem 1rem', direction: isEnglish ? 'ltr' : 'rtl' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                
                {/* 1. Header Section */}
                <div style={{ marginBottom: '4rem', padding: '0 1rem' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem', background: 'linear-gradient(to right, #fff, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {isEnglish ? 'Knowledge Hub' : 'مركز المعرفة'}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.25rem', maxWidth: '700px' }}>
                        {isEnglish 
                            ? 'Expert insights on AI agents, business automation, and the future of work.' 
                            : 'رؤى الخبراء حول وكلاء الذكاء الاصطناعي، أتمتة الأعمال، ومستقبل العمل.'}
                    </p>
                </div>

                {/* 2. Main Content Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '3rem' }}>
                    
                    {/* LEFT COLUMN: ARTICLES */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        
                        {/* Featured Post (Only if on 'all' category and no search) */}
                        {category === 'all' && !search && featuredPost && (
                            <Link to={`/blog/${featuredPost.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ 
                                    background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.4), rgba(76, 29, 149, 0.2))', 
                                    borderRadius: '32px', 
                                    padding: '2.5rem', 
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                    display: 'grid',
                                    gridTemplateColumns: '1.2fr 1fr',
                                    gap: '2.5rem',
                                    alignItems: 'center',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8B5CF6'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)'}
                                >
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#F59E0B', fontWeight: 800, fontSize: '0.8rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
                                            <Star size={16} fill="#F59E0B" /> {isEnglish ? 'Featured Article' : 'مقال مميز'}
                                        </div>
                                        <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '1.25rem', lineHeight: '1.2' }}>{isEnglish ? featuredPost.title_en : featuredPost.title_ar}</h2>
                                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>{isEnglish ? featuredPost.excerpt_en : featuredPost.excerpt_ar}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A78BFA', fontWeight: 800 }}>{isEnglish ? 'Read Featured Article' : 'اقرأ المقال المميز'} <ArrowRight size={18} /></div>
                                    </div>
                                    <div style={{ height: '300px', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--color-border-subtle)' }}>
                                        <img src={featuredPost.featured_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* Recent Articles Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                            {filteredPosts.length === 0 ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', background: 'var(--color-bg-surface)', borderRadius: '32px', border: '1px dashed var(--color-border-subtle)' }}>
                                    <BookOpen size={48} color="#374151" style={{ marginBottom: '1rem' }} />
                                    <h3 style={{ color: 'var(--color-text-secondary)' }}>{isEnglish ? 'No articles match your criteria.' : 'لم يتم العثور على مقالات تطابق بحثك.'}</h3>
                                </div>
                            ) : (
                                filteredPosts.map(post => (
                                    <Link key={post.id} to={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{ background: 'var(--color-bg-surface)', borderRadius: '24px', border: '1px solid var(--color-border-subtle)', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                            <div style={{ height: '200px', background: '#0B0F19', borderRadius: '24px 24px 0 0', overflow: 'hidden' }}>
                                                <img src={post.featured_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ color: '#8B5CF6', fontWeight: 800, fontSize: '0.75rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                                                    {t(`sectors.${post.category.toLowerCase().replace(' ', '_')}`) || post.category}
                                                </div>
                                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', lineHeight: '1.3' }}>{isEnglish ? post.title_en : post.title_ar}</h3>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{isEnglish ? post.excerpt_en : post.excerpt_ar}</p>
                                                <div style={{ marginTop: 'auto', color: '#A78BFA', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {isEnglish ? 'Read More' : 'اقرأ المزيد'} <ArrowRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>

                        {/* Banner Section */}
                        {bannerSettings && (
                            <div style={{ 
                                padding: '3.5rem', 
                                background: 'linear-gradient(135deg, #1E1B4B, #4C1D95)', 
                                borderRadius: '32px', 
                                border: '1px solid var(--color-border-subtle)',
                                textAlign: 'center'
                            }}>
                                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '1rem' }}>{isEnglish ? bannerSettings.banner_text_en : bannerSettings.banner_text_ar}</h2>
                                <p style={{ fontSize: '1.1rem', marginBottom: '2.5rem', opacity: 0.9 }}>{isEnglish ? bannerSettings.banner_subtext_en : bannerSettings.banner_subtext_ar}</p>
                                <Link to={bannerSettings.banner_link} style={{ display: 'inline-block', padding: '14px 35px', background: 'white', color: '#4C1D95', borderRadius: '12px', fontWeight: 900, textDecoration: 'none' }}>
                                    {isEnglish ? 'Get Started' : 'ابدأ الآن'}
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: SIDEBAR */}
                    <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: 'fit-content', position: 'sticky', top: '2rem' }}>
                        
                        {/* Search Sidebar */}
                        <div style={{ background: 'var(--color-bg-surface)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--color-border-subtle)' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', right: isEnglish ? 'auto' : '15px', left: isEnglish ? '15px' : 'auto', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                                <input 
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder={isEnglish ? "Search..." : "بحث..."}
                                    style={{ width: '100%', padding: isEnglish ? '12px 12px 12px 42px' : '12px 42px 12px 12px', background: '#0B0F19', border: '1px solid var(--color-border-subtle)', borderRadius: '12px', color: 'var(--color-text-main)' }}
                                />
                            </div>
                        </div>

                        {/* Category Sidebar */}
                        <div style={{ background: 'var(--color-bg-surface)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--color-border-subtle)' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Tag size={18} color="#8B5CF6" /> {isEnglish ? 'Categories' : 'التصنيفات'}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {categories.map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => handleCategoryChange(cat)}
                                        style={{ 
                                            textAlign: isEnglish ? 'left' : 'right',
                                            padding: '10px 15px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: category === cat ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                            color: category === cat ? '#A78BFA' : '#9CA3AF',
                                            cursor: 'pointer',
                                            fontWeight: category === cat ? 700 : 500,
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {cat === 'all' ? (isEnglish ? 'All Articles' : 'جميع المقالات') : (t(`sectors.${cat.toLowerCase().replace(' ', '_')}`) || cat)}
                                        {category === cat && <div style={{ width: '6px', height: '6px', background: '#8B5CF6', borderRadius: '50%' }} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Trending Sidebar */}
                        <div style={{ background: 'var(--color-bg-surface)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--color-border-subtle)' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUp size={18} color="#10B981" /> {isEnglish ? 'Trending' : 'شائع الآن'}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {posts.slice(1, 4).map((rp, idx) => (
                                    <Link key={rp.id} to={`/blog/${rp.slug}`} style={{ textDecoration: 'none', display: 'flex', gap: '12px' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'rgba(255,255,255,0.1)', width: '20px' }}>0{idx + 1}</div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-main)', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {isEnglish ? rp.title_en : rp.title_ar}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Newsletter Sidebar */}
                        <NewsletterSignup source="blog_list" />

                    </aside>
                </div>
            </div>
        </div>
    );
};

export default BlogList;
