
// ✅ Ensure cart is loaded when the page loads
document.addEventListener("DOMContentLoaded", loadCart);

// ✅ Function to Load Cart Data
// ✅ Load Cart Function
async function loadCart() {
    const token = localStorage.getItem("authToken");
    let cart = [];

    if (token) {
        try {
            const response = await fetch("https://pureplucks.com/api/users/cart", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await response.json();
            if (Array.isArray(result)) {
                cart = result;
            }
        } catch (error) {
            console.error("❌ Error fetching cart:", error);
        }
    } else {
        cart = JSON.parse(localStorage.getItem("guestCart")) || [];
    }

    // 🔄 Enrich cart with product details
    const enrichedCart = await Promise.all(
        cart.map(async item => {
            try {
                const res = await fetch(`https://pureplucks.com/api/products/${item.productId}`);
                if (!res.ok) return { ...item, deleted: true };
                const product = await res.json();
                return {
                    ...item,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    outOfStock: product.outOfStock,
                    deleted: false
                };
            } catch {
                return { ...item, deleted: true };
            }
        })
    );
displayCart(enrichedCart);
updateCartCounter(enrichedCart);

// ✅ Simple out-of-stock check
const hasOutOfStock = enrichedCart.some(item => item.outOfStock === true);
if (hasOutOfStock) {
    alert("Some items in your cart are out of stock. Please remove them before proceeding to checkout.");
}
}


// ✅ Display Cart Function
function displayCart(cart) {
    const cartContainer = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const checkoutBtn = document.getElementById("checkout-btn");
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

        if (isDeleted) {
            blockCheckout = true;
        } else if (isOutOfStock) {
            blockCheckout = true;
        }

        let itemTotal = (!isDeleted && !isOutOfStock) ? item.price * item.quantity : 0;
        totalAmount += itemTotal;

        const cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        cartItem.setAttribute("data-id", item.productId);

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
                    `₹${item.price}`}</p>
                <div class="cart-actions">
                    <button class="cart-btn-minus" onclick="updateCartQuantity('${item.productId}', ${item.quantity - 1})" 
                        ${isDeleted || isOutOfStock ? 'disabled' : ''}>-</button>
                    <span class="cart-quantity">${item.quantity}</span>
                    <button class="cart-btn-plus" onclick="updateCartQuantity('${item.productId}', ${item.quantity + 1})" 
                        ${isDeleted || isOutOfStock ? 'disabled' : ''}>+</button>
                    <button class="cart-btn-remove" onclick="removeFromCart('${item.productId}')">Remove</button>
                </div>
            </div>
        `;

        cartContainer.appendChild(cartItem);
    });

    cartTotal.innerText = totalAmount.toFixed(2);
    checkoutBtn.disabled = blockCheckout;

    // 🚚 Free Shipping Progress
    const shippingMessage = document.querySelector(".shipping-message");
    const shippingFill = document.querySelector(".shipping-fill");
    const shippingTruck = document.querySelector(".shipping-truck");

    let progress = 0;
    let message = "";

    if (totalAmount >= 1000) {
        progress = 100;
        message = "🎉 Yay! You’ve unlocked FREE Shipping!";
    } else if (totalAmount >= 500) {
        progress = (totalAmount / 1000) * 100;
        const more = (1000 - totalAmount).toFixed(0);
        message = `🛒 Add ₹${more} more to get FREE shipping!!`;
    } else {
        progress = (totalAmount / 1000) * 100;
        const more = (1000 - totalAmount).toFixed(0);
        message = `🚚 Add ₹${more} more for free shipping !!`;
    }

    shippingMessage.textContent = message;
    shippingFill.style.width = `${progress}%`;
    shippingTruck.style.left = `calc(${progress}% - 20px)`;
}



// ✅ Function to Update Cart Quantity
async function updateCartQuantity(productId, newQuantity) {
    if (newQuantity < 1) return;

    const token = localStorage.getItem("authToken");

    // Check product stock first
    try {
        const productRes = await fetch(`https://pureplucks.com/api/products/${productId}`);
        const product = await productRes.json();

        if (product.stock === 0) {
            alert("Product is out of stock. Cannot update quantity.");
            return;
        }

        if (token) {
            await fetch(`https://pureplucks.com/api/users/cart/${productId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ quantity: newQuantity })
            });
        } else {
            let cart = JSON.parse(localStorage.getItem("guestCart")) || [];
            cart = cart.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item);
            localStorage.setItem("guestCart", JSON.stringify(cart));
        }

        loadCart();
    } catch (error) {
        console.error("Error updating cart quantity:", error);
    }
}

async function removeFromCart(productId) {
    const cartItem = document.querySelector(`.cart-item[data-id="${productId}"]`);
    
    if (!cartItem) {
        console.error(`Cart item with productId ${productId} not found.`);
        return;
    }

    // Add removed class for animation
    cartItem.classList.add("removed");

    // Wait for animation to complete before making the API call
    setTimeout(async () => {
        const token = localStorage.getItem("authToken");
        if (token) {
            try {
                await fetch(`https://pureplucks.com/api/users/cart/${productId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
                loadCart();
            } catch (error) {
                console.error("Error removing item from cart:", error);
            }
        } else {
            let cart = JSON.parse(localStorage.getItem("guestCart")) || [];
            cart = cart.filter(item => item.productId !== productId);
            localStorage.setItem("guestCart", JSON.stringify(cart));
            loadCart();
        }
    }, 2000); // Adjust timing to match the animation duration
}

// ✅ Function to Update Cart Counter

function updateCartCounter(cart) {
    let totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById("cart-count").innerText = totalItems || "";
}
// Log cart data from localStorage
let cart = JSON.parse(localStorage.getItem("guestCart")) || [];
console.log("🚗 Cart Data from localStorage:", cart);

// If cart is empty, log an alert
if (cart.length === 0) {
    console.log("No cart data found in localStorage.");
}

// Log each cart item to inspect the structure
cart.forEach(item => {
    console.log("🛍️ Cart Item Details:", item);
});

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
            const res = await fetch(`https://pureplucks.com/api/products/${product.productId}`);
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
            addToCart(productId, 1, true); // Redirect to checkout
        });
    });

    document.querySelectorAll(".cart-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const productId = this.getAttribute("data-id");
            addToCart(productId, 1); // Just add to cart
        });
    });

    if (recentlyViewedContainer.children.length === 0) {
        recentlyViewedContainer.innerHTML = "<p>Currently No Recommended products.</p>";
    }
});

// 🛒 Function to add item to Cart
async function addToCart(productId, quantity = 1, redirectToCheckout = false) {
    const token = localStorage.getItem("authToken");

   if (!token) {
    let cart = JSON.parse(localStorage.getItem("guestCart")) || [];
    const itemIndex = cart.findIndex(item => item.productId === productId);

    if (itemIndex > -1) {
        cart[itemIndex].quantity += quantity;
    } else {
        cart.push({ productId, quantity });
    }

    localStorage.setItem("guestCart", JSON.stringify(cart));
    updateCartCount();
    alert("Added to cart!");
    window.location.reload();

    if (redirectToCheckout) {
        window.location.href = "checkout.html";
    }
    return;
}

    try {
        const response = await fetch("https://pureplucks.com/api/users/cart", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ productId, quantity })
        });

        const data = await response.json();
       if (response.ok) {
    updateCartCount();
    alert("Added to Cart! 🛒");
    window.location.reload();

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

    
document.addEventListener("DOMContentLoaded", () => {
    const cartItemsContainer = document.getElementById("cart-items");

    cartItemsContainer.addEventListener("click", (event) => {
        if (event.target.classList.contains("cart-btn-remove")) {
            const cartItem = event.target.closest(".cart-item");

            if (!cartItem) {
                console.error("Cart item element not found.");
                return;
            }

            // Add transition effect and "Removed" text
            cartItem.classList.add("removed");
            cartItem.innerHTML += `<span class="removed-label">Removed</span>`;

            setTimeout(() => {
                cartItem.remove();
            }, 500); // Remove after animation
        }
    });

});


document.addEventListener("DOMContentLoaded", async () => {
    const checkoutButton = document.getElementById("checkout-btn");

    if (!checkoutButton) {
        console.error("❌ Checkout button not found.");
        return;
    }

    checkoutButton.addEventListener("click", async (event) => {
        event.preventDefault(); // ✅ Stop default navigation behavior

        const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
        const token = localStorage.getItem("authToken");
        let userCart = [];

        if (token) {
            try {
                const response = await fetch("https://pureplucks.com/api/users/cart", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                userCart = await response.json();
            } catch (error) {
                console.error("❌ Error fetching user cart:", error);
            }
        }

        const isCartEmpty = !token ? guestCart.length === 0 : userCart.length === 0;

        if (isCartEmpty) {
            alert("🛒 Please add some items to the cart before proceeding to checkout!");
        } else {
            window.location.href = "checkout.html"; // ✅ Navigate to checkout ONLY if cart isn't empty
        }
    });
});

function startDeliveryCountdown() {
    const countdownEl = document.getElementById("countdown");
    const container = document.getElementById("delivery-timer");

    function updateTimer() {
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
            container.innerHTML = `<p class="delivery-message">🚚 Oops, you missed today’s cut-off! <strong>Order before 12 PM to get your items delivered next day</strong> – fast & fresh!</p>`;
            clearInterval(timerInterval);
        }
    }

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
}

document.addEventListener("DOMContentLoaded", startDeliveryCountdown);
