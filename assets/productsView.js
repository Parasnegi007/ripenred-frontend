let product = null; // ✅ Declare globally to be accessible in event listeners
let selectedQuantity = 1; // ✅ Default quantity

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get("product");

    console.log("🔍 Retrieved Product ID:", productId);

    if (!productId) {
        console.error("❌ No product ID found in URL.");
        document.querySelector(".product-container").innerHTML = "<p>Product not found.</p>";
        return;
    }

    try {
        const response = await fetch(`https://pureplucks.com/api/products/${productId}`);
        if (!response.ok) throw new Error("Failed to fetch product details");

        product = await response.json(); // ✅ Assign product globally
        console.log("✅ Product Data:", product);

        productId = product._id || product.productId;  

        if (!productId) {
            console.error("❌ Product ID missing from API response.");
            document.querySelector(".product-container").innerHTML = "<p>Product not found.</p>";
            return;
        }
// Populate product details dynamically
document.getElementById("product-image").src = product.image;
document.getElementById("product-title").innerText = product.name;
document.getElementById("product-tags").innerHTML = 
    (product.tags || ["100% Natural", "Handpicked", "Sun-Ripened"])
    .map(tag => `<span style="background-color: #FFA500; color: white; padding: 4px 10px; 
        border-radius: 6px; font-size: 14px; font-weight: bold; text-transform: uppercase; 
        white-space: nowrap; margin-right: 6px; font-style: normal;
        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2); transition: all 0.3s ease-in-out; cursor:pointer;
        display: inline-block;">${tag}</span>`)
    .join("");

const style = document.createElement("style");
style.innerHTML = `
    #product-tags span:hover {
        transform: translateY(-3px);
        box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.3);
    }
`;
document.head.appendChild(style);

document.getElementById("product-description").innerHTML = product.description.substring(0, 200) + "...";
document.getElementById("full-description").innerHTML = product.description;

const isOutOfStock = product.outOfStock === true;

// Handle MRP and Price
document.getElementById("product-mrp").innerText = isOutOfStock ? "" : `₹${product.mrp}`;
document.getElementById("product-price").innerText = isOutOfStock ? "Out of Stock" : `₹${product.price}`;

// Disable buttons if out of stock
if (isOutOfStock) {
    document.querySelector(".add-to-cart").disabled = true;
    document.querySelector(".buy-now").disabled = true;
    document.querySelector(".add-to-cart").style.opacity = "0.5";
    document.querySelector(".buy-now").style.opacity = "0.5";
    document.querySelector(".add-to-cart").style.cursor = "not-allowed";
    document.querySelector(".buy-now").style.cursor = "not-allowed";
}

        // ✅ Inject Quantity Controls Before Price
        const quantityControlHTML = document.createElement("div");
        quantityControlHTML.classList.add("quantity-control");
        quantityControlHTML.innerHTML = `
            <button class="quantity-btn-minus">-</button>
            <span id="product-quantity">${selectedQuantity}</span>
            <button class="quantity-btn-plus">+</button>
        `;
        document.getElementById("product-mrp").insertAdjacentElement("beforebegin", quantityControlHTML);

        // ✅ Attach event listeners to quantity buttons
        document.querySelector(".quantity-btn-minus").addEventListener("click", () => {
            updateProductQuantity(-1);
        });

        document.querySelector(".quantity-btn-plus").addEventListener("click", () => {
            updateProductQuantity(1);
        });

    } catch (error) {
        console.error("❌ Error fetching product details:", error);
        document.querySelector(".product-container").innerHTML = "<p>Product not found.</p>";
    }
});

// ✅ Function to update quantity dynamically
function updateProductQuantity(change) {
    selectedQuantity = Math.max(1, selectedQuantity + change);
    console.log("🔄 Updated Quantity:", selectedQuantity);
    document.getElementById("product-quantity").innerText = selectedQuantity;
}document.addEventListener("DOMContentLoaded", async function () {
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
            addToCart(productId, 1, true);
        });
    });

    document.querySelectorAll(".cart-btn").forEach(button => {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            const productId = this.getAttribute("data-id");
            addToCart(productId, 1);
        });
    });

    if (recentlyViewedContainer.children.length === 0) {
        recentlyViewedContainer.innerHTML = "<p>Currently No Recommended products.</p>";
    }
});

let alertShown = false; // ✅ Track if alert has been displayed
document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".add-to-cart").addEventListener("click", () => {
        if (product) {
            console.log("🛒 Adding to Cart:", product._id, "Quantity:", selectedQuantity);
            addToCart(product._id, selectedQuantity);
            alert("Added to cart! 🛒"); // ✅ Show alert every time button is clicked
        } else {
            console.error("❌ Product is not available when adding to cart.");
        }
    });

    document.querySelector(".buy-now").addEventListener("click", () => {
        if (product) {
            console.log("⚡ Buying Now:", product._id, "Quantity:", selectedQuantity);
            addToCart(product._id, selectedQuantity, true);
            alert("Added to cart! 🛒"); // ✅ Show alert every time button is clicked
        } else {
            console.error("❌ Product is not available when buying.");
        }
    });
});

// 🛒 Updated Add to Cart Function
async function addToCart(productId, quantity, redirectToCheckout = false) {
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
        console.log("✅ Cart Updated:", cart);

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
            console.log("✅ Added to Cart Successfully");

            if (redirectToCheckout) window.location.href = "checkout.html";
        } else {
            console.error("❌ Error adding to cart:", data.message);
        }
    } catch (error) {
        console.error("❌ Error adding to cart:", error);
    }
}
function toggleFAQ(element) {
    let answer = element.nextElementSibling;
    answer.style.display = (answer.style.display === "none" || answer.style.display === "") ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", async function () {
  const token = localStorage.getItem("authToken");

  const couponText = document.getElementById("couponText");
  const revealLink = document.getElementById("revealLink");

  if (!couponText || !revealLink || !token) return;

  try {
    const response = await fetch("https://pureplucks.com/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      localStorage.removeItem("authToken");
      return;
    }

    await response.json();

    couponText.textContent = "PURE20";
    revealLink.style.display = "none";
  } catch (error) {
    // Optional: handle silently
  }
});
