const fs = require('fs');
const path = require('path');

const filePath = "c:\\Users\\moza4\\Smart Employees\\src\\components\\InterviewRoom.jsx";
let lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

function replaceRange(start, end, newLines) {
    // start and end are 1-indexed
    const startIndex = start - 1;
    const count = end - start + 1;
    lines.splice(startIndex, count, ...newLines.split('\n'));
}

// 1. roleTitle (373-375)
replaceRange(373, 375, `            const roleTitle = isArabic
                ? (adminTitleAr || activeAgentMap[targetId]?.title || templateTitle || genericRoleTitle)
                : (adminTitleEn || targetTemplate.name_en || (t('templates.aiConsultant')) || genericRoleTitle);`);

// 2. initialMessages (377-416)
replaceRange(377, 416, `            const initialMessages = {
                medical: t('interview.greetingMedical').replace('{name}', agentName).replace('{role}', roleTitle),
                realestate: t('interview.greetingRealEstate').replace('{name}', agentName).replace('{role}', roleTitle),
                beauty: t('interview.greetingBeauty').replace('{name}', agentName).replace('{role}', roleTitle),
                restaurant: t('interview.greetingRestaurant').replace('{name}', agentName).replace('{role}', roleTitle),
                fitness: t('interview.greetingFitness').replace('{name}', agentName).replace('{role}', roleTitle),
                general: t('interview.greetingGeneral').replace('{name}', agentName).replace('{role}', roleTitle)
            };`);

// 3. setMessages (419-427)
replaceRange(419, 427, `            setMessages([
                {
                    role: 'agent',
                    content: isOwnerSession 
                        ? t('interview.readyForDuty')
                        : (initialMessages[detectedIndustry] || initialMessages.general),
                    timestamp: new Date(),
                }
            ]);`);

// 4. Low credit (592-601)
replaceRange(592, 601, `                if (creditResult.isLow) {
                    setMessages(prev => [
                        ...prev,
                        {
                            role: 'agent',
                            content: t('interview.lowCredit').replace('{credit}', creditResult.remaining),
                            timestamp: new Date(),
                        }
                    ]);
                }`);

// 5. Booking responses (619-625)
replaceRange(619, 625, `                        if (error) {
                            console.error("Booking Error:", error);
                            return { status: "error", message: t('tools.bookingError').replace('{error}', error.message) };
                        }
                        return { status: "success", message: t('tools.bookingSuccess') };
                    }
                    return { status: "success", message: t('tools.bookingDemoSuccess') };`);

// 6. Price update (634-637)
replaceRange(634, 637, `                    const res = await updateServicePrice(entityId, args.serviceName, args.newPrice);
                    if (res.success) return { status: "success", message: t('tools.priceUpdateSuccess').replace('{service}', args.serviceName).replace('{price}', args.newPrice) };
                    return { error: t('tools.priceUpdateError').replace('{error}', res.error) };`);

// 7. Booking details update (644-646)
replaceRange(644, 646, `                    const res = await updateBookingDetails(args.bookingId, updates);
                    if (res.success) return { status: "success", message: t('tools.bookingUpdateSuccess') };
                    return { error: t('tools.bookingUpdateError').replace('{error}', res.error) };`);

// 8. Customer notes update (661-666)
replaceRange(661, 666, `                        if (error) {
                            console.error("Notes Error:", error);
                            return { status: "error", message: t('tools.customerNotesError').replace('{error}', error.message) };
                        }
                        return { status: "success", message: t('tools.customerNotesSuccess') };
                    }
                    return { status: "success", message: t('tools.customerNotesSuccess') };`);

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log("Successfully updated InterviewRoom.jsx");
