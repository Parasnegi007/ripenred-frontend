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

function validateProductData(product) {
    return product && 
           product._id && 
           product.name && 
           typeof product.price === 'number';
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

// Dynamic API URLs using getAPIURL() helper
const getWishlistAPI = () => `${getAPIURL()}/users/wishlist`;
const getCartAPI = () => `${getAPIURL()}/users/cart`;

document.addEventListener("DOMContentLoaded", async () => {
    const categoryName = document.body.getAttribute("data-category"); // Get category from HTML
    if (!categoryName) {
        console.error("❌ No category specified in HTML.");
        return;
    }

    if (!apiRateLimiter.canMakeRequest('categories')) {
        console.warn('Rate limit exceeded for categories');
        return;
    }

    try {
        // Fetch categories to get the correct ID
        const categoryResponse = await fetch(`${getAPIURL()}/categories`);
        if (!categoryResponse.ok) {
            throw new Error(`HTTP ${categoryResponse.status}: Failed to fetch categories`);
        }

        const categories = await categoryResponse.json();
        
        if (!Array.isArray(categories)) {
            throw new Error('Invalid categories data received');
        }
        
        const category = categories.find(cat => cat.name && cat.name.toLowerCase() === categoryName.toLowerCase());

        if (!category) {
            console.error("❌ Category not found:", categoryName);
            displayError("Category not found. Please try again.");
            return;
        }

        console.log("✅ Found Category ID:", category._id);

        if (!apiRateLimiter.canMakeRequest('products')) {
            console.warn('Rate limit exceeded for products');
            return;
        }

        // Fetch products based on the category ID
        const productResponse = await fetch(`${getAPIURL()}/products/category/${sanitizeInput(category._id)}`);
        if (!productResponse.ok) {
            throw new Error(`HTTP ${productResponse.status}: Failed to fetch products`);
        }

        const products = await productResponse.json();
        
        if (!Array.isArray(products)) {
            throw new Error('Invalid products data received');
        }
        
        displayProducts(products);
    } catch (error) {
        console.error("❌ Error loading products:", error);
        displayError("Failed to load products. Please try again later.");
    }
});

// ✅ Error display function
function displayError(message) {
    const productsContainer = document.getElementById("productsContainer");
    if (productsContainer) {
        productsContainer.innerHTML = `<p class="error-message">${sanitizeInput(message)}</p>`;
    }
}

// Function to display products in the grid
function displayProducts(products) {
    const productsContainer = document.getElementById("productsContainer");

    if (!productsContainer) {
        console.error("❌ Product grid not found in HTML.");
        return;
    }

    productsContainer.innerHTML = "";

    if (products.length === 0) {
        productsContainer.innerHTML = "<p>No products available.</p>";
        return;
    }

    products
        .filter(product => validateProductData(product))
        .forEach(product => {
            const productCard = document.createElement("div");
            productCard.className = "product";

            // ✅ Sanitize product data
            const safeProductId = sanitizeInput(product._id);
            const safeProductName = sanitizeInput(product.name || 'Unknown Product');
            const safeProductImage = sanitizeInput(product.image || '/images/placeholder.png');
            const safePrice = parseFloat(product.price) || 0;
            const safeMrp = parseFloat(product.mrp) || 0;

            attachHoverTracking();
            attachClickTracking();

            productCard.addEventListener("click", (e) => {
                if (
                    e.target.closest(".cart-btn") ||
                    e.target.closest(".buy-now-btn") ||
                    e.target.closest(".add-to-wishlist")
                ) return;

                window.location.href = `products.html?product=${safeProductId}`;
            });

            const outOfStock = product.outOfStock === true;

            productCard.innerHTML = `
                <div class="product-img-wrapper" style="position: relative;">
                    <img class="product-image" src="${safeProductImage}" alt="${safeProductName}">
                    ${outOfStock ? '<span class="out-of-stock-label" style="position:absolute;top:8px;left:8px;background:red;color:white;padding:2px 6px;font-size:12px;">Out of Stock</span>' : ''}
                </div>
                <h3 class="product-title">${safeProductName}</h3>
               <p>
        ${outOfStock 
            ? '<span class="price" style="color:red;">Out of Stock</span>' 
            : `<span class="mrp">₹${safeMrp}</span> <span class="price">₹${safePrice}</span>`}
    </p>

                <div class="product-buttons">
                    <button class="buy-now-btn" data-id="${safeProductId}" ${outOfStock ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}'>Buy Now</button>
                    <button class="cart-btn" data-id="${safeProductId}" ${outOfStock ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                    <button class="add-to-wishlist" onclick="addToWishlist('${safeProductId}')">
                        <i class="fa fa-heart" aria-hidden="true"></i>
                    </button>
                </div>
            `;

            productsContainer.appendChild(productCard);
        });

    document.querySelectorAll(".buy-now-btn").forEach(button => {
        button.addEventListener("click", function () {
            const productId = sanitizeInput(this.dataset.id);
            if (productId) {
                addToCart(productId, true);
            }
        });
    });

    document.querySelectorAll(".cart-btn").forEach(button => {
        button.addEventListener("click", function () {
            const productId = sanitizeInput(this.dataset.id);
            if (productId) {
                addToCart(productId);
            }
        });
    });
}


// 🛒 Function to add item to Cart (Guest & Logged-in Users)
async function addToCart(productId, redirectToCheckout = false) {
    const safeProductId = sanitizeInput(productId);
    
    if (!safeProductId) {
        console.error('Invalid product ID');
        return;
    }

    if (!apiRateLimiter.canMakeRequest('cart')) {
        showNotification('Too many requests. Please try again later.', "warning");
        return;
    }

    const token = localStorage.getItem("authToken");

    if (!token) {
        try {
            let cart = JSON.parse(localStorage.getItem("guestCart")) || [];
            const itemIndex = cart.findIndex(item => item.productId === safeProductId);

            if (itemIndex > -1) {
                cart[itemIndex].quantity += 1;
            } else {
                cart.push({ productId: safeProductId, quantity: 1 });
            }

            localStorage.setItem("guestCart", JSON.stringify(cart));
            updateCartCount();
            showNotification("Added to cart! 🛒", "success");

            if (redirectToCheckout) {
                window.location.href = "checkout.html";
            }
        } catch (error) {
            console.error("Error processing guest cart:", error);
            showNotification("Failed to add to cart. Please try again.", "error");
        }
        return;
    }

    // Logged-in user cart API request
    try {
        const response = await fetch(getCartAPI(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ productId: safeProductId, quantity: 1 })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        updateCartCount();
        showNotification("Added to Cart! 🛒", "success");

        if (redirectToCheckout) {
            window.location.href = "checkout.html";
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
        showNotification("Failed to add to cart. Please try again.", "error");
    }
}

// ❤️ Function to add item to Wishlist (Guest & Logged-in Users)
async function addToWishlist(productId) {
    const safeProductId = sanitizeInput(productId);
    
    if (!safeProductId) {
        console.error('Invalid product ID');
        return;
    }

    if (!apiRateLimiter.canMakeRequest('wishlist')) {
        showNotification('Too many requests. Please try again later.', "warning");
        return;
    }

    const token = localStorage.getItem("authToken");

    if (!token) {
        try {
            let wishlist = JSON.parse(localStorage.getItem("guestWishlist")) || [];
            if (!wishlist.includes(safeProductId)) {
                wishlist.push(safeProductId);
                localStorage.setItem("guestWishlist", JSON.stringify(wishlist));
                showNotification("✅ Added to Wishlist! ❤️", "success");
            } else {
                showNotification("Item already in wishlist!", "info");
            }
        } catch (error) {
            console.error("Error processing guest wishlist:", error);
            showNotification("Failed to add to wishlist. Please try again.", "error");
        }
        return;
    }

    // Logged-in user wishlist API request
    try {
        const response = await fetch(getWishlistAPI(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ productId: safeProductId })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
                    showNotification("✅ Added to Wishlist! ❤️", "success");
            } catch (error) {
            console.error("❌ Error adding to wishlist:", error);
            showNotification("❌ Failed to add to wishlist. Please try again.", "error");
        }
}
