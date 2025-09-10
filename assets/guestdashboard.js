// ✅ Security utilities
function sanitizeInput(input) {
    return input.toString().trim().replace(/[<>"'&]/g, '');
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
}

function validateOrderData(order) {
    return order && 
           order._id && 
           order.orderItems && 
           Array.isArray(order.orderItems) &&
           order.orderStatus &&
           order.paymentStatus;
}

// ✅ Rate limiting for API calls
const apiRateLimiter = {
    requests: new Map(),
    maxRequests: 30,
    windowMs: 60000, // 1 minute
    
    canMakeRequest(endpoint) {
        const now = Date.now();
        const requests = this.requests.get(endpoint) || [];
        
        const recentRequests = requests.filter(time => now - time < this.windowMs);
        
        if (recentRequests.length >= this.maxRequests) {
            return false;
        }
        
        recentRequests.push(now);
        this.requests.set(endpoint, recentRequests);
        return true;
    }
};

// ✅ Initialize DOM elements with error handling
document.addEventListener('DOMContentLoaded', () => {
    const trackBtn = document.getElementById('trackBtn');
    if (!trackBtn) {
        console.error('Track button not found');
        return;
    }

    // ✅ Secure order tracking functionality
    trackBtn.addEventListener('click', async () => {
        const emailInput = document.getElementById('trackEmail');
        const phoneInput = document.getElementById('trackPhone');
        const resultBox = document.querySelector('.result-box');
        const errorBox = document.getElementById('errorMessage');
        
        // Validate DOM elements exist
        if (!emailInput || !phoneInput || !resultBox || !errorBox) {
            console.error('Required DOM elements not found');
            return;
        }
        
        const email = sanitizeInput(emailInput.value);
        const phone = sanitizeInput(phoneInput.value);
        
        resultBox.innerHTML = '';
        errorBox.innerHTML = '';
        
        // Show loading state
        resultBox.innerHTML = `
            <div class="loading-message">
                <i class="fa fa-spinner fa-spin" aria-hidden="true"></i>
                <p>Searching for your orders...</p>
            </div>
        `;

        // Validate inputs
        if (!validateEmail(email) || !validatePhone(phone)) {
            resultBox.innerHTML = '';
            errorBox.textContent = 'Valid email and 10-digit phone are required.';
            return;
        }

        if (!apiRateLimiter.canMakeRequest('track-order')) {
            resultBox.innerHTML = '';
            errorBox.textContent = 'Too many requests. Please try again later.';
            return;
        }

        try {
            const response = await fetch(`${getAPIURL()}/orders/track-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, phone })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (!data.orders || !Array.isArray(data.orders) || data.orders.length === 0) {
                errorBox.innerHTML = `
                    <div class="no-orders-message">
                        <i class="fa fa-search" aria-hidden="true"></i>
                        <p>No orders found with the provided email and phone number.</p>
                        <p class="suggestion">Please double-check your details and try again, or contact our support team if you need assistance.</p>
                    </div>
                `;
                return;
            }
            
            // Clear resultBox to avoid duplication
            resultBox.innerHTML = '';

            // Sort orders by date (newest first)
            data.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

            // Render each order
            data.orders.forEach((order) => {
                if (!validateOrderData(order)) {
                    console.warn('Invalid order data:', order);
                    return;
                }

                const items = order.orderItems.map(prod => `
                    <li class="order-item">
                        <div class="item-details">
                            <span class="item-name">${sanitizeInput(prod.name)}</span>
                            <span class="item-quantity">Qty: ${parseInt(prod.quantity) || 1}</span>
                        </div>
                        ${prod.price ? `<span class="item-price">₹${parseFloat(prod.price) || 0}</span>` : ''}
                    </li>
                `).join('');

                const orderHtml = `
                    <div class="order-block">
                        <!-- Order Header with ID and Date -->
                        <div class="order-header">
                            <div class="order-id">
                                <span class="order-label">Order ID:</span> 
                                <span class="order-value">${sanitizeInput(order.orderId || order._id)}</span>
                            </div>
                            <div class="order-date">
                                <span class="order-date-value">${new Date(order.orderDate).toLocaleString()}</span>
                            </div>
                        </div>

                        <!-- Order Status Section (Visually Prominent) -->
                        <div class="order-status-container">
                            <div class="order-status-text">
                                <h4>Order Status</h4>
                                <div class="status-grid">
                                    <div class="status-item">
                                        <div class="status-icon shipping-icon"></div>
                                        <div class="status-details">
                                            <span class="status-label">Status</span>
                                            <span class="status-value">${sanitizeInput(order.orderStatus)}</span>
                                        </div>
                                    </div>
                                    <div class="status-item">
                                        <div class="status-icon payment-icon"></div>
                                        <div class="status-details">
                                            <span class="status-label">Payment</span>
                                            <span class="status-value">${sanitizeInput(order.paymentStatus)}</span>
                                        </div>
                                    </div>
                                    <div class="status-item">
                                        <div class="status-icon method-icon"></div>
                                        <div class="status-details">
                                            <span class="status-label">Method</span>
                                            <span class="status-value">${sanitizeInput(order.paymentMethod)}</span>
                                        </div>
                                    </div>
                                    <div class="status-item">
                                        <div class="status-icon total-icon"></div>
                                        <div class="status-details">
                                            <span class="status-label">Total</span>
                                            <span class="status-value price">₹${parseFloat(order.finalTotal) || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tracking Information -->
                        <div class="tracking-info">
                            <div class="tracking-detail">
                                <span class="tracking-label">Tracking ID:</span>
                                <span class="tracking-value">${sanitizeInput(order.trackingId || "N/A")}</span>
                            </div>
                            <div class="tracking-detail">
                                <span class="tracking-label">Courier Partner:</span>
                                <span class="tracking-value">${sanitizeInput(order.courierPartner || "N/A")}</span>
                            </div>
                        </div>

                        <!-- Shipping Information -->
                        <div class="order-section">
                            <h5 class="section-title">Shipping Information</h5>
                            <div class="shipping-details">
                                <div class="customer-info">
                                    <div class="info-item"><span class="info-label">Name:</span> ${sanitizeInput(order.name)}</div>
                                    <div class="info-item"><span class="info-label">Email:</span> ${sanitizeInput(order.email)}</div>
                                    <div class="info-item"><span class="info-label">Phone:</span> ${sanitizeInput(order.phone)}</div>
                                </div>
                                <div class="address-info">
                                    <span class="info-label">Shipping Address:</span>
                                    <div class="address-text"> 
                                        ${order.shippingAddress ? `
                                            ${sanitizeInput(order.shippingAddress.street || '')}, 
                                            ${sanitizeInput(order.shippingAddress.city || '')}, 
                                            ${sanitizeInput(order.shippingAddress.state || '')}, 
                                            ${sanitizeInput(order.shippingAddress.zipcode || '')}, 
                                            ${sanitizeInput(order.shippingAddress.country || '')}
                                        ` : 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Order Summary -->
                        <div class="order-section">
                            <h5 class="section-title">Order Summary</h5>
                            <div class="price-details">
                                <div class="price-row">
                                    <span class="price-label">Item Total:</span>
                                    <span class="price-value">₹${parseFloat(order.totalPrice) || 0}</span>
                                </div>
                                <div class="price-row">
                                    <span class="price-label">Shipping Charges:</span>
                                    <span class="price-value">₹${parseFloat(order.shippingCharges) || 0}</span>
                                </div>
                                <div class="price-row">
                                    <span class="price-label">Applied Coupons:</span>
                                    <span class="price-value">${order.appliedCoupons && order.appliedCoupons.length > 0 ? order.appliedCoupons.map(c => sanitizeInput(c)).join(', ') : 'None'}</span>
                                </div>
                                <div class="price-row total-row">
                                    <span class="price-label">Final Total:</span>
                                    <span class="price-value total-price">₹${parseFloat(order.finalTotal) || 0}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Order Items -->
                        <div class="order-section">
                            <h5 class="section-title">Order Items</h5>
                            <ul class="order-items-list">${items}</ul>
                        </div>
                    </div>
                `;

                resultBox.innerHTML += orderHtml;
            });
        } catch (err) {
            console.error('Track Order Error:', err);
            
            // Provide specific error messages based on error type
            if (err.message.includes('404')) {
                errorBox.innerHTML = `
                    <div class="no-orders-message">
                        <i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
                        <p>No orders found with this email and phone number.</p>
                        <p class="suggestion">Please verify your email and phone number, or contact our support team for assistance.</p>
                    </div>
                `;
            } else if (err.message.includes('400')) {
                errorBox.innerHTML = `
                    <div class="error-message-box">
                        <i class="fa fa-times-circle" aria-hidden="true"></i>
                        <p>Invalid request. Please check your email and phone number format.</p>
                    </div>
                `;
            } else if (err.message.includes('500')) {
                errorBox.innerHTML = `
                    <div class="error-message-box">
                        <i class="fa fa-server" aria-hidden="true"></i>
                        <p>Server error occurred. Please try again in a few moments.</p>
                        <p class="suggestion">If the problem persists, please contact our support team.</p>
                    </div>
                `;
            } else {
                errorBox.innerHTML = `
                    <div class="error-message-box">
                        <i class="fa fa-wifi" aria-hidden="true"></i>
                        <p>Unable to connect to the server. Please check your internet connection and try again.</p>
                        <p class="suggestion">If you continue to experience issues, please contact our support team.</p>
                    </div>
                `;
            }
        }
    });
});
