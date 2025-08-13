document.addEventListener("DOMContentLoaded", function () {

    async function loadCategories() {
        try {
            const response = await fetch("https://ripenred-backend.onrender.com/api/categories");
            if (!response.ok) throw new Error("Failed to fetch categories");
    
            const categories = await response.json();
            const categoryGrid = document.querySelector(".category-grid");
    
            categoryGrid.innerHTML = ""; // Clear previous content
    
            categories.forEach(category => {
                const categoryItem = document.createElement("div");
                categoryItem.classList.add("category-item");
                
                // ✅ Make whole tile clickable
                categoryItem.addEventListener("click", () => {
                    window.location.href = `${category.slug}.html`;
                });
    
                categoryItem.innerHTML = `
                    <img src="${category.image}" alt="${category.name}">
                    <h3>${category.name}</h3>
                    <p>${category.description || "No description available."}</p>
                `;
    
                categoryGrid.appendChild(categoryItem);
            });
    
        } catch (error) {
            console.error("Error loading categories:", error);
        }
    }
    
    document.addEventListener("DOMContentLoaded", loadCategories);
    

// ✅ Call this function when the page loads
window.addEventListener("DOMContentLoaded", loadCategories);
async function checkForCategoryFilter() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get("category");

    if (categoryId) {
        loadProducts(categoryId); // ✅ Fetch products for this category only
    }
}

window.addEventListener("DOMContentLoaded", checkForCategoryFilter);
});

// 🛒 Function to add item to Cart (Guest & Logged-in Users)
async function addToCart(productId, redirectToCheckout = false) {
    const token = localStorage.getItem("authToken");

    if (!token) {
        // Guest userin localStorage
        let cart = JSON.parse(localStorage.getItem("guestCart")) || [];
        const itemIndex = cart.findIndex(item => item.productId === productId);

        if (itemIndex > -1) {
            cart[itemIndex].quantity += 1;
        } else {
            cart.push({ productId, quantity: 1 });
        }

        localStorage.setItem("guestCart", JSON.stringify(cart));
        updateCartCount();
        alert("Added to cart! 🛒");

        if (redirectToCheckout) {
            window.location.href = "checkout.html"; // Redirect guest user to checkout
        }
        return;
    }

    // Logged-in userin backend
    try {
        const response = await fetch( "https://ripenred-backend.onrender.com/api/users/cart", {
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
            alert("Added to Cart! 🛒");

            if (redirectToCheckout) {
                window.location.href = "checkout.html"; // Redirect logged-in user to checkout
            }
        } else {
            alert(data.message || "Error adding to cart");
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
    }
}
      

document.addEventListener("DOMContentLoaded", async function () {
    const recentlyViewedContainer = document.getElementById("recently-viewed-list");
    const viewedProducts = JSON.parse(localStorage.getItem("recentlyViewed")) || [];

    if (!recentlyViewedContainer) return;

    recentlyViewedContainer.innerHTML = ""; // Clear existing content

    if (viewedProducts.length === 0) {
        recentlyViewedContainer.innerHTML = "<p>Currently No Recommended products.</p>";
        return;
    }

    for (const product of viewedProducts) {
        try {
            const res = await fetch(`https://ripenred-backend.onrender.com/api/products/${product.productId}`);
            if (!res.ok) {
                console.warn(`⛔ Skipping deleted product ID: ${product.productId}`);
                continue; // Product not found (likely deleted)
            }

            const fullProduct = await res.json();

            if (fullProduct.outOfStock === true) {
                console.info(`❌ Skipping out of stock product: ${fullProduct.name}`);
                continue; // Skip out-of-stock products
            }

            const productCard = document.createElement("div");
            productCard.classList.add("product-card");

            productCard.addEventListener("click", (e) => {
                if (
                    e.target.closest(".cart-btn") ||
                    e.target.closest(".buy-now-btn")
                ) return;

                window.location.href = `products.html?product=${fullProduct._id}`;
            });

            productCard.innerHTML = `
                <img src="${fullProduct.image}" alt="${fullProduct.name}">
                <h3>${fullProduct.name}</h3>
                <p><span class="price">₹${fullProduct.price}</span></p>
                <button class="buy-now-btn" data-id="${fullProduct._id}">Buy Now</button>
                <button class="cart-btn" data-id="${fullProduct._id}">
                    <i class="fas fa-shopping-cart"></i>
                </button>
            `;

            recentlyViewedContainer.appendChild(productCard);
        } catch (error) {
            console.error(`❌ Error processing product ${product.productId}:`, error);
        }
    }

    // Attach event listeners after rendering
    document.querySelectorAll(".buy-now-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const productId = this.getAttribute("data-id");
           addToCart(productId, true);

        });
    });

    document.querySelectorAll(".cart-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const productId = this.getAttribute("data-id");
          addToCart(productId);


        });
    });

    if (recentlyViewedContainer.children.length === 0) {
        recentlyViewedContainer.innerHTML = "<p>Currently No Recommended products.</p>";
    }
});



document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("https://ripenred-backend.onrender.com/api/products/featured");
        const featuredProducts = await response.json();

        if (featuredProducts.length > 0) {
            displayFeaturedProducts(featuredProducts);
        } else {
            console.warn("No featured products available.");
        }
    } catch (error) {
        console.error("Error fetching featured products:", error);
    }
});
function displayFeaturedProducts(products) {
    const featuredList = document.getElementById("featured-list");
    featuredList.innerHTML = ""; // Clear existing content

    products.forEach(product => {
        if (product.outOfStock === true) return; // ❌ Skip out-of-stock products

        const productCard = document.createElement("div");
        productCard.classList.add("product-card");

        // Attach click event to navigate to product details page
        productCard.addEventListener("click", (e) => {
            if (
                e.target.closest(".cart-btn") || 
                e.target.closest(".buy-now-btn")
            ) return; // Prevent navigation when clicking buttons

            window.location.href = `products.html?product=${product._id}`;
        });

        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>
                <span class="mrp">₹${product.mrp}</span>
                <span class="price">₹${product.price}</span>
            </p>
            <button class="buy-now-btn" data-id="${product._id}">Buy Now</button>
            <button class="cart-btn" data-id="${product._id}">
                <i class="fas fa-shopping-cart"></i>
            </button>
        `;

        featuredList.appendChild(productCard);
    });
    // 🔥 Run Hover Tracking AFTER products are rendered
    attachHoverTracking();
attachClickTracking();
}
