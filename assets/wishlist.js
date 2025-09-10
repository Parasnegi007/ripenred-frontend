// Utility functions for security and UX
function sanitizeInput(input) {
    if (!input && input !== 0) return '';
    return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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

function displayError(message) {
    console.error(`❌ ${message}`);
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

function showLoading() {
    const loadingDiv = document.getElementById('loading-message');
    if (loadingDiv) {
        loadingDiv.style.display = 'block';
    }
}

function hideLoading() {
    const loadingDiv = document.getElementById('loading-message');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

async function fetchWishlist() {
    const token = localStorage.getItem("authToken");
    if (!token) {
        displayError("User not logged in!");
        return;
    }

    showLoading();

    try {
            const response = await fetch(`${getAPIURL()}/users/wishlist`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const wishlist = await response.json();
        displayWishlist(wishlist); // ✅ Ensure it updates the HTML
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        displayError("Error fetching wishlist. Please try again.");
    } finally {
        hideLoading();
    }
}
// Example rate limiter
const rateLimiter = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
};

async function loadWishlist() {
    const token = localStorage.getItem("authToken");
    let wishlist = [];

    showLoading();

    try {
        if (token) {
            const response = await fetch(`${getAPIURL()}/users/wishlist`, {
                headers: { Authorization: `Bearer ${token}` } 
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            wishlist = await response.json();
        } else {
            // ✅ Ensure guestWishlist is always defined
            let guestWishlist = JSON.parse(localStorage.getItem("guestWishlist")) || [];
            console.log("🔍 Guest Wishlist Product IDs:", guestWishlist);

            wishlist = await Promise.all(guestWishlist.map(async (productId) => {
                const res = await fetch(`${getAPIURL()}/products/${productId}`);
                if (!res.ok) {
                    console.warn(`Failed to fetch product ${productId}`);
                    return null;
                }
                return res.json();
            }));

            // Filter out null values from failed requests
            wishlist = wishlist.filter(product => product !== null);
            console.log("📦 Final Wishlist Data for Display:", wishlist);
        }

        displayWishlist(wishlist);
    } catch (error) {
        console.error("Error loading wishlist:", error);
        displayError("Error loading wishlist. Please try again.");
    } finally {
        hideLoading();
    }
}

loadWishlist();
function displayWishlist(wishlist) {
    const wishlistContainer = document.getElementById("wishlistItems");
    if (!wishlistContainer) {
        displayError("Wishlist container not found in HTML.");
     return;
    }

    wishlistContainer.innerHTML = ""; // Clear previous items

    if (wishlist.length === 0) {
        wishlistContainer.innerHTML = "<p>Your wishlist is empty.</p>";
        return;
    }

        wishlist.forEach(product => {
            if (!product || !product._id || !product.name) return;
        const outOfStock = product.outOfStock === true;

        const itemDiv = document.createElement("div");
        itemDiv.id = `wishlist-item-${product._id}`;
        itemDiv.className = "wishlist-item";
        itemDiv.setAttribute("data-product-id", product._id);

        itemDiv.innerHTML = `
            <div class="wishlist-img-wrapper" style="position: relative;">
                <img src="${sanitizeInput(product.image)}" alt="${sanitizeInput(product.name)}" onerror="this.onerror=null;this.src='placeholder.jpg';">
                ${outOfStock ? '<span class="out-of-stock-label" style="position:absolute;top:8px;left:8px;background:red;color:white;padding:2px 6px;font-size:12px;">Out of Stock</span>' : ''}
            </div>
            <h3>${sanitizeInput(product.name)}</h3>
            <p>
                ${outOfStock 
                    ? '<span class="price" style="color:red;">Out of Stock</span>' 
                    : `<span class="mrp">₹${sanitizeInput(product.mrp)}</span> <span class="price">₹${sanitizeInput(product.price)}</span>`}
            </p>
            <div class="wishlist-buttons">
                <button class="buy-now-btn" data-id="${product._id}" ${outOfStock ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>Buy Now</button>
                <button class="add-to-cart" data-id="${product._id}" ${outOfStock ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>
                    <i class="fas fa-shopping-cart"></i>
                </button>
                <button class="remove-btn" data-id="${product._id}">Remove</button>
            </div>
        `;

        wishlistContainer.appendChild(itemDiv);
    });

    // Attach navigation click event
 document.querySelectorAll(".wishlist-item").forEach(item => {
    item.addEventListener("click", (e) => {
        if (
            e.target.closest(".add-to-cart") || 
            e.target.closest(".buy-now-btn") || 
            e.target.closest(".remove-btn")
        ) return;

        const productId = item.getAttribute("data-product-id");
        if (productId) {
            window.location.href = `products.html?product=${productId}`;
        }
    });
});


    // Buy Now buttons (redirect to checkout)
    document.querySelectorAll(".buy-now-btn").forEach(button => {
        button.addEventListener("click", function () {
            const productId = this.dataset.id;
            addToCart(productId, true);
        });
    });
    
    // Add to cart buttons
    document.querySelectorAll(".add-to-cart").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const productId = this.getAttribute("data-id");
            addToCart(productId);
        });
    });
    
    // Remove from wishlist buttons
    document.querySelectorAll(".remove-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const productId = this.getAttribute("data-id");
            removeFromWishlist(productId);
        });
    });
}

// 🛒 Function to add item to Cart (Guest & Logged-in Users)

async function addToCart(productId, redirectToCheckout = false) {
    const token = localStorage.getItem("authToken");

    if (!token) {
        // Guest user - store in localStorage
        let cart = JSON.parse(localStorage.getItem("guestCart")) || [];
        const itemIndex = cart.findIndex(item => item.productId === productId);

        if (itemIndex > -1) {
            cart[itemIndex].quantity += 1;
        } else {
            cart.push({ productId, quantity: 1 });
        }

        localStorage.setItem("guestCart", JSON.stringify(cart));
        updateCartCount();
        showNotification("Added to cart! 🛒", "success");

        if (redirectToCheckout) {
            window.location.href = "../store/checkout.html"; // Redirect guest user to checkout
        }
        return;
    }

    // Logged-in user - store in backend
    try {
        const response = await fetch(`${getAPIURL()}/users/cart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity: 1 })
        });

        const data = await response.json();
        if (response.ok) {
            updateCartCount();
            showNotification("Added to Cart! 🛒", "success");

            if (redirectToCheckout) {
                window.location.href = "../store/checkout.html"; // Redirect logged-in user to checkout
            }
        } else {
            showNotification(data.message || "Error adding to cart", "error");
        }
    } catch (error) {
            displayError("Error adding to cart.");
    }
}

// ✅ Call this function on page load
document.addEventListener("DOMContentLoaded", rateLimiter(fetchWishlist, 2000)); // Limiting to one call per 2 seconds
async function removeFromWishlist(productId) {
    const token = localStorage.getItem("authToken");

    if (token) {
        try {
            const response = await fetch(`${getAPIURL()}/users/wishlist/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                displayError("Error removing from wishlist!");
                return;
            }
        } catch (error) {
            console.error("❌ Error:", error);
            displayError("Error removing from wishlist. Please try again.");
            return;
        }
    } else {
        // ✅ Remove from guest wishlist (localStorage)
        let guestWishlist = JSON.parse(localStorage.getItem("guestWishlist")) || [];
        guestWishlist = guestWishlist.filter(id => id !== productId);
        localStorage.setItem("guestWishlist", JSON.stringify(guestWishlist));
    }

    // ✅ Remove from UI if element exists
    const itemElement = document.getElementById(`wishlist-item-${productId}`);
    if (itemElement) {
        itemElement.remove();
    }

            showNotification("❌ Removed from Wishlist!", "success");
}
