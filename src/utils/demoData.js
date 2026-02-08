/**
 * Demo Data Generator for Elite Agents Platform
 * استخدم هذا الملف لإضافة بيانات تجريبية إلى قاعدة البيانات للاختبار
 */

import { createAgent, saveContract, createTask } from '../services/supabaseService';

export const generateDemoData = async () => {
    try {
        console.log('🚀 بدء إنشاء البيانات التجريبية...');

        // 1. Create demo agent for medical clinic
        const medicalAgent = await createAgent({
            name: 'عيادة الدكتور أحمد للأسنان',
            specialty: 'Medical Clinic - طب الأسنان'
        });

        if (!medicalAgent.success) {
            throw new Error('Failed to create medical agent');
        }

        console.log('✅ تم إنشاء وكيل العيادة الطبية');

        // 2. Save contract for medical agent
        const medicalContract = {
            businessName: 'عيادة الدكتور أحمد للأسنان',
            businessType: 'عيادة طبية',
            specialty: 'طب الأسنان',
            workingHours: {
                start: '09:00',
                end: '21:00',
                timezone: 'Asia/Riyadh'
            },
            services: [
                'فحص روتيني',
                'تنظيف أسنان',
                'حشوات تجميلية',
                'تبييض الأسنان',
                'علاج الجذور'
            ],
            appointmentDuration: 30,
            rules: [
                'لا تحجز مواعيد خارج ساعات العمل',
                'يجب ترك 15 دقيقة بين كل موعد وآخر',
                'الحالات الطارئة لها أولوية',
                'تأكيد الموعد قبل 24 ساعة'
            ],
            priorities: [
                'الحالات الطارئة أولاً',
                'المرضى القدامى لهم أولوية الحجز',
                'دقة تسجيل بيانات المرضى'
            ],
            constraints: [
                'الطبيب يعمل 6 أيام في الأسبوع (الجمعة إجازة)',
                'أقصى عدد مواعيد في اليوم: 20 موعد',
                'لا يمكن إلغاء الموعد قبل أقل من 6 ساعات'
            ]
        };

        await saveContract(medicalAgent.data.id, medicalContract);
        console.log('✅ تم حفظ عقد العيادة الطبية');

        // 3. Create demo tasks for medical clinic
        const demoTasks = [
            {
                agentId: medicalAgent.data.id,
                taskType: 'appointment',
                taskData: {
                    patientName: 'محمد عبدالله',
                    phoneNumber: '+966501234567',
                    appointmentDate: '2026-02-10',
                    appointmentTime: '10:00',
                    service: 'فحص روتيني',
                    notes: 'موعد أول مرة'
                }
            },
            {
                agentId: medicalAgent.data.id,
                taskType: 'appointment',
                taskData: {
                    patientName: 'فاطمة أحمد',
                    phoneNumber: '+966502345678',
                    appointmentDate: '2026-02-10',
                    appointmentTime: '11:00',
                    service: 'تنظيف أسنان',
                    notes: 'مريضة دائمة'
                }
            },
            {
                agentId: medicalAgent.data.id,
                taskType: 'patient_data',
                taskData: {
                    patientName: 'خالد محمد',
                    age: 35,
                    phoneNumber: '+966503456789',
                    medicalHistory: ['حساسية من البنسلين'],
                    lastVisit: '2026-01-15',
                    nextVisit: '2026-02-15'
                }
            },
            {
                agentId: medicalAgent.data.id,
                taskType: 'appointment',
                taskData: {
                    patientName: 'نور الهدى',
                    phoneNumber: '+966504567890',
                    appointmentDate: '2026-02-11',
                    appointmentTime: '14:00',
                    service: 'تبييض الأسنان',
                    notes: 'طلب خاص'
                }
            },
            {
                agentId: medicalAgent.data.id,
                taskType: 'patient_data',
                taskData: {
                    patientName: 'عبدالعزيز سعود',
                    age: 42,
                    phoneNumber: '+966505678901',
                    medicalHistory: ['ضغط دم مرتفع', 'سكري'],
                    lastVisit: '2026-01-20',
                    nextVisit: '2026-02-20'
                }
            },
        ];

        for (const task of demoTasks) {
            await createTask(task);
        }

        console.log(`✅ تم إنشاء ${demoTasks.length} مهام تجريبية`);

        // Store agent ID for dashboard
        localStorage.setItem('currentAgentId', medicalAgent.data.id);
        console.log('✅ تم حفظ معرف الوكيل في localStorage');

        return {
            success: true,
            agentId: medicalAgent.data.id,
            message: 'تم إنشاء البيانات التجريبية بنجاح!'
        };

    } catch (error) {
        console.error('❌ خطأ في إنشاء البيانات التجريبية:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Beauty Salon Demo Data
export const generateBeautySalonDemo = async () => {
    try {
        const salonAgent = await createAgent({
            name: 'صالون الجمال الراقي',
            specialty: 'Beauty Salon - صالون تجميل'
        });

        if (!salonAgent.success) {
            throw new Error('Failed to create salon agent');
        }

        const salonContract = {
            businessName: 'صالون الجمال الراقي',
            businessType: 'صالون تجميل',
            specialty: 'عناية شاملة بالمرأة',
            workingHours: {
                start: '10:00',
                end: '22:00',
                timezone: 'Asia/Riyadh'
            },
            services: [
                'قص شعر',
                'صبغة',
                'فرد برازيلي',
                'مكياج',
                'عناية بالبشرة',
                'مناكير وباديكير'
            ],
            appointmentDuration: 60,
            rules: [
                'الحجز المسبق ضروري',
                'لا يقبل الإلغاء قبل أقل من 4 ساعات',
                'خدمات الفرد تحتاج 3 ساعات',
                'المكياج يحجز قبل المناسبة بـ 48 ساعة'
            ],
            priorities: [
                'مناسبات الزفاف لها أولوية',
                'العميلات الدائمات لهن خصم 10%'
            ],
            constraints: [
                'عدد كراسي التصفيف: 4',
                'أقصى حجز في نفس الوقت: 4 عميلات'
            ]
        };

        await saveContract(salonAgent.data.id, salonContract);

        const salonTasks = [
            {
                agentId: salonAgent.data.id,
                taskType: 'appointment',
                taskData: {
                    clientName: 'سارة عبدالله',
                    phoneNumber: '+966506789012',
                    appointmentDate: '2026-02-09',
                    appointmentTime: '16:00',
                    service: 'قص شعر + صبغة',
                    notes: 'عميلة دائمة'
                }
            },
            {
                agentId: salonAgent.data.id,
                taskType: 'appointment',
                taskData: {
                    clientName: 'ريم محمد',
                    phoneNumber: '+966507890123',
                    appointmentDate: '2026-02-10',
                    appointmentTime: '18:00',
                    service: 'مكياج زفاف',
                    notes: 'مناسبة خاصة - حفل زفاف'
                }
            }
        ];

        for (const task of salonTasks) {
            await createTask(task);
        }

        return {
            success: true,
            agentId: salonAgent.data.id,
            message: 'تم إنشاء بيانات صالون التجميل بنجاح!'
        };

    } catch (error) {
        console.error('❌ خطأ في إنشاء بيانات الصالون:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
