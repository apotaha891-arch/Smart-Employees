import React, { useState } from 'react';
import { 
    AlertCircle, CheckCircle2, X, Briefcase, 
    Sparkles, FileText, Puzzle, Smartphone 
} from 'lucide-react';
import { useEntitySetup } from '../features/entity-setup/hooks/useEntitySetup';
import SourcesTab from '../features/entity-setup/components/SourcesTab';
import IdentityTab from '../features/entity-setup/components/IdentityTab';
import KnowledgeTab from '../features/entity-setup/components/KnowledgeTab';
import IntegrationsTab from '../features/entity-setup/components/IntegrationsTab';
import ActivationTab from '../features/entity-setup/components/ActivationTab';
import HelpModal from '../features/entity-setup/components/HelpModal';

const EntitySetup = () => {
    const {
        loading, agentId, activeTab, setActiveTab, statusMsg, setStatusMsg, paymentSuccess, setPaymentSuccess,
        formData, setFormData, services, newService, setNewService, editingService, setEditingService,
        integrationKeys, integrationDraft, setIntegrationDraft, expandedIntegration, setExpandedIntegration,
        integrationSaving, saveSuccess, requestToolName, setRequestToolName, requestReason, setRequestReason,
        requestContactName, setRequestContactName, requestContactPhone, setRequestContactPhone, 
        requestContactEmail, setRequestContactEmail, requestSuccess,
        aiLoading, aiLoadingMsg, aiFiles, aiUrl, setAiUrl, aiUrlsList, extractedProfile, setExtractedProfile,
        newFaq, setNewFaq, activeFieldGuide, setActiveFieldGuide,
        isTestingSheets, isTestingCalendar,
        language, t, currentUserId, isAgencyAdmin, isImpersonating,
        handleSave, handleAddService, handleUpdateService, handleDeleteService,
        openIntegration, handleSaveIntegration, handleFileChange, removeFile, handleAddUrl, removeUrl,
        handleAiGenerate, handleConfirmProfile, handleTestSheetsConnection, handleTestCalendarConnection
    } = useEntitySetup();

    const [showHelpModal, setShowHelpModal] = useState(false);
    const [helpModalType, setHelpModalType] = useState(null);

    const tabs = [
        { id: 'sources', label: language === 'ar' ? 'مصادر الذكاء' : 'AI Sources', icon: Sparkles },
        { id: 'identity', label: language === 'ar' ? 'معلومات المنشأة' : 'Entity Info', icon: Briefcase },
        { id: 'knowledge', label: language === 'ar' ? 'الخدمات والمواعيد' : 'Services & Hours', icon: FileText },
        { id: 'integrations', label: language === 'ar' ? 'الربط' : 'Integrations', icon: Puzzle },
        { id: 'activation', label: language === 'ar' ? 'التفعيل' : 'Activation', icon: Smartphone }
    ];

    if (loading && !formData.businessName) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--color-text-secondary)' }}>
                <div className="animate-pulse" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                    {language === 'ar' ? '⏳ جاري تحميل البيانات...' : '⏳ Loading data...'}
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ textAlign: language === 'ar' ? 'right' : 'left', color: 'var(--color-text-main)', position: 'relative', minHeight: '100vh' }}>
            
            {showHelpModal && (
                <HelpModal 
                    language={language}
                    helpModalType={helpModalType}
                    setShowHelpModal={setShowHelpModal}
                    currentUserId={currentUserId}
                    setStatusMsg={setStatusMsg}
                />
            )}
            
            {/* Agency Self-Edit Warning Guardrail */}
            {isAgencyAdmin && !isImpersonating && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '1rem 1.5rem',
                    borderRadius: '16px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    color: '#F59E0B',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <AlertCircle size={24} />
                    <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 800, display: 'block', fontSize: '1rem' }}>
                            {language === 'ar' ? '⚠️ تنبيه: أنت تعدل ملف وكالتك الشخصي' : '⚠️ Warning: You are editing your Agency Profile'}
                        </span>
                        <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                            {language === 'ar' 
                                ? 'هذه البيانات تخص حسابك كوكالة (سولانا). إذا كنت تريد إعداد منشأة لعميل، يرجى الذهاب للوحة الوكالة واختيار "التحكم كعميل".' 
                                : 'These details belong to your Agency account. To setup a client business, go to Agency Dashboard and click "Manage as Client".'}
                        </span>
                    </div>
                </div>
            )}
            
            {/* Global Status Banner */}
            {statusMsg.text && (
                <div className="status-banner" style={{
                    position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 10000, width: '90%', maxWidth: '550px',
                    background: statusMsg.type === 'success' ? '#059669' : '#DC2626',
                    color: 'white', padding: '1.25rem 2rem', borderRadius: '24px',
                    boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 1), 0 0 30px rgba(139, 92, 246, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', border: '2px solid var(--color-border-subtle)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {statusMsg.type === 'success' ? <CheckCircle2 size={30} /> : <AlertCircle size={30} />}
                        <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{statusMsg.type === 'success' ? (language === 'ar' ? 'نجاح ✅' : 'Success ✅') : (language === 'ar' ? 'خطأ ⚠️' : 'Error ⚠️')}</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, opacity: 0.9 }}>{statusMsg.text}</div>
                        </div>
                    </div>
                    <button onClick={() => setStatusMsg({ type: '', text: '' })} style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={24} />
                    </button>
                </div>
            )}

            {/* Page Header */}
            {paymentSuccess && (
                <div className="animate-fade-in" style={{
                    background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                    padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#10B981'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CheckCircle2 size={24} />
                        <div>
                            <span style={{ fontWeight: 800, display: 'block' }}>{language === 'ar' ? 'تم تفعيل الخدمة بنجاح!' : 'Plan Activated Successfully!'}</span>
                            <span style={{ fontSize: '0.85rem' }}>{language === 'ar' ? 'يمكنك الآن البدء بربط الأدوات وتدريب موظفك.' : 'You can now start connecting tools and training your agent.'}</span>
                        </div>
                    </div>
                    <button onClick={() => setPaymentSuccess(false)} style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                    <Briefcase size={24} />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>
                        {language === 'ar' ? 'إعداد المنشأة' : 'Entity Setup'}
                    </h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                        {language === 'ar'
                            ? 'معلومات منشأتك التي يستخدمها الموظفون الذكيون للتعرف على عملك'
                            : 'Your business profile that AI agents read to understand your entity'}
                    </p>
                </div>
            </div>

            {/* Tabs Panel */}
            <div style={{ background: 'var(--color-bg-surface)', borderRadius: '16px', border: '1px solid var(--color-border-subtle)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-subtle)', flexWrap: 'wrap' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: 1, padding: '1rem', background: activeTab === tab.id ? 'var(--color-bg-input)' : 'transparent',
                                border: 'none', color: activeTab === tab.id ? '#8B5CF6' : '#9CA3AF',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                cursor: 'pointer', transition: 'all 0.2s', borderBottom: activeTab === tab.id ? '2px solid #8B5CF6' : 'none',
                                fontWeight: activeTab === tab.id ? 600 : 400
                            }}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {activeTab === 'sources' && (
                        <SourcesTab 
                            language={language} aiFiles={aiFiles} aiUrl={aiUrl} setAiUrl={setAiUrl} aiUrlsList={aiUrlsList}
                            aiLoading={aiLoading} aiLoadingMsg={aiLoadingMsg} extractedProfile={extractedProfile} setExtractedProfile={setExtractedProfile}
                            handleFileChange={handleFileChange} removeFile={removeFile} handleAddUrl={handleAddUrl} removeUrl={removeUrl}
                            handleAiGenerate={handleAiGenerate} handleConfirmProfile={handleConfirmProfile} loading={loading}
                        />
                    )}

                    {activeTab === 'identity' && (
                        <IdentityTab 
                            language={language} formData={formData} setFormData={setFormData} services={services}
                            integrationKeys={integrationKeys} handleSave={handleSave} loading={loading}
                        />
                    )}

                    {activeTab === 'knowledge' && (
                        <KnowledgeTab 
                            language={language} t={t} formData={formData} setFormData={setFormData} services={services}
                            editingService={editingService} setEditingService={setEditingService}
                            newService={newService} setNewService={setNewService}
                            handleAddService={handleAddService} handleUpdateService={handleUpdateService} handleDeleteService={handleDeleteService}
                            newFaq={newFaq} setNewFaq={setNewFaq} handleSave={handleSave} loading={loading}
                        />
                    )}

                    {activeTab === 'integrations' && (
                        <IntegrationsTab 
                            language={language} currentUserId={currentUserId} agentId={agentId} entityId={entityId}
                            formData={formData} integrationKeys={integrationKeys} integrationDraft={integrationDraft} setIntegrationDraft={setIntegrationDraft}
                            expandedIntegration={expandedIntegration} setExpandedIntegration={setExpandedIntegration}
                            integrationSaving={integrationSaving} saveSuccess={saveSuccess} requestSuccess={requestSuccess}
                            openIntegration={openIntegration} handleSaveIntegration={handleSaveIntegration}
                            handleOAuthConnect={handleOAuthConnect} loadingOAuth={null} // OAuth handling simplified or removed for now if not used
                            activeFieldGuide={activeFieldGuide} setActiveFieldGuide={setActiveFieldGuide}
                            setStatusMsg={setStatusMsg} handleTestSheetsConnection={handleTestSheetsConnection}
                            handleTestCalendarConnection={handleTestCalendarConnection} isTestingSheets={isTestingSheets}
                            isTestingCalendar={isTestingCalendar} setShowHelpModal={setShowHelpModal} setHelpModalType={setHelpModalType}
                        />
                    )}

                    {activeTab === 'activation' && (
                        <ActivationTab 
                            language={language} loading={loading} setStatusMsg={setStatusMsg} setPaymentSuccess={setPaymentSuccess}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default EntitySetup;
