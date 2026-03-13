(function() {
    // 24Shift Smart Agent Widget
    const scriptTag = document.currentScript;
    const agentId = scriptTag.getAttribute('data-agent-id');
    const accentColor = scriptTag.getAttribute('data-color') || '#8B5CF6';
    const businessName = scriptTag.getAttribute('data-name') || 'Smart Assistant';
    const welcomeMsg = scriptTag.getAttribute('data-welcome') || 'Hello! How can I help you today?';
    const apiUrl = scriptTag.getAttribute('data-api-url') || 'https://dydflepcfdrlslpxapqo.supabase.co/functions/v1/agent-handler';

    console.log('24Shift Widget: Initializing...', { agentId, businessName });

    if (!agentId) {
        console.error('24Shift Widget Error: data-agent-id is missing in the script tag.');
        return;
    }

    // Styles
    const styles = `
        #shift-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            direction: ltr;
        }
        #shift-widget-bubble {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: ${accentColor};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        #shift-widget-bubble:hover {
            transform: scale(1.1);
        }
        #shift-widget-bubble svg {
            width: 30px;
            height: 30px;
            fill: white;
        }
        #shift-widget-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 380px;
            height: 600px;
            max-height: calc(100vh - 120px);
            background: #FFFFFF;
            border-radius: 20px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.2);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(0,0,0,0.05);
        }
        #shift-widget-window.open {
            display: flex;
            animation: shift-slide-in 0.3s ease-out;
        }
        @keyframes shift-slide-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        #shift-header {
            background: ${accentColor};
            padding: 20px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        #shift-header-title {
            font-weight: 700;
            font-size: 1.1rem;
        }
        #shift-chat-area {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #F9FAFB;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .shift-msg {
            max-width: 80%;
            padding: 10px 14px;
            border-radius: 15px;
            font-size: 0.95rem;
            line-height: 1.4;
        }
        .shift-msg-ai {
            align-self: flex-start;
            background: white;
            color: #1F2937;
            border: 1px solid #E5E7EB;
            border-bottom-left-radius: 2px;
        }
        .shift-msg-user {
            align-self: flex-end;
            background: ${accentColor};
            color: white;
            border-bottom-right-radius: 2px;
        }
        #shift-input-area {
            padding: 15px;
            background: white;
            border-top: 1px solid #E5E7EB;
            display: flex;
            gap: 10px;
        }
        #shift-input {
            flex: 1;
            border: 1px solid #E5E7EB;
            border-radius: 25px;
            padding: 10px 18px;
            outline: none;
            font-size: 0.95rem;
        }
        #shift-input:focus {
            border-color: ${accentColor};
        }
        #shift-send {
            background: ${accentColor};
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: white;
        }
        .shift-typing {
            font-size: 0.8rem;
            color: #9CA3AF;
            margin-left: 5px;
            display: none;
        }
        @media (max-width: 480px) {
            #shift-widget-window {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                width: 100%; height: 100%; max-height: 100%;
                border-radius: 0;
            }
        }
    `;

    // Inject Styles
    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    // Create DOM elements
    const container = document.createElement('div');
    container.id = 'shift-widget-container';
    
    container.innerHTML = `
        <div id="shift-widget-window">
            <div id="shift-header">
                <div>
                    <div id="shift-header-title">${businessName}</div>
                    <div style="font-size: 0.75rem; opacity: 0.8;">Active Now</div>
                </div>
                <div id="shift-close" style="cursor:pointer; padding:5px;">✕</div>
            </div>
            <div id="shift-chat-area">
                <div class="shift-msg shift-msg-ai">${welcomeMsg}</div>
                <div id="shift-typing-indicator" class="shift-typing">${businessName} is typing...</div>
            </div>
            <form id="shift-input-area">
                <input type="text" id="shift-input" placeholder="Type your message..." autocomplete="off">
                <button type="submit" id="shift-send">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </form>
            <div style="text-align: center; padding: 10px; font-size: 0.7rem; color: #9CA3AF; background: #F9FAFB;">
                Powered by <a href="https://24shift.solutions" target="_blank" style="color: ${accentColor}; text-decoration: none; font-weight: bold;">24Shift</a>
            </div>
        </div>
        <div id="shift-widget-bubble">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
    `;

    document.body.appendChild(container);

    const bubble = document.getElementById('shift-widget-bubble');
    const window = document.getElementById('shift-widget-window');
    const closeBtn = document.getElementById('shift-close');
    const form = document.getElementById('shift-input-area');
    const input = document.getElementById('shift-input');
    const chatArea = document.getElementById('shift-chat-area');
    const typing = document.getElementById('shift-typing-indicator');

    // Persistence - Isolate session per agent to prevent context leakage
    let sessionKey = `shift_session_id_${agentId}`;
    let sessionId = localStorage.getItem(sessionKey);
    if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(sessionKey, sessionId);
    }

    // Toggle Window
    bubble.onclick = () => window.classList.toggle('open');
    closeBtn.onclick = () => window.classList.remove('open');

    // Handle Messages
    form.onsubmit = async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        addMessage(text, 'user');
        
        typing.style.display = 'block';
        chatArea.scrollTop = chatArea.scrollHeight;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    sessionId: sessionId,
                    agentId: agentId
                })
            });

            const data = await response.json();
            typing.style.display = 'none';
            
            if (data.success) {
                addMessage(data.text, 'ai');
            } else {
                addMessage("Sorry, I encountered an error. Please try again.", 'ai');
            }
        } catch (err) {
            console.error('24Shift Widget: API Connection Error:', err);
            typing.style.display = 'none';
            addMessage("Unable to connect to service. Please check your internet or configuration.", 'ai');
        }
    };

    function addMessage(text, sender) {
        const msg = document.createElement('div');
        msg.className = `shift-msg shift-msg-${sender}`;
        msg.innerText = text;
        chatArea.insertBefore(msg, typing);
        chatArea.scrollTop = chatArea.scrollHeight;
    }

})();
