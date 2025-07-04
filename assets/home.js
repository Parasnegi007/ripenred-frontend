document.addEventListener("DOMContentLoaded", () => {
function loadSaleProducts() {
    fetch("https://pureplucks.com/api/products/sale-products")
        .then(response => response.json())
        .then(products => {
            const saleProductsContainer = document.getElementById("sale-list");
            saleProductsContainer.innerHTML = ""; // Clear previous content

            products
                .filter(product => !product.outOfStock) // ⛔ Skip out-of-stock items
                .forEach(product => {
                    const productCard = `
                        <div class="product-card" data-product-id="${product._id}">
                            <img src="${product.image}" alt="${product.name}" />
                            <h3>${product.name}</h3>
                            <p>
                                <span class="mrp">₹${product.mrp}</span>
                                <span class="price">₹${product.price}</span>
                            </p>
                            <button class="buy-now-btn" data-id="${product._id}">Buy Now</button>
                            <button class="cart-btn" data-id="${product._id}">
                                <i class="fas fa-shopping-cart"></i>
                            </button>
                        </div>
                    `;

                    saleProductsContainer.insertAdjacentHTML("beforeend", productCard);
                });

            // Attach click event listeners AFTER products are added to the DOM
            document.querySelectorAll(".product-card").forEach(card => {
                card.addEventListener("click", (e) => {
                    if (
                        e.target.closest(".cart-btn") ||
                        e.target.closest(".buy-now-btn")
                    ) return;

                    const productId = card.getAttribute("data-product-id");
                    if (productId) {
                        window.location.href = `products.html?product=${productId}`;
                    } else {
                        console.error("❌ No product ID found.");
                    }
                });
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
        })
        .catch(error => console.error("❌ Error loading sale products:", error));
}


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
                window.location.href = "checkout.html"; // Redirect logged-in user to checkout
            }
        } else {
            alert(data.message || "Error adding to cart");
        }
    } catch (error) {
        console.error("Error adding to cart:", error);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    loadSaleProducts();

    const oneDay = 24 * 60 * 60 * 1000;
    const saleDuration = 7 * oneDay; // 7 days sale period
    const breakDuration = 2 * oneDay; // 2 days break period
    const cycleLength = saleDuration + breakDuration;

    // Set the initial sale start time
    const initialSaleStart = new Date("May 1, 2025 00:00:00").getTime();

    function getCurrentPhase() {
        const now = new Date().getTime();
        const timeElapsed = now - initialSaleStart;
        const currentCycleTime = timeElapsed % cycleLength;

        if (currentCycleTime < saleDuration) {
            return {
                phase: "sale",
                timeLeft: saleDuration - currentCycleTime
            };
        } else {
            return {
                phase: "break",
                timeLeft: cycleLength - currentCycleTime
            };
        }
    }

    function updateCountdown() {
        const { phase, timeLeft } = getCurrentPhase();
        const bannerHeading = document.querySelector(".countdown-banner h1");
        const saleProductsContainer = document.getElementById("sale-products");

        if (phase === "sale") {
            bannerHeading.innerHTML = `Limited Time Sale! <strong>Grab Your Favorites Now!</strong>`;
            saleProductsContainer.style.display = "block"; // Show products during sale
        } else {
            bannerHeading.innerHTML = `<strong>Get Ready!</strong>: Next Sale Starts In `;
            saleProductsContainer.style.display = "none"; // Hide products during break
        }

        const days = Math.floor(timeLeft / oneDay);
        const hours = Math.floor((timeLeft % oneDay) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        document.getElementById("days").textContent = days.toString().padStart(2, '0');
        document.getElementById("hours").textContent = hours.toString().padStart(2, '0');
        document.getElementById("minutes").textContent = minutes.toString().padStart(2, '0');
        document.getElementById("seconds").textContent = seconds.toString().padStart(2, '0');
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();
});
});
    document.addEventListener("DOMContentLoaded", updateCartCount);   
    
    document.addEventListener("DOMContentLoaded", () => {
        const carouselWrapper = document.querySelector(".hero-carousel");
        const dotsContainer = document.querySelector(".carousel-dots");
        const prevArrow = document.querySelector(".carousel-control.prev");
        const nextArrow = document.querySelector(".carousel-control.next");
        const slides = Array.from(document.querySelectorAll(".carousel-slide")); // Get all slides
        const dots = Array.from(document.querySelectorAll(".dot")); // Get all dots
    
        let currentIndex = 0;
        let autoSlideInterval;
    
        // Function to update slide position
       function updateSlidePosition() {
  const offset = -currentIndex * 100;
  carouselWrapper.style.transform = `translateX(${offset}%)`;
  carouselWrapper.style.transition = "transform 0.8s ease";

  // Update active dot
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === currentIndex);
  });

  // Remove animations from all slides
  slides.forEach(slide => {
    const h2 = slide.querySelector("h2");
    const p = slide.querySelector("p");
    const btn = slide.querySelector("a");

    if (h2) h2.classList.remove("animate-h2");
    if (p) p.classList.remove("animate-p");
    if (btn) btn.classList.remove("animate-btn");

    if (h2) h2.style.opacity = "0";
    if (p) p.style.opacity = "0";
    if (btn) btn.style.opacity = "0";
  });

  // Animate active slide content
  const activeSlide = slides[currentIndex];
  const h2 = activeSlide.querySelector("h2");
  const p = activeSlide.querySelector("p");
  const btn = activeSlide.querySelector("a");

  setTimeout(() => {
    if (h2) h2.classList.add("animate-h2");
    if (p) p.classList.add("animate-p");
    if (btn) btn.classList.add("animate-btn");
  }, 800); // Delay after slide transition
}

        // Auto-Slide Function
        function startAutoSlide() {
            stopAutoSlide(); // Stop any existing interval before starting a new one
            autoSlideInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % slides.length; // Move to the next slide
                updateSlidePosition();
            }, 5000); // 10-second interval
        }
    
        function stopAutoSlide() {
            clearInterval(autoSlideInterval); // Clear the auto-slide interval
        }
    
        // Event listeners for arrows
        prevArrow.addEventListener("click", () => {
            stopAutoSlide(); // Stop auto-slide on manual interaction
            currentIndex = (currentIndex - 1 + slides.length) % slides.length; // Loop backward
            updateSlidePosition();
            startAutoSlide(); // Restart auto-slide after manual interaction
        });
    
        nextArrow.addEventListener("click", () => {
            stopAutoSlide(); // Stop auto-slide on manual interaction
            currentIndex = (currentIndex + 1) % slides.length; // Loop forward
            updateSlidePosition();
            startAutoSlide(); // Restart auto-slide after manual interaction
        });
    
        // Dot navigation
        dots.forEach((dot, i) => {
            dot.addEventListener("click", () => {
                stopAutoSlide(); // Stop auto-slide on manual interaction
                currentIndex = i; // Set the current index to the clicked dot's index
                updateSlidePosition();
                startAutoSlide(); // Restart auto-slide after manual interaction
            });
        });
    
        // Initialize the carousel
        updateSlidePosition();
        startAutoSlide();
    });
    

    // 🚀 Dashboard Icon Click Logic (Login Persistence)
    const dashboardIcon = document.querySelector(".dashboard-container a");

    if (dashboardIcon) {
        dashboardIcon.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent default navigation

            const loggedInUser = localStorage.getItem("loggedInUser");

if (localStorage.getItem("isLoggedIn") === "true" && loggedInUser) {
    window.location.href = "dashboard.html"; 
} else {
    window.location.href = "guest-dashboard.html"; 
}
        });
    }
    // Store login state in localStorage after successful login
localStorage.setItem("isLoggedIn", "true");
console.log("User logged in, isLoggedIn set to:", localStorage.getItem("isLoggedIn"));


    // ✅ Ensure Login State Persists
    if (localStorage.getItem("isLoggedIn") !== "true") {
        console.log("User is not logged in.");
    } else {
        console.log("User is logged in.");
    }

document.addEventListener("DOMContentLoaded", async function () {
    await checkLoginStatus();
});

// 🔹 Fetch Login Status from Backend
async function checkLoginStatus() {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            console.log("User is not logged in.");
            return;
        }

        const response = await fetch("https://pureplucks.com/api/users/me", {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            console.log("User session expired or invalid token.");
            localStorage.removeItem("authToken");
            return;
        }

        const userData = await response.json();
        console.log("User is logged in:", userData);

        // ✅ Update Dashboard Link Based on Login Status
        const dashboardIcon = document.querySelector(".dashboard-container a");
        if (dashboardIcon) {
            dashboardIcon.href = "dashboard.html";
        }
    } catch (error) {
        console.error("Error checking login status:", error);
    }
}


document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("https://pureplucks.com/api/products/featured");
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

    attachHoverTracking(); // Re-attach hover events after DOM update
}
    document.addEventListener("DOMContentLoaded", () => {
    const images = document.querySelectorAll('.image-scrollbar'); // Target images in the scroller

    const handleScroll = () => {
        images.forEach(image => {
            const rect = image.getBoundingClientRect();
            const scrollThreshold = window.innerHeight * 0.6; // Adjust sensitivity dynamically (80% of the viewport height)

            // Check if the image enters or leaves the sensitive area
            if (rect.top < scrollThreshold && rect.bottom > 0) {
                image.style.transform = 'translateX(0)'; // Slide in
                image.style.opacity = '1'; // Fade in
            } else {
                image.style.transform = 'translateX(-100%)'; // Slide out
                image.style.opacity = '0'; // Fade out
            }
        });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Trigger on page load
});


document.addEventListener("DOMContentLoaded", () => {
    const testimonials = document.querySelectorAll('.testimonial');

    const handleScroll = () => {
        testimonials.forEach(testimonial => {
            const rect = testimonial.getBoundingClientRect();
            const scrollThreshold = window.innerHeight * 0.6;
            if (rect.top < window.innerHeight && rect.bottom >= 0) {
                testimonial.style.transform = 'translateX(0)';
                testimonial.style.opacity = '1';
            } else {
                testimonial.style.transform = 'translateX(-100%)';
                testimonial.style.opacity = '0';
            }
        });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Trigger effect on page load
    
});

document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("discountPopup");
  const closeBtn = document.getElementById("closePopup");
  const revealBtn = document.getElementById("revealButton");
  const couponText = document.getElementById("couponText");
  const promoButton = document.querySelector(".promo-button");

  const COUPON_CODE = "PURE20"; // ✅ Set your coupon code here

  // Show Popup on "Get Discount" Button Click
  if (promoButton) {
    promoButton.addEventListener("click", () => {
      popup.style.display = "flex";

      if (localStorage.getItem("isLoggedIn") === "true" && localStorage.getItem("loggedInUser")) {
        couponText.textContent = COUPON_CODE;
        revealBtn.style.display = "none"; // Hide the button if already logged in
      } else {
        couponText.textContent = "********";
        revealBtn.style.display = "inline-block";
      }
    });
  }

  // Close the Popup
  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
  });

  // Redirect to Signup if not logged in
  revealBtn.addEventListener("click", () => {
    window.location.href = "signup.html";
  });

  // Optional: Close popup when clicking outside content
  window.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.style.display = "none";
    }
  });
});
// Add loading class immediately
document.body.classList.add("loading");

// Hide loader once everything is fully loaded
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");

  if (loader) {
    // Use requestAnimationFrame for smoother rendering
    requestAnimationFrame(() => {
      loader.style.opacity = "0";
      loader.style.pointerEvents = "none";

      // Fully remove after fade-out
      setTimeout(() => {
        loader.style.display = "none";
        document.body.classList.remove("loading");
      }, 300); // Match with CSS transition
    });
  }
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
