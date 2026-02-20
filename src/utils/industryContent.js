const industryData = {
    ar: {
        general: {
            id: 'general',
            heroTitle: "وظّف وكلاءك الأذكياء لرفع كفاءة منشأتك",
            heroDescription: "منصة Elite Agents تمكنك من استقطاب أفضل الكفاءات الرقمية المدربة على أعلى المعايير لخدمة عملائك وزيادة مبيعاتك على مدار الساعة.",
            img: "https://images.pexels.com/photos/3182811/pexels-photo-3182811.jpeg?auto=compress&cs=tinysrgb&w=800",
            quote: "نحن لا نوفر تقنية، نحن نوفر الوقت والراحة لمدراء المستقبل.",
            recommendations: [
                {
                    title: "تحسين تجربة العميل",
                    desc: "وكلاء الاستقبال الرقمي يقللون وقت الانتظار بنسبة 80% ويزيدون من رضا العملاء."
                },
                {
                    title: "التوسع السريع",
                    desc: "أضف كفاءات جديدة في دقائق بدلاً من شهور البحث والتدريب التقليدي."
                }
            ]
        },
        medical: {
            id: 'medical',
            heroTitle: "موظف استقبال رقمي لعيادتك.. عناية فائقة بمرضاك",
            heroDescription: "اجعل عيادتك تعمل بكفاءة 24/7. وكلاؤنا الأذكياء متخصصون في جدولة المواعيد الطبية، الإجابة على استفسارات المرضى، وتنظيم سجلاتهم بدقة طبية عالية.",
            img: "https://images.pexels.com/photos/3845129/pexels-photo-3845129.jpeg?auto=compress&cs=tinysrgb&w=800",
            quote: "صحة عمل عيادتك تبدأ بتقديم خدمة عملاء استثنائية وسلسة.",
            recommendations: [
                {
                    title: "تنسيق المواعيد الطبية",
                    desc: "تجنب تضارب المواعيد وضمن امتلاء جدول الطبيب عبر نظام حجز ذكي وودود."
                },
                {
                    title: "متابعة ما بعد العلاج",
                    desc: "آلية تلقائية للاطمئنان على المرضى وتذكيرهم بمواعيد المتابعة القادمة."
                }
            ]
        },
        realestate: {
            id: 'realestate',
            heroTitle: "مستشارك العقاري الرقمي.. لا تفوت أي فرصة بيع",
            heroDescription: "حوّل استفسارات واتساب إلى صفقات حقيقية. وكلائنا الأذكياء مدربون على عرض العقارات، الرد على اعتراضات العملاء، وتصنيف المهتمين بدقة عالية.",
            img: "https://images.pexels.com/photos/8293778/pexels-photo-8293778.jpeg?auto=compress&cs=tinysrgb&w=800",
            quote: "في العقار، السرعة في الرد هي الفرق بين إغلاق الصفقة وضياعها.",
            recommendations: [
                {
                    title: "عرض الفلل والشقق",
                    desc: "تقديم تفاصيل المساحات والأسعار والمواقع لعملائك بمجرد طلبهم، وبأسلوب لبق."
                },
                {
                    title: "تصنيف المشترين الجادين",
                    desc: "يقوم الوكيل بتحديد ميزانية العميل واحتياجاته قبل تحويله لموظف المبيعات البشري."
                }
            ]
        },
        beauty: {
            id: 'beauty',
            heroTitle: "حوّلي صالونك إلى وجهة ذكية للجمال",
            heroDescription: "وكيل الاستقبال الذكي ينظم حجوزات الأميرات، ينسق جداول الخبيرات، ويقترح الخدمات الإضافية لزيادة أرباح صالونك بكل رقة واحترافية.",
            img: "https://images.pexels.com/photos/3985338/pexels-photo-3985338.jpeg?auto=compress&cs=tinysrgb&w=800",
            quote: "الجمال يبدأ من اللحظة التي يقرر فيها العميل حجز خدمته الأولى.",
            recommendations: [
                {
                    title: "إدارة حجوزات الخدمات",
                    desc: "تنسيق دقيق بين خدمات الشعر، المكياج، والسبا لمنع أي انتظار مزعج للعميلات."
                },
                {
                    title: "عروض الدلال والجمال",
                    desc: "إرسال عروض ترويجية مخصصة للعميلات الأوفياء لزيادة عدد الزيارات الشهرية."
                }
            ]
        },
        restaurant: {
            id: 'restaurant',
            heroTitle: "مضيف رقمي لمطعمك.. إدارة طاولات بذكاء عالمي",
            heroDescription: "لا تفقد زبوناً بسبب انشغال الخط. وكيلنا الذكي يدير الحجوزات، يؤكد المواعيد، وينظم قائمة الانتظار بأسلوب يفتح الشهية للزيارة.",
            img: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800",
            quote: "تجربة الطعام المميزة تبدأ من جودة الاستقبال ووضوح الحجز.",
            recommendations: [
                {
                    title: "تنظيم الطاولات والانتظار",
                    desc: "توزيع ذكي للضيوف على الطاولات المتاحة وتقليل الضغط على طاقم الخدمة الأرضي."
                },
                {
                    title: "تأكيد الطلبات المسبقة",
                    desc: "إمكانية تنسيق طلبات المناسبات الخاصة وتأكيد الحجوزات الكبيرة تلقائياً."
                }
            ]
        },
        fitness: {
            id: 'fitness',
            heroTitle: "منسق رياضي ذكي.. طاقة لا تنضب لناديك",
            heroDescription: "حوّل ناديك الرياضي إلى بيئة تفاعلية. وكيلنا الذكي يحجز حصص التدريب، يتابع التزامات المشتركين، ويجيب على استفسارات الاشتراكات والبرامج.",
            img: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800",
            quote: "الالتزام هو سر النجاح، ووكيلنا هنا ليضمن التزام عملائك بأهدافهم الرياضية.",
            recommendations: [
                {
                    title: "جدولة حصص التدريب",
                    desc: "نظام سلس لحجز حصص اليوغا، الكروسفيت، أو التدريب الشخصي دون تدخل يدوي."
                },
                {
                    title: "تحفيز المشتركين",
                    desc: "إرسال رسائل تشجيعية وتذكير بالمواعيد لضمان استمرارية تجديد الاشتراكات."
                }
            ]
        }
    },
    en: {
        general: {
            id: 'general',
            heroTitle: "Hire Smart AI Agents to Boost Your Business Efficiency",
            heroDescription: "Elite Agents platform enables you to recruit top-tier digital talent trained to the highest standards to serve your customers and increase sales around the clock.",
            img: "https://images.pexels.com/photos/3182811/pexels-photo-3182811.jpeg?auto=compress&cs=tinysrgb&w=800",
            quote: "We don't provide technology, we provide time and peace of mind for tomorrow's leaders.",
            recommendations: [
                {
                    title: "Improve Customer Experience",
                    desc: "Digital reception agents reduce wait times by 80% and increase customer satisfaction significantly."
                },
                {
                    title: "Rapid Expansion",
                    desc: "Add new capabilities in minutes instead of months of traditional recruitment and training."
                }
            ]
        },
        medical: {
            id: 'medical',
            heroTitle: "Digital Receptionist for Your Clinic - Premium Care for Your Patients",
            heroDescription: "Make your clinic operate 24/7 efficiently. Our smart agents specialize in scheduling medical appointments, answering patient inquiries, and organizing records with high medical precision.",
            img: "https://images.pexels.com/photos/3845129/pexels-photo-3845129.jpeg?auto=compress&cs=tinysrgb&w=800",
            quote: "The health of your clinic's operations begins with exceptional and seamless customer service.",
            recommendations: [
                {
                    title: "Medical Appointment Scheduling",
                    desc: "Avoid scheduling conflicts and ensure your doctor's schedule is fully booked with an intelligent and friendly booking system."
                },
                {
                    title: "Post-Treatment Follow-up",
                    desc: "Automated system to check on patients and remind them of upcoming follow-up appointments."
                }
            ]
        },
        realestate: {
            id: 'realestate',
            heroTitle: "Your Digital Real Estate Advisor - Don't Miss Any Sale",
            heroDescription: "Convert WhatsApp inquiries into real deals. Our smart agents are trained to showcase properties, handle customer objections, and identify serious buyers with high accuracy.",
            img: "https://images.pexels.com/photos/8293778/pexels-photo-8293778.jpeg?auto=compress&cs=tinysrgb&w=800",
            quote: "In real estate, the speed of response is the difference between closing a deal and losing it.",
            recommendations: [
                {
                    title: "Property Showcase",
                    desc: "Present property details, prices, and locations to clients on demand in a professional manner."
                },
                {
                    title: "Identify Serious Buyers",
                    desc: "The agent identifies buyer budgets and needs before transferring to your human sales team."
                }
            ]
        },
        beauty: {
            id: 'beauty',
            heroTitle: "Transform Your Beauty Salon Into a Smart Destination",
            heroDescription: "A smart reception agent organizes bookings, coordinates stylist schedules, and suggests add-on services to increase your salon's revenue with elegance and professionalism.",
            img: "https://images.pexels.com/photos/3985338/pexels-photo-3985338.jpeg?auto=compress&cs=tinysrgb&w=800",
            quote: "Beauty begins the moment a client decides to book their first service.",
            recommendations: [
                {
                    title: "Service Booking Management",
                    desc: "Seamless coordination between hair, makeup, and spa services to prevent client wait times."
                },
                {
                    title: "Beauty Promotions",
                    desc: "Send personalized promotional offers to loyal clients to increase monthly visits."
                }
            ]
        },
        restaurant: {
            id: 'restaurant',
            heroTitle: "Digital Host for Your Restaurant - Smart Table Management",
            heroDescription: "Never lose a customer due to a busy line. Our smart agent manages reservations, confirms bookings, and organizes the waitlist with a professional touch.",
            img: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=800",
            quote: "A memorable dining experience starts with excellent reception and clear booking management.",
            recommendations: [
                {
                    title: "Table & Waitlist Management",
                    desc: "Smart distribution of guests across available tables while reducing pressure on your service team."
                },
                {
                    title: "Pre-Order Confirmations",
                    desc: "Coordinate special event orders and automatically confirm large reservations."
                }
            ]
        },
        fitness: {
            id: 'fitness',
            heroTitle: "Smart Fitness Coordinator - Unlimited Energy for Your Gym",
            heroDescription: "Transform your fitness center into an interactive environment. Our smart agent books training sessions, tracks member commitments, and answers subscription inquiries.",
            img: "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800",
            quote: "Commitment is the secret to success, and our agent ensures your clients stay committed to their fitness goals.",
            recommendations: [
                {
                    title: "Training Session Scheduling",
                    desc: "Seamless system to book yoga, CrossFit, or personal training sessions without manual intervention."
                },
                {
                    title: "Member Motivation",
                    desc: "Send motivational messages and appointment reminders to ensure continuous membership renewals."
                }
            ]
        }
    }
};

export const getIndustryContent = (industryType = 'general', language = 'ar') => {
    const langData = industryData[language] || industryData.ar;
    return langData[industryType] || langData.general;
};
