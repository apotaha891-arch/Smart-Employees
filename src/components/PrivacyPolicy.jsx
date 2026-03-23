import React from 'react';
import { useLanguage } from '../LanguageContext';

const PrivacyPolicy = () => {
    const { language } = useLanguage();

    return (
        <div className="max-w-4xl mx-auto px-6 py-20 bg-white text-gray-800">
            <h1 className="text-3xl font-bold mb-8">
                {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </h1>
            
            <section className="space-y-6">
                <p>
                    {language === 'ar' 
                        ? 'نحن في 24Shift ملتزمون بحماية خصوصيتك. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك عند استخدام خدماتنا، بما في ذلك تكامل إنستغرام.'
                        : 'At 24Shift, we are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our services, including Instagram integration.'}
                </p>

                <h2 className="text-xl font-semibold">
                    {language === 'ar' ? '1. المعلومات التي نجمعها' : '1. Information We Collect'}
                </h2>
                <p>
                    {language === 'ar'
                        ? 'عند ربط حساب إنستغرام الخاص بك، نصل فقط إلى الرسائل والتعليقات لتمكين الرد التلقائي بواسطة الموظف الرقمي. لا نقوم بتخزين كلمات مرورك.'
                        : 'When you link your Instagram account, we only access messages and comments to enable automated replies by the AI agent. We do not store your passwords.'}
                </p>

                <h2 className="text-xl font-semibold">
                    {language === 'ar' ? '2. كيف نستخدم معلوماتك' : '2. How We Use Your Information'}
                </h2>
                <p>
                    {language === 'ar'
                        ? 'تستخدم البيانات فقط لتقديم خدمات الرد الآلي وتحسين تجربة خدمة العملاء لمنشأتك.'
                        : 'Data is used solely to provide automated response services and improve the customer service experience for your business.'}
                </p>

                <h2 className="text-xl font-semibold">
                    {language === 'ar' ? '3. حماية البيانات' : '3. Data Security'}
                </h2>
                <p>
                    {language === 'ar'
                        ? 'نحن نستخدم إجراءات أمنية متقدمة لحماية بياناتك من الوصول غير المصرح به.'
                        : 'We use advanced security measures to protect your data from unauthorized access.'}
                </p>

                <p className="mt-12 text-sm text-gray-500">
                    {language === 'ar' ? 'آخر تحديث: مارس 2026' : 'Last Updated: March 2026'}
                </p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
