document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    const orderItemsContainer = document.getElementById('orderItems');
    const orderTotalEl = document.getElementById('orderTotal');
    const menuList = document.getElementById('menuList');
    const tableSelect = document.getElementById('tableSelect');
    const resetBtn = document.getElementById('resetBtn');
    const refreshMenuBtn = document.getElementById('refreshMenuBtn');

    // Generate a unique session ID for this browser tab
    let sessionId = crypto.randomUUID();

    // Init
    loadMenu();

    // Event Listeners
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text) return;

        // Display user message
        appendMessage('user', text);
        messageInput.value = '';

        // Show typing indicator
        const typingId = showTypingIndicator();

        try {
            const tableId = parseInt(tableSelect.value, 10);
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, session_id: sessionId, table_id: tableId })
            });

            const data = await response.json();
            
            // Remove typing indicator
            document.getElementById(typingId)?.remove();

            // Display AURA reply
            appendMessage('aura', data.reply);

            // Update Order Panel
            updateOrderPanel(data.order_state);

            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;

        } catch (error) {
            console.error('Chat error:', error);
            document.getElementById(typingId)?.remove();
            appendMessage('aura', "Sorry, I'm having trouble connecting to the server.");
        }
    });

    resetBtn.addEventListener('click', async () => {
        try {
            await fetch(`/api/session/reset?session_id=${sessionId}`, { method: 'POST' });
            updateOrderPanel([]);
            chatMessages.innerHTML = '';
            appendMessage('aura', "Session reset! What would you like to order?");
        } catch (error) {
            console.error('Reset error:', error);
        }
    });

    refreshMenuBtn.addEventListener('click', loadMenu);

    // Helpers
    function appendMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}-message`;
        
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = text;
        
        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message aura-message';
        msgDiv.id = id;
        
        msgDiv.innerHTML = `
            <div class="bubble">
                <div class="typing-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    function updateOrderPanel(orderState) {
        if (!orderState || orderState.length === 0) {
            orderItemsContainer.innerHTML = '<div class="empty-state">No items added yet.</div>';
            orderTotalEl.textContent = 'Rs 0.00';
            return;
        }

        orderItemsContainer.innerHTML = '';
        let total = 0;

        orderState.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const el = document.createElement('div');
            el.className = 'order-item';
            el.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-qty">Qty: ${item.quantity}</span>
                </div>
                <div class="item-price">Rs ${itemTotal.toFixed(2)}</div>
            `;
            orderItemsContainer.appendChild(el);
        });

        orderTotalEl.textContent = `Rs ${total.toFixed(2)}`;
    }

    async function loadMenu() {
        try {
            menuList.innerHTML = '<div class="loading-state">Loading...</div>';
            const response = await fetch('/api/menu');
            const data = await response.json();
            
            if (!data.menu || data.menu.length === 0) {
                menuList.innerHTML = '<div class="empty-state">Menu is empty.</div>';
                return;
            }

            menuList.innerHTML = '';
            data.menu.forEach(item => {
                const el = document.createElement('div');
                el.className = 'menu-row';
                el.innerHTML = `
                    <span>${item.name}</span>
                    <span style="color: var(--primary)">Rs ${item.price}</span>
                `;
                menuList.appendChild(el);
            });
        } catch (error) {
            console.error('Menu load error:', error);
            menuList.innerHTML = '<div class="empty-state">Failed to load menu.</div>';
        }
    }
});
