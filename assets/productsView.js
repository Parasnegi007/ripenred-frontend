// ✅ Production-grade ProductView - with enhancements and best-practices

// === Config & Env ===
const CONFIG = {
  get API_BASE() { return getAPIURL(); }, // Dynamic API URL
  TOKENS: {
    AUTH: "authToken",
    GUEST_CART: "guestCart",
    VIEWED: "recentlyViewed"
  },
  DELHI_PINCODES: [
    "110001", "110002", "110003", "110004", "110005", "110006", "110007", "110008", "110009",
    "110010", "110011", "110012", "110013", "110014", "110015", "110016", "110017", "110018",
    "110019", "110020", "110021", "110022", "110023", "110024", "110025", "110026", "110027",
    "110028", "110029", "110030", "110031", "110032", "110033", "110034", "110035", "110036",
    "110037", "110038", "110039", "110040", "110041", "110042", "110043", "110044", "110045",
    "110046", "110047", "110048", "110049", "110050", "110051", "110052", "110053", "110054",
    "110055", "110056", "110057", "110058", "110059", "110060", "110061", "110062", "110063",
    "110064", "110065", "110066", "110067", "110068", "110069", "110070", "110071", "110072",
    "110073", "110074", "110075", "110076", "110077", "110078", "110080", "110081", "110082",
    "110083", "110084", "110085", "110086", "110087", "110088", "110089", "110090", "110091",
    "110092", "110093", "110094", "110095", "110096"
  ]
};

// === Error Tracker (Basic) ===
class ErrorTracker {
  static track(error, context = {}) {
    const err = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: location.href,
      context
    };
    console.error('[ProductView.Error]', err);
    // You can integrate with external loggers/analytics
  }
}

// === Loading Indicator ===
class LoadingManager {
  static show(msg = 'Loading...') {
    let loader = document.getElementById('global-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'global-loader';
      loader.style.cssText = 
        'position:fixed;top:0;left:0;right:0;bottom:0;background:#000A;z-index:9999;display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:#fff;';
      loader.setAttribute('role', 'status');
      loader.setAttribute('aria-label', msg);
      document.body.appendChild(loader);
    }
    loader.innerHTML = `<span style="padding:20px;border-radius:12px;background:#222b">${msg}</span>`;
  }
  static hide() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.remove();
  }
}

// === Global State ===
let product = null;
let selectedQuantity = 1;

// === HTML Sanitizer Utility ===
const Sanitizer = {
  sanitize(input) {
    const el = document.createElement("div");
    el.innerHTML = input || "";
    ["script", "iframe", "object", "embed", "link", "meta"].forEach(tag => {
      const nodes = el.getElementsByTagName(tag);
      while (nodes.length > 0) nodes[0].remove();
    });
    return el.innerHTML;
  },
  escape(str) {
    const temp = document.createElement("div");
    temp.textContent = str;
    return temp.innerHTML;
  }
};

// === Quantity Update ===
function updateProductQuantity(change) {
  selectedQuantity = Math.max(1, selectedQuantity + change);
  document.getElementById("product-quantity").innerText = selectedQuantity;
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
// === Product Loader with Loading & Better Error Tracking ===
document.addEventListener("DOMContentLoaded", async () => {
  const productId = new URLSearchParams(location.search).get("product");
  if (!productId) {
    showError("Product not found.");
    ErrorTracker.track(new Error('Missing productId in URL'));
    return;
  }
  LoadingManager.show('Loading product…');
  try {
    const response = await fetch(`${CONFIG.API_BASE}/products/${encodeURIComponent(productId)}`);
    if (!response.ok) throw new Error("Product fetch failed");
    product = await response.json();
    if (!product || !product._id) throw new Error("Incomplete product data");
    renderProductDetails(product);
    setupQuantityControls();
    
    // ✅ Load reviews section after product details are rendered
    setTimeout(() => {
      loadReviewsSection();
    }, 500);
    
    LoadingManager.hide();
  } catch (err) {
    ErrorTracker.track(err, {productId});
    showError("Product not found or broken.");
    LoadingManager.hide();
  }
});

// === Render Main Product ===
function renderProductDetails(p) {
  // ✅ Inject Product JSON-LD Schema for SEO
  injectProductSchema(p);
  
  // ✅ Update breadcrumb and SEO title dynamically
  try {
    const breadcrumbItems = document.querySelectorAll('.breadcrumb ol li');
    if (breadcrumbItems && breadcrumbItems.length >= 3) {
      const lastItem = breadcrumbItems[2];
      lastItem.innerHTML = `<span style="color:#ffd700;font-size:14px;font-weight:500;">${p.name || 'Product'}</span>`;
    }
    document.title = `${p.name} | Fresh Himalayan Fruits | Ripe'n Red`;
  } catch (e) { /* no-op */ }
  
  const img = document.getElementById("product-image");
  if (img) img.src = p.image || "";
  const title = document.getElementById("product-title");
  if (title) title.innerText = Sanitizer.escape(p.name || "");

  // ✅ Render star rating below title if available
  renderStarRating(p);
  const tags = document.getElementById("product-tags");
if (tags) {
  tags.innerHTML = (p.tags || ["100% Natural", "Handpicked", "Sun-Ripened"])
    .map(tag => `
      <span class="liquid-tag">${Sanitizer.escape(tag)}</span>
    `).join("");

  if (!document.getElementById('pv-tags-hover-style')) {
    const style = document.createElement("style");
    style.id = 'pv-tags-hover-style';
    style.textContent = `
      .liquid-tag {
        position: relative;
        background: linear-gradient(135deg, #ff9800, #ff5722);
        color: #fff;
        padding: 10px 10px;
        border-radius: 40px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        margin: 4px;
        display: inline-block;
        cursor: pointer;
        overflow: hidden;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        animation: blobMorph 3s ease-in-out infinite;
      }

      /* Blob-like Morphing */
      @keyframes blobMorph {
        0%   { border-radius: 40px 60px 35px 55px; }
        25%  { border-radius: 55px 35px 60px 40px; }
        50%  { border-radius: 60px 50px 40px 55px; }
        75%  { border-radius: 35px 55px 50px 60px; }
        100% { border-radius: 40px 60px 35px 55px; }
      }

      /* Hover Bounce */
      .liquid-tag:hover {
        transform: scale(1.1) translateY(-3px);
        background: linear-gradient(135deg, #ffa726, #f44336);
        box-shadow: 0 6px 16px rgba(0,0,0,0.25);
      }

      /* Ripple Effect on Click */
      .liquid-tag:active::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        width: 10px;
        height: 10px;
        background: rgba(255,255,255,0.5);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: ripple 0.6s ease-out;
      }

      @keyframes ripple {
        from { width: 10px; height: 10px; opacity: 0.7; }
        to   { width: 120px; height: 120px; opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

  // Rich Text
  const desc = document.getElementById("product-description");
  if (desc) desc.innerHTML = Sanitizer.sanitize((p.description||"").slice(0,340)) ;
  const full = document.getElementById("full-description");
  if (full) full.innerHTML = Sanitizer.sanitize(p.description);
  // Price
  const isOut = p.outOfStock===true;
  const mrp = document.getElementById("product-mrp");
  if (mrp) mrp.innerText = isOut ? "" : `₹${p.mrp}`;
  const price = document.getElementById("product-price");
  if (price) price.innerText = isOut ? "Out of Stock" : `₹${p.price}`;
  
// Savings
const savings = document.getElementById("product-savings");
if (savings) {
  if (!isOut && p.mrp && p.price && p.mrp > p.price) {
    const percent = Math.round(((p.mrp - p.price) / p.mrp) * 100);
    savings.innerText = `Save ${percent}%`;
  } else {
    savings.innerText = "";
  }
}
  document.querySelectorAll(".add-to-cart,.buy-now").forEach(btn => {
    if(btn) {
      btn.disabled = isOut;
      btn.style.opacity = isOut ? "0.5" : "1";
      btn.style.cursor = isOut ? "not-allowed" : "pointer";
    }
  });
}

// ✅ Inject Product JSON-LD schema (client-side fallback)
function injectProductSchema(p) {
  try {
    // Ensure SKU exists, otherwise fallback to ID-based SKU
    const sku = p.sku && typeof p.sku === 'string' && p.sku.trim() !== ''
      ? p.sku
      : `RNR-${(p._id || '').toString().slice(-6).toUpperCase()}`;

    const schema = {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: p.name || '',
      image: [p.image || ''],
      description: (p.description || '').toString().slice(0, 500),
      sku,
      brand: { "@type": "Brand", "name": "Ripe’n Red" },
      offers: {
        "@type": "Offer",
        url: window.location.href,
        priceCurrency: "INR",
        price: (typeof p.price === 'number' ? p.price.toFixed(2) : `${p.price || ''}`),
        availability: p.outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition"
      }
    };

    // ✅ Add aggregateRating when available for rich snippets
    if (typeof p.avgRating === 'number' && typeof p.reviewCount === 'number' && p.reviewCount > 0) {
      schema.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: String(p.avgRating),
        reviewCount: String(p.reviewCount)
      };
    }

    // Remove previous schema to avoid duplicates
    document.querySelectorAll('script[type="application/ld+json"][data-auto="product"]')
      .forEach(el => el.remove());

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-auto', 'product');
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
  } catch (e) {
    ErrorTracker.track(e, { where: 'injectProductSchema' });
  }
}

// ✅ Render star rating under title
function renderStarRating(p) {
  try {
    const container = document.getElementById('product-title');
    if (!container) return;
    const existing = document.getElementById('star-rating');
    if (existing) existing.remove();

    const rating = typeof p.avgRating === 'number' ? p.avgRating : 0;
    const count = typeof p.reviewCount === 'number' ? p.reviewCount : 0;
    
    if (rating === 0 && count === 0) return; // Don't show if no reviews
    
    const starContainer = document.createElement('div');
    starContainer.id = 'star-rating';
    starContainer.style.cssText = 'margin-top:8px;font-size:16px;color:#f59e0b;display:flex;align-items:center;gap:8px;';

    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const starsHtml = `${'★'.repeat(fullStars)}${halfStar ? '☆' : ''}${'☆'.repeat(emptyStars)}`;

    starContainer.innerHTML = `
      <span aria-label="Rating ${rating} out of 5" style="letter-spacing:2px;font-size:18px;">${starsHtml}</span>
      <span style="color:#666;font-size:14px;">${rating.toFixed(1)} out of 5 (${count} ${count === 1 ? 'review' : 'reviews'})</span>
    `;
    container.insertAdjacentElement('afterend', starContainer);
  } catch(e) { 
    ErrorTracker.track(e, { where: 'renderStarRating' }); 
  }
}

// ✅ Load and display reviews section
async function loadReviewsSection() {
  if (!product || !product._id) return;
  
  try {
    const response = await fetch(`${CONFIG.API_BASE}/products/${product._id}/reviews`);
    if (!response.ok) throw new Error('Failed to fetch reviews');
    
    const data = await response.json();
    renderReviewsSection({
      reviews: data.reviews || [],
      avgRating: typeof data.avgRating === 'number' ? data.avgRating : (product.avgRating || 0),
      reviewCount: typeof data.reviewCount === 'number' ? data.reviewCount : (product.reviewCount || 0)
    });
  } catch (error) {
    ErrorTracker.track(error, { where: 'loadReviewsSection' });
  }
}

// ✅ Render reviews section (below product info, above FAQ)
function renderReviewsSection({ reviews, avgRating = 0, reviewCount = 0 }) {
  // Find insertion point (before FAQ or at end of product container)
  // Always render inside product container (below product info)
  const productContainer = document.querySelector('.product-container') || document.body;

  // Remove existing reviews section
  const existing = document.getElementById('reviews-section');
  if (existing) existing.remove();
  
  const reviewsSection = document.createElement('section');
  reviewsSection.id = 'reviews-section';
  reviewsSection.style.cssText = 'margin:48px auto;padding:0 16px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;';
  
  const safeAvg = Number(avgRating || 0);
  const safeCount = Number(reviewCount || (reviews ? reviews.length : 0));
  
  const reviewsHtml = `
    <div style="max-width:95%;margin:0 auto;">
      <div style="display:flex;gap:24px;align-items:center;margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="font-size:36px;font-weight:700;color:#111827;">${safeAvg.toFixed(1)}</div>
          <div style="font-size:20px;color:#f59e0b;letter-spacing:2px;">${'★'.repeat(Math.floor(safeAvg))}${'☆'.repeat(5 - Math.floor(safeAvg))}</div>
        </div>
        <div style="color:#6b7280;font-size:14px;">Based on ${safeCount} ${safeCount === 1 ? 'review' : 'reviews'}</div>
      </div>
      <div style="height:1px;background:#e5e7eb;margin:16px 0 24px;"></div>
      <h2 style="font-size:24px;margin-bottom:20px;color:#1f2937;">Customer Reviews</h2>
      
      ${(!reviews || reviews.length === 0) ? `
        <p style=\"color:#6b7280;font-style:italic;margin-top:8px;\">No reviews yet. Be the first to review this product!</p>
      ` : `
        <div style=\"margin-bottom:16px;\">
          <button id=\"write-review-btn\" >Write a Review</button>
        </div>
        <div class=\"carousel-container\" style=\"position:relative;margin:16px 0;\">
<button class="carousel-arrow prev" 
    style="    padding-bottom: 0.2em;position:absolute; left:0px; top:45%; transform:translateY(-50%); z-index:10; background:#111827;border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.1); color:white;">
    «
</button>

          <div class=\"carousel-wrapper\" style=\"overflow:hidden;\">
            <div id=\"reviews-list\" class=\"carousel-track\" style=\"display:flex;transition:transform 0.3s ease;\">
              ${reviews.map(review => `
                <div class=\"carousel-slide\" style=\"flex:0 0 100%;padding:0;box-sizing:border-box;\">
                  <div style=\"margin:15px 0 0 0 ;border:1px solid #e5e7eb;border-radius:12px;padding:18px;background:#ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.04);\">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                      <h3 style="font-size:16px;font-weight:600;margin:0;color:#1f2937;">${Sanitizer.escape(review.title || '')}</h3>
                      <div style=\"color:#f59e0b;font-size:16px;letter-spacing:1px;\">${'★'.repeat(review.rating || 0)}${'☆'.repeat(5 - (review.rating || 0))}</div>
                    </div>
                    <p style="color:#374151;line-height:1.5;margin-bottom:8px;">${Sanitizer.escape(review.content || '')}</p>
                    <div style="font-size:12px;color:#6b7280;">
                      By ${Sanitizer.escape(review.authorName || 'Anonymous')} • ${new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
<button class="carousel-arrow next" 
    style="    padding-bottom: 0.2em;position:absolute; right:0px; top:45%; transform:translateY(-50%); z-index:10; background:#111827; border-radius:50%; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.1); color:white;">
    »
</button>

          <div class=\"carousel-indicators\" style=\"display:flex;justify-content:center;gap:8px;margin:10px auto;\">
            ${reviews.map((_, index) => `
              <button class=\"carousel-indicator${index === 0 ? ' active' : ''}\" data-index=\"${index}\" style=\"width:8px;height:10px;border-radius:50%;border:none;background:${index === 0 ? '#111827' : '#d1d5db'};cursor:pointer;\"></button>
            `).join('')}
          </div>
        </div>
      `}
      
      <!-- Review Form (initially hidden) -->
      <div id=\"review-form\" style=\"display:none;background:#f9fafb;padding:20px;border:1px solid #e5e7eb;border-radius:12px;margin-top:20px;\">
        <h3 style="margin-bottom:16px;color:#1f2937;">Write a Review</h3>
        <form id="review-submit-form">
          <div style="margin-bottom:12px;">
            <label style="display:block;margin-bottom:4px;color:#374151;font-weight:500;">Rating:</label>
            <div id=\"rating-stars\" style=\"font-size:22px;color:#d1d5db;cursor:pointer;\">
              <span data-rating="1">☆</span>
              <span data-rating="2">☆</span>
              <span data-rating="3">☆</span>
              <span data-rating="4">☆</span>
              <span data-rating="5">☆</span>
            </div>
            <input type="hidden" id="rating-value" value="0">
          </div>
          <div style="margin-bottom:12px;">
            <label style="display:block;margin-bottom:4px;color:#374151;font-weight:500;">Title:</label>
            <input type=\"text\" id=\"review-title\" style=\"width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;\" placeholder=\"Brief summary of your experience\" required>
          </div>
          <div style="margin-bottom:12px;">
            <label style="display:block;margin-bottom:4px;color:#374151;font-weight:500;">Review:</label>
            <textarea id=\"review-content\" style=\"width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;min-height:110px;resize:vertical;\" placeholder=\"Share your thoughts about this product\" required></textarea>
          </div>
          <div style="margin-bottom:16px;">
            <label style="display:block;margin-bottom:4px;color:#374151;font-weight:500;">Your Name (optional):</label>
            <input type=\"text\" id=\"review-author\" style=\"width:100%;padding:10px;border:1px solid #d1d5db;border-radius:8px;\" placeholder=\"Your name or leave blank for Anonymous\">
          </div>
          <div style="display:flex;gap:10px;">
            <button type=\"submit\">Submit Review</button>
            <button type=\"button\" id=\"cancel-review\">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  reviewsSection.innerHTML = reviewsHtml;
  
  // Always append to product container
  productContainer.appendChild(reviewsSection);
  
  // Setup event listeners
  setupReviewFormHandlers();
}

// ✅ Setup review form event handlers
function setupReviewFormHandlers() {
  const writeBtn = document.getElementById('write-review-btn');
  const reviewForm = document.getElementById('review-form');
  const cancelBtn = document.getElementById('cancel-review');
  const submitForm = document.getElementById('review-submit-form');
  const ratingStars = document.querySelectorAll('#rating-stars span');
  
  if (writeBtn) {
    writeBtn.onclick = () => {
      reviewForm.style.display = 'block';
      writeBtn.style.display = 'none';
    };
  }
  
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      reviewForm.style.display = 'none';
      if (writeBtn) writeBtn.style.display = 'inline-block';
      submitForm.reset();
      document.getElementById('rating-value').value = '0';
      ratingStars.forEach(star => star.style.color = '#d1d5db');
    };
  }
  
  // Set up carousel navigation
  setupCarouselHandlers();
  
  // Rating stars interaction
  ratingStars.forEach((star, index) => {
    star.onmouseover = () => {
      ratingStars.forEach((s, i) => {
        s.style.color = i <= index ? '#f59e0b' : '#d1d5db';
      });
    };
    star.onclick = () => {
      const rating = index + 1;
      document.getElementById('rating-value').value = rating;
      ratingStars.forEach((s, i) => {
        s.style.color = i < rating ? '#f59e0b' : '#d1d5db';
        s.innerHTML = i < rating ? '★' : '☆';
      });
    };
  });
  
  if (submitForm) {
    submitForm.onsubmit = async (e) => {
      e.preventDefault();
      await submitReview();
    };
  }
}


// ✅ Set up carousel functionality
function setupCarouselHandlers() {
  const reviewsList = document.getElementById('reviews-list');
  const prevBtn = document.querySelector('.carousel-arrow.prev');
  const nextBtn = document.querySelector('.carousel-arrow.next');
  const indicators = document.querySelectorAll('.carousel-indicator');
  
  if (!reviewsList || !prevBtn || !nextBtn) return;
  
  let currentSlide = 0;
  const totalSlides = document.querySelectorAll('.carousel-slide').length;
  
  // Initially hide previous button if at first slide
  prevBtn.style.opacity = currentSlide === 0 ? '0.5' : '1';
  prevBtn.style.cursor = currentSlide === 0 ? 'not-allowed' : 'pointer';
  
  // Handle slide transitions
  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    
    currentSlide = index;
    reviewsList.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update indicators
    indicators.forEach((indicator, i) => {
      if (i === currentSlide) {
        indicator.style.background = '#111827';
        indicator.classList.add('active');
      } else {
        indicator.style.background = '#d1d5db';
        indicator.classList.remove('active');
      }
    });
    
    // Show/hide navigation buttons
    prevBtn.style.opacity = currentSlide === 0 ? '0.5' : '1';
    prevBtn.style.cursor = currentSlide === 0 ? 'not-allowed' : 'pointer';
    nextBtn.style.opacity = currentSlide === totalSlides - 1 ? '0.5' : '1';
    nextBtn.style.cursor = currentSlide === totalSlides - 1 ? 'not-allowed' : 'pointer';
  }
  
  // Event listeners for buttons
  prevBtn.addEventListener('click', () => {
    if (currentSlide > 0) goToSlide(currentSlide - 1);
  });
  
  nextBtn.addEventListener('click', () => {
    if (currentSlide < totalSlides - 1) goToSlide(currentSlide + 1);
  });
  
  // Event listeners for indicators
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      goToSlide(index);
    });
  });
  
  // Optional: Auto-play functionality
  let autoplayInterval;
  function startAutoplay() {
    autoplayInterval = setInterval(() => {
      const nextSlide = (currentSlide + 1) % totalSlides;
      goToSlide(nextSlide);
    }, 5000); // Change slide every 5 seconds
  }
  
  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }
  
  // Start autoplay and pause on hover
  startAutoplay();
  
  const carouselContainer = document.querySelector('.carousel-container');
  if (carouselContainer) {
    carouselContainer.addEventListener('mouseenter', stopAutoplay);
    carouselContainer.addEventListener('mouseleave', startAutoplay);
  }
  
  // Touch events for mobile swipe
  let touchStartX = 0;
  let touchEndX = 0;
  
  reviewsList.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });
  
  reviewsList.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
  
  function handleSwipe() {
    const swipeThreshold = 50; // Minimum swipe distance
    if (touchEndX < touchStartX - swipeThreshold) {
      // Swipe left, go to next slide
      if (currentSlide < totalSlides - 1) goToSlide(currentSlide + 1);
    }
    if (touchEndX > touchStartX + swipeThreshold) {
      // Swipe right, go to previous slide
      if (currentSlide > 0) goToSlide(currentSlide - 1);
    }
  }
}

// ✅ Submit review via API
async function submitReview() {
  const rating = parseInt(document.getElementById('rating-value').value);
  const title = document.getElementById('review-title').value.trim();
  const content = document.getElementById('review-content').value.trim();
  const authorName = document.getElementById('review-author').value.trim();
  
  if (rating === 0) {
    showNotification('Please select a rating', 'warning');
    return;
  }
  
  if (!title || !content) {
    showNotification('Title and review content are required', 'warning');
    return;
  }
  
  try {
    const response = await fetch(`${CONFIG.API_BASE}/products/${product._id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, title, content, authorName: authorName || 'Anonymous' })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit review');
    }
    
    showNotification('Review submitted successfully!', 'success');
    
    // Refresh the page to show new review and updated rating
    setTimeout(() => window.location.reload(), 1500);
    
  } catch (error) {
    ErrorTracker.track(error, { where: 'submitReview' });
    showNotification('Failed to submit review. Please try again.', 'error');
  }
}

// === Quantity Button Setup ===
function setupQuantityControls() {
  const html = `<div class="quantity-control">
    <button class="quantity-btn-minus">-</button>
    <span id="product-quantity">${selectedQuantity}</span>
    <button class="quantity-btn-plus">+</button>
  </div>`;
document.getElementById("product-description").insertAdjacentHTML("afterend", html);

  document.querySelector(".quantity-btn-minus").onclick = () => updateProductQuantity(-1);
  document.querySelector(".quantity-btn-plus").onclick = () => updateProductQuantity(1);
}

// === Show Global Error ===
function showError(msg) {
  // Accessible error box
  let alertDiv = document.getElementById('product-error-box');
  if (!alertDiv) {
    alertDiv = document.createElement('div');
    alertDiv.setAttribute('role', 'alert');
    alertDiv.setAttribute('id', 'product-error-box');
    alertDiv.style = 'padding:15px;margin:15px;color:#fff;background:#C00;border-radius:5px;font-weight:bold;text-align:center;';
    const container = document.querySelector('.product-container');
    if (container) container.prepend(alertDiv);
    else document.body.prepend(alertDiv);
  }
  alertDiv.innerHTML = Sanitizer.escape(msg);
  setTimeout(()=>{if(alertDiv)alertDiv.remove();}, 5000);
}

// === Buy Now / Add to Cart Buttons ===
document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".add-to-cart")?.addEventListener("click", () => {
    if (!product) return;
    addToCart(product._id, selectedQuantity);
    showNotification("Added to cart! 🛒", "success");
  });

  document.querySelector(".buy-now")?.addEventListener("click", () => {
    if (!product) return;
    addToCart(product._id, selectedQuantity, true);
    showNotification("Added to cart! 🛒", "success");
  });
});

// === Guest/Login Cart Logic ===
async function addToCart(productId, qty, gotoCheckout = false) {
  const token = localStorage.getItem(CONFIG.TOKENS.AUTH);

  if (!token) {
    let guestCart = JSON.parse(localStorage.getItem(CONFIG.TOKENS.GUEST_CART)) || [];
    const index = guestCart.findIndex(item => item.productId === productId);
    if (index > -1) guestCart[index].quantity += qty;
    else guestCart.push({ productId, quantity: qty });
    localStorage.setItem(CONFIG.TOKENS.GUEST_CART, JSON.stringify(guestCart));
    window.updateCartCount();
    if (gotoCheckout) location.href = "checkout.html";
    return;
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE}/users/cart`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ productId, quantity: qty })
    });

    if (!res.ok) throw new Error("Server error");
    const result = await res.json();
    window.updateCartCount();
    if (gotoCheckout) location.href = "checkout.html";
  } catch (err) {
    console.error("❌ Cart error:", err);
    showNotification("Could not add to cart. Please try again.", "error");
  }
}
// === Utility: Safe HTML Escaping ===
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// === Recently Viewed Products ===
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("recently-viewed-list");
  if (!container) return;

  let viewed = [];
  try {
    viewed = JSON.parse(localStorage.getItem(CONFIG.TOKENS.VIEWED)) || [];
    if (!Array.isArray(viewed)) viewed = [];
  } catch {
    viewed = [];
  }

  container.innerHTML = "";

  if (!viewed.length) {
    container.innerHTML = "<p>Currently No Recommended products.</p>";
    return;
  }

  for (const item of viewed) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/products/${encodeURIComponent(item.productId)}`);
      if (!res.ok) continue;
      const p = await res.json();
      if (p.outOfStock) continue;

      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}">
        <h3>${escapeHTML(p.name)}</h3>
        <p><span class="price">₹${escapeHTML(String(p.price))}</span></p>
        <button class="buy-now-btn" data-id="${escapeHTML(p._id)}">Buy Now</button>
        <button class="cart-btn" data-id="${escapeHTML(p._id)}"><i class="fas fa-shopping-cart"></i></button>
      `;
      card.onclick = e => {
        if (!e.target.closest(".cart-btn,.buy-now-btn")) {
          window.location.href = `products.html?product=${encodeURIComponent(p._id)}`;
        }
      };
      container.appendChild(card);
    } catch (error) {
      console.warn(`⛔ Error processing viewed product: ${item.productId}`, error);
    }
  }

  if (typeof attachRecentCardListeners === "function") {
    attachRecentCardListeners(container);
  }
});


// === Recent Card Button Handlers ===
function attachRecentCardListeners(container) {
  container.querySelectorAll(".buy-now-btn").forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      addToCart(btn.dataset.id, 1, true);
      showNotification("Added to cart! 🛒 Redirecting to checkout...", "success");
    };
  });
  container.querySelectorAll(".cart-btn").forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      addToCart(btn.dataset.id, 1);
      showNotification("Added to cart! 🛒", "success");
    };
  });
}

// === Coupon Unlock Logic ===
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem(CONFIG.TOKENS.AUTH);
  const couponText = document.getElementById("couponText");
  const revealLink = document.getElementById("revealLink");

  if (!token || !couponText || !revealLink) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      couponText.innerText = "RIPE20";
      revealLink.style.display = "none";
    } else {
      localStorage.removeItem(CONFIG.TOKENS.AUTH);
    }
  } catch {}
});

// === Delivery Area Pincode Check ===
function checkAvailability() {
  const pincode = document.getElementById("pincode").value.trim();
  const result = document.getElementById("availability-result");

  if (!pincode) {
    result.textContent = "Please enter your area PIN code to check delivery availability.";
    result.style.color = "red";
    return;
  }

  if (CONFIG.DELHI_PINCODES.includes(pincode)) {
    result.textContent = "🎉 Great news! We deliver our fresh produce to your location.";
    result.style.color = "green";
  } else {
    result.textContent = "🚫 Sorry, we currently don’t deliver to this PIN code. Try a different one.";
    result.style.color = "red";
  }
}

// === Accordion FAQ Toggle ===
function toggleFAQ(element) {
  const answer = element.nextElementSibling;
  if (answer) {
    answer.style.display = answer.style.display === "block" ? "none" : "block";
  }
}
