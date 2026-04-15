import React from 'react';
import { Sparkles, Upload, FileText, Link as LinkIcon, X, Loader, CheckCircle2, Save, Puzzle, Clock } from 'lucide-react';
import { AI_LOADING_MESSAGES } from '../constants';

const SourcesTab = ({
    language,
    aiFiles,
    aiUrl,
    setAiUrl,
    aiUrlsList,
    aiLoading,
    aiLoadingMsg,
    extractedProfile,
    setExtractedProfile,
    handleFileChange,
    removeFile,
    handleAddUrl,
    removeUrl,
    handleAiGenerate,
    handleConfirmProfile,
    loading
}) => {
    // Styles from original component
    const inpStyle = {
        width: '100%',
        background: 'var(--color-bg-input)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '10px',
        color: 'var(--color-text-main)',
        padding: '10px 14px',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'all 0.2s',
        boxSizing: 'border-box'
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ padding: '1rem 1.2rem', background: 'linear-gradient(135deg,rgba(139,92,246,0.1),rgba(109,40,217,0.05))', borderRadius: 12, border: '1px solid rgba(139,92,246,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Sparkles size={18} color="#A78BFA" />
                    <span style={{ fontWeight: 700, color: '#A78BFA', fontSize: '0.95rem' }}>
                        {language === 'ar' ? 'الإعداد الذكي بالذكاء الاصطناعي' : 'AI-Powered Smart Setup'}
                    </span>
                </div>
                <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.83rem', lineHeight: 1.6 }}>
                    {language === 'ar'
                        ? 'ارفع ملفات منشأتك (PDF, Word, Excel) للحصول على أفضل دقة. موظفنا الذكي سيقرأها ويُنشئ لك ملف تعريفي متكامل تلقائياً.'
                        : 'Upload your business files (PDF, Word, Excel) for best accuracy. Our AI agent will read them and auto-generate a complete profile.'}
                </p>
            </div>

            {/* File Upload */}
            <div>
                <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginBottom: 8, fontWeight: 600 }}>
                    📁 {language === 'ar' ? 'رفع الملفات (PDF, Word, Excel, CSV)' : 'Upload Files (PDF, Word, Excel, CSV)'}
                </label>
                <div
                    onClick={() => document.getElementById('entity-ai-upload').click()}
                    style={{
                        border: '2px dashed rgba(139,92,246,0.3)', borderRadius: 12, padding: '1.75rem',
                        textAlign: 'center', cursor: 'pointer', background: 'rgba(139,92,246,0.03)',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'}
                >
                    <Upload size={28} color="#8B5CF6" style={{ marginBottom: 8 }} />
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                        {language === 'ar' ? 'اضغط لاختيار الملفات أو اسحبها هنا' : 'Click to choose files or drag & drop here'}
                    </p>
                    <input id="entity-ai-upload" type="file" multiple style={{ display: 'none' }}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" />
                </div>
                {aiFiles.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {aiFiles.map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: '7px 12px', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-main)', fontSize: '0.83rem' }}>
                                    <FileText size={14} color="#8B5CF6" /> {f.name}
                                </div>
                                <X size={14} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => removeFile(i)} />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* URL Input */}
            <div style={{ marginTop: '0.5rem', padding: '1rem', border: '1px solid var(--color-border-subtle)', borderRadius: 12, background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <label style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>
                        🔗 {language === 'ar' ? 'أضف روابط (اختياري - ميزة تجريبية)' : 'Add Links (Optional - Experimental)'}
                    </label>
                    <span style={{ fontSize: '0.7rem', color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: 8 }}>
                        {language === 'ar' ? '⚠️ استخراج الروابط قد يكون غير دقيق' : '⚠️ Extraction may be inaccurate'}
                    </span>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <LinkIcon size={16} style={{ position: 'absolute', [language === 'ar' ? 'right' : 'left']: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
                        <input type="url" value={aiUrl} onChange={e => setAiUrl(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                            placeholder="https://"
                            style={{ ...inpStyle, [language === 'ar' ? 'paddingRight' : 'paddingLeft']: 38 }} />
                    </div>
                    <button onClick={handleAddUrl}
                        style={{ padding: '0 16px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#A78BFA', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {language === 'ar' ? '+ إضافة' : '+ Add'}
                    </button>
                </div>
                
                {aiUrlsList.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {aiUrlsList.map((url, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: '7px 12px', borderRadius: 8 }}>
                                <a href={url} target="_blank" rel="noreferrer" style={{ color: '#60A5FA', fontSize: '0.82rem', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>{url}</a>
                                <X size={14} color="#EF4444" style={{ cursor: 'pointer' }} onClick={() => removeUrl(i)} />
                            </div>
                        ))}
                    </div>
                )}
                
                <p style={{ margin: '10px 0 0', color: '#6B7280', fontSize: '0.75rem', lineHeight: 1.4 }}>
                    {language === 'ar' 
                        ? '💡 نوصي برفع ملفات PDF أو Word بدلاً من الروابط للحصول على نتائج أدق وأسرع.' 
                        : '💡 We recommend uploading PDF/Word files instead of links for faster and more accurate results.'}
                </p>
            </div>

            {/* AI Generate Button */}
            <button onClick={handleAiGenerate}
                disabled={aiLoading || (aiFiles.length === 0 && aiUrlsList.length === 0)}
                style={{
                    padding: '14px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: '1rem',
                    background: (aiFiles.length === 0 && aiUrlsList.length === 0) ? '#374151' : 'linear-gradient(135deg,#8B5CF6,#6D28D9)',
                    color: 'var(--color-text-main)', cursor: (aiFiles.length === 0 && aiUrlsList.length === 0) ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s'
                }}>
                {aiLoading
                    ? (<><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> {AI_LOADING_MESSAGES[language][aiLoadingMsg]}</>)
                    : (<>
                        <Sparkles size={18} /> 
                        {aiFiles.length > 0 && aiUrlsList.length > 0 
                            ? (language === 'ar' ? 'تحليل الملفات والروابط ✨' : 'Analyze Files & Links ✨')
                            : aiFiles.length > 0 
                            ? (language === 'ar' ? 'بدء تحليل الملفات ✨' : 'Start Analyzing Files ✨')
                            : (language === 'ar' ? 'بدء استخراج البيانات ✨' : 'Start Data Extraction ✨')
                        }
                       </>)}
            </button>

            {/* Extracted Profile Preview */}
            {extractedProfile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.85rem 1.1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, color: '#10B981', fontSize: '0.85rem', fontWeight: 600 }}>
                        <CheckCircle2 size={18} />
                        {language === 'ar'
                            ? 'تم استخراج البيانات — راجع الجدول أدناه ثم اضغط "تأكيد وحفظ"'
                            : 'Data extracted — review the table below then click "Confirm & Save"'}
                    </div>

                    <div style={{ background: '#0D1117', borderRadius: 12, border: '1px solid var(--color-border-subtle)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                                    <th style={{ padding: '10px 14px', color: '#A78BFA', fontWeight: 700, textAlign: language === 'ar' ? 'right' : 'left', width: '35%' }}>
                                        {language === 'ar' ? 'الحقل' : 'Field'}
                                    </th>
                                    <th style={{ padding: '10px 14px', color: '#A78BFA', fontWeight: 700, textAlign: language === 'ar' ? 'right' : 'left' }}>
                                        {language === 'ar' ? 'القيمة المستخرجة (قابلة للتعديل)' : 'Extracted Value (editable)'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { key: 'businessName', labelAr: 'اسم المنشأة', labelEn: 'Business Name', multiline: false },
                                    { key: 'businessType', labelAr: 'نوع النشاط', labelEn: 'Business Type', multiline: false },
                                    { key: 'phone', labelAr: 'رقم التواصل', labelEn: 'Contact Number', multiline: false },
                                    { key: 'address', labelAr: 'الموقع / العنوان', labelEn: 'Location', multiline: false },
                                    { key: 'website', labelAr: 'الموقع الإلكتروني', labelEn: 'Website', multiline: false },
                                    { key: 'mission_statement', labelAr: 'مهمة المنشأة (Mission)', labelEn: 'Mission Statement', multiline: true },
                                    { key: 'target_audience', labelAr: 'الجمهور المستهدف', labelEn: 'Target Audience', multiline: false },
                                    { key: 'brand_voice', labelAr: 'نبرة الصوت (Tone)', labelEn: 'Brand Voice', multiline: false },
                                    { key: 'procedures', labelAr: 'إجراءات العمل (SOPs)', labelEn: 'Standard Procedures', multiline: true },
                                    { key: 'description', labelAr: 'وصف عام', labelEn: 'General Description', multiline: true },
                                    { key: 'services', labelAr: 'الخدمات المستخرجة', labelEn: 'Extracted Services', multiline: true },
                                ].map((row, idx) => (
                                    <tr key={row.key} style={{ borderBottom: '1px solid var(--color-border-subtle)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                                        <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)', fontWeight: 600, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                                            {language === 'ar' ? row.labelAr : row.labelEn}
                                        </td>
                                        <td style={{ padding: '8px 14px' }}>
                                            {row.multiline ? (
                                                <textarea
                                                    rows={3}
                                                    value={extractedProfile[row.key]}
                                                    onChange={e => setExtractedProfile(p => ({ ...p, [row.key]: e.target.value }))}
                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border-subtle)', borderRadius: 8, color: 'var(--color-text-main)', padding: '7px 10px', fontSize: '0.85rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                                                />
                                            ) : (
                                                <input
                                                    value={extractedProfile[row.key]}
                                                    onChange={e => setExtractedProfile(p => ({ ...p, [row.key]: e.target.value }))}
                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border-subtle)', borderRadius: 8, color: 'var(--color-text-main)', padding: '7px 10px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                                                />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Structured Services Preview */}
                    {extractedProfile.extracted_services && extractedProfile.extracted_services.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                            <h4 style={{ color: 'var(--color-text-main)', fontSize: '0.85rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Puzzle size={14} style={{ color: '#FCD34D' }} />
                                {language === 'ar' ? 'الخدمات التي تم التعرف عليها (' + extractedProfile.extracted_services.length + ')' : 'Identified Services (' + extractedProfile.extracted_services.length + ')'}
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                {extractedProfile.extracted_services.map((svc, sIdx) => (
                                    <div key={sIdx} style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, padding: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ color: 'var(--color-text-main)', fontWeight: 700, fontSize: '0.8rem' }}>{svc.name}</span>
                                            <span style={{ color: '#10B981', fontWeight: 800, fontSize: '0.8rem' }}>${svc.price}</span>
                                        </div>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Clock size={10} />
                                            {svc.duration} {language === 'ar' ? 'دقيقة' : 'min'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Confirm buttons */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={handleConfirmProfile} disabled={loading}
                            style={{
                                flex: 1, padding: '13px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: '0.95rem',
                                background: 'linear-gradient(135deg,#10B981,#059669)', color: 'var(--color-text-main)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                            }}>
                            <Save size={16} />
                            {loading
                                ? (language === 'ar' ? '⏳ جاري الحفظ...' : '⏳ Saving...')
                                : (language === 'ar' ? 'تأكيد وحفظ البروفايل' : 'Confirm & Save Profile')}
                        </button>
                        <button onClick={() => setExtractedProfile(null)}
                            style={{ padding: '13px 18px', borderRadius: 12, border: '1px solid var(--color-border-subtle)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                            {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                    </div>
                </div>
            )}

            {!extractedProfile && (
                <p style={{ margin: 0, color: '#6B7280', fontSize: '0.78rem', textAlign: 'center' }}>
                    {language === 'ar'
                        ? 'بعد التحليل ستظهر نتائج قابلة للمراجعة والتعديل قبل الحفظ.'
                        : 'After analysis, results appear for review and editing before saving.'}
                </p>
            )}
        </div>
    );
};

export default SourcesTab;
