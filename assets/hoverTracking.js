// === Secure Hover & Click Tracking for 'Recently Viewed' ===

// Utility for safe string handling
function sanitizeInput(input) {
  if (!input && input !== 0) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function getRecentlyViewed() {
  try {
    const viewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
    return Array.isArray(viewed) ? viewed : [];
  } catch {
    return [];
  }
}

function setRecentlyViewed(viewed) {
  // Only save up to 10 items
  localStorage.setItem("recentlyViewed", JSON.stringify(viewed.slice(0, 10)));
}

// Attach events for product hovers
function attachHoverTracking() {
  const productCards = document.querySelectorAll(".product-card");
  productCards.forEach(card => {
    let hoverTimer;

    function safeGet(selector) {
      try {
        const el = card.querySelector(selector);
        return el;
      } catch { return null; }
    }

    function hoverHandler() {
      hoverTimer = setTimeout(() => {
        // Gather essential info for viewed product
        const buyNowBtn = safeGet(".buy-now-btn");
        const img = safeGet("img");
        const title = safeGet("h3");
        const price = safeGet(".price");

        // Validate required data
        if (!buyNowBtn || !img || !title || !price) return;
        const productId = sanitizeInput(buyNowBtn.getAttribute("data-id"));
        const productImage = sanitizeInput(img.src);
        const productName = sanitizeInput(title.innerText);
        const productPrice = sanitizeInput(price.innerText);

        // Compose viewed product object
        const entry = { productId, productImage, productName, productPrice };
        if (!productId) return;

        let viewed = getRecentlyViewed();
        // Remove if already present
        viewed = viewed.filter(p => p.productId !== productId);
        // Add to top
        viewed.unshift(entry);
        setRecentlyViewed(viewed);
      }, 1200); // Hover threshold 1.2s
    }

    function leaveHandler() {
      clearTimeout(hoverTimer);
    }

    // Remove previous listeners (idempotency)
    card.removeEventListener("mouseenter", hoverHandler);
    card.removeEventListener("mouseleave", leaveHandler);

    card.addEventListener("mouseenter", hoverHandler);
    card.addEventListener("mouseleave", leaveHandler);
  });
}

// Attach events for product clicks
function attachClickTracking() {
  const productCards = document.querySelectorAll(".product");
  productCards.forEach(card => {
    function safeGet(selector) {
      try { return card.querySelector(selector); } catch { return null; }
    }

    function clickHandler(e) {
      // Do not track on action buttons
      if (
        e.target.closest(".cart-btn") ||
        e.target.closest(".buy-now-btn") ||
        e.target.closest(".add-to-wishlist")
      ) return;

      const buyNowBtn = safeGet(".buy-now-btn");
      const img = safeGet("img");
      const title = safeGet("h3");
      const price = safeGet(".price");

      if (!buyNowBtn || !img || !title || !price) return;
      const productId = sanitizeInput(buyNowBtn.getAttribute("data-id"));
      const productImage = sanitizeInput(img.src);
      const productName = sanitizeInput(title.innerText);
      const productPrice = sanitizeInput(price.innerText);

      if (!productId) return;

      let viewed = getRecentlyViewed();
      viewed = viewed.filter(p => p.productId !== productId);
      viewed.unshift({ productId, productImage, productName, productPrice });
      setRecentlyViewed(viewed);

      // Navigate to product details page
      window.location.href = `products.html?product=${encodeURIComponent(productId)}`;
    }

    card.removeEventListener("click", clickHandler);
    card.addEventListener("click", clickHandler);
  });
}

// Initialize tracking on DOM load
document.addEventListener("DOMContentLoaded", function () {
  attachHoverTracking();
  attachClickTracking();
});
