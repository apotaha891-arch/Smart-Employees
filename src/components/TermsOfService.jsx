import React from 'react';
import { useLanguage } from '../LanguageContext';

const TermsOfService = () => {
    const { language } = useLanguage();

    return (
        <div className="max-w-4xl mx-auto px-6 py-20 bg-white text-gray-800">
            <h1 className="text-3xl font-bold mb-8">
                {language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}
            </h1>
            
            <section className="space-y-6">
                <p>
                    {language === 'ar' 
                        ? 'أهلاً بك في 24Shift. باستخدام خدماتنا، فإنك توافق على الالتزام بهذه الشروط.'
                        : 'Welcome to 24Shift. By using our services, you agree to comply with these terms.'}
                </p>

                <h2 className="text-xl font-semibold">
                    {language === 'ar' ? '1. استخدام الخدمة' : '1. Service Usage'}
                </h2>
                <p>
                    {language === 'ar'
                        ? 'يجب استخدام الخدمة فقط للأغراض القانونية والتجارية المشروعة. يمنع استخدام الخدمة لإرسال رسائل مزعجة أو غير قانونية.'
                        : 'The service must be used only for legal and legitimate business purposes. Using the service for spam or illegal messaging is strictly prohibited.'}
                </p>

                <h2 className="text-xl font-semibold">
                    {language === 'ar' ? '2. حسابات إنستغرام' : '2. Instagram Accounts'}
                </h2>
                <p>
                    {language === 'ar'
                        ? 'أنت مسؤول عن الحفاظ على أمان حساب إنستغرام الخاص بك والأنشطة التي تجري من خلال تكاملنا.'
                        : 'You are responsible for maintaining the security of your Instagram account and the activities that occur through our integration.'}
                </p>

                <h2 className="text-xl font-semibold">
                    {language === 'ar' ? '3. المسؤولية' : '3. Liability'}
                </h2>
                <p>
                    {language === 'ar'
                        ? 'نحن نسعى جاهدين لتقديم خدمة موثوقة، ولكننا لسنا مسؤولين عن أي أخطاء ناتجة عن تغييرات في سياسات أو واجهات برمجة تطبيقات الطرف الثالث مثل Meta.'
                        : 'We strive to provide a reliable service, but we are not liable for any errors resulting from changes in policies or APIs of third parties like Meta.'}
                </p>

                <p className="mt-12 text-sm text-gray-500">
                    {language === 'ar' ? 'آخر تحديث: مارس 2026' : 'Last Updated: March 2026'}
                </p>
            </section>
        </div>
    );
};

export default TermsOfService;
