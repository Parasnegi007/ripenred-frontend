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

function validateCategoryData(category) {
    return category && 
           category._id && 
           category.name && 
           category.slug;
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

// ✅ Error display function
function displayError(message) {
    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid) {
        categoryGrid.innerHTML = `<p class="error-message">${sanitizeInput(message)}</p>`;
    }
}

// ✅ Loading state function
function showLoading(show = true) {
    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid) {
        if (show) {
            categoryGrid.innerHTML = '<p class="loading-message">Loading categories...</p>';
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {

    async function loadCategories() {
        if (!apiRateLimiter.canMakeRequest('categories')) {
            console.warn('Rate limit exceeded for categories');
            displayError('Too many requests. Please try again later.');
            return;
        }

        const categoryGrid = document.querySelector(".category-grid");
        if (!categoryGrid) {
            console.error('Category grid element not found');
            return;
        }

        showLoading(true);

        try {
            const response = await fetch(`${getAPIURL()}/categories`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to fetch categories`);
            }
    
            const categories = await response.json();
            
            if (!Array.isArray(categories)) {
                throw new Error('Invalid categories data received');
            }
    
            categoryGrid.innerHTML = ""; // Clear previous content
    
            if (categories.length === 0) {
                categoryGrid.innerHTML = '<p>No categories available.</p>';
                return;
            }

            categories
                .filter(category => validateCategoryData(category))
                .forEach(category => {
                    const categoryItem = document.createElement("div");
                    categoryItem.classList.add("category-item");
                    
                    // ✅ Sanitize category data
                    const safeCategoryName = sanitizeInput(category.name);
                    const safeCategorySlug = sanitizeInput(category.slug);
                    const safeCategoryImage = sanitizeInput(category.image || '/images/placeholder.png');
                    const safeCategoryDescription = sanitizeInput(category.description || "No description available.");
                    
                    // ✅ Make whole tile clickable with error handling
                    categoryItem.addEventListener("click", () => {
                        try {
                            window.location.href = `${safeCategorySlug}.html`;
                        } catch (error) {
                            console.error('Navigation error:', error);
                            showNotification('Failed to navigate to category. Please try again.', "error");
                        }
                    });
        
                    categoryItem.innerHTML = `
                        <img src="${safeCategoryImage}" alt="${safeCategoryName}" onerror="this.src='/images/placeholder.png'">
                        <h3>${safeCategoryName}</h3>
                        <p>${safeCategoryDescription}</p>
                    `;
        
                    categoryGrid.appendChild(categoryItem);
                });
    
        } catch (error) {
            console.error("Error loading categories:", error);
            displayError('Failed to load categories. Please try again later.');
        }
    }
    
    // ✅ Initialize categories on page load
    loadCategories();
    
    // ✅ Check for category filter in URL
    async function checkForCategoryFilter() {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryId = urlParams.get("category");

        if (categoryId) {
            const safeCategoryId = sanitizeInput(categoryId);
            if (safeCategoryId) {
                loadProducts(safeCategoryId); // ✅ Fetch products for this category only
            }
        }
    }
    
    // ✅ Initialize category filter check
    checkForCategoryFilter();
});

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
        // Guest user in localStorage
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
                window.location.href = "checkout.html"; // Redirect guest user to checkout
            }
        } catch (error) {
            console.error("Error processing guest cart:", error);
            showNotification("Failed to add to cart. Please try again.", "error");
        }
        return;
    }

    // Logged-in user in backend
    try {
        const response = await fetch(`${getAPIURL()}/users/cart`, {
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
            window.location.href = "checkout.html"; // Redirect logged-in user to checkout
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

    try {
        const viewedProducts = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
        recentlyViewedContainer.innerHTML = ""; // Clear existing content

        if (viewedProducts.length === 0) {
            recentlyViewedContainer.innerHTML = "<p>Currently No Recommended products.</p>";
            return;
        }

        for (const product of viewedProducts) {
            try {
                const safeProductId = sanitizeInput(product.productId);
                if (!safeProductId) continue;

                const res = await fetch(`${getAPIURL()}/products/${safeProductId}`);
                if (!res.ok) {
                    console.warn(`⛔ Skipping deleted product ID: ${safeProductId}`);
                    continue; // Product not found (likely deleted)
                }

                const fullProduct = await res.json();

                if (fullProduct.outOfStock === true) {
                    console.info(`❌ Skipping out of stock product: ${fullProduct.name}`);
                    continue; // Skip out-of-stock products
                }

                const productCard = document.createElement("div");
                productCard.classList.add("product-card");

                // ✅ Sanitize product data
                const safeProductName = sanitizeInput(fullProduct.name || 'Unknown Product');
                const safeProductImage = sanitizeInput(fullProduct.image || '/images/placeholder.png');
                const safePrice = parseFloat(fullProduct.price) || 0;
                const safeId = sanitizeInput(fullProduct._id);

                productCard.addEventListener("click", (e) => {
                    if (
                        e.target.closest(".cart-btn") ||
                        e.target.closest(".buy-now-btn")
                    ) return;

                    window.location.href = `products.html?product=${safeId}`;
                });

                productCard.innerHTML = `
                    <img src="${safeProductImage}" alt="${safeProductName}" onerror="this.src='/images/placeholder.png'">
                    <h3>${safeProductName}</h3>
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
    } catch (error) {
        console.error("Error loading recently viewed products:", error);
        recentlyViewedContainer.innerHTML = "<p>Error loading recommended products.</p>";
    }
}

// ✅ Attach event listeners for recently viewed products
function attachRecentlyViewedListeners() {
    const recentlyViewedContainer = document.getElementById("recently-viewed-list");
    if (!recentlyViewedContainer) return;

    recentlyViewedContainer.querySelectorAll(".buy-now-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const productId = sanitizeInput(this.getAttribute("data-id"));
            if (productId) {
                addToCart(productId, true);
            }
        });
    });

    recentlyViewedContainer.querySelectorAll(".cart-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const productId = sanitizeInput(this.getAttribute("data-id"));
            if (productId) {
                addToCart(productId);
            }
        });
    });
}

// ✅ Initialize recently viewed products
document.addEventListener("DOMContentLoaded", loadRecentlyViewed);



// ✅ Featured products with security
async function loadFeaturedProducts() {
    if (!apiRateLimiter.canMakeRequest('featured')) {
        console.warn('Rate limit exceeded for featured products');
        return;
    }

    try {
        const response = await fetch(`${getAPIURL()}/products/featured`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch featured products`);
        }

        const featuredProducts = await response.json();
        
        if (!Array.isArray(featuredProducts)) {
            throw new Error('Invalid featured products data received');
        }

        if (featuredProducts.length > 0) {
            displayFeaturedProducts(featuredProducts);
        } else {
            console.warn("No featured products available.");
        }
    } catch (error) {
        console.error("Error fetching featured products:", error);
        const featuredList = document.getElementById("featured-list");
        if (featuredList) {
            featuredList.innerHTML = '<p class="error-message">Failed to load featured products.</p>';
        }
    }
}

// ✅ Display featured products with security
function displayFeaturedProducts(products) {
    const featuredList = document.getElementById("featured-list");
    if (!featuredList) {
        console.error('Featured list container not found');
        return;
    }

    featuredList.innerHTML = ""; // Clear existing content

    products
        .filter(product => product && !product.outOfStock)
        .forEach(product => {
            const productCard = document.createElement("div");
            productCard.classList.add("product-card");

            // ✅ Sanitize product data
            const safeProductId = sanitizeInput(product._id);
            const safeProductName = sanitizeInput(product.name || 'Unknown Product');
            const safeProductImage = sanitizeInput(product.image || '/images/placeholder.png');
            const safePrice = parseFloat(product.price) || 0;
            const safeMrp = parseFloat(product.mrp) || 0;

            // Attach click event to navigate to product details page
            productCard.addEventListener("click", (e) => {
                if (
                    e.target.closest(".cart-btn") || 
                    e.target.closest(".buy-now-btn")
                ) return; // Prevent navigation when clicking buttons

                window.location.href = `products.html?product=${safeProductId}`;
            });

            productCard.innerHTML = `
                <img src="${safeProductImage}" alt="${safeProductName}" onerror="this.src='/images/placeholder.png'">
                <h3>${safeProductName}</h3>
                <p>
                    <span class="mrp">₹${safeMrp}</span>
                    <span class="price">₹${safePrice}</span>
                </p>
                <button class="buy-now-btn" data-id="${safeProductId}">Buy Now</button>
                <button class="cart-btn" data-id="${safeProductId}">
                    <i class="fas fa-shopping-cart"></i>
                </button>
            `;

            featuredList.appendChild(productCard);
        });
    
    // ✅ Attach event listeners for featured products
    attachFeaturedProductListeners();
    
    // 🔥 Run Hover Tracking AFTER products are rendered
    if (typeof attachHoverTracking === 'function') {
        attachHoverTracking();
    }
    if (typeof attachClickTracking === 'function') {
        attachClickTracking();
    }
}

// ✅ Attach event listeners for featured products
function attachFeaturedProductListeners() {
    const featuredList = document.getElementById("featured-list");
    if (!featuredList) return;

    featuredList.querySelectorAll(".buy-now-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const productId = sanitizeInput(this.getAttribute("data-id"));
            if (productId) {
                addToCart(productId, true);
            }
        });
    });

    featuredList.querySelectorAll(".cart-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const productId = sanitizeInput(this.getAttribute("data-id"));
            if (productId) {
                addToCart(productId);
            }
        });
    });
}

// ✅ Initialize featured products
document.addEventListener("DOMContentLoaded", loadFeaturedProducts);
