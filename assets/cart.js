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

function validateQuantity(quantity) {
    const num = parseInt(quantity, 10);
    return num > 0 && num <= 99 ? num : 1; // Max 99 items per product
}

function validatePrice(price) {
    const num = parseFloat(price);
    return num >= 0 ? num : 0;
}

// ✅ Google Analytics E-commerce Tracking
function trackAddToCart(productId, name, price, quantity) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'add_to_cart', {
            currency: 'INR',
            value: price * quantity,
            items: [{
                item_id: productId,
                item_name: name,
                price: price,
                quantity: quantity
            }]
        });
    }
}

function trackRemoveFromCart(productId, name, price, quantity) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'remove_from_cart', {
            currency: 'INR',
            value: price * quantity,
            items: [{
                item_id: productId,
                item_name: name,
                price: price,
                quantity: quantity
            }]
        });
    }
}

function trackViewCart(totalValue, itemCount) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'view_cart', {
            currency: 'INR',
            value: totalValue,
            items: [],
            item_count: itemCount
        });
    }
}

// ✅ State management
let isCartLoading = false;
let cartOperationQueue = [];

// ✅ Load Cart Function with enhanced error handling
async function loadCart() {
    if (isCartLoading) return; // Prevent multiple simultaneous loads
    isCartLoading = true;
    
    const token = localStorage.getItem("authToken");
    let cart = [];

    try {
        if (token) {
            const response = await fetch(`${getAPIURL()}/users/cart`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            if (Array.isArray(result)) {
                cart = result;
            }
        } else {
            cart = JSON.parse(localStorage.getItem("guestCart")) || [];
        }
    } catch (error) {
        console.error("❌ Error fetching cart:", error);
        // Fallback to guest cart on error
        try {
            cart = JSON.parse(localStorage.getItem("guestCart")) || [];
        } catch {
            cart = [];
        }
    } finally {
        isCartLoading = false;
    }

    // 🔄 Enrich cart with product details
    const enrichedCart = await Promise.all(
        cart.map(async item => {
            try {
                const res = await fetch(`${getAPIURL()}/products/${item.productId}`);
                if (!res.ok) return { ...item, deleted: true };
                const product = await res.json();
                return {
                    ...item,
                    name: sanitizeInput(product.name || 'Unknown Product'),
                    price: validatePrice(product.price),
                    image: sanitizeInput(product.image || '/images/placeholder.png'),
                    outOfStock: product.outOfStock,
                    deleted: false
                };
            } catch {
                return { ...item, deleted: true };
            }
        })
    );

    displayCart(enrichedCart);
    window.updateCartCount();

    // ✅ Simple out-of-stock check
    const hasOutOfStock = enrichedCart.some(item => item.outOfStock === true);
    if (hasOutOfStock) {
        showNotification("Some items in your cart are out of stock. Please remove them before proceeding to checkout.", "warning");
    }
}

// ✅ Display Cart Function with security improvements
function displayCart(cart) {
    const cartContainer = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const checkoutBtn = document.getElementById("checkout-btn");
    
    if (!cartContainer || !cartTotal || !checkoutBtn) {
        console.error("❌ Required cart elements not found");
        return;
    }
    
    cartContainer.innerHTML = "";
    let totalAmount = 0;
    let blockCheckout = false;

    if (cart.length === 0) {
        cartContainer.innerHTML = "<p>Your cart is empty.</p>";
        cartTotal.innerText = "0.00";
        checkoutBtn.disabled = true;
        return;
    }

    cart.forEach(item => {
        const isDeleted = item.deleted;
        const isOutOfStock = item.outOfStock === true;
        const safeQuantity = validateQuantity(item.quantity);
        const safePrice = validatePrice(item.price);

        if (isDeleted || isOutOfStock) {
            blockCheckout = true;
        }

        let itemTotal = (!isDeleted && !isOutOfStock) ? safePrice * safeQuantity : 0;
        totalAmount += itemTotal;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.setAttribute("data-id", sanitizeInput(item.productId));

        cartItem.innerHTML = `
            <div class="cart-img-wrapper">
                <img src="${isDeleted ? '/images/deleted.png' : item.image}" 
                     alt="${isDeleted ? 'Deleted' : item.name}" class="cart-img">
                ${isOutOfStock ? `<span class="badge out-of-stock-badge">Out of Stock</span>` : ""}
            </div>
            <div class="cart-details">
                <h3 class="item-name">${isDeleted ? 'Product Removed' : item.name}</h3>
                <p class="item-price">${(isDeleted || isOutOfStock) ? 
                    '<span class="out-of-stock-label">Out of Stock</span>' : 
                    `₹${safePrice}`}</p>
                <div class="cart-actions">
                    <button class="cart-btn-minus" onclick="updateCartQuantity('${sanitizeInput(item.productId)}', ${safeQuantity - 1})" 
                        ${isDeleted || isOutOfStock ? 'disabled' : ''}>-</button>
                    <span class="cart-quantity">${safeQuantity}</span>
                    <button class="cart-btn-plus" onclick="updateCartQuantity('${sanitizeInput(item.productId)}', ${safeQuantity + 1})" 
                        ${isDeleted || isOutOfStock ? 'disabled' : ''}>+</button>
                    <button class="cart-btn-remove" onclick="removeFromCart('${sanitizeInput(item.productId)}')">Remove</button>
                </div>
            </div>
        `;

        cartContainer.appendChild(cartItem);
    });

    cartTotal.innerText = validatePrice(totalAmount).toFixed(2);
    checkoutBtn.disabled = blockCheckout;

    // ✅ Track cart view
    trackViewCart(totalAmount, cart.length);

    // 🚚 Free Shipping Progress
    updateShippingProgress(totalAmount);
}

// ✅ Separate shipping progress function
function updateShippingProgress(totalAmount) {
    const shippingMessage = document.querySelector(".shipping-message");
    const shippingFill = document.querySelector(".shipping-fill");
    const shippingTruck = document.querySelector(".shipping-truck");

    if (!shippingMessage || !shippingFill || !shippingTruck) return;

    let progress = 0;
    let message = "";

    if (totalAmount >= 1000) {
        progress = 100;
        message = "🎉 Yay! You've unlocked FREE Shipping!";
    } else if (totalAmount >= 500) {
        progress = (totalAmount / 1000) * 100;
        const more = (1000 - totalAmount).toFixed(0);
        message = `🛒 Add Products worth ₹${more} more to get FREE shipping!!`;
    } else {
        progress = (totalAmount / 1000) * 100;
        const more = (1000 - totalAmount).toFixed(0);
        message = `🚚 Add Products worth ₹${more} more for free shipping !!`;
    }

    shippingMessage.textContent = message;
    shippingFill.style.width = `${progress}%`;
    shippingTruck.style.left = `calc(${progress}% - 20px)`;
}

// ✅ Function to Update Cart Quantity with improved validation
async function updateCartQuantity(productId, newQuantity) {
    const validQuantity = validateQuantity(newQuantity);
    if (validQuantity < 1) return;

    const token = localStorage.getItem("authToken");

    try {
        // Check product stock first
        const productRes = await fetch(`${getAPIURL()}/products/${sanitizeInput(productId)}`);
        if (!productRes.ok) {
            throw new Error("Product not found");
        }
        
        const product = await productRes.json();

        if (product.stock === 0) {
            showNotification("Product is out of stock. Cannot update quantity.", "error");
            return;
        }

        if (validQuantity > product.stock) {
            showNotification(`Only ${product.stock} items available in stock.`, "warning");
            return;
        }

        if (token) {
            const response = await fetch(`${getAPIURL()}/users/cart/${sanitizeInput(productId)}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ quantity: validQuantity })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        } else {
            let cart = JSON.parse(localStorage.getItem("guestCart")) || [];
            cart = cart.map(item => 
                item.productId === productId ? { ...item, quantity: validQuantity } : item
            );
            localStorage.setItem("guestCart", JSON.stringify(cart));
        }

        await loadCart();
        window.updateCartCount();
    } catch (error) {
        console.error("Error updating cart quantity:", error);
        showNotification("Failed to update quantity. Please try again.", "error");
    }
}

// ✅ Improved remove from cart function
async function removeFromCart(productId) {
    const safeProductId = sanitizeInput(productId);
    const cartItem = document.querySelector(`.cart-item[data-id="${safeProductId}"]`);
    
    if (!cartItem) {
        console.error(`Cart item with productId ${safeProductId} not found.`);
        return;
    }

    // Add removed class for animation
    cartItem.classList.add("removed");

    try {
        // ✅ Track remove from cart event
        const itemName = cartItem.querySelector('.item-name')?.textContent || 'Unknown Product';
        const itemPrice = parseFloat(cartItem.querySelector('.item-price')?.textContent?.replace('₹', '') || 0);
        const itemQuantity = parseInt(cartItem.querySelector('.cart-quantity')?.textContent || 1);
        trackRemoveFromCart(safeProductId, itemName, itemPrice, itemQuantity);

        const token = localStorage.getItem("authToken");
        
        if (token) {
            const response = await fetch(`${getAPIURL()}/users/cart/${safeProductId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        } else {
            let cart = JSON.parse(localStorage.getItem("guestCart")) || [];
            cart = cart.filter(item => item.productId !== safeProductId);
            localStorage.setItem("guestCart", JSON.stringify(cart));
        }

        // Show success notification for removal
        showNotification(`${itemName} has been removed from your cart`, "error");
        
        // Wait for animation then reload
        setTimeout(async () => {
            await loadCart();
            window.updateCartCount();
        }, 500);
        
    } catch (error) {
        console.error("Error removing item from cart:", error);
        cartItem.classList.remove("removed"); // Revert animation on error
        showNotification("Failed to remove item. Please try again.", "error");
    }
}

// ✅ Function to Update Cart Counter
function updateCartCounter(cart) {
    const totalItems = cart.reduce((sum, item) => sum + validateQuantity(item.quantity), 0);
    const cartCountElement = document.getElementById("cart-count");
    if (cartCountElement) {
        cartCountElement.innerText = totalItems || "";
    }
}

// ✅ Enhanced add to cart function
async function addToCart(productId, quantity = 1, redirectToCheckout = false) {
    const safeProductId = sanitizeInput(productId);
    const safeQuantity = validateQuantity(quantity);
    const token = localStorage.getItem("authToken");

    try {
        // Check product availability first
        const productRes = await fetch(`${getAPIURL()}/products/${safeProductId}`);
        if (!productRes.ok) {
            throw new Error("Product not found");
        }
        
        const product = await productRes.json();
        if (product.outOfStock || product.stock < safeQuantity) {
            showNotification("Product is not available in the requested quantity.", "error");
            return;
        }

        if (!token) {
            let cart = JSON.parse(localStorage.getItem("guestCart")) || [];
            const itemIndex = cart.findIndex(item => item.productId === safeProductId);

            if (itemIndex > -1) {
                cart[itemIndex].quantity = validateQuantity(cart[itemIndex].quantity + safeQuantity);
            } else {
                cart.push({ productId: safeProductId, quantity: safeQuantity });
            }

            localStorage.setItem("guestCart", JSON.stringify(cart));
            window.updateCartCount();
            showNotification("Added to cart!", "success");

            if (redirectToCheckout) {
                window.location.href = "checkout.html";
            } else {
                await loadCart(); // Refresh instead of reload
            }
            return;
        }

        const response = await fetch(`${getAPIURL()}/users/cart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ productId: safeProductId, quantity: safeQuantity })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Failed to add to cart");
        }

        window.updateCartCount();
        
        // ✅ Track add to cart event
        trackAddToCart(safeProductId, product.name || 'Unknown Product', product.price || 0, safeQuantity);
        
        showNotification("Added to Cart! 🛒", "success");

        if (redirectToCheckout) {
            window.location.href = "checkout.html";
        } else {
            await loadCart(); // Refresh instead of reload
        }

    } catch (error) {
        console.error("Error adding to cart:", error);
        showNotification("Failed to add to cart. Please try again.", "error");
    }
}

// ✅ Recently viewed products with security
async function loadRecentlyViewed() {
    const recentlyViewedContainer = document.getElementById("recently-viewed-list");
    if (!recentlyViewedContainer) return;

    const viewedProducts = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
    recentlyViewedContainer.innerHTML = "";

    if (viewedProducts.length === 0) {
        recentlyViewedContainer.innerHTML = "<p>Currently No Recommended products.</p>";
        return;
    }

    for (const product of viewedProducts) {
        try {
            const res = await fetch(`${getAPIURL()}/products/${sanitizeInput(product.productId)}`);
            if (!res.ok) {
                console.warn(`⛔ Skipping deleted product ID: ${product.productId}`);
                continue;
            }

            const fullProduct = await res.json();

            if (fullProduct.outOfStock === true) {
                console.info(`❌ Skipping out of stock product: ${fullProduct.name}`);
                continue;
            }

            const productCard = document.createElement("div");
            productCard.classList.add("product-card");

            productCard.addEventListener("click", (e) => {
                if (e.target.closest(".cart-btn") || e.target.closest(".buy-now-btn")) return;
                window.location.href = `products.html?product=${sanitizeInput(fullProduct._id)}`;
            });

            const safeName = sanitizeInput(fullProduct.name || 'Unknown Product');
            const safePrice = validatePrice(fullProduct.price);
            const safeImage = sanitizeInput(fullProduct.image || '/images/placeholder.png');
            const safeId = sanitizeInput(fullProduct._id);

            productCard.innerHTML = `
                <img src="${safeImage}" alt="${safeName}">
                <h3>${safeName}</h3>
                <p><span class="price">₹${safePrice}</span></p>
                <button class="buy-now-btn" data-id="${safeId}">Buy Now</button>
                <button class="cart-btn" data-id="${safeId}">
                    <i class="fas fa-shopping-cart"></i>
                </button>
            `;

            recentlyViewedContainer.appendChild(productCard);
        } catch (error) {
            console.error(`❌ Error processing product ${product.productId}:`, error);
        }
    }

    // Attach event listeners after rendering
    attachRecentlyViewedListeners();

    if (recentlyViewedContainer.children.length === 0) {
        recentlyViewedContainer.innerHTML = "<p>Currently No Recommended products.</p>";
    }
}

// ✅ Attach event listeners for recently viewed products
function attachRecentlyViewedListeners() {
    document.querySelectorAll(".buy-now-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const productId = sanitizeInput(this.getAttribute("data-id"));
            addToCart(productId, 1, true); // Redirect to checkout
        });
    });

    document.querySelectorAll(".cart-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const productId = sanitizeInput(this.getAttribute("data-id"));
            addToCart(productId, 1); // Just add to cart
        });
    });
}

// ✅ Enhanced checkout validation
function initializeCheckout() {
    const checkoutButton = document.getElementById("checkout-btn");
    if (!checkoutButton) return;

    checkoutButton.addEventListener("click", async (event) => {
        event.preventDefault();

        const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
        const token = localStorage.getItem("authToken");
        let userCart = [];

        if (token) {
            try {
                const response = await fetch(`${getAPIURL()}/users/cart`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    userCart = await response.json();
                }
            } catch (error) {
                console.error("❌ Error fetching user cart:", error);
            }
        }

        const isCartEmpty = !token ? guestCart.length === 0 : userCart.length === 0;

        if (isCartEmpty) {
            showNotification("🛒 Please add some items to the cart before proceeding to checkout!", "warning");
        } else {
            window.location.href = "checkout.html";
        }
    });
}

// ✅ Delivery countdown with error handling
function startDeliveryCountdown() {
    const countdownEl = document.getElementById("countdown");
    const container = document.getElementById("delivery-timer");
    
    if (!countdownEl || !container) return;

    function updateTimer() {
        try {
            const now = new Date();
            const deadline = new Date();
            deadline.setHours(12, 0, 0, 0); // Set to 12:00 PM today

            const timeRemaining = deadline - now;

            if (timeRemaining > 0) {
                const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
                const seconds = Math.floor((timeRemaining / 1000) % 60);

                countdownEl.textContent = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
            } else {
                container.innerHTML = `<p class="delivery-message">🚚 Oops, you missed today's cut-off! <strong>Order before 12 PM to get your items delivered next day</strong> – fast & fresh!</p>`;
                clearInterval(timerInterval);
            }
        } catch (error) {
            console.error("Error updating timer:", error);
            clearInterval(timerInterval);
        }
    }

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
}

// ✅ Global cart count update function
function updateCartCount() {
    const cartCountElement = document.getElementById("cart-count");
    if (!cartCountElement) return;

    const token = localStorage.getItem("authToken");

    if (token) {
        fetch(`${getAPIURL()}/users/cart`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(cart => {
            const totalQuantity = Array.isArray(cart) ? cart.reduce((sum, item) => sum + validateQuantity(item.quantity), 0) : 0;
            cartCountElement.textContent = totalQuantity || "";
        })
        .catch(error => {
            console.error("❌ Error fetching cart count:", error);
            // Fallback to guest cart
            const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
            const totalQuantity = guestCart.reduce((sum, item) => sum + validateQuantity(item.quantity), 0);
            cartCountElement.textContent = totalQuantity || "";
        });
    } else {
        try {
            const cart = JSON.parse(localStorage.getItem("guestCart")) || [];
            const totalQuantity = cart.reduce((sum, item) => sum + validateQuantity(item.quantity), 0);
            cartCountElement.textContent = totalQuantity || "";
        } catch (error) {
            console.error("❌ Error reading guest cart:", error);
            cartCountElement.textContent = "";
        }
    }
}

// ✅ Initialize all cart functionality
document.addEventListener("DOMContentLoaded", async () => {
    await loadCart();
    await loadRecentlyViewed();
    initializeCheckout();
    startDeliveryCountdown();
    window.updateCartCount();
});

// ✅ Make functions globally available
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.addToCart = addToCart;
window.updateCartCount = updateCartCount;
