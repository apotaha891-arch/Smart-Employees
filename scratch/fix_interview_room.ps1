
$filePath = "c:\Users\moza4\Smart Employees\src\components\InterviewRoom.jsx"
$content = Get-Content $filePath

# Replace initial messages block (Lines 377-416)
$newInitialMessages = @'
            const initialMessages = {
                medical: t('interview.greetingMedical').replace('{name}', agentName).replace('{role}', roleTitle),
                realestate: t('interview.greetingRealEstate').replace('{name}', agentName).replace('{role}', roleTitle),
                beauty: t('interview.greetingBeauty').replace('{name}', agentName).replace('{role}', roleTitle),
                restaurant: t('interview.greetingRestaurant').replace('{name}', agentName).replace('{role}', roleTitle),
                fitness: t('interview.greetingFitness').replace('{name}', agentName).replace('{role}', roleTitle),
                general: t('interview.greetingGeneral').replace('{name}', agentName).replace('{role}', roleTitle)
            };
'@

# Replace setMessages block (Lines 419-427)
$newSetMessages = @'
            setMessages([
                {
                    role: 'agent',
                    content: isOwnerSession 
                        ? t('interview.readyForDuty')
                        : (initialMessages[detectedIndustry] || initialMessages.general),
                    timestamp: new Date(),
                }
            ]);
'@

# Replace low credit warning (Lines 592-601)
$newLowCredit = @'
                if (creditResult.isLow) {
                    setMessages(prev => [
                        ...prev,
                        {
                            role: 'agent',
                            content: t('interview.lowCredit').replace('{credit}', creditResult.remaining),
                            timestamp: new Date(),
                        }
                    ]);
                }
'@

# Helper to replace line ranges
function Replace-Range($start, $end, $newText) {
    global:content = ($global:content[0..($start-2)]) + ($newText -split "`r?`n") + ($global:content[$end..($global:content.Length-1)])
}

# Apply replacements (starting from bottom to avoid shifting indices for later calls - actually line ranges are absolute so bottom-up is better)
# Range 592-601
Replace-Range 592 601 $newLowCredit
# Range 419 427
Replace-Range 419 427 $newSetMessages
# Range 377 416
Replace-Range 377 416 $newInitialMessages

# Replace roleTitle logic to fix template name fallback (Line 373-375)
$newRoleTitle = @'
            const roleTitle = isArabic
                ? (adminTitleAr || activeAgentMap[targetId]?.title || templateTitle || genericRoleTitle)
                : (adminTitleEn || targetTemplate.name_en || (t('templates.aiConsultant')) || genericRoleTitle);
'@
Replace-Range 373 375 $newRoleTitle

# Tool responses replacements
# Line 621-625 (Booking success/error)
$newBookingResponse = @'
                        if (error) {
                            console.error("Booking Error:", error);
                            return { status: "error", message: t('tools.bookingError').replace('{error}', error.message) };
                        }
                        return { status: "success", message: t('tools.bookingSuccess') };
                    }
                    return { status: "success", message: t('tools.bookingDemoSuccess') };
'@
Replace-Range 619 625 $newBookingResponse

# Line 634-637 (Price update)
$newPriceResponse = @'
                    const res = await updateServicePrice(entityId, args.serviceName, args.newPrice);
                    if (res.success) return { status: "success", message: t('tools.priceUpdateSuccess').replace('{service}', args.serviceName).replace('{price}', args.newPrice) };
                    return { error: t('tools.priceUpdateError').replace('{error}', res.error) };
'@
Replace-Range 634 637 $newPriceResponse

# Line 644-646 (Booking update)
$newUpdateResponse = @'
                    const res = await updateBookingDetails(args.bookingId, updates);
                    if (res.success) return { status: "success", message: t('tools.bookingUpdateSuccess') };
                    return { error: t('tools.bookingUpdateError').replace('{error}', res.error) };
'@
Replace-Range 644 646 $newUpdateResponse

# Line 662-666 (Notes update)
$newNotesResponse = @'
                        if (error) {
                            console.error("Notes Error:", error);
                            return { status: "error", message: t('tools.customerNotesError').replace('{error}', error.message) };
                        }
                        return { status: "success", message: t('tools.customerNotesSuccess') };
                    }
                    return { status: "success", message: t('tools.customerNotesSuccess') };
'@
Replace-Range 661 666 $newNotesResponse

$global:content | Set-Content $filePath -Encoding UTF8
