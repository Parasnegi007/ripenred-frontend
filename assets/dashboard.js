// ✅ Security utilities
function sanitizeInput(input) {
    return input.toString().trim().replace(/[<>"'&]/g, '');
}

// ✅ Notification system integration
function showNotification(message, type = 'info') {
    if (window.notifications) {
        window.notifications.show(message, type);
    } else {
        // Fallback to alert if notification system not loaded
        alert(message);
    }
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
}

function validateUserData(userData) {
    return userData && 
           typeof userData === 'object' && 
           userData.name && 
           userData.email && 
           userData.phone;
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

// ✅ Enhanced DOM ready handler
window.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("authToken");

    if (!token) {
        // 🚫 No token = Guest user
        window.location.href = "guest-dashboard.html";  // 🔁 Redirect to guest dashboard
        return;
    }

    if (!apiRateLimiter.canMakeRequest('profile')) {
        console.warn('Rate limit exceeded for profile fetch');
        return;
    }

    try {
        const response = await fetch(`${getAPIURL()}/users/profile`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch user details`);
        }

        const userData = await response.json();

        // ✅ Validate user data
        if (!validateUserData(userData)) {
            throw new Error("Invalid user data received");
        }

        // ✅ Store user data locally with sanitization
        const sanitizedUserData = {
            name: sanitizeInput(userData.name),
            email: sanitizeInput(userData.email),
            phone: sanitizeInput(userData.phone)
        };
        localStorage.setItem("loggedInUser", JSON.stringify(sanitizedUserData));

        // ✅ Update dashboard with sanitized user data
        const displayName = document.getElementById("display-name");
        const displayEmail = document.getElementById("display-email");
        const displayPhone = document.getElementById("display-phone");
        
        if (displayName) displayName.textContent = sanitizedUserData.name || "Not Provided";
        if (displayEmail) displayEmail.textContent = sanitizedUserData.email || "Not Provided";
        if (displayPhone) displayPhone.textContent = sanitizedUserData.phone || "Not Provided";

       // ✅ Continue loading full dashboard with userData...
    } catch (error) {
        console.error("Error:", error);
        // 🛠 Optional: fallback to guest dashboard if token is invalid
        localStorage.removeItem("authToken"); // Clean up invalid token
        window.location.href = "guest-dashboard.html"; // 🔁 Redirect to guest dashboard
    }

    // ✅ Secure logout functionality
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            try {
                // Clear all user data
                ['authToken', 'loggedInUser', 'sessionData'].forEach(key => {
                    localStorage.removeItem(key);
                    sessionStorage.removeItem(key);
                });
                
                // Clear rate limiter
                apiRateLimiter.requests.clear();
                
                window.location.href = "login.html";
            } catch (error) {
                console.error("Error during logout:", error);
                window.location.href = "login.html";
            }
        });
    }

    // ✅ Secure edit profile section
    const editProfileBtn = document.getElementById("edit-profile");
    if (editProfileBtn) {
        editProfileBtn.addEventListener("click", function () {
            const editProfileSection = document.getElementById("edit-profile-section");
            if (!editProfileSection) {
                console.error('Edit profile section not found');
                return;
            }
            
            editProfileSection.style.display = "block";

            try {
                const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
                if (!loggedInUser) {
                    throw new Error("No user data found");
                }
                
                const editName = document.getElementById("edit-name");
                const editEmail = document.getElementById("edit-email");
                const editPhone = document.getElementById("edit-phone");
                
                if (editName) editName.value = sanitizeInput(loggedInUser.name);
                if (editEmail) editEmail.value = sanitizeInput(loggedInUser.email);
                if (editPhone) editPhone.value = sanitizeInput(loggedInUser.phone);
            } catch (error) {
                console.error("Error loading user data for edit:", error);
                showNotification("Failed to load user data. Please refresh the page.", "error");
            }
        });
    }

    // ✅ Secure input monitoring
    const inputs = ["edit-name", "edit-email", "edit-phone"];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("input", function () {
                const saveBtn = document.getElementById("save-profile");
                if (saveBtn) {
                    saveBtn.style.display = "block";
                }
            });
        }
    });

    // ✅ Secure OTP visibility logic
    const emailInput = document.getElementById("edit-email");
    const phoneInput = document.getElementById("edit-phone");
    const sendOtpBtn = document.getElementById("send-otp");

    function checkIfChanged() {
        try {
            const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
            if (!loggedInUser) return;
            
            const updatedEmail = sanitizeInput(emailInput?.value || '');
            const updatedPhone = sanitizeInput(phoneInput?.value || '');

            const emailChanged = updatedEmail && updatedEmail !== loggedInUser.email;
            const phoneChanged = updatedPhone && updatedPhone !== loggedInUser.phone;

            if (sendOtpBtn) {
                sendOtpBtn.style.display = (emailChanged || phoneChanged) ? "block" : "none";
            }
        } catch (error) {
            console.error("Error checking input changes:", error);
        }
    }

    if (emailInput) emailInput.addEventListener("input", checkIfChanged);
    if (phoneInput) phoneInput.addEventListener("input", checkIfChanged);

    // ✅ Email & Phone Validation
    function validateInput(input, pattern) {
        if (pattern.test(input.value.trim())) {
            input.style.border = "2px solid green"; // ✅ Valid
        } else {
            input.style.border = "2px solid red"; // ❌ Invalid
        }
    }

    emailInput.addEventListener("input", function () {
        validateInput(this, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    phoneInput.addEventListener("input", function () {
        validateInput(this, /^[0-9]{10}$/);
    });

    // ✅ Secure OTP sending functionality
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener("click", async function () {
            if (!apiRateLimiter.canMakeRequest('send-otp')) {
                showNotification('Too many OTP requests. Please wait before trying again.', "warning");
                return;
            }

            try {
                const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
                if (!loggedInUser) {
                    throw new Error("No user data found");
                }

                const updatedEmail = sanitizeInput(emailInput?.value || '');
                const updatedPhone = sanitizeInput(phoneInput?.value || '');

                // Validate inputs
                if (updatedEmail && !validateEmail(updatedEmail)) {
                    showNotification("Please enter a valid email address!", "warning");
                    return;
                }
                if (updatedPhone && !validatePhone(updatedPhone)) {
                    showNotification("Please enter a valid 10-digit phone number!", "warning");
                    return;
                }

                if (!updatedEmail && !updatedPhone) {
                    showNotification("Enter a valid email or phone number!", "warning");
                    return;
                }

                sendOtpBtn.textContent = "Sending...";
                sendOtpBtn.disabled = true;

                const token = localStorage.getItem("authToken");
                if (!token) {
                    throw new Error("Authentication token not found");
                }

                const response = await fetch(`${getAPIURL()}/users/send-otp-update`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        email: updatedEmail || loggedInUser.email, 
                        phone: updatedPhone || loggedInUser.phone 
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                showNotification("OTP sent to your email and phone.", "success");
                
                const otpSection = document.getElementById("email-otp-section");
                if (otpSection) {
                    otpSection.style.display = "block";
                }
            } catch (error) {
                console.error("OTP Error:", error);
                showNotification("Failed to send OTP. Please try again.", "error");
            } finally {
                setTimeout(() => {
                    sendOtpBtn.textContent = "Send OTP";
                    sendOtpBtn.disabled = false;
                }, 5000);
            }
        });
    }

    // ✅ Secure save profile functionality
    const saveProfileBtn = document.getElementById("save-profile");
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener("click", async function () {
            if (!apiRateLimiter.canMakeRequest('update-profile')) {
                showNotification('Too many update requests. Please wait before trying again.', "warning");
                return;
            }

            try {
                const nameEl = document.getElementById("edit-name");
                const emailEl = document.getElementById("edit-email");
                const phoneEl = document.getElementById("edit-phone");
                const otpEl = document.getElementById("email-otp");

                const name = sanitizeInput(nameEl?.value || '');
                const email = sanitizeInput(emailEl?.value || '');
                const phone = sanitizeInput(phoneEl?.value || '');
                const otp = sanitizeInput(otpEl?.value || '');

                const token = localStorage.getItem("authToken");
                if (!token) {
                    throw new Error("Authentication token not found");
                }

                const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
                if (!loggedInUser) {
                    throw new Error("No user data found");
                }

                // Validate inputs
                if (!name) {
                    showNotification("Name is required!", "warning");
                    return;
                }
                if (email && !validateEmail(email)) {
                    showNotification("Please enter a valid email address!", "warning");
                    return;
                }
                if (phone && !validatePhone(phone)) {
                    showNotification("Please enter a valid 10-digit phone number!", "warning");
                    return;
                }

                let requestBody = { name };

                const emailChanged = email && email !== loggedInUser.email;
                const phoneChanged = phone && phone !== loggedInUser.phone;

                if (emailChanged) requestBody.email = email;
                if (phoneChanged) requestBody.phone = phone;

                // OTP is required if email or phone changes
                if (emailChanged || phoneChanged) {
                    if (!otp) {
                        showNotification("OTP is required to update email or phone.", "warning");
                        return;
                    }
                    requestBody.otp = otp;
                }

                const response = await fetch(`${getAPIURL()}/users/update-profile`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                showNotification("Profile updated successfully!", "success");
                
                // Update stored user data
                if (data.user && validateUserData(data.user)) {
                    localStorage.setItem("loggedInUser", JSON.stringify(data.user));
                }
                
                location.reload();
            } catch (error) {
                console.error("Update Error:", error);
                showNotification("Failed to update profile. Please try again.", "error");
            }
        });
    }
});

// ✅ Secure function to fetch user addresses
async function fetchAddresses() {
    const token = localStorage.getItem("authToken");
    if (!token) {
        console.error("Token not found in localStorage.");
        return;
    }

    if (!apiRateLimiter.canMakeRequest('addresses')) {
        console.warn('Rate limit exceeded for addresses fetch');
        return;
    }

    try {
        const response = await fetch(`${getAPIURL()}/users/getAddresses`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.address && Array.isArray(data.address) && data.address.length > 0) {
            displayAddresses(data.address);
        } else {
            displayEmptyMessage();
        }
    } catch (error) {
        console.error("Error fetching addresses:", error);
        displayEmptyMessage();
    }
}

// ✅ Secure function to display addresses
function displayAddresses(addresses) {
    const grid = document.getElementById("addresses-grid");
    if (!grid) {
        console.error("Element 'addresses-grid' not found.");
        return;
    }

    grid.innerHTML = ''; // Clear existing content

    addresses.forEach(address => {
        if (!address || !address._id) {
            console.warn('Invalid address object:', address);
            return;
        }

        const addressTile = document.createElement("div");
        addressTile.classList.add("address-tile");

        // Sanitize address data
        const safeStreet = sanitizeInput(address.street || '');
        const safeCity = sanitizeInput(address.city || '');
        const safeState = sanitizeInput(address.state || '');
        const safeZipcode = sanitizeInput(address.zipcode || '');
        const safeCountry = sanitizeInput(address.country || '');
        const safeId = sanitizeInput(address._id);

        addressTile.innerHTML = `
            <p>${safeStreet}</p>
            <p>${safeCity}, ${safeState}</p>
            <p>${safeZipcode}, ${safeCountry}</p>
            <button class="delete-button" data-address-id="${safeId}">✖</button>
        `;

        // Add event listener for delete button
        const deleteBtn = addressTile.querySelector('.delete-button');
        deleteBtn.addEventListener('click', () => {
            deleteAddress(safeId);
        });

        grid.appendChild(addressTile);
    });
}

// Handle case where no addresses are found
function displayEmptyMessage() {
    const grid = document.getElementById("addresses-grid");
    grid.innerHTML = "<p>No saved addresses found.</p>";
}
// ✅ Secure function to handle address deletion
async function deleteAddress(addressId) {
    const safeAddressId = sanitizeInput(addressId);
    
    if (!safeAddressId) {
        console.error('Invalid address ID');
        return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this address?");
    if (!confirmDelete) {
        return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
        console.error("Token not found in localStorage.");
        showNotification("You are not authorized. Please log in again.", "error");
        return;
    }

    if (!apiRateLimiter.canMakeRequest('delete-address')) {
        showNotification('Too many delete requests. Please wait before trying again.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${getAPIURL()}/users/deleteAddress/${safeAddressId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Remove the address from the displayed list
        const addressTile = document.querySelector(`button[data-address-id="${safeAddressId}"]`)?.parentElement;
        if (addressTile) {
            addressTile.remove();
        }
        
        showNotification("Address deleted successfully.", "success");
    } catch (error) {
        console.error("Error deleting address:", error);
        showNotification("An error occurred while deleting the address. Please try again.", "error");
    }
}

// Call the fetch function when the page loads
document.addEventListener("DOMContentLoaded", fetchAddresses);
// ✅ Secure orders functionality
let allOrders = [];
let currentDisplayIndex = 0;

async function fetchOrders() {
    const token = localStorage.getItem("authToken");
    if (!token) {
        console.error("Token not found in localStorage.");
        showNotification("You need to log in to view your orders.", "error");
        return;
    }

    if (!apiRateLimiter.canMakeRequest('orders')) {
        console.warn('Rate limit exceeded for orders fetch');
        return;
    }

    try {
        const response = await fetch(`${getAPIURL()}/orders/my-orders`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        if (data.orders && Array.isArray(data.orders)) {
            // Sort orders by orderDate in descending order (newest first)
            allOrders = data.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
            displayOrdersInChunks();
        } else {
            console.warn('No orders found or invalid data structure');
            const container = document.getElementById("orders-container");
            if (container) {
                container.innerHTML = '<p>No orders found.</p>';
            }
        }
    } catch (error) {
        console.error("Error fetching orders:", error);
        const container = document.getElementById("orders-container");
        if (container) {
            container.innerHTML = '<p>Failed to load orders. Please try again.</p>';
        }
    }
}

// ✅ Secure function to display orders in chunks with systematic organization like guestdashboard
function displayOrdersInChunks() {
    const container = document.getElementById("orders-container");
    if (!container) {
        console.error('Orders container not found');
        return;
    }
    
    const chunkSize = currentDisplayIndex === 0 ? 2 : 3;
    const ordersToDisplay = allOrders.slice(
        currentDisplayIndex,
        currentDisplayIndex + chunkSize
    );
    
    ordersToDisplay.forEach(order => {
        if (!order || !order._id) {
            console.warn('Invalid order object:', order);
            return;
        }

        const orderTile = document.createElement("div");
        orderTile.classList.add("order-tile");

        // Sanitize order data
        const safeOrderId = sanitizeInput(order.orderId || order._id);
        const safeOrderStatus = sanitizeInput(order.orderStatus || 'Unknown');
        const safeFinalTotal = parseFloat(order.finalTotal) || 0;
        const safePaymentStatus = sanitizeInput(order.paymentStatus || 'Unknown');
        const safePaymentMethod = sanitizeInput(order.paymentMethod || 'N/A');
        
// Create order items list for the order summary section
        const orderItemsHtml = order.orderItems && Array.isArray(order.orderItems) 
            ? order.orderItems.map(item => {
                const safeName = sanitizeInput(item.name || 'Unknown Item');
                const safePrice = parseFloat(item.price) || 0;
                const safeImage = sanitizeInput(item.image || '');
                const safeQuantity = parseInt(item.quantity) || 1;
                
                return `
                    <li class="order-item">
                        <div class="item-details">
                            <span class="item-name">${safeName}</span>
                            <span class="item-quantity">Qty: ${safeQuantity}</span>
                            <span class="item-price">₹${safePrice}</span>
                        </div>
                        ${safeImage ? `<img src="${safeImage}" alt="${safeName}" class="product-image" />` : ''}
                    </li>
                `;
            }).join('')
            : '<li>No items found</li>';

        // Create product images row for header preview (limit to first 5 images)
        const productImagesHtml = order.orderItems && Array.isArray(order.orderItems) 
            ? order.orderItems.slice(0, 5).map(item => {
                const safeName = sanitizeInput(item.name || 'Unknown Item');
                const safeImage = sanitizeInput(item.image || '');
                
                return safeImage ? `<img src="${safeImage}" alt="${safeName}" class="product-preview-image" title="${safeName}" />` : '';
            }).filter(img => img).join('')
            : '';
        
        // Show item count if there are more than 5 items or if some items don't have images
        const totalItems = order.orderItems ? order.orderItems.length : 0;
        const itemCountHtml = totalItems > 5 ? `<span class="item-count-badge">+${totalItems - 5} more</span>` : '';

        const orderHtml = `
            <!-- Order Summary (clickable header) -->
            <div class="order-summary" style="cursor: pointer;">
                <!-- Row 1: Order ID | Status | Date -->
                <div class="order-top-row">
                    <div class="order-id">
                        <span class="order-label">Order ID:</span> 
                        <span class="order-value">${safeOrderId}</span>
                    </div>
                    <div class="order-status-center">
                        <span class="status-badge status-${safeOrderStatus.toLowerCase()}">${safeOrderStatus}</span>
                    </div>
                    <div class="order-date">
                        <span class="order-date-value">${new Date(order.orderDate).toLocaleDateString()}</span>
                    </div>
                </div>
                
                <!-- Row 2: Product Images | Order Total -->
                <div class="order-bottom-row">
                    <div class="product-images-section">
                        <div class="product-images-row">
                            ${productImagesHtml}
                            ${itemCountHtml}
                        </div>
                    </div>
                    <div class="order-total-section">
                        <span class="total-label">Total:</span>
                        <span class="total-amount">₹${safeFinalTotal}</span>
                    </div>
                </div>
            </div>

            <!-- Order Details (collapsible content) -->
            <div class="order-details" style="display: none;">
                <!-- Order Status Section (Visually Prominent) -->
                <div class="order-status-container">
                    <div class="order-status-text">
                        <h4>Order Status</h4>
                        <div class="status-grid">
                            <div class="status-item">
                                <div class="status-icon shipping-icon"></div>
                                <div class="status-details">
                                    <span class="status-label">Status</span>
                                    <span class="status-value">${safeOrderStatus}</span>
                                </div>
                            </div>
                            <div class="status-item">
                                <div class="status-icon payment-icon"></div>
                                <div class="status-details">
                                    <span class="status-label">Payment</span>
                                    <span class="status-value">${safePaymentStatus}</span>
                                </div>
                            </div>
                            <div class="status-item">
                                <div class="status-icon method-icon"></div>
                                <div class="status-details">
                                    <span class="status-label">Method</span>
                                    <span class="status-value">${safePaymentMethod}</span>
                                </div>
                            </div>
                            <div class="status-item">
                                <div class="status-icon total-icon"></div>
                                <div class="status-details">
                                    <span class="status-label">Total</span>
                                    <span class="status-value price">₹${safeFinalTotal}</span>
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
                            <div class="info-item"><span class="info-label">Name:</span> ${sanitizeInput(order.name || 'N/A')}</div>
                            <div class="info-item"><span class="info-label">Email:</span> ${sanitizeInput(order.email || 'N/A')}</div>
                            <div class="info-item"><span class="info-label">Phone:</span> ${sanitizeInput(order.phone || 'N/A')}</div>
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

                <!-- Order Items Details -->
                <div class="order-section">
                    <h5 class="section-title">Order Items</h5>
                    <ul class="order-items-list">${orderItemsHtml}</ul>
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
                            <span class="price-value total-price">₹${safeFinalTotal}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        orderTile.innerHTML = orderHtml;
        
        // Add click event for collapsible functionality
        const orderSummary = orderTile.querySelector('.order-summary');
        const orderDetails = orderTile.querySelector('.order-details');
        
        orderSummary.addEventListener('click', () => {
            if (orderDetails.style.display === 'none') {
                orderDetails.style.display = 'block';
                orderSummary.classList.add('expanded');
            } else {
                orderDetails.style.display = 'none';
                orderSummary.classList.remove('expanded');
            }
        });
        
        container.appendChild(orderTile);
    });

    currentDisplayIndex += chunkSize;

    if (currentDisplayIndex >= allOrders.length) {
        document.getElementById("load-previous-orders").style.display = "none";
    }
}


// Function to handle Track Order button click
function trackOrder(orderId) {
    console.log(`Tracking order with ID: ${orderId}`);
    showNotification(`Tracking details for Order ID: ${orderId} (Demo action)`, "info");
}

// Event listener for the "Load More" button
document.getElementById("load-previous-orders").addEventListener("click", displayOrdersInChunks);

// Initial fetch on page load
document.addEventListener("DOMContentLoaded", fetchOrders);
