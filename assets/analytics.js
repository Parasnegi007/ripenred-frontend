// ✅ Google Analytics 4 E-commerce Tracking Helper
// This file provides centralized analytics tracking for the Ripe'n Red store

class StoreAnalytics {
  constructor() {
    this.measurementId = 'G-YEJN0VHC28';
    this.currency = 'INR';
    this.init();
  }

  init() {
    // Check if gtag is available
    if (typeof gtag === 'undefined') {
      console.warn('Google Analytics not loaded. Analytics tracking disabled.');
      return;
    }
    
    console.log('✅ Store Analytics initialized with ID:', this.measurementId);
  }

  // Track page views
  trackPageView(pageTitle, pageLocation = window.location.href) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', {
        page_title: pageTitle,
        page_location: pageLocation
      });
    }
  }

  // Track product views
  trackProductView(productId, name, price, category = 'Fruits') {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'view_item', {
        currency: this.currency,
        value: price,
        items: [{
          item_id: productId,
          item_name: name,
          price: price,
          item_category: category
        }]
      });
    }
  }

  // Track add to cart
  trackAddToCart(productId, name, price, quantity) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'add_to_cart', {
        currency: this.currency,
        value: price * quantity,
        items: [{
          item_id: productId,
          item_name: name,
          price: price,
          quantity: quantity
        }]
      });
    }
  }

  // Track remove from cart
  trackRemoveFromCart(productId, name, price, quantity) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'remove_from_cart', {
        currency: this.currency,
        value: price * quantity,
        items: [{
          item_id: productId,
          item_name: name,
          price: price,
          quantity: quantity
        }]
      });
    }
  }

  // Track cart view
  trackViewCart(totalValue, itemCount) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'view_cart', {
        currency: this.currency,
        value: totalValue,
        items: [],
        item_count: itemCount
      });
    }
  }

  // Track begin checkout
  trackBeginCheckout(totalValue, itemCount) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'begin_checkout', {
        currency: this.currency,
        value: totalValue,
        items: [],
        item_count: itemCount
      });
    }
  }

  // Track payment method selection
  trackPaymentMethod(paymentMethod) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'select_payment_method', {
        payment_type: paymentMethod
      });
    }
  }

  // Track successful purchase
  trackPurchase(orderId, totalValue, tax = 0, shipping = 0) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'purchase', {
        transaction_id: orderId,
        value: totalValue,
        tax: tax,
        shipping: shipping,
        currency: this.currency
      });
    }
  }

  // Track search
  trackSearch(searchTerm) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'search', {
        search_term: searchTerm
      });
    }
  }

  // Track user engagement
  trackEngagement(action, label = '') {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'user_engagement', {
        event_category: 'engagement',
        event_label: label,
        value: action
      });
    }
  }

  // Track errors
  trackError(error, context = {}) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: error.message || error,
        fatal: false,
        ...context
      });
    }
  }

  // Track custom events
  trackCustomEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, parameters);
    }
  }
}

// Initialize analytics globally
window.storeAnalytics = new StoreAnalytics();

// Auto-track page views
document.addEventListener('DOMContentLoaded', () => {
  const pageTitle = document.title || 'Unknown Page';
  window.storeAnalytics.trackPageView(pageTitle);
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StoreAnalytics;
}
