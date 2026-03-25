import React, { useState, useEffect } from 'react';
import { 
    Plus, Edit2, Trash2, Eye, Save, X, Globe, 
    LayoutDashboard, Check, Newspaper, Settings, 
    ExternalLink, Search, Image as ImageIcon
} from 'lucide-react';
import * as adminService from '../services/adminService';
import { useLanguage } from '../LanguageContext';

const AdminBlogManager = () => {
    const { language } = useLanguage();
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'promotions'
    const [settings, setSettings] = useState({
        banner_text_en: 'Ready to hire your first AI Agent?',
        banner_text_ar: 'هل أنت جاهز لتوظيف أول موظف ذكاء اصطناعي؟',
        banner_subtext_en: 'Automate your business 24/7 with 24Shift.',
        banner_subtext_ar: 'أتمتة عملك على مدار الساعة مع 24Shift.',
        banner_link: '/salon-setup',
        is_active: true
    });
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [editingPost, setEditingPost] = useState(null);
    const [editTab, setEditTab] = useState('en');

    useEffect(() => {
        loadPosts();
        loadSettings();
    }, []);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const data = await adminService.getBlogPosts();
            setPosts(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const data = await adminService.getBlogSettings();
            if (data) setSettings(data);
        } catch (err) {
            console.error("Failed to load blog settings:", err);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setMsg('⏳ Saving settings...');
            await adminService.updateBlogSettings(settings);
            flash('✅ Settings saved successfully!');
        } catch (err) {
            flash('❌ Error saving settings');
        }
    };

    const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

    const handleCreateNew = () => {
        setEditingPost({
            slug: '',
            title_en: '',
            title_ar: '',
            content_en: '',
            content_ar: '',
            excerpt_en: '',
            excerpt_ar: '',
            featured_image: '',
            status: 'draft',
            category: 'general',
            meta_keywords: [],
            ad_slots: { top: true, sidebar: true, content: true }
        });
        setEditTab(language === 'ar' ? 'ar' : 'en');
    };

    const handleSave = async () => {
        if (!editingPost.slug || !editingPost.title_en || !editingPost.title_ar) {
            return flash('❌ Please fill in the slug and titles for both languages');
        }
        try {
            const saved = await adminService.saveBlogPost(editingPost);
            setPosts(prev => {
                const exists = prev.find(p => p.id === saved.id);
                if (exists) return prev.map(p => p.id === saved.id ? saved : p);
                return [saved, ...prev];
            });
            setEditingPost(null);
            flash('✅ Blog post saved successfully!');
        } catch (err) {
            flash('❌ Error saving post: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await adminService.deleteBlogPost(id);
            setPosts(prev => prev.filter(p => p.id !== id));
            flash('✅ Post deleted');
        } catch (err) {
            flash('❌ Error deleting post');
        }
    };

    const generateSlug = (title) => {
        return title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
    };

    if (loading) return <div className="text-center p-xl">Loading blog posts...</div>;

    if (editingPost) {
        return (
            <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                   <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0 }}>
                            {editingPost.id ? 'Edit Blog Post' : 'Create New Post'}
                        </h2>
                        <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>{editingPost.slug || 'new-post-slug'}</p>
                   </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setEditingPost(null)} style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                        <button onClick={handleSave} style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 25px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={18} /> Save Post
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                    {/* Main Editor */}
                    <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        {/* Language Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                            <button onClick={() => setEditTab('en')} style={{ padding: '1rem 2rem', border: 'none', background: editTab === 'en' ? 'rgba(139, 92, 246, 0.1)' : 'transparent', color: editTab === 'en' ? '#A78BFA' : '#6B7280', fontWeight: 700, borderBottom: editTab === 'en' ? '2px solid #8B5CF6' : 'none', cursor: 'pointer' }}>English</button>
                            <button onClick={() => setEditTab('ar')} style={{ padding: '1rem 2rem', border: 'none', background: editTab === 'ar' ? 'rgba(139, 92, 246, 0.1)' : 'transparent', color: editTab === 'ar' ? '#A78BFA' : '#6B7280', fontWeight: 700, borderBottom: editTab === 'ar' ? '2px solid #8B5CF6' : 'none', cursor: 'pointer' }}>العربية</button>
                        </div>
                        
                        <div style={{ padding: '1.5rem' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    {editTab === 'en' ? 'Article Title' : 'عنوان المقال'}
                                </label>
                                <input 
                                    value={editTab === 'en' ? editingPost.title_en : editingPost.title_ar}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setEditingPost(p => {
                                            const updated = { ...p, [editTab === 'en' ? 'title_en' : 'title_ar']: val };
                                            if (editTab === 'en' && !p.id) updated.slug = generateSlug(val);
                                            return updated;
                                        });
                                    }}
                                    placeholder={editTab === 'en' ? "Enter title..." : "أدخل العنوان..."}
                                    style={{ width: '100%', padding: '12px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '1.1rem', fontWeight: 700, direction: editTab === 'ar' ? 'rtl' : 'ltr' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    {editTab === 'en' ? 'Excerpt (Brief Summary)' : 'مقتطف (وصف قصير)'}
                                </label>
                                <textarea 
                                    rows={3}
                                    value={editTab === 'en' ? editingPost.excerpt_en : editingPost.excerpt_ar}
                                    onChange={(e) => setEditingPost(p => ({ ...p, [editTab === 'en' ? 'excerpt_en' : 'excerpt_ar']: e.target.value }))}
                                    placeholder={editTab === 'en' ? "Short summary for SEO..." : "وصف قصير لمحركات البحث..."}
                                    style={{ width: '100%', padding: '12px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '0.9rem', direction: editTab === 'ar' ? 'rtl' : 'ltr', resize: 'vertical' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    {editTab === 'en' ? 'Content (HTML Supported)' : 'المحتوى (يدعم HTML)'}
                                </label>
                                <textarea 
                                    rows={20}
                                    value={editTab === 'en' ? editingPost.content_en : editingPost.content_ar}
                                    onChange={(e) => setEditingPost(p => ({ ...p, [editTab === 'en' ? 'content_en' : 'content_ar']: e.target.value }))}
                                    placeholder={editTab === 'en' ? "Write your article here..." : "اكتب مقالك هنا..."}
                                    style={{ width: '100%', padding: '15px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '0.95rem', lineHeight: '1.6', direction: editTab === 'ar' ? 'rtl' : 'ltr', minHeight: '400px', fontFamily: 'monospace' }}
                                />
                                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6B7280' }}>
                                    Tip: You can use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, etc.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Config */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={16} color="#8B5CF6" /> Publishing Settings
                            </h3>
                            
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '0.4rem' }}>URL Slug (SEO)</label>
                                <input 
                                    value={editingPost.slug}
                                    onChange={(e) => setEditingPost(p => ({ ...p, slug: e.target.value }))}
                                    style={{ width: '100%', padding: '8px 12px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#A78BFA', fontSize: '0.85rem', fontWeight: 600 }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Status</label>
                                <select 
                                    value={editingPost.status}
                                    onChange={(e) => setEditingPost(p => ({ ...p, status: e.target.value }))}
                                    style={{ width: '100%', padding: '8px 12px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Category</label>
                                <input 
                                    value={editingPost.category}
                                    onChange={(e) => setEditingPost(p => ({ ...p, category: e.target.value }))}
                                    placeholder="e.g. Technology"
                                    style={{ width: '100%', padding: '8px 12px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.75rem', marginBottom: '0.4rem' }}>Featured Image URL</label>
                                <input 
                                    value={editingPost.featured_image}
                                    onChange={(e) => setEditingPost(p => ({ ...p, featured_image: e.target.value }))}
                                    placeholder="https://..."
                                    style={{ width: '100%', padding: '8px 12px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', fontSize: '0.85rem' }}
                                />
                                {editingPost.featured_image && (
                                    <img src={editingPost.featured_image} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginTop: '0.5rem', border: '1px solid rgba(255,255,255,0.1)' }} />
                                )}
                            </div>
                        </div>

                        <div style={{ background: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Globe size={16} color="#10B981" /> Advertisement Slots
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {Object.entries(editingPost.ad_slots).map(([key, val]) => (
                                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#E4E4E7', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={val}
                                            onChange={(e) => setEditingPost(p => ({ ...p, ad_slots: { ...p.ad_slots, [key]: e.target.checked } }))}
                                            style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                                        />
                                        Show ads in {key === 'top' ? 'Top Header' : key === 'sidebar' ? 'Sidebar' : 'Content Body'}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', margin: 0 }}>Blog Management</h1>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button 
                            onClick={() => setActiveTab('posts')} 
                            style={{ 
                                background: activeTab === 'posts' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                border: 'none',
                                color: activeTab === 'posts' ? '#A78BFA' : '#6B7280',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                borderBottom: activeTab === 'posts' ? '2px solid #8B5CF6' : 'none'
                            }}
                        >
                            Articles
                        </button>
                        <button 
                            onClick={() => setActiveTab('promotions')} 
                            style={{ 
                                background: activeTab === 'promotions' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                border: 'none',
                                color: activeTab === 'promotions' ? '#A78BFA' : '#6B7280',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                borderBottom: activeTab === 'promotions' ? '2px solid #8B5CF6' : 'none'
                            }}
                        >
                            Promotional Banners
                        </button>
                    </div>
                </div>
                {activeTab === 'posts' && (
                    <button onClick={handleCreateNew} style={{ background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(139, 92, 246, 0.2)' }}>
                        <Plus size={20} /> Create New Post
                    </button>
                )}
            </div>

            {msg && (
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#A78BFA', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: 700, textAlign: 'center' }}>
                    {msg}
                </div>
            )}

            {activeTab === 'promotions' ? (
                <div style={{ background: '#111827', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0 }}>Global Blog Banners</h2>
                        <button onClick={handleSaveSettings} style={{ background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 25px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={18} /> Save Settings
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#A78BFA' }}>English Content</h3>
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Banner Title</label>
                                <input 
                                    value={settings.banner_text_en}
                                    onChange={(e) => setSettings(p => ({ ...p, banner_text_en: e.target.value }))}
                                    style={{ width: '100%', padding: '12px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Banner Subtext</label>
                                <textarea 
                                    value={settings.banner_subtext_en}
                                    onChange={(e) => setSettings(p => ({ ...p, banner_subtext_en: e.target.value }))}
                                    style={{ width: '100%', padding: '12px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', direction: 'rtl' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#A78BFA' }}>المحتوى العربي</h3>
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '0.5rem' }}>عنوان البنر</label>
                                <input 
                                    value={settings.banner_text_ar}
                                    onChange={(e) => setSettings(p => ({ ...p, banner_text_ar: e.target.value }))}
                                    style={{ width: '100%', padding: '12px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '0.5rem' }}>النص الفرعي</label>
                                <textarea 
                                    value={settings.banner_subtext_ar}
                                    onChange={(e) => setSettings(p => ({ ...p, banner_subtext_ar: e.target.value }))}
                                    style={{ width: '100%', padding: '12px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}
                                />
                            </div>
                        </div>

                        <div style={{ gridColumn: '1/-1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem' }}>
                             <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Destination Link (URL)</label>
                                <input 
                                    value={settings.banner_link}
                                    onChange={(e) => setSettings(p => ({ ...p, banner_link: e.target.value }))}
                                    style={{ width: '100%', padding: '12px', background: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#8B5CF6', fontWeight: 700 }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox"
                                        checked={settings.is_active}
                                        onChange={(e) => setSettings(p => ({ ...p, is_active: e.target.checked }))}
                                        style={{ width: '20px', height: '20px', accentColor: '#8B5CF6' }}
                                    />
                                    Enable Global Blog Banners
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {posts.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', background: '#111827', borderRadius: '24px', border: '2px dashed rgba(255,255,255,0.05)' }}>
                        <Newspaper size={48} color="#374151" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ color: '#9CA3AF' }}>No blog posts yet.</h3>
                        <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Click the button above to start writing.</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} style={{ background: '#111827', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.3s' }}>
                            <div style={{ position: 'relative', height: '160px', background: '#0B0F19' }}>
                                {post.featured_image ? (
                                    <img src={post.featured_image} alt={post.title_en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151' }}>
                                        <ImageIcon size={40} />
                                    </div>
                                )}
                                <div style={{ position: 'absolute', top: '10px', right: '10px', background: post.status === 'published' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(245, 158, 11, 0.9)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                    {post.status}
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem', flex: 1 }}>
                                <div style={{ fontSize: '0.7rem', color: '#8B5CF6', fontWeight: 800, marginBottom: '0.5rem', textTransform: 'uppercase' }}>{post.category || 'Uncategorized'}</div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', marginBottom: '0.75rem', lineHeight: '1.4' }}>{post.title_en}</h3>
                                <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt_en}</p>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => setEditingPost(post)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(post.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                                        <ExternalLink size={14} /> View
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                </div>
            )}
        </div>
    );
};

export default AdminBlogManager;
