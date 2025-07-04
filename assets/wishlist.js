async function fetchWishlist() {
    const token = localStorage.getItem("authToken");
    if (!token) {
        console.error("❌ User not logged in!");
        return;
    }

    try {
        const response = await fetch("https://pureplucks.com/api/users/wishlist", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
        });

        const wishlist = await response.json();
        displayWishlist(wishlist); // ✅ Ensure it updates the HTML
    } catch (error) {
        console.error("❌ Error fetching wishlist:", error);
    }
}
async function loadWishlist() {
    const token = localStorage.getItem("authToken");
    let wishlist = [];

    if (token) {
        const response = await fetch("https://pureplucks.com/api/users/wishlist", { headers: { Authorization: `Bearer ${token}` } });
        wishlist = await response.json();
    } else {
        // ✅ Ensure guestWishlist is always defined
        let guestWishlist = JSON.parse(localStorage.getItem("guestWishlist")) || [];
        console.log("🔍 Guest Wishlist Product IDs:", guestWishlist);

        wishlist = await Promise.all(guestWishlist.map(async (productId) => {
            const res = await fetch(`https://pureplucks.com/api/products/${productId}`);
            return res.json();
        }));

        console.log("📦 Final Wishlist Data for Display:", wishlist);
    
    }

    displayWishlist(wishlist);
}

loadWishlist();
function displayWishlist(wishlist) {
    const wishlistContainer = document.getElementById("wishlistItems");
    if (!wishlistContainer) {
        console.error("❌ Wishlist container not found in HTML.");
        return;
    }

    wishlistContainer.innerHTML = ""; // Clear previous items

    if (wishlist.length === 0) {
        wishlistContainer.innerHTML = "<p>Your wishlist is empty.</p>";
        return;
    }

    wishlist.forEach(product => {
        const outOfStock = product.outOfStock === true;

        const itemDiv = document.createElement("div");
        itemDiv.id = `wishlist-item-${product._id}`;
        itemDiv.className = "wishlist-item";
        itemDiv.setAttribute("data-product-id", product._id);

        itemDiv.innerHTML = `
            <div class="wishlist-img-wrapper" style="position: relative;">
                <img src="${product.image}" alt="${product.name}">
                ${outOfStock ? '<span class="out-of-stock-label" style="position:absolute;top:8px;left:8px;background:red;color:white;padding:2px 6px;font-size:12px;">Out of Stock</span>' : ''}
            </div>
            <h3>${product.name}</h3>
            <p>
                ${outOfStock 
                    ? '<span class="price" style="color:red;">Out of Stock</span>' 
                    : `<span class="mrp">₹${product.mrp}</span> <span class="price">₹${product.price}</span>`}
            </p>
            <div class="wishlist-buttons">
                <button class="buy-now-btn" data-id="${product._id}" ${outOfStock ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>Buy Now</button>
                <button class="add-to-cart" onclick="addToCart('${product._id}')" ${outOfStock ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>
                    <i class="fas fa-shopping-cart"></i>
                </button>
                <button class="remove-btn" onclick="removeFromWishlist('${product._id}')">Remove</button>
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
     document.querySelectorAll(".cart-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const productId = this.getAttribute("data-id");
          addToCart(productId);


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
        alert("Added to cart! 🛒");

        if (redirectToCheckout) {
            window.location.href = "../store/checkout.html"; // Redirect guest user to checkout
        }
        return;
    }

    // Logged-in user - store in backend
    try {
        const response = await fetch( "https://pureplucks.com/api/users/cart", {
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
                window.location.href = "../store/checkout.html"; // Redirect logged-in user to checkout
            }
        } else {
            alert(data.message || "Error adding to cart");
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
    }
}

// ✅ Call this function on page load
document.addEventListener("DOMContentLoaded", fetchWishlist);
async function removeFromWishlist(productId) {
    const token = localStorage.getItem("authToken");

    if (token) {
        try {
            const response = await fetch(`https://pureplucks.com/api/users/wishlist/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                alert("❌ Error removing from wishlist!");
                return;
            }
        } catch (error) {
            console.error("❌ Error:", error);
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

    alert("❌ Removed from Wishlist!");
}