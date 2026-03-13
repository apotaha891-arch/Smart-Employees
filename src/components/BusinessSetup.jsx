import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { getCurrentUser, updateAgent, getProfile, invokeMultiFileWorkflow } from '../services/supabaseService';
import { Upload, Link as LinkIcon, Sparkles, X, FileText, Loader } from 'lucide-react';

const BusinessSetup = () => {
    const { t, language } = useLanguage();
    const [formData, setFormData] = useState({
        business_name: '',
        business_type: '',
        working_hours: '',
        description: '',
        services: '',
        branding_tone: 'professional',
        knowledge_base: ''
    });
    const [loading, setLoading] = useState(false);

    // AI Setup States
    const [aiFiles, setAiFiles] = useState([]);
    const [aiUrl, setAiUrl] = useState('');
    const [aiUrlsList, setAiUrlsList] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

    const loadingMessages = language === 'ar' ? [
        'جاري رفع الملفات وقراءتها...',
        'جاري تحليل النصوص باستخدام الذكاء الاصطناعي...',
        'يتم الآن استخراج الخدمات وتفاصيل النشاط...',
        'شارفنا على الانتهاء، جاري التنسيق...'
    ] : [
        'Uploading and reading files...',
        'Analyzing text with AI...',
        'Extracting services and business details...',
        'Almost done, formatting data...'
    ];

    useEffect(() => {
        let interval;
        if (aiLoading) {
            interval = setInterval(() => {
                setLoadingMessageIdx((prev) => (prev + 1) % loadingMessages.length);
            }, 3000);
        } else {
            setLoadingMessageIdx(0);
        }
        return () => clearInterval(interval);
    }, [aiLoading, loadingMessages.length]);

    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // From Step 5 (ContractSign)
    const agentId = location.state?.agentId || localStorage.getItem('currentAgentId');
    const initialRules = location.state?.businessRules || {};

    useEffect(() => {
        const checkUser = async () => {
            const { user } = await getCurrentUser();
            if (!user) {
                navigate('/login');
            } else {
                setUser(user);

                // Pre-fill from AI Extraction Rules if they exist
                setFormData(prev => ({
                    ...prev,
                    business_name: initialRules.businessName || prev.business_name,
                    business_type: initialRules.businessType || prev.business_type,
                    description: initialRules.description || prev.description,
                    services: initialRules.knowledgeBase || prev.services,
                }));

                // Fallback to fetch profile if empty
                const profile = await getProfile(user.id);
                if (profile.success && profile.data) {
                    setFormData(prev => ({
                        ...prev,
                        business_name: prev.business_name || profile.data.business_name || '',
                        business_type: prev.business_type || profile.data.business_type || '',
                        working_hours: prev.working_hours || profile.data.working_hours || '',
                        description: prev.description || profile.data.description || '',
                        services: prev.services || profile.data.services || '',
                        branding_tone: prev.branding_tone || profile.data.branding_tone || 'professional',
                        knowledge_base: prev.knowledge_base || profile.data.knowledge_base || ''
                    }));
                }
            }
        };
        checkUser();
    }, [navigate, initialRules.businessName, initialRules.businessType, initialRules.description, initialRules.knowledgeBase]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!agentId) {
            alert(language === 'ar' ? 'لم يتم العثور على وكيل نشط، يرجى إعادة خطوات التوظيف.' : 'No active agent found, please restart the hiring process.');
            return;
        }

        setLoading(true);
        // Save knowledge directly to the designated Agent!
        const result = await updateAgent(agentId, {
            knowledge_base: formData.knowledge_base + '\n\nمواعيد العمل:\n' + formData.working_hours,
            branding_tone: formData.branding_tone
        });

        if (result.success) {
            alert(language === 'ar' ? 'تم تهيئة الموظف وحفظ قاعدة المعرفة بنجاح!' : 'Agent configured and knowledge base saved successfully!');
            // Step 7: Transition to Dashboard Integration Selection (New Tool Page)
            navigate('/salon-setup?tab=integrations', { state: { agentId } });
        } else {
            alert(t('errorPrefix') + result.error);
        }
        setLoading(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setAiFiles([...aiFiles, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index) => {
        setAiFiles(aiFiles.filter((_, i) => i !== index));
    };

    const handleAddUrl = () => {
        if (aiUrl && !aiUrlsList.includes(aiUrl)) {
            setAiUrlsList([...aiUrlsList, aiUrl]);
            setAiUrl('');
        }
    };

    const removeUrl = (index) => {
        setAiUrlsList(aiUrlsList.filter((_, i) => i !== index));
    };

    const handleAiProcess = async () => {
        if (aiFiles.length === 0 && aiUrlsList.length === 0) {
            alert(language === 'ar' ? 'يرجى إضافة ملف أو رابط واحد على الأقل.' : 'Please add at least one file or URL.');
            return;
        }

        setAiLoading(true);
        const result = await invokeMultiFileWorkflow(aiFiles, aiUrlsList);

        if (result.success && result.data) {
            // Apply extracted data to formData
            setFormData({
                ...formData,
                business_name: result.data.business_name || formData.business_name,
                business_type: result.data.business_type || formData.business_type,
                working_hours: result.data.working_hours || formData.working_hours,
                description: result.data.description || formData.description,
                services: result.data.services || formData.services,
                knowledge_base: result.data.knowledge_base || formData.knowledge_base
            });
            alert(language === 'ar' ? 'تم استخراج البيانات بنجاح.' : 'Data extracted successfully.');
            // Clear inputs
            setAiFiles([]);
            setAiUrlsList([]);
        } else {
            alert(language === 'ar' ? 'حدث خطأ أثناء معالجة الملفات: ' + result.error : 'Error processing files: ' + result.error);
        }
        setAiLoading(false);
    };

    return (
        <div className="container py-xl animate-fade-in" style={{ paddingBottom: '6rem' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', background: 'linear-gradient(to bottom, #FFF, #52525B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {language === 'ar' ? 'الإعدادات العامة للمنشأة' : 'Business General Setup'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                    {language === 'ar' ? 'قم بتهيئة المعايير والبروتوكولات التي سيلتزم بها موظفك الذكي عند التعامل مع عملائك.' : 'Configure the standards and protocols your smart agent will follow when interacting with clients.'}
                </p>
            </div>

            <div className="grid grid-2" style={{ alignItems: 'start', gap: '2rem', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)' }}>
                {/* Right Column: AI Panel + Tips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* AI Smart Setup Panel */}
                    <div className="card" style={{ background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, rgba(17, 24, 39, 1) 100%)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ backgroundColor: '#8B5CF620', padding: '10px', borderRadius: '12px', color: '#8B5CF6' }}>
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: 'white' }}>{language === 'ar' ? 'الإعداد الذكي بالذكاء الاصطناعي' : 'AI Smart Setup'}</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{language === 'ar' ? 'ارفع ملفات أو أضف روابط لتدريب موظفك الرقمي فوراً' : 'Upload files or add links to train your digital agent immediately'}</p>
                            </div>
                        </div>

                        <div className="mb-md">
                            <label className="label"><span>📁</span> {language === 'ar' ? 'رفع ملفات (PDF, Excel, Word)' : 'Upload Files (PDF, Excel, Word)'}</label>
                            <div
                                style={{
                                    border: '2px dashed rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: 'rgba(0,0,0,0.2)',
                                    transition: 'all 0.3s'
                                }}
                                onClick={() => document.getElementById('ai-file-upload').click()}
                            >
                                <Upload size={32} color="#9CA3AF" style={{ marginBottom: '1rem' }} />
                                <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.9rem' }}>{language === 'ar' ? 'اضغط لاختيار الملفات أو اسحبها هنا' : 'Click to select files or drag them here'}</p>
                                <input
                                    id="ai-file-upload"
                                    type="file"
                                    multiple
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                                />
                            </div>

                            {aiFiles.length > 0 && (
                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {aiFiles.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '0.85rem' }}>
                                                <FileText size={16} color="#8B5CF6" /> {f.name}
                                            </div>
                                            <X size={16} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => removeFile(i)} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mb-lg">
                            <label className="label"><span>🔗</span> {language === 'ar' ? 'روابط الصفحات وقواعد البيانات' : 'Page Links & Databases'}</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <LinkIcon size={18} style={{ position: 'absolute', [language === 'ar' ? 'right' : 'left']: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                                    <input
                                        type="url"
                                        className="input-field"
                                        style={{ [language === 'ar' ? 'paddingRight' : 'paddingLeft']: '40px' }}
                                        placeholder="https://example.com/services"
                                        value={aiUrl}
                                        onChange={(e) => setAiUrl(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                                    />
                                </div>
                                <button onClick={handleAddUrl} className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>{language === 'ar' ? 'إضافة' : 'Add'}</button>
                            </div>

                            {aiUrlsList.length > 0 && (
                                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {aiUrlsList.map((url, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                                            <a href={url} target="_blank" rel="noreferrer" style={{ color: '#60A5FA', fontSize: '0.85rem', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                                                {url}
                                            </a>
                                            <X size={16} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => removeUrl(i)} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            className={`btn btn-block ${aiLoading ? 'loading' : ''}`}
                            onClick={handleAiProcess}
                            disabled={aiLoading || (aiFiles.length === 0 && aiUrlsList.length === 0)}
                            style={{
                                background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                                color: 'white',
                                opacity: (aiFiles.length === 0 && aiUrlsList.length === 0) ? 0.5 : 1,
                                pointerEvents: (aiFiles.length === 0 && aiUrlsList.length === 0) ? 'none' : 'auto'
                            }}
                        >
                            {aiLoading ? (language === 'ar' ? 'جاري التحليل واستخراج البيانات...' : 'Analyzing and extracting data...') : (language === 'ar' ? 'أتمتة وتحليل البيانات ✨' : 'Automate & Analyze Data ✨')}
                        </button>
                        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                            {language === 'ar' ? 'سيتم تحليل الملفات وملء بيانات الإعداد اليدوي أدناه تلقائياً.' : 'Files will be analyzed and the manual setup data below will be automatically filled.'}
                        </p>
                    </div>

                    {/* Tips Panel immediately below AI Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>💡 {language === 'ar' ? 'كيف سيساعدك موظفك الذكي؟' : 'How will your smart agent help?'}</h3>

                        <div className="card" style={{ [language === 'ar' ? 'borderRight' : 'borderLeft']: '4px solid #8B5CF6', background: 'rgba(139, 92, 246, 0.05)', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                                <div style={{ fontSize: '1.75rem', background: '#8B5CF620', padding: '10px', borderRadius: '12px', display: 'flex' }}>⏱️</div>
                                <div>
                                    <h4 style={{ marginBottom: '0.5rem', color: 'white', fontSize: '1.1rem' }}>{language === 'ar' ? 'تغطية فورية 24/7' : 'Instant 24/7 Coverage'}</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                                        {language === 'ar' ? 'موظفك لا ينام ولا يأخذ إجازات. سيقوم بالرد على استفسارات عملائك وحجز مواعيدهم في أي وقت من اليوم، حتى خارج أوقات العمل الرسمية.' : 'Your employee never sleeps or takes vacations. They will respond to customer inquiries and book appointments anytime, even outside official working hours.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ [language === 'ar' ? 'borderRight' : 'borderLeft']: '4px solid #10B981', background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                                <div style={{ fontSize: '1.75rem', background: '#10B98120', padding: '10px', borderRadius: '12px', display: 'flex' }}>🎯</div>
                                <div>
                                    <h4 style={{ marginBottom: '0.5rem', color: 'white', fontSize: '1.1rem' }}>{language === 'ar' ? 'دقة واحترافية متناهية' : 'Extreme Accuracy & Professionalism'}</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                                        {language === 'ar' ? 'ابنِ قاعدة معرفية قوية لموظفك. سيلتزم تماماً بالتعليمات والأسعار والخدمات التي تقدمها، ولن يرتكب الأخطاء البشرية الشائعة.' : 'Build a strong knowledge base for your employee. They will strictly adhere to your instructions, prices, and services, eliminating common human errors.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ [language === 'ar' ? 'borderRight' : 'borderLeft']: '4px solid #F59E0B', background: 'rgba(245, 158, 11, 0.05)', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                                <div style={{ fontSize: '1.75rem', background: '#F59E0B20', padding: '10px', borderRadius: '12px', display: 'flex' }}>💰</div>
                                <div>
                                    <h4 style={{ marginBottom: '0.5rem', color: 'white', fontSize: '1.1rem' }}>{language === 'ar' ? 'توفير التكاليف ومضاعفة المبيعات' : 'Cost Savings & Doubled Sales'}</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                                        {language === 'ar' ? 'بدلاً من توظيف فريق دعم كبير، سيتولى الذكاء الاصطناعي المهام الروتينية ليتفرغ فريقك للمبيعات والإدارة، مما يعود بالنفع على إيراداتك.' : 'Instead of hiring a large support team, AI handles routine tasks so your team can focus on sales and management, benefiting your revenue.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ background: 'linear-gradient(45deg, #18181B, #09090B)', border: '1px dashed var(--accent)', padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚀</div>
                            <h4 style={{ color: 'var(--secondary-accent)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>{language === 'ar' ? 'جاهز للانطلاق؟' : 'Ready to launch?'}</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                                {language === 'ar' ? 'أكمل بيانات المنشأة بدقة وزود موظفك بالمعلومات اللازمة، ثم احفظ الإعدادات لتبدأ ثورة الذكاء الاصطناعي في مشروعك!' : 'Complete your business data accurately and provide your agent with necessary information, then save settings to start the AI revolution in your project!'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Left Column: Manual Setup Panel */}
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <h3 style={{ margin: '0 0 1.5rem', color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>{language === 'ar' ? 'وثيقة الإعداد اليدوي' : 'Manual Setup Document'}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div>
                                <label className="label"><span>🏢</span> {language === 'ar' ? 'اسم المنشأة' : 'Business Name'}</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder={language === 'ar' ? "مثال: 24Shift" : "e.g., 24Shift"}
                                    value={formData.business_name}
                                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label"><span>🏷️</span> {language === 'ar' ? 'نوع النشاط' : 'Business Type'}</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder={language === 'ar' ? "مثال: عيادة تجميل" : "e.g., Beauty Clinic"}
                                    value={formData.business_type}
                                    onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-md">
                            <label className="label"><span>⏰</span> {language === 'ar' ? 'مواعيد العمل الرسمية' : 'Official Working Hours'}</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={language === 'ar' ? "مثال: من 9 صباحاً حتى 10 مساءً" : "e.g., 9 AM to 10 PM"}
                                value={formData.working_hours}
                                onChange={(e) => setFormData({ ...formData, working_hours: e.target.value })}
                                required
                            />
                        </div>

                        <div className="mb-md">
                            <label className="label"><span>🧩</span> {language === 'ar' ? 'الخدمات الأساسية والأسعار' : 'Core Services & Prices'}</label>
                            <textarea
                                className="input-field"
                                rows="3"
                                placeholder={language === 'ar' ? "قائمة بكل ما تريد من موظفك تقديمه..." : "List everything you want your agent to offer..."}
                                value={formData.services}
                                onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                                required
                            ></textarea>
                        </div>

                        <div className="mb-md">
                            <label className="label"><span>🎭</span> {language === 'ar' ? 'أسلوب التحدث والهوية' : 'Tone & Identity'}</label>
                            <select
                                className="input-field"
                                value={formData.branding_tone}
                                onChange={(e) => setFormData({ ...formData, branding_tone: e.target.value })}
                                style={{
                                    color: 'white',
                                    background: '#1F2937',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <option value="professional" style={{ color: 'white', background: '#1F2937' }}>{language === 'ar' ? 'رسمي واحترافي' : 'Official & Professional'}</option>
                                <option value="friendly" style={{ color: 'white', background: '#1F2937' }}>{language === 'ar' ? 'ودود وشبابي' : 'Friendly & Youthful'}</option>
                                <option value="fast" style={{ color: 'white', background: '#1F2937' }}>{language === 'ar' ? 'سريع ومباشر' : 'Fast & Direct'}</option>
                                <option value="luxury" style={{ color: 'white', background: '#1F2937' }}>{language === 'ar' ? 'راقي وفاخر' : 'Luxury & Refined'}</option>
                            </select>
                        </div>

                        <div className="mb-2xl">
                            <label className="label"><span>🧠</span> {language === 'ar' ? 'قاعدة المعرفة الأساسية' : 'Core Knowledge Base'}</label>
                            <textarea
                                className="input-field"
                                rows="12"
                                style={{ background: 'rgba(212, 175, 55, 0.03)', borderColor: 'rgba(212, 175, 55, 0.15)' }}
                                placeholder={language === 'ar' ? "أدخل هنا كل المعلومات والتعليمات التي تريد لموظفك حفظها..." : "Enter all information and instructions you want your agent to memorize here..."}
                                value={formData.knowledge_base}
                                onChange={(e) => setFormData({ ...formData, knowledge_base: e.target.value })}
                            ></textarea>
                            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                <small style={{ color: 'var(--text-secondary)' }}>{language === 'ar' ? 'تحديث هذه اللوحة يعيد بناء معرفة موظفك فوراً.' : 'Updating this board instantly rebuilds your agent\'s knowledge.'}</small>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-block ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') : (language === 'ar' ? 'تحديث وتأكيد البيانات' : 'Update & Confirm Data')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BusinessSetup;
