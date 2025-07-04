const WISHLIST_API = "https://pureplucks.com/api/users/wishlist"; 
const CART_API = "https://pureplucks.com/api/users/cart"; 

document.addEventListener("DOMContentLoaded", async () => {
    const categoryName = document.body.getAttribute("data-category"); // Get category from HTML
    if (!categoryName) {
        console.error("❌ No category specified in HTML.");
        return;
    }

    try {
        // Fetch categories to get the correct ID
        const categoryResponse = await fetch("https://pureplucks.com/api/categories");
        if (!categoryResponse.ok) throw new Error("Failed to fetch categories");

        const categories = await categoryResponse.json();
        const category = categories.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase());

        if (!category) {
            console.error("❌ Category not found:", categoryName);
            return;
        }

        console.log("✅ Found Category ID:", category._id);

        // Fetch products based on the category ID
        const productResponse = await fetch(`https://pureplucks.com/api/products/category/${category._id}`);
        if (!productResponse.ok) throw new Error("Failed to fetch products");

        const products = await productResponse.json();
        displayProducts(products);
    } catch (error) {
        console.error("❌ Error loading products:", error);
    }
});

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

    products.forEach(product => {
        const productCard = document.createElement("div");
        productCard.className = "product";

        attachHoverTracking();
        attachClickTracking();

        productCard.addEventListener("click", (e) => {
            if (
                e.target.closest(".cart-btn") ||
                e.target.closest(".buy-now-btn") ||
                e.target.closest(".add-to-wishlist")
            ) return;

            window.location.href = `products.html?product=${product._id}`;
        });

        const outOfStock = product.outOfStock === true;

        productCard.innerHTML = `
            <div class="product-img-wrapper" style="position: relative;">
                <img class="product-image" src="${product.image}" alt="${product.name}">
                ${outOfStock ? '<span class="out-of-stock-label" style="position:absolute;top:8px;left:8px;background:red;color:white;padding:2px 6px;font-size:12px;">Out of Stock</span>' : ''}
            </div>
            <h3 class="product-title">${product.name}</h3>
           <p>
    ${outOfStock 
        ? '<span class="price" style="color:red;">Out of Stock</span>' 
        : `<span class="mrp">₹${product.mrp}</span> <span class="price">₹${product.price}</span>`}
</p>

            <div class="product-buttons">
                <button class="buy-now-btn" data-id="${product._id}" ${outOfStock ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>Buy Now</button>
                <button class="cart-btn" data-id="${product._id}" ${outOfStock ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>
                    <i class="fas fa-shopping-cart"></i>
                </button>
                <button class="add-to-wishlist" onclick="addToWishlist('${product._id}')">
                    <i class="fa fa-heart" aria-hidden="true"></i>
                </button>
            </div>
        `;

        productsContainer.appendChild(productCard);
    });

    document.querySelectorAll(".buy-now-btn").forEach(button => {
        button.addEventListener("click", function () {
            const productId = this.dataset.id;
            addToCart(productId, true);
        });
    });

    document.querySelectorAll(".cart-btn").forEach(button => {
        button.addEventListener("click", function () {
            const productId = this.dataset.id;
            addToCart(productId);
        });
    });
}


// 🛒 Function to add item to Cart (Guest & Logged-in Users)
async function addToCart(productId, redirectToCheckout = false) {
    const token = localStorage.getItem("authToken");

    if (!token) {
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
            window.location.href = "checkout.html";
        }
        return;
    }

    // Logged-in user cart API request
    try {
        const response = await fetch(CART_API, {
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
                window.location.href = "checkout.html";
            }
        } else {
            alert(data.message || "Error adding to cart");
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
    }
}

// ❤️ Function to add item to Wishlist (Guest & Logged-in Users)
async function addToWishlist(productId) {
    const token = localStorage.getItem("authToken");

    if (!token) {
        let wishlist = JSON.parse(localStorage.getItem("guestWishlist")) || [];
        if (!wishlist.includes(productId)) {
            wishlist.push(productId);
            localStorage.setItem("guestWishlist", JSON.stringify(wishlist));
            alert("✅ Added to Wishlist! ❤️");
        }
        return;
    }

    // Logged-in user wishlist API request
    try {
        const response = await fetch(WISHLIST_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ productId })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert("✅ Added to Wishlist! ❤️");
        } else {
            console.error("❌ Server Error:", data.message || "Error adding to wishlist");
            alert(data.message || "❌ Error adding to wishlist");
        }
    } catch (error) {
        console.error("❌ Error adding to wishlist:", error);
        alert("❌ Failed to add to wishlist. Please try again.");
    }
}
