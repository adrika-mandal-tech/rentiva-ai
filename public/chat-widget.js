(function () {
    // 1. Create Floating Button
    const chatBtn = document.createElement('div');
    chatBtn.id = 'rentiva-chat-btn';
    chatBtn.innerHTML = `
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4); transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: fixed; bottom: 30px; right: 30px; z-index: 9999; box-shadow: 0 8px 30px rgba(0,0,0,0.15); animation: pulse 2s infinite;"
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 28px; height: 28px; margin: auto;">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.023c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
        </div>
    `;
    document.body.appendChild(chatBtn);

    // Add pulse animation to head
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
                box-shadow: 0 8px 30px rgba(99, 102, 241, 0.3);
            }
            50% {
                transform: scale(1.05);
                box-shadow: 0 8px 40px rgba(99, 102, 241, 0.5);
            }
        }
        #rentiva-chat-btn div:hover {
            transform: scale(1.1) !important;
            box-shadow: 0 12px 35px rgba(99, 102, 241, 0.6) !important;
        }
    `;
    document.head.appendChild(style);

    // 2. Create Chat Window Container
    const chatWindow = document.createElement('div');
    chatWindow.id = 'rentiva-chat-window';
    chatWindow.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 30px;
        width: 400px;
        height: 650px;
        background: transparent;
        z-index: 10000;
        display: none;
        flex-direction: column;
        filter: drop-shadow(0 20px 50px rgba(0,0,0,0.4));
        user-select: none;
        max-width: calc(100vw - 60px);
        max-height: calc(100vh - 150px);
    `;

    chatWindow.innerHTML = `
        <!-- Drag Handle -->
        <div id="chat-drag-handle" style="height: 48px; background: rgba(15, 12, 41, 0.9); backdrop-filter: blur(20px); border-top-left-radius: 24px; border-top-right-radius: 24px; cursor: move; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="font-size: 11px; font-weight: 800; color: #6366f1; display: flex; align-items: center; gap: 10px; letter-spacing: 1px;">
                <span style="width: 8px; height: 8px; background: #00f2ff; border-radius: 50%; box-shadow: 0 0 10px #00f2ff;"></span>
                RENTIVA GALAXY
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <a href="/chat.html" target="_blank" title="Open Full Page" style="color: #94a3b8; transition: color 0.2s;">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 16px; height: 16px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                </a>
                <div id="close-chat" style="cursor: pointer; color: #94a3b8; padding: 5px;">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" style="width: 18px; height: 18px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
            </div>
        </div>
        <!-- Iframe -->
        <iframe src="/chat.html" style="flex: 1; border: none; border-bottom-left-radius: 24px; border-bottom-right-radius: 24px; background: transparent;"></iframe>
    `;
    document.body.appendChild(chatWindow);

    // 3. Toggle Logic
    const btn = chatBtn.querySelector('div');
    chatWindow.style.transition = 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
    chatWindow.style.opacity = '0';
    chatWindow.style.transform = 'translateY(20px) scale(0.95)';
    chatWindow.style.transformOrigin = 'bottom right';

    const toggleChat = (show) => {
        if (show) {
            chatWindow.style.display = 'flex';
            setTimeout(() => {
                chatWindow.style.opacity = '1';
                chatWindow.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0) scale(1)`;
            }, 10);
            btn.style.transform = 'scale(0.9) rotate(15deg)';
        } else {
            chatWindow.style.opacity = '0';
            chatWindow.style.transform = `translate3d(${xOffset}px, ${yOffset + 20}px, 0) scale(0.95)`;
            setTimeout(() => {
                if (chatWindow.style.opacity === '0') chatWindow.style.display = 'none';
            }, 400);
            btn.style.transform = 'scale(1)';
        }
    };

    btn.addEventListener('click', () => {
        const isHidden = chatWindow.style.display === 'none' || chatWindow.style.opacity === '0';
        toggleChat(isHidden);
    });

    chatWindow.querySelector('#close-chat').addEventListener('click', () => {
        toggleChat(false);
    });

    // 4. Draggable Logic
    const dragHandle = chatWindow.querySelector('#chat-drag-handle');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    dragHandle.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // Touch support
    dragHandle.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', dragEnd);

    function dragStart(e) {
        if (e.type === "touchstart") {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === dragHandle || dragHandle.contains(e.target)) {
            isDragging = true;
        }
    }

    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            if (e.type === "touchmove") {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, chatWindow);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    // Hover effect
    btn.addEventListener('mouseenter', () => {
        if (chatWindow.style.display === 'none') {
            btn.style.transform = 'translateY(-5px) scale(1.05)';
        }
    });
    btn.addEventListener('mouseleave', () => {
        if (chatWindow.style.display === 'none') {
            btn.style.transform = 'scale(1)';
        }
    });

})();
