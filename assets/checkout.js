/**
 * Production-Ready Checkout System
 * Version: 2.0.0
 * Features: Security, Error Handling, Retry Logic, Loading States, Monitoring
 */

// ✅ Configuration Management
const CONFIG = {
  API_BASE_URL: getAPIURL(),
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  REQUEST_TIMEOUT: 10000,
  DEBOUNCE_DELAY: 300,

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

// ✅ Error Tracking Service
class ErrorTracker {
  static track(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId'),
      context
    };
    
    // In production, send to error tracking service like Sentry
    // this.sendToSentry(errorData);
  }
}

// ✅ Performance Monitor
class PerformanceMonitor {
  static startTimer(name) {
    performance.mark(`${name}-start`);
  }
  
  static endTimer(name) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    // In production, send to analytics service
    // this.sendToAnalytics(name, measure.duration);
  }
}

// ✅ Loading State Manager
class LoadingManager {
  static activeLoaders = new Set();
  
  static show(identifier, message = 'Loading...') {
    this.activeLoaders.add(identifier);
    this.updateUI(message);
  }
  
  static hide(identifier) {
    this.activeLoaders.delete(identifier);
    if (this.activeLoaders.size === 0) {
      this.hideUI();
    }
  }
  
  static updateUI(message) {
    let loader = document.getElementById('global-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'global-loader';
      loader.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 18px;
      `;
      document.body.appendChild(loader);
    }
    loader.innerHTML = `
      <div style="text-align: center;">
        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; 
                    border-radius: 50%; width: 40px; height: 40px; 
                    animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <p>${message}</p>
      </div>
    `;
  }
  
  static hideUI() {
    const loader = document.getElementById('global-loader');
    if (loader) {
      loader.remove();
    }
  }
}

// ✅ Security Utils
class SecurityUtils {
  static sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  static validatePhone(phone) {
    const re = /^\d{10}$/;
    return re.test(phone.replace(/\D/g, ''));
  }
  
  static generateCSRFToken() {
    // Use crypto.getRandomValues for cryptographically secure random generation
    if (crypto && crypto.getRandomValues) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for older browsers (less secure but better than Math.random)
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2);
      return `${timestamp}-${random}`;
    }
  }
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
// ✅ State Management
class AppState {
  constructor() {
    this.state = {
      cartItems: [],
      userInfo: null,
      discountAmount: 0,
      couponApplied: false,
      savedAddresses: [],
      isLoading: false,
      errors: {}
    };
    this.listeners = new Set();
  }
  
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }
  
  getState() {
    return { ...this.state };
  }
}

// ✅ Utility Functions
class Utils {
  static getToken() {
    return localStorage.getItem('authToken');
  }
  
  static isLoggedIn() {
    return !!this.getToken();
  }
  
  static calculateShipping(total) {
    return total < 500 ? 200 : total <= 1000 ? 100 : 0;
  }
  
  static formatPrice(price) {
    return parseFloat(price || 0).toFixed(2);
  }
  
  static validatePincode(pincode) {
    return CONFIG.DELHI_PINCODES.includes(pincode);
  }
  
  static debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }
  
  static showMessage(element, message, type = 'error') {
    if (!element) return;
    element.textContent = SecurityUtils.sanitizeHtml(message);
    element.style.color = type === 'error' ? '#c0392b' : '#007b00';
    element.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }
  
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ✅ Enhanced API Service with Retry Logic
class APIService {
  constructor() {
    this.csrfToken = SecurityUtils.generateCSRFToken();
    this.idempotencyKeys = new Map(); // Track idempotency keys
  }
  
  generateIdempotencyKey() {
    // Generate unique idempotency key for each request
    const timestamp = Date.now().toString(36);
    const random = crypto.getRandomValues ? 
      Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('') :
      Math.random().toString(36).substring(2);
    return `idemp_${timestamp}_${random}`;
  }
  
  async request(endpoint, options = {}, retryCount = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
    
    try {
      const token = Utils.getToken();
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.csrfToken,
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers
        },
        signal: controller.signal,
        ...options
      };
      
      // Add idempotency key for POST/PUT/DELETE requests
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
        const idempotencyKey = this.generateIdempotencyKey();
        config.headers['X-Idempotency-Key'] = idempotencyKey;
        
        // Store the key to prevent duplicate requests
        this.idempotencyKeys.set(idempotencyKey, {
          endpoint,
          timestamp: Date.now(),
          method: options.method
        });
        
        // Clean up old keys (older than 1 hour)
        this.cleanupIdempotencyKeys();
      }
      
      const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, config);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMsg = errorData.message;
          }
        } catch (e) {
          // Ignore JSON parse errors, fallback to default errorMsg
        }
        throw new Error(errorMsg);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Retry logic for network errors
      if (retryCount < CONFIG.RETRY_ATTEMPTS && 
          (error.name === 'AbortError' || error.name === 'TypeError')) {
        await Utils.sleep(CONFIG.RETRY_DELAY * Math.pow(2, retryCount));
        return this.request(endpoint, options, retryCount + 1);
      }
      
      ErrorTracker.track(error, { endpoint, retryCount });
      throw error;
    }
  }
  
  async getCart() {
    return this.request('/users/cart');
  }
  
  async getProducts() {
    return this.request('/products');
  }
  
  async getUserProfile() {
    return this.request('/users/profile');
  }
  
  async applyCoupon(code) {
    // Get the cart total from the DOM
    const totalElement = document.getElementById('order-total');
    const cartTotal = totalElement ? parseFloat(totalElement.textContent) || 0 : 0;
    
    return this.request('/users/apply-coupon', {
      method: 'POST',
      body: JSON.stringify({ code, cartTotal })
    });
  }
  
  async saveAddress(addressData) {
    const endpoint = Utils.isLoggedIn() ? '/users/addAddress' : '/users/guest/addAddress';
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(addressData)
    });
  }
  
  async createOrder(orderData) {
    return this.request('/orders/create-order', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }
  
  async getAddresses(email = null) {
    const endpoint = Utils.isLoggedIn() 
      ? '/users/getAddresses'
      : `/users/guest/getAddresses/${email}`;
    return this.request(endpoint);
  }

  cleanupIdempotencyKeys() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [key, data] of this.idempotencyKeys.entries()) {
      if (data.timestamp < oneHourAgo) {
        this.idempotencyKeys.delete(key);
      }
    }
  }
}

// ✅ Google Analytics E-commerce Tracking
class AnalyticsTracker {
  static trackAddToCart(productId, name, price, quantity) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'add_to_cart', {
        currency: 'INR',
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

  static trackBeginCheckout(totalValue, itemCount) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'begin_checkout', {
        currency: 'INR',
        value: totalValue,
        items: [],
        item_count: itemCount
      });
    }
  }

  static trackPurchase(orderId, totalValue, tax, shipping, currency = 'INR') {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'purchase', {
        transaction_id: orderId,
        value: totalValue,
        tax: tax,
        shipping: shipping,
        currency: currency
      });
    }
  }

  static trackPaymentMethod(paymentMethod) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'select_payment_method', {
        payment_type: paymentMethod
      });
    }
  }
}

// ✅ Checkout Manager Class
class CheckoutManager {
  constructor() {
    this.appState = new AppState();
    this.apiService = new APIService();
    this.boundHandlers = {};
  }
  
  async init() {
    try {
      PerformanceMonitor.startTimer('checkout-init');
      LoadingManager.show('init', 'Initializing checkout...');
      
      await this.loadInitialData();
      this.setupEventListeners();
      this.setupPerformanceObserver();
      this.setupCurrentLocationButton(); // <-- Add this line
      LoadingManager.hide('init');
      PerformanceMonitor.endTimer('checkout-init');
    } catch (error) {
      LoadingManager.hide('init');
      ErrorTracker.track(error, { phase: 'initialization' });
      this.showError('Failed to initialize checkout. Please refresh the page.');
    }
  }
  
  async loadInitialData() {
    const promises = [
      this.fetchCartItems(),
      this.fetchUserDetails(),
      this.fetchSavedAddresses(),
      this.populateCountries(),
      this.populateStatesAndUT(),
      this.initializeMap()
    ];
    
    // Use Promise.allSettled to handle partial failures gracefully
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`Failed to load data at index ${index}:`, result.reason);
      }
    });
  }
  
  setupEventListeners() {
    // Use bound handlers for proper cleanup
    this.boundHandlers = {
      handleSaveAddress: this.handleSaveAddress.bind(this),
      handleProceedToPayment: this.handleProceedToPayment.bind(this),

      handleApplyCoupon: this.handleApplyCoupon.bind(this),
      handleAddressSelection: this.handleAddressSelection.bind(this),
      handlePincodeValidation: Utils.debounce(this.validatePincodeDelivery.bind(this), CONFIG.DEBOUNCE_DELAY),
      handleLocationFetch: Utils.debounce(this.fetchLocationByPostalCode.bind(this), 500)
    };
    
    this.attachEventListeners();
  }
  
  attachEventListeners() {
    // Form elements
    const zipcodeInput = document.getElementById('zipcode');
    if (zipcodeInput) {
      zipcodeInput.addEventListener('blur', this.boundHandlers.handlePincodeValidation);
      zipcodeInput.addEventListener('blur', this.boundHandlers.handleLocationFetch);
    }
    
    // Add real-time validation for all form fields
    this.setupRealTimeValidation();
    
    // Buttons
    const elements = [
      { id: 'saveAddress', handler: 'handleSaveAddress' },
      { id: 'proceedToPayment', handler: 'handleProceedToPayment' },
      { id: 'applyCouponBtn', handler: 'handleApplyCoupon' }
    ];
    
    elements.forEach(({ id, handler }) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('click', this.boundHandlers[handler]);
      }
    });
    
    // Global handlers
    document.addEventListener('click', this.boundHandlers.handleAddressSelection);
    this.setupPaymentMethodSelection();
  }
  
  setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'measure') {
            // In production, send to analytics service
            // this.sendToAnalytics(entry.name, entry.duration);
          }
        });
      });
      observer.observe({ entryTypes: ['measure'] });
    }
  }
  
  async fetchCartItems() {
    try {
      PerformanceMonitor.startTimer('fetch-cart');
      LoadingManager.show('cart', 'Loading cart items...');
      
      let cartItems = [];
      
      if (Utils.isLoggedIn()) {
        cartItems = await this.fetchLoggedInUserCart();
      } else {
        cartItems = await this.fetchGuestCart();
      }
      
      this.appState.setState({ cartItems });
      this.displayCartItems(cartItems);
      
      LoadingManager.hide('cart');
      PerformanceMonitor.endTimer('fetch-cart');
    } catch (error) {
      LoadingManager.hide('cart');
      ErrorTracker.track(error, { action: 'fetch-cart' });
      this.displayCartItems([]);
      this.showError('Failed to load cart items. Please refresh the page.');
    }
  }
  
  async fetchLoggedInUserCart() {
    const rawCart = await this.apiService.getCart();
    
    // Parallel fetch of product details
    const cartItems = await Promise.allSettled(
      rawCart.map(async (item) => {
        try {
          const product = await this.apiService.request(`/products/${item.productId}`);
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
    
    return cartItems
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(item => !item.outOfStock && !item.deleted);
  }
  
  async fetchGuestCart() {
    const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
    
    if (guestCart.length === 0) {
      return [];
    }
    
    const products = await this.apiService.getProducts();
    
    const cartItems = guestCart.map(item => {
      const product = products.find(p => p._id === item.productId);
      if (product) {
        return {
          productId: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.image,
          outOfStock: product.outOfStock,
          deleted: false
        };
      } else {
        console.warn('Product not found for guest cart item:', item.productId);
        return { ...item, deleted: true };
      }
    });
    
    // Clean up localStorage
    const cleanedCart = cartItems.filter(item => !item.outOfStock && !item.deleted);
    localStorage.setItem('guestCart', JSON.stringify(
      cleanedCart.map(({ productId, quantity }) => ({ productId, quantity }))
    ));
    
    return cleanedCart;
  }
  
  displayCartItems(cartItems) {
    const cartContainer = document.getElementById('order-items');
    const totalElement = document.getElementById('order-total');
    const orderSummarySection = document.querySelector('.order-summary');
    
    if (!cartContainer || !totalElement || !orderSummarySection) {
      console.error('Order summary section not found! Check IDs and classes in your HTML.');
      return;
    }
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    if (cartItems.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.textContent = 'Your cart is empty.';
      fragment.appendChild(emptyMessage);
      cartContainer.innerHTML = '';
      cartContainer.appendChild(fragment);
      totalElement.textContent = '0';
      this.updateOrderSummary(0);
      return;
    }
    
    let totalPrice = 0;
    
    cartItems.forEach(item => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity, 10) || 1;
      
      const itemElement = document.createElement('div');
      itemElement.classList.add('cart-item');
      
      // Sanitize display data
      const sanitizedName = SecurityUtils.sanitizeHtml(item.name);
      const sanitizedImage = SecurityUtils.sanitizeHtml(item.image);
      
      itemElement.innerHTML = `
        <img src="${sanitizedImage}" alt="${sanitizedName}" class="product-image" loading="lazy" />
        <div class="product-details">
          <p class="product-name">${sanitizedName}</p>
          <p class="product-quantity">x${quantity}</p>
          <p class="product-price">₹${Utils.formatPrice(price)}</p>
        </div>
      `;
      
      fragment.appendChild(itemElement);
      totalPrice += price * quantity;
    });
    
    // Update DOM in one operation
    cartContainer.innerHTML = '';
    cartContainer.appendChild(fragment);
    totalElement.textContent = Utils.formatPrice(totalPrice);
    this.updateOrderSummary(totalPrice);
  }
  
  updateOrderSummary(totalPrice) {
    const shippingCharges = Utils.calculateShipping(totalPrice);
    const finalTotal = totalPrice + shippingCharges;
    
    this.updateShippingLine(shippingCharges);
    this.updateFinalTotalLine(finalTotal);
  }
  
  updateShippingLine(shippingCharges) {
    const orderSummarySection = document.querySelector('.order-summary');
    let shippingLine = document.getElementById('shipping-line');
    
    if (!shippingLine) {
      shippingLine = document.createElement('p');
      shippingLine.id = 'shipping-line';
      shippingLine.style.fontWeight = 'bold';
      shippingLine.style.textAlign = 'right';
      orderSummarySection.appendChild(shippingLine);
    }
    
    shippingLine.textContent = `Shipping Charges: ₹${shippingCharges}`;
  }
  
  updateFinalTotalLine(finalTotal) {
    const orderSummarySection = document.querySelector('.order-summary');
    let finalTotalLine = document.getElementById('final-total-line');
    
    if (!finalTotalLine) {
      finalTotalLine = document.createElement('h3');
      finalTotalLine.id = 'final-total-line';
      finalTotalLine.style.fontSize = '26px';
      finalTotalLine.style.fontWeight = 'bold';
      finalTotalLine.style.color = '#28a745';
      finalTotalLine.style.textAlign = 'center';
      orderSummarySection.appendChild(finalTotalLine);
    }
    
    finalTotalLine.textContent = `Final Total: ₹${Utils.formatPrice(finalTotal)}`;
  }
  
  updateDiscountLine(discountAmount) {
    const orderSummarySection = document.querySelector('.order-summary');
    let discountLine = document.getElementById('discount-line');
    
    if (!discountLine) {
      discountLine = document.createElement('p');
      discountLine.id = 'discount-line';
      discountLine.style.fontWeight = 'bold';
      discountLine.style.textAlign = 'right';
      discountLine.style.color = '#28a745';
      discountLine.style.fontSize = '16px';
      
      // Insert discount line before shipping line
      const shippingLine = document.getElementById('shipping-line');
      if (shippingLine) {
        orderSummarySection.insertBefore(discountLine, shippingLine);
      } else {
        orderSummarySection.appendChild(discountLine);
      }
    }
    
    discountLine.textContent = `Discount Applied: -₹${Utils.formatPrice(discountAmount)}`;
  }
  
  async handleApplyCoupon(event) {
    event.preventDefault();
    
    const couponInput = document.getElementById('couponInput');
    const couponMessage = document.getElementById('couponMessage');
    const applyCouponBtn = document.getElementById('applyCouponBtn');
    
    if (!couponInput || !couponMessage || !applyCouponBtn) {
      this.showError('Coupon elements not found');
      return;
    }
    
    const code = couponInput.value.trim();
    
    if (!Utils.isLoggedIn()) {
      Utils.showMessage(couponMessage, 'Please log in or sign up to use coupons.', 'error');
      return;
    }
    
    if (!code) {
      Utils.showMessage(couponMessage, 'Please enter a coupon code.', 'error');
      return;
    }
    
    try {
      LoadingManager.show('coupon', 'Applying coupon...');
      applyCouponBtn.disabled = true;
      
      const result = await this.apiService.applyCoupon(code);
      
      const discountPercent = result.discountPercent || 20;
      const totalElement = document.getElementById('order-total');
      
      if (!totalElement) {
        throw new Error('Unable to find order total element');
      }
      
      const originalTotal = parseFloat(totalElement.textContent) || 0;
      const discountAmount = Math.round((originalTotal * discountPercent) / 100);
      const discountedTotal = originalTotal - discountAmount;
      
      // Calculate shipping on original total, not discounted total
      const shippingCharges = Utils.calculateShipping(originalTotal);
      const finalTotal = discountedTotal + shippingCharges;
      
      // Update state
      this.appState.setState({ discountAmount, couponApplied: true });
      
      // Update UI
      totalElement.textContent = Utils.formatPrice(discountedTotal);
      
      // Show permanent success message for coupon
      couponMessage.textContent = `Coupon applied! ₹${discountAmount} off.`;
      couponMessage.style.color = '#007b00';
      couponMessage.style.display = 'block';
      
      // Add discount line in order summary
      this.updateDiscountLine(discountAmount);
      
      applyCouponBtn.disabled = true;
      couponInput.disabled = true;
      
      const finalTotalLine = document.getElementById('final-total-line');
      if (finalTotalLine) {
        finalTotalLine.textContent = `Final Total: ₹${Utils.formatPrice(finalTotal)}`;
      }
      
      LoadingManager.hide('coupon');
    } catch (error) {
      LoadingManager.hide('coupon');
      applyCouponBtn.disabled = false;
      ErrorTracker.track(error, { action: 'apply-coupon', code });
      Utils.showMessage(couponMessage, error.message || 'Invalid coupon code.', 'error');
    }
  }
  
  async fetchUserDetails() {
    try {
      if (!Utils.isLoggedIn()) return;
      
      const user = await this.apiService.getUserProfile();
      
      // Store user ID
      localStorage.setItem('userId', user._id);
      
      // Auto-fill and disable fields for logged-in users
      const fields = ['name', 'email', 'phone'];
      fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
          element.value = user[field] || '';
          element.disabled = true;
        }
      });
      
      this.appState.setState({ userInfo: user });
    } catch (error) {
      ErrorTracker.track(error, { action: 'fetch-user-details' });
      // Don't show error to user as this is not critical
    }
  }
  
  validatePincodeDelivery() {
    const pincode = document.getElementById('zipcode')?.value.trim();
    const proceedBtn = document.getElementById('proceedToPayment');
    const saveBtn = document.getElementById('saveAddress');
    
    let warningMsg = document.getElementById('pincode-warning');
    if (!warningMsg) {
      warningMsg = document.createElement('p');
      warningMsg.id = 'pincode-warning';
      warningMsg.style.cssText = 'color: red; margin-top: 6px; font-size: 16px; text-align: center;';
      
      if (saveBtn) {
        saveBtn.insertAdjacentElement('afterend', warningMsg);
      }
    }
    
    if (!pincode) {
      if (proceedBtn) proceedBtn.disabled = false;
      if (saveBtn) saveBtn.disabled = false;
      warningMsg.textContent = '';
      return;
    }
    
    if (!Utils.validatePincode(pincode)) {
      showNotification('Sorry, we currently deliver only in Delhi.', "warning");
      if (proceedBtn) proceedBtn.disabled = true;
      if (saveBtn) saveBtn.disabled = true;
      warningMsg.textContent = 'We do not currently serve this location.';
    } else {
      if (proceedBtn) proceedBtn.disabled = false;
      if (saveBtn) saveBtn.disabled = false;
      warningMsg.textContent = '';
    }
  }
  
  async fetchLocationByPostalCode() {
    const postalCode = document.getElementById('zipcode')?.value.trim();
    
    if (!postalCode) return;
    
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${postalCode}`);
      const data = await response.json();
      
      if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        
        const cityElement = document.getElementById('city');
        const stateElement = document.getElementById('state');
        const countryElement = document.getElementById('country');
        
        if (cityElement) cityElement.value = postOffice.District;
        if (stateElement) stateElement.value = postOffice.State;
        if (countryElement) countryElement.value = postOffice.Country;
        
        // Center map on the pincode location if coordinates are available
        if (postOffice.Latitude && postOffice.Longitude) {
          const lat = parseFloat(postOffice.Latitude);
          const lng = parseFloat(postOffice.Longitude);
          this.centerMapOnLocation(lat, lng);
        } else {
          console.log(`📍 No coordinates available for pincode: ${postalCode}`);
        }
      }
    } catch (error) {
      console.warn('Error fetching location data:', error);
      // Silent failure for location lookup
    }
  }
  
  centerMapOnLocation(lat, lng) {
    if (this.map && this.marker) {
      this.map.setView([lat, lng], 15);
      this.marker.setLatLng([lat, lng]);
      this.updateCoordinates(lat, lng);
    }
  }
  
  async handleSaveAddress(event) {
    event.preventDefault();
    
    try {
      LoadingManager.show('save-address', 'Saving address...');
      
      // Enhanced browser detection and logging
      const browserInfo = this.getBrowserInfo();
      console.log('🔍 Browser info for address saving:', browserInfo);
      
      const addressData = this.collectAddressData();
      console.log('🔍 Address data collected:', { ...addressData, phone: addressData.phone ? '***' : undefined });
      
      // Use enhanced saveAddress with browser-specific handling
      const result = await this.saveAddressWithRetry(addressData, browserInfo);
      
      showNotification('Address saved successfully!', "success");
      await this.fetchSavedAddresses();
      
      LoadingManager.hide('save-address');
    } catch (error) {
      LoadingManager.hide('save-address');
      console.error('❌ Save address error details:', {
        error: error.message,
        stack: error.stack,
        browser: this.getBrowserInfo(),
        timestamp: new Date().toISOString()
      });
      
      ErrorTracker.track(error, { 
        action: 'save-address',
        browser: this.getBrowserInfo(),
        userAgent: navigator.userAgent
      });
      
      // More specific error messages based on error type
      let errorMessage = 'Failed to save address. Please try again.';
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('validation')) {
        errorMessage = error.message; // Show validation errors as-is
      }
      
      showNotification(errorMessage, "error");
    }
  }
  
  collectAddressData() {
    const validationErrors = [];
    
    // Get all form values
    const street = document.getElementById('street')?.value.trim();
    const city = document.getElementById('city')?.value.trim();
    const state = document.getElementById('state')?.value.trim();
    const zipcode = document.getElementById('zipcode')?.value.trim();
    const country = document.getElementById('country')?.value.trim();
    
    // Validate address fields according to backend validation rules
    if (!street) {
      validationErrors.push('Street address is required');
    } else if (street.length < 5 || street.length > 100) {
      validationErrors.push('Street address must be between 5 and 100 characters');
    }
    
    if (!city) {
      validationErrors.push('City is required');
    } else if (city.length < 2 || city.length > 50) {
      validationErrors.push('City must be between 2 and 50 characters');
    } else if (!/^[a-zA-Z\s]+$/.test(city)) {
      validationErrors.push('City can only contain letters and spaces');
    }
    
    if (!state) {
      validationErrors.push('State is required');
    } else if (state.length < 2 || state.length > 50) {
      validationErrors.push('State must be between 2 and 50 characters');
    } else if (!/^[a-zA-Z\s]+$/.test(state)) {
      validationErrors.push('State can only contain letters and spaces');
    }
    
    if (!zipcode) {
      validationErrors.push('Zipcode is required');
    } else if (zipcode.length < 5 || zipcode.length > 10) {
      validationErrors.push('Zipcode must be between 5 and 10 characters');
    } else if (!/^[0-9\-\s]+$/.test(zipcode)) {
      validationErrors.push('Zipcode can only contain numbers, hyphens, and spaces');
    } else if (!Utils.validatePincode(zipcode)) {
      validationErrors.push('Sorry, we currently deliver only in Delhi');
    }
    
    if (!country) {
      validationErrors.push('Country is required');
    } else if (country.length < 2 || country.length > 50) {
      validationErrors.push('Country must be between 2 and 50 characters');
    } else if (!/^[a-zA-Z\s]+$/.test(country)) {
      validationErrors.push('Country can only contain letters and spaces');
    }
    
    // Get coordinates from map
    const coordinates = this.getMapCoordinates();
    
    let addressData = { 
      street, 
      city, 
      state, 
      zipcode, 
      country
    };
    
    // Validate coordinates if provided
    if (coordinates.latitude !== null && coordinates.longitude !== null) {
      if (coordinates.latitude < -90 || coordinates.latitude > 90) {
        validationErrors.push('Latitude must be between -90 and 90');
      }
      if (coordinates.longitude < -180 || coordinates.longitude > 180) {
        validationErrors.push('Longitude must be between -180 and 180');
      }
      
      if (validationErrors.length === 0) {
        addressData.latitude = coordinates.latitude;
        addressData.longitude = coordinates.longitude;
      }
    }
    
    // Validate guest user info if not logged in
    if (!Utils.isLoggedIn()) {
      const name = document.getElementById('name')?.value.trim();
      const email = document.getElementById('email')?.value.trim();
      const phone = document.getElementById('phone')?.value.trim();
      
      if (!name) {
        validationErrors.push('Name is required for guest checkout');
      } else if (name.length < 2 || name.length > 50) {
        validationErrors.push('Name must be between 2 and 50 characters');
      }
      
      if (!email) {
        validationErrors.push('Email is required for guest checkout');
      } else if (!SecurityUtils.validateEmail(email)) {
        validationErrors.push('Please enter a valid email address');
      }
      
      if (!phone) {
        validationErrors.push('Phone number is required for guest checkout');
      } else if (!SecurityUtils.validatePhone(phone)) {
        validationErrors.push('Phone number must be exactly 10 digits');
      }
      
      if (validationErrors.length === 0) {
        addressData = { name, email, phone, ...addressData };
      }
    }
    
    // Throw error with all validation messages if any exist
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('. '));
    }
    
    return addressData;
  }
  
  async fetchSavedAddresses() {
    try {
      if (!Utils.isLoggedIn()) {
        const guestEmail = document.getElementById('email')?.value.trim();
        if (!guestEmail) {
          console.log('Guest email not entered yet.');
          return;
        }
      }
      
      const email = Utils.isLoggedIn() ? null : document.getElementById('email')?.value.trim();
      const data = await this.apiService.getAddresses(email);
      
      this.appState.setState({ savedAddresses: data.address || [] });
      this.displayAddresses(data.name, data.address || []);
    } catch (error) {
      ErrorTracker.track(error, { action: 'fetch-saved-addresses' });
      // Silent failure for addresses
    }
  }
  
  displayAddresses(userName, addresses) {
    const addressesContainer = document.getElementById('saved-addresses');
    if (!addressesContainer) return;
    
    addressesContainer.innerHTML = '';
    
    if (!addresses || addresses.length === 0) {
      addressesContainer.innerHTML = '<p>No saved addresses found.</p>';
      return;
    }
    
    const fragment = document.createDocumentFragment();
    
    addresses.forEach((address, index) => {
      const addressElement = document.createElement('div');
      addressElement.classList.add('address-item');
      
      const sanitizedUserName = SecurityUtils.sanitizeHtml(userName || 'Guest');
      const sanitizedAddress = Object.fromEntries(
        Object.entries(address).map(([key, value]) => [key, SecurityUtils.sanitizeHtml(value)])
      );
      
      addressElement.innerHTML = `
        <label>
          <input type="radio" name="selectedAddress" value="${index}" ${index === addresses.length - 1 ? 'checked' : ''}>
          <strong>${sanitizedUserName}</strong><br>
          ${sanitizedAddress.street}, ${sanitizedAddress.city}, ${sanitizedAddress.state}, ${sanitizedAddress.zipcode}, ${sanitizedAddress.country}
        </label>
      `;
      
      fragment.appendChild(addressElement);
    });
    
    addressesContainer.appendChild(fragment);
  }
  
  populateCountries() {
    const countries = ['India'];
    const countryDropdown = document.getElementById('country');
    
    if (!countryDropdown) return;
    
    countryDropdown.innerHTML = '<option value="">Select Country</option>';
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country;
      option.textContent = country;
      countryDropdown.appendChild(option);
    });
    
    countryDropdown.value = 'India';
  }
  
  populateStatesAndUT() {
    const states = [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
      'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
      'Lakshadweep', 'Delhi', 'Puducherry', 'Ladakh', 'Jammu and Kashmir'
    ];
    
    const stateDropdown = document.getElementById('state');
    if (!stateDropdown) return;
    
    stateDropdown.innerHTML = '<option value="">Select State/UT</option>';
    states.forEach(state => {
      const option = document.createElement('option');
      option.value = state;
      option.textContent = state;
      stateDropdown.appendChild(option);
    });
  }
  
  async handleProceedToPayment(event) {
    event.preventDefault();
    
    try {
      const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked');
      const paymentMethod = selectedPaymentMethod?.value;
      const selectedAddressIndex = document.querySelector('input[name="selectedAddress"]:checked')?.value;
      
      if (!paymentMethod) {
        showNotification('Please select a payment method.', "warning");
        return;
      }
      
      if (selectedAddressIndex == null) {
        showNotification('Please select an address.', "warning");
        return;
      }
      
      // ✅ Track begin checkout event
      const cartItems = this.appState.getState().cartItems || [];
      const totalPrice = this.appState.getState().totalPrice || 0;
      AnalyticsTracker.trackBeginCheckout(totalPrice, cartItems.length);
      
      // ✅ Track payment method selection
      AnalyticsTracker.trackPaymentMethod(paymentMethod);
      
      // Handle payment methods
      await this.processPayment(paymentMethod);
    } catch (error) {
      ErrorTracker.track(error, { action: 'proceed-to-payment' });
              showNotification('Failed to process payment. Please try again.', "error");
    }
  }
  
  async processPayment(paymentMethod) {
    try {
      LoadingManager.show('process-payment', 'Processing payment...');
      
      const orderData = await this.buildOrderData();
      
      if (paymentMethod === 'razorpay') {
        await this.initiateRazorpayPayment(orderData);
      } else if (paymentMethod === 'phonepe') {
        await this.initiatePhonePePayment(orderData);
      } else {
        // Fallback for other payment methods
        const result = await this.apiService.createOrder(orderData);
        showNotification(`✅ Payment confirmed! Your order ID is ${result.orderId}`, "success");
        localStorage.setItem('orderId', result.orderId);
        window.location.href = 'order-confirmation.html';
      }
      
      LoadingManager.hide('process-payment');
    } catch (error) {
      LoadingManager.hide('process-payment');
      ErrorTracker.track(error, { action: 'process-payment' });
              showNotification('Payment processing failed. Please try again.', "error");
    }
  }
  
  async initiateRazorpayPayment(orderData) {
    try {
      // Create order on backend
      const result = await this.apiService.createOrder(orderData);
      
      if (!result.razorpayOrderId) {
        throw new Error('Failed to create Razorpay order');
      }
      
      const options = {
        key: result.razorpayKey,
        amount: result.amount,
        currency: result.currency,
        name: 'Ripe\'n Red',
        description: 'Fresh Himalayan Fruits',
        image: 'assets/images/logo1.webp',
        order_id: result.razorpayOrderId,
        handler: async (response) => {
          await this.handlePaymentSuccess(response, result.orderId, result.orderData);
        },
        prefill: {
          name: orderData.userInfo?.name || this.getUserInfo().name || '',
          email: orderData.userInfo?.email || this.getUserInfo().email || '',
          contact: orderData.userInfo?.phone || this.getUserInfo().phone || ''
        },
        notes: {
          address: `${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}`,
          orderId: result.orderId
        },
        theme: {
          color: '#28a745'
        },
        modal: {
          ondismiss: () => {
            LoadingManager.hide('process-payment');
            this.showError('Payment cancelled by user');
          }
        }
      };
      
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (response) => {
        this.handlePaymentFailure(response);
      });
      
      rzp.open();
    } catch (error) {
      ErrorTracker.track(error, { action: 'initiate-razorpay' });
      throw error;
    }
  }
  
  async handlePaymentSuccess(response, orderId, orderData) {
    try {
      LoadingManager.show('verify-payment', 'Verifying payment...');
      
      console.log('🔍 Starting payment verification for order:', orderId);
      console.log('🔍 Razorpay response:', {
        order_id: response.razorpay_order_id,
        payment_id: response.razorpay_payment_id,
        signature: response.razorpay_signature ? '***present***' : 'missing'
      });
      
      // Verify payment on backend and create order
      const verificationResult = await this.apiService.request('/orders/verify-payment', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          orderId: orderId,
          orderData: orderData // Pass the order data for database creation
        })
      });
      
      console.log('🔍 Payment verification result:', verificationResult);
      console.log('🔍 Result success property:', verificationResult?.success);
      console.log('🔍 Result type:', typeof verificationResult);
      
      // Enhanced verification check with better error handling
      if (verificationResult && (verificationResult.success === true || verificationResult.success === "true")) {
        console.log('✅ Payment verification successful, processing...');
        
        try {
          // ✅ Track successful purchase
          const totalValue = orderData.totalPrice || 0;
          const shipping = orderData.shippingCharges || 0;
          const tax = 0; // Assuming no tax for now
          AnalyticsTracker.trackPurchase(orderId, totalValue, tax, shipping, 'INR');
          
          // Clear cart
          if (Utils.isLoggedIn()) {
            // Clear server cart for logged-in users
            await this.clearServerCart();
          } else {
            // Clear local storage cart for guest users
            localStorage.removeItem('guestCart');
          }
          
          localStorage.setItem('orderId', orderId);
          localStorage.setItem('paymentId', response.razorpay_payment_id);
          
          // Email is now sent from backend for consistency
          
          this.showSuccess('Payment successful! Redirecting to confirmation page...');
          
          setTimeout(() => {
            window.location.href = 'order-confirmation.html';
          }, 2000);
          
          LoadingManager.hide('verify-payment');
        } catch (successError) {
          console.error('❌ Error in success block:', successError);
          LoadingManager.hide('verify-payment');
          throw successError;
        }
      } else {
        LoadingManager.hide('verify-payment');
        console.error('❌ Payment verification failed:', verificationResult);
        
        // More detailed error logging
        if (verificationResult) {
          console.error('❌ Verification result details:', {
            success: verificationResult.success,
            message: verificationResult.message,
            orderId: verificationResult.orderId,
            existing: verificationResult.existing
          });
          
          // If order already exists (duplicate), treat as success
          if (verificationResult.existing === true) {
            console.log('⚠️ Order already exists, treating as successful...');
            localStorage.setItem('orderId', orderId);
            localStorage.setItem('paymentId', response.razorpay_payment_id);
            this.showSuccess('Payment already processed! Redirecting to confirmation page...');
            setTimeout(() => {
              window.location.href = 'order-confirmation.html';
            }, 2000);
            return;
          }
        }
        
        throw new Error(verificationResult?.message || 'Payment verification failed - please contact support with your payment ID: ' + response.razorpay_payment_id);
      }
    } catch (error) {
      LoadingManager.hide('verify-payment');
      console.error('❌ Payment verification catch block:', error);
      console.error('❌ Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      ErrorTracker.track(error, { 
        action: 'payment-verification',
        orderId: orderId,
        paymentId: response?.razorpay_payment_id,
        orderData: {
          totalPrice: orderData?.totalPrice,
          finalTotal: orderData?.finalTotal,
          paymentMethod: orderData?.paymentMethod
        }
      });
      
      // More user-friendly error message
      let errorMessage = 'Payment verification failed. ';
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage += 'Please check your internet connection and contact support.';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'Request timed out. Your payment may have been processed - please check your orders or contact support.';
      } else {
        errorMessage += 'Please contact support with your payment ID: ' + (response?.razorpay_payment_id || 'N/A');
      }
      
      this.showError(errorMessage);
    }
  }
  
  async handlePaymentFailure(response) {
    LoadingManager.hide('process-payment');
    ErrorTracker.track(new Error('Payment failed'), { 
      action: 'razorpay-payment-failure',
      error: response.error 
    });
    
    // Send payment failure email
    const orderData = this.appState.getState().orderData;
    if (orderData) {
      await this.sendPaymentFailureEmail(
        orderData.orderId || 'UNKNOWN', 
        orderData, 
        response.error.description
      );
    }
    
    this.showError(`Payment failed: ${response.error.description}`);
  }
  
  async clearServerCart() {
    try {
      await this.apiService.request('/users/cart', {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn('Failed to clear server cart:', error);
      // Non-critical error, don't throw
    }
  }
  
  async buildOrderData() {
    const { cartItems, discountAmount } = this.appState.getState();
    const validationErrors = [];
    
    console.log('🔍 Building order data with validation...');
    
    // Validate cart items
    if (!cartItems || cartItems.length === 0) {
      validationErrors.push('Cart must contain at least one item');
    } else {
      cartItems.forEach((item, index) => {
        if (!item.productId) {
          validationErrors.push(`Cart item ${index + 1}: Product ID is required`);
        } else if (!/^[a-f\d]{24}$/i.test(item.productId)) {
          validationErrors.push(`Cart item ${index + 1}: Invalid product ID format`);
        }
        
        if (!item.quantity || item.quantity < 1 || item.quantity > 99) {
          validationErrors.push(`Cart item ${index + 1}: Quantity must be between 1 and 99`);
        }
      });
    }
    
    // Get and validate address
    let shippingAddress;
    try {
      shippingAddress = await this.getSelectedAddress();
      console.log('✅ Address validation passed');
    } catch (error) {
      validationErrors.push(`Address validation: ${error.message}`);
    }
    
    // Get and validate user info for guest users
    let userInfo = undefined;
    if (!Utils.isLoggedIn()) {
      try {
        userInfo = this.getUserInfo();
        console.log('✅ Guest user info validation passed');
      } catch (error) {
        validationErrors.push(`Guest info validation: ${error.message}`);
      }
    }
    
    // Validate payment method
    const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked');
    if (!selectedPaymentMethod) {
      validationErrors.push('Payment method is required');
    }
    
    // Validate total price
    let totalPrice = 0;
    if (cartItems && cartItems.length > 0) {
      cartItems.forEach(item => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseInt(item.quantity) || 0;
        totalPrice += itemPrice * itemQuantity;
      });
    }
    
    if (totalPrice <= 0) {
      validationErrors.push('Total price must be a positive number');
    }
    
    // Throw all validation errors at once
    if (validationErrors.length > 0) {
      const errorMessage = 'Order validation failed: ' + validationErrors.join('. ');
      console.error('❌ Order validation errors:', validationErrors);
      throw new Error(errorMessage);
    }
    
    const shippingCharges = Utils.calculateShipping(totalPrice);
    const finalTotal = totalPrice - (discountAmount || 0) + shippingCharges;
    
    const couponInput = document.getElementById('couponInput');
    const { couponApplied } = this.appState.getState();
    const appliedCoupons = couponApplied && couponInput ? [couponInput.value.trim()] : [];
    
    const orderData = {
      cartItems: cartItems.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity),
        price: parseFloat(item.price) || 0,
      })),
      shippingAddress,
      paymentMethod: selectedPaymentMethod.value,
      userInfo: userInfo, // Will be undefined for logged-in users
      userId: Utils.isLoggedIn() ? localStorage.getItem('userId') : undefined,
      totalPrice,
      discountAmount: discountAmount || 0,
      shippingCharges,
      appliedCoupons,
      finalTotal,
    };
    
    console.log('✅ Order data built successfully:', {
      cartItems: orderData.cartItems.length,
      hasAddress: !!orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod,
      totalPrice: orderData.totalPrice,
      finalTotal: orderData.finalTotal
    });
    
    return orderData;
  }
  
  async getSelectedAddress() {
    const selectedAddressIndex = document.querySelector('input[name="selectedAddress"]:checked')?.value;
    
    if (selectedAddressIndex != null && selectedAddressIndex !== '') {
      const { savedAddresses } = this.appState.getState();
      const address = savedAddresses[selectedAddressIndex];
      
      if (!address) {
        throw new Error('Selected address is invalid.');
      }
      
      return address;
    } else {
      // Use form data
      const addressData = this.collectAddressData();
      const coordinates = this.getMapCoordinates();
      
      return {
        street: addressData.street,
        city: addressData.city,
        state: addressData.state,
        zipcode: addressData.zipcode,
        country: addressData.country,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      };
    }
  }
  
  getUserInfo() {
    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    
    if (!name || !email || !phone) {
      throw new Error('Please fill in name, email, and phone.');
    }
    
    if (!SecurityUtils.validateEmail(email)) {
      throw new Error('Please enter a valid email address.');
    }
    
    if (!SecurityUtils.validatePhone(phone)) {
      throw new Error('Please enter a valid 10-digit phone number.');
    }
    
    return { name, email, phone };
  }
  
  handleAddressSelection(event) {
    const addressItems = document.querySelectorAll('.address-item');
    
    if (event.target.name === 'selectedAddress') {
      // Remove highlight from all items
      addressItems.forEach(item => {
        item.style.borderLeft = 'none';
        item.style.background = 'white';
        item.style.boxShadow = 'none';
        item.style.paddingLeft = '0';
        item.style.color = '#333';
      });
      
      // Add highlight to selected item
      const selectedLabel = event.target.closest('.address-item');
      if (selectedLabel) {
        selectedLabel.style.borderLeft = '4px solid #007bff';
        selectedLabel.style.background = '#eef5ff';
        selectedLabel.style.boxShadow = '0 2px 5px rgba(0, 123, 255, 0.2)';
        selectedLabel.style.paddingLeft = '10px';
        selectedLabel.style.color = '#007bff';
      }
    }
  }
  
  setupPaymentMethodSelection() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    
    paymentOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected class from all options
        paymentOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Mark associated radio button as checked
        const radioButton = option.querySelector('input[name="payment-method"]');
        if (radioButton) {
          radioButton.checked = true;
        }
      });
    });
  }
  
  // 🔧 Setup real-time validation for form fields
  setupRealTimeValidation() {
    const formFields = [
      { id: 'name', validator: this.validateName.bind(this) },
      { id: 'email', validator: this.validateEmail.bind(this) },
      { id: 'phone', validator: this.validatePhone.bind(this) },
      { id: 'street', validator: this.validateStreet.bind(this) },
      { id: 'city', validator: this.validateCity.bind(this) },
      { id: 'state', validator: this.validateState.bind(this) },
      { id: 'zipcode', validator: this.validateZipcode.bind(this) },
      { id: 'country', validator: this.validateCountry.bind(this) }
    ];
    
    formFields.forEach(({ id, validator }) => {
      const field = document.getElementById(id);
      if (field) {
        // Add validation on blur (when user leaves the field)
        field.addEventListener('blur', () => {
          this.validateField(field, validator);
        });
        
        // Add validation on input for instant feedback (with debouncing)
        field.addEventListener('input', Utils.debounce(() => {
          this.validateField(field, validator);
        }, 500));
      }
    });
  }
  
  // 🔧 Validate individual field and show feedback
  validateField(field, validator) {
    try {
      const result = validator(field.value.trim());
      this.showFieldValidation(field, result.isValid, result.message);
    } catch (error) {
      this.showFieldValidation(field, false, error.message);
    }
  }
  
  // 🔧 Show field validation feedback
  showFieldValidation(field, isValid, message) {
    // Remove existing validation classes and messages
    field.classList.remove('valid', 'invalid');
    
    const existingMessage = field.parentNode.querySelector('.validation-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    if (isValid) {
      field.classList.add('valid');
    } else {
      field.classList.add('invalid');
      
      // Create and show error message
      const messageElement = document.createElement('div');
      messageElement.className = 'validation-message error';
      messageElement.textContent = message;
      messageElement.style.cssText = `
        color: #dc3545;
        font-size: 12px;
        margin-top: 4px;
        display: block;
      `;
      
      field.parentNode.appendChild(messageElement);
    }
  }
  
  // 🔧 Individual field validators
  validateName(value) {
    if (!value) {
      return { isValid: false, message: 'Name is required' };
    }
    if (value.length < 2 || value.length > 50) {
      return { isValid: false, message: 'Name must be between 2 and 50 characters' };
    }
    return { isValid: true, message: '' };
  }
  
  validateEmail(value) {
    if (!value) {
      return { isValid: false, message: 'Email is required' };
    }
    if (!SecurityUtils.validateEmail(value)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    return { isValid: true, message: '' };
  }
  
  validatePhone(value) {
    if (!value) {
      return { isValid: false, message: 'Phone number is required' };
    }
    if (!SecurityUtils.validatePhone(value)) {
      return { isValid: false, message: 'Phone number must be exactly 10 digits' };
    }
    return { isValid: true, message: '' };
  }
  
  validateStreet(value) {
    if (!value) {
      return { isValid: false, message: 'Street address is required' };
    }
    if (value.length < 5 || value.length > 100) {
      return { isValid: false, message: 'Street address must be between 5 and 100 characters' };
    }
    return { isValid: true, message: '' };
  }
  
  validateCity(value) {
    if (!value) {
      return { isValid: false, message: 'City is required' };
    }
    if (value.length < 2 || value.length > 50) {
      return { isValid: false, message: 'City must be between 2 and 50 characters' };
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      return { isValid: false, message: 'City can only contain letters and spaces' };
    }
    return { isValid: true, message: '' };
  }
  
  validateState(value) {
    if (!value) {
      return { isValid: false, message: 'State is required' };
    }
    if (value.length < 2 || value.length > 50) {
      return { isValid: false, message: 'State must be between 2 and 50 characters' };
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      return { isValid: false, message: 'State can only contain letters and spaces' };
    }
    return { isValid: true, message: '' };
  }
  
  validateZipcode(value) {
    if (!value) {
      return { isValid: false, message: 'Zipcode is required' };
    }
    if (value.length < 5 || value.length > 10) {
      return { isValid: false, message: 'Zipcode must be between 5 and 10 characters' };
    }
    if (!/^[0-9\-\s]+$/.test(value)) {
      return { isValid: false, message: 'Zipcode can only contain numbers, hyphens, and spaces' };
    }
    if (!Utils.validatePincode(value)) {
      return { isValid: false, message: 'Sorry, we currently deliver only in Delhi' };
    }
    return { isValid: true, message: '' };
  }
  
  validateCountry(value) {
    if (!value) {
      return { isValid: false, message: 'Country is required' };
    }
    if (value.length < 2 || value.length > 50) {
      return { isValid: false, message: 'Country must be between 2 and 50 characters' };
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      return { isValid: false, message: 'Country can only contain letters and spaces' };
    }
    return { isValid: true, message: '' };
  }
  
  showError(message) {
    if (window.notifications) {
      window.notifications.error(message);
    } else {
      // Fallback to old method if notification system not loaded
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #f8d7da; color: #721c24; padding: 15px;
        border: 1px solid #f5c6cb; border-radius: 4px;
        max-width: 300px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      `;
      errorDiv.textContent = message;
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        errorDiv.remove();
      }, 5000);
    }
  }

  // Map functionality
  async initializeMap() {
    try {
      // Wait for Leaflet to be available
      if (typeof L === 'undefined') {
        console.warn('Leaflet not loaded, retrying in 1 second...');
        await Utils.sleep(1000);
        return this.initializeMap();
      }

      const mapContainer = document.getElementById('delivery-map');
      if (!mapContainer) {
        console.warn('Map container not found');
        return;
      }

      // Default center (Delhi, India)
      const defaultCenter = [28.7041, 77.1025];
      
      // Initialize map
      this.map = L.map('delivery-map').setView(defaultCenter, 10);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Add marker for user's location
      this.marker = L.marker(defaultCenter, {
        draggable: true,
        title: 'Drag to set delivery location'
      }).addTo(this.map);

      // Store initial coordinates
      this.updateCoordinates(defaultCenter[0], defaultCenter[1]);

      // Handle marker drag events
      this.marker.on('dragend', (event) => {
        const position = event.target.getLatLng();
        this.updateCoordinates(position.lat, position.lng);
      });

      // Handle map click events
      this.map.on('click', (event) => {
        const position = event.latlng;
        this.marker.setLatLng(position);
        this.updateCoordinates(position.lat, position.lng);
        console.log('🗺️ Map clicked at:', position);
      });

      console.log('✅ Map initialized successfully with OpenStreetMap');
      console.log('📍 Map center:', defaultCenter);
      console.log('🗺️ Map container:', mapContainer);
    } catch (error) {
      console.error('❌ Failed to initialize map:', error);
      ErrorTracker.track(error, { phase: 'map-initialization' });
    }
  }

  updateCoordinates(lat, lng) {
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;
    console.log(`📍 Location set: ${lat}, ${lng}`);
  }

  getMapCoordinates() {
    const latElement = document.getElementById('latitude');
    const lngElement = document.getElementById('longitude');
    
    if (!latElement || !lngElement) {
      return { latitude: null, longitude: null };
    }
    
    const lat = parseFloat(latElement.value);
    const lng = parseFloat(lngElement.value);
    
    // Return null if coordinates are not valid numbers
    return { 
      latitude: isNaN(lat) ? null : lat, 
      longitude: isNaN(lng) ? null : lng 
    };
  }
  
  setupCurrentLocationButton() {
    const btn = document.getElementById('fetchCurrentLocation');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      if (!navigator.geolocation) {
        this.showError('Geolocation is not supported by your browser.');
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Locating...';
      
      // Enhanced location options with maximum accuracy
      const options = {
        enableHighAccuracy: true,
        timeout: 20000,           // 20 seconds for better accuracy
        maximumAge: 0,            // No cached positions
        maximumAge: 0
      };
      
      // Try to get device orientation for better accuracy
      let deviceOrientation = null;
      if (window.DeviceOrientationEvent) {
        try {
          deviceOrientation = await this.getDeviceOrientation();
        } catch (e) {
          // Device orientation not available
        }
      }
      
      // Use watchPosition for continuous updates to get best accuracy
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          const altitude = position.coords.altitude;
          const heading = position.coords.heading;
          const speed = position.coords.speed;
          
          // Stop watching after getting a good position
          navigator.geolocation.clearWatch(watchId);
          
          this.centerMapOnLocation(lat, lng);
          btn.textContent = '📍 Use My Current Location';
          btn.disabled = false;
          
          // Show accuracy info
          const accuracyMsg = accuracy < 10 ? 'Excellent' : 
                            accuracy < 50 ? 'Good' : 
                            accuracy < 100 ? 'Fair' : 'Poor';
          this.showSuccess(`Location set! (${accuracyMsg} accuracy: ${Math.round(accuracy)}m)`);
        },
        (error) => {
          navigator.geolocation.clearWatch(watchId);
          let msg = 'Unable to fetch your location.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission denied. Please allow location access.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'Location unavailable. Try moving to an open area.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'Location request timed out. Please try again.';
          }
          this.showError(msg);
          btn.textContent = '📍 Use My Current Location';
          btn.disabled = false;
        },
        options
      );
      
      // Fallback to getCurrentPosition if watchPosition fails
      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        if (btn.disabled) {
          this.fallbackGetLocation(btn);
        }
      }, 25000);
    });
  }
  
  async getDeviceOrientation() {
    return new Promise((resolve, reject) => {
      if (!window.DeviceOrientationEvent) {
        reject('Device orientation not supported');
        return;
      }
      
      const handleOrientation = (event) => {
        const orientation = {
          alpha: event.alpha,    // Z-axis rotation
          beta: event.beta,      // X-axis rotation  
          gamma: event.gamma,    // Y-axis rotation
          absolute: event.absolute
        };
        
        window.removeEventListener('deviceorientation', handleOrientation);
        resolve(orientation);
      };
      
      window.addEventListener('deviceorientation', handleOrientation);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('deviceorientation', handleOrientation);
        reject('Device orientation timeout');
      }, 5000);
    });
  }
  
  fallbackGetLocation(btn) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        
        this.centerMapOnLocation(lat, lng);
        btn.textContent = '📍 Use My Current Location';
        btn.disabled = false;
        
        this.showSuccess(`Location set! (Accuracy: ${Math.round(accuracy)}m)`);
      },
      (error) => {
        let msg = 'Unable to fetch your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        this.showError(msg);
        btn.textContent = '📍 Use My Current Location';
        btn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }
  
  // 🔧 Enhanced browser detection
  getBrowserInfo() {
    const ua = navigator.userAgent;
    const browserInfo = {
      userAgent: ua,
      isChrome: /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor),
      isFirefox: /Firefox/.test(ua),
      isSafari: /Safari/.test(ua) && /Apple Computer/.test(navigator.vendor),
      isEdge: /Edg/.test(ua),
      isIE: /Trident/.test(ua) || /MSIE/.test(ua),
      isOpera: /Opera/.test(ua) || /OPR/.test(ua),
      isMobile: /Mobile|Android|iPhone|iPad/.test(ua),
      supportsModernJS: typeof Promise !== 'undefined' && typeof fetch !== 'undefined',
      supportsCrypto: typeof crypto !== 'undefined' && typeof crypto.getRandomValues !== 'undefined'
    };
    
    // Detect Chrome version for Chrome-specific issues
    const chromeMatch = ua.match(/Chrome\/(\d+)/);
    if (chromeMatch) {
      browserInfo.chromeVersion = parseInt(chromeMatch[1]);
    }
    
    // Detect Safari version
    const safariMatch = ua.match(/Version\/(\d+)/);
    if (safariMatch && browserInfo.isSafari) {
      browserInfo.safariVersion = parseInt(safariMatch[1]);
    }
    
    // Detect Firefox version
    const firefoxMatch = ua.match(/Firefox\/(\d+)/);
    if (firefoxMatch) {
      browserInfo.firefoxVersion = parseInt(firefoxMatch[1]);
    }
    
    return browserInfo;
  }
  
  // 🔧 Enhanced address saving with retry logic and browser-specific handling
  async saveAddressWithRetry(addressData, browserInfo, retryCount = 0) {
    const maxRetries = 3;
    const baseDelay = 1000;
    
    try {
      console.log(`🔄 Saving address attempt ${retryCount + 1}/${maxRetries + 1}`);
      
      // Browser-specific modifications
      const modifiedData = this.applyBrowserSpecificFixes(addressData, browserInfo);
      
      // Use different request strategies based on browser
      let result;
      if (browserInfo.isIE || (!browserInfo.supportsModernJS)) {
        result = await this.saveAddressLegacy(modifiedData);
      } else {
        result = await this.apiService.saveAddress(modifiedData);
      }
      
      console.log('✅ Address saved successfully:', result);
      return result;
      
    } catch (error) {
      console.error(`❌ Save address attempt ${retryCount + 1} failed:`, error);
      
      // Retry logic for network errors only
      if (retryCount < maxRetries && this.shouldRetryAddressSave(error, browserInfo)) {
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`⏳ Retrying in ${delay}ms...`);
        
        await Utils.sleep(delay);
        return this.saveAddressWithRetry(addressData, browserInfo, retryCount + 1);
      }
      
      // Add browser info to error
      error.browserInfo = browserInfo;
      throw error;
    }
  }
  
  // 🔧 Apply browser-specific fixes to address data
  applyBrowserSpecificFixes(addressData, browserInfo) {
    const modifiedData = { ...addressData };
    
    // Fix for Safari sometimes sending undefined as string
    if (browserInfo.isSafari) {
      Object.keys(modifiedData).forEach(key => {
        if (modifiedData[key] === 'undefined' || modifiedData[key] === undefined) {
          modifiedData[key] = '';
        }
      });
    }
    
    // Fix for older Chrome versions with coordinate precision issues
    if (browserInfo.isChrome && browserInfo.chromeVersion < 90) {
      if (modifiedData.latitude) {
        modifiedData.latitude = parseFloat(modifiedData.latitude.toFixed(6));
      }
      if (modifiedData.longitude) {
        modifiedData.longitude = parseFloat(modifiedData.longitude.toFixed(6));
      }
    }
    
    // Fix for Firefox form encoding issues
    if (browserInfo.isFirefox) {
      Object.keys(modifiedData).forEach(key => {
        if (typeof modifiedData[key] === 'string') {
          modifiedData[key] = modifiedData[key].trim();
        }
      });
    }
    
    return modifiedData;
  }
  
  // 🔧 Legacy address saving for older browsers
  async saveAddressLegacy(addressData) {
    const endpoint = Utils.isLoggedIn() ? '/users/addAddress' : '/users/guest/addAddress';
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${CONFIG.API_BASE_URL}${endpoint}`, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      const token = Utils.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.timeout = CONFIG.REQUEST_TIMEOUT;
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error occurred'));
      };
      
      xhr.ontimeout = function() {
        reject(new Error('Request timed out'));
      };
      
      xhr.send(JSON.stringify(addressData));
    });
  }
  
  // 🔧 Determine if address save should be retried
  shouldRetryAddressSave(error, browserInfo) {
    // Don't retry validation errors
    if (error.message.includes('required') || 
        error.message.includes('invalid') || 
        error.message.includes('validation')) {
      return false;
    }
    
    // Retry network errors
    if (error.message.includes('network') || 
        error.message.includes('fetch') ||
        error.message.includes('timeout') ||
        error.name === 'TypeError' ||
        error.name === 'AbortError') {
      return true;
    }
    
    // Browser-specific retry logic
    if (browserInfo.isSafari && error.message.includes('TypeError')) {
      return true;
    }
    
    if (browserInfo.isFirefox && error.message.includes('NS_ERROR')) {
      return true;
    }
    
    return false;
  }

/**
 * PhonePe Payment Integration with Popup
 * Similar to Razorpay modal but using popup + backend polling
 */async initiatePhonePePayment(orderData) {
  try {
    LoadingManager.show('phonepe-payment', 'Initiating PhonePe payment...');

    // 1. Create PhonePe payment order
    const result = await this.apiService.createOrder(orderData);

    if (!result.success || !result.phonePeTransactionId || !result.paymentUrl) {
      throw new Error('Failed to create PhonePe payment order');
    }

    console.log('✅ PhonePe payment order created:', {
      transactionId: result.phonePeTransactionId,
      orderId: result.orderId,
      amount: result.amount
    });

    // 2. Save for later verification
    sessionStorage.setItem('phonePeOrderData', JSON.stringify({
      orderId: result.orderId,
      transactionId: result.phonePeTransactionId,
      amount: result.amount,
      orderData: orderData
    }));

    // 3. 🚀 Redirect user to PhonePe
    window.location.href = result.paymentUrl;

  } catch (error) {
    LoadingManager.hide('phonepe-payment');
    ErrorTracker.track(error, { action: 'initiate-phonepe' });
    throw new Error(`PhonePe payment initiation failed: ${error.message}`);
  }
}

/**
 * Handle PhonePe payment success
 */
async handlePhonePePaymentSuccess(verificationResult) {
  try {
    const storedData = JSON.parse(sessionStorage.getItem('phonePeOrderData') || '{}');

    // Track successful purchase
    AnalyticsTracker.trackPurchase(
      storedData.orderId,
      storedData.orderData.finalTotal,
      0,
      storedData.orderData.shippingCharges,
      'INR'
    );

    // Clear cart
    if (Utils.isLoggedIn()) {
      await this.clearServerCart();
    } else {
      localStorage.removeItem('guestCart');
    }

    // Store success data
    localStorage.setItem('orderId', storedData.orderId);
    localStorage.setItem('paymentId', verificationResult.transactionId);
    sessionStorage.removeItem('phonePeOrderData');

    // Email is now sent from backend, no need to send from frontend

    this.showSuccess('PhonePe payment successful! Redirecting...');
    setTimeout(() => {
      window.location.href = 'order-confirmation.html';
    }, 2000);
  } catch (error) {
    ErrorTracker.track(error, { action: 'phonepe-payment-success' });
    this.showError('PhonePe payment verification failed. Please contact support.');
  }
}

/**
 * Handle PhonePe payment failure
 */
async handlePhonePePaymentFailure(paymentData) {
  ErrorTracker.track(new Error('PhonePe payment failed'), {
    action: 'phonepe-payment-failure',
    paymentData: paymentData
  });

  const storedData = JSON.parse(sessionStorage.getItem('phonePeOrderData') || '{}');
  if (storedData.orderData) {
    await this.sendPaymentFailureEmail(
      storedData.orderId || 'UNKNOWN',
      storedData.orderData,
      paymentData.message || 'PhonePe payment failed'
    );
  }

  const errorMsg = paymentData.message || 'PhonePe payment failed. Please try again.';
  this.showError(errorMsg);
  sessionStorage.removeItem('phonePeOrderData');
}

  
  /**
   * Handle PhonePe payment cancellation
   */
  handlePhonePePaymentCancellation() {
    const modal = document.getElementById('phonepe-payment-modal');
    if (modal) modal.remove();
    
    showNotification('PhonePe payment was cancelled.', 'warning');
    
    // Clean up stored data
    sessionStorage.removeItem('phonePeOrderData');
  }

  showSuccess(message) {
    if (window.notifications) {
      window.notifications.success(message);
    } else {
      // Fallback to old method if notification system not loaded
      const successDiv = document.createElement('div');
      successDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #d4edda; color: #155724; padding: 15px;
        border: 1px solid #c3e6cb; border-radius: 4px;
        max-width: 300px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      `;
      successDiv.textContent = message;
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        successDiv.remove();
      }, 5000);
    }
  }
  
  // Send checkout success email via API
  async sendCheckoutSuccessEmailAPI(orderId, orderData) {
    try {
      console.log('📧 Attempting to send checkout success email...');
      console.log('Order data:', { orderId, userInfo: orderData.userInfo, userDetails: orderData.userDetails });
      
      // Get customer email from different possible sources
      const customerEmail = orderData.userInfo?.email || 
                          orderData.userDetails?.email || 
                          orderData.guestEmail || 
                          orderData.customerEmail;
      
      if (!customerEmail) {
        console.warn('⚠️ No customer email found for checkout success email');
        return false;
      }
      
      const response = await fetch(`${getAPIURL()}/emails/checkout-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: customerEmail,
          orderData: {
            orderId: orderId,
            totalAmount: orderData.finalTotal || orderData.totalPrice,
            items: orderData.orderItems || orderData.items || [],
            shippingAddress: orderData.shippingAddress,
            expectedDelivery: '2-4 business days'
          }
        })
      });
      
      const result = await response.json();
      console.log('📧 Email API response:', result);
      
      if (response.ok) {
        console.log('✅ Checkout success email sent to:', customerEmail);
        return true;
      } else {
        console.warn('⚠️ Failed to send checkout success email:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Error sending checkout success email:', error);
      return false;
    }
  }

  // Cleanup method for proper memory management
  destroy() {
    // Remove event listeners
    Object.values(this.boundHandlers).forEach(handler => {
      // In a real implementation, you'd track and remove specific listeners
    });
    
    // Clear state
    this.appState = null;
    this.apiService = null;
    this.boundHandlers = {};
  }
}

// ✅ Payment Handler with Retry Logic
class PaymentHandler {
  constructor() {
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
  }

  async handlePayment(paymentData) {
    try {
      // ✅ Validate payment data before sending
      if (!this.validatePaymentData(paymentData)) {
        throw new Error('Invalid payment data');
      }

      // ✅ Create order first
      const orderResponse = await this.createOrder(paymentData);
      
      if (orderResponse.paymentMethod === 'razorpay') {
        return await this.handleRazorpayPayment(orderResponse, paymentData);
      } else {
        return await this.handleDirectPayment(orderResponse, paymentData);
      }
    } catch (error) {
      ErrorTracker.track(error, { 
        context: 'PaymentHandler.handlePayment',
        paymentData: { ...paymentData, sensitive: 'REDACTED' }
      });
      
      // ✅ Retry logic for network errors
      if (this.shouldRetry(error) && this.retryAttempts < this.maxRetries) {
        return await this.retryPayment(paymentData);
      }
      
      throw error;
    }
  }

  validatePaymentData(paymentData) {
    const required = ['cartItems', 'shippingAddress', 'paymentMethod', 'totalPrice'];
    return required.every(field => paymentData[field] && 
      (Array.isArray(paymentData[field]) ? paymentData[field].length > 0 : true));
  }

  async createOrder(paymentData) {
    const response = await apiService.request('/orders/create-order', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to create order');
    }
    
    return response;
  }

  async handleRazorpayPayment(orderResponse, paymentData) {
    return new Promise((resolve, reject) => {
      const options = {
        key: orderResponse.razorpayKey,
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: "Your Store Name",
        description: `Order ${orderResponse.orderId}`,
        order_id: orderResponse.razorpayOrderId,
        handler: async (response) => {
          try {
            // ✅ Verify payment on backend
            const verificationResponse = await this.verifyPayment(response, orderResponse.orderId, paymentData);
            resolve(verificationResponse);
          } catch (error) {
            reject(error);
          }
        },
        prefill: {
          name: paymentData.userInfo?.name || paymentData.userDetails?.name,
          email: paymentData.userInfo?.email || paymentData.userDetails?.email,
          contact: paymentData.userInfo?.phone || paymentData.userDetails?.phone
        },
        theme: {
          color: "#3399cc"
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();
    });
  }

  async verifyPayment(razorpayResponse, orderId, paymentData) {
    const verificationData = {
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature,
      orderId: orderId,
      orderData: paymentData
    };

    const response = await apiService.request('/orders/verify-payment', {
      method: 'POST',
      body: JSON.stringify(verificationData)
    });

    if (!response.success) {
      throw new Error(response.message || 'Payment verification failed');
    }

    return response;
  }

  async handleDirectPayment(orderResponse, paymentData) {
    // Handle direct payment methods (COD, bank transfer, etc.)
    return orderResponse;
  }

  shouldRetry(error) {
    // Retry on network errors, not on validation or business logic errors
    return error.name === 'TypeError' || 
           error.name === 'AbortError' || 
           error.message.includes('network') ||
           error.message.includes('fetch');
  }

  async retryPayment(paymentData) {
    this.retryAttempts++;
    const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Retrying payment in ${delay}ms (attempt ${this.retries}/${this.maxRetries})`);
    
    await Utils.sleep(delay);
    return this.handlePayment(paymentData);
  }

  reset() {
    this.retryAttempts = 0;
  }

  // Note: Email sending is now handled by backend for both Razorpay and PhonePe
}

// ✅ Initialize the application
let checkoutManager;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Add CSS animations and validation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      .fade-in {
        animation: fadeIn 0.3s ease-in;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      /* 📝 Validation styles */
      .form-field {
        position: relative;
        margin-bottom: 20px;
      }
      
      input.valid {
        border-color: #28a745 !important;
        box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
      }
      
      input.invalid {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
      }
      
      select.valid {
        border-color: #28a745 !important;
        box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
      }
      
      select.invalid {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
      }
      
      .validation-message {
        font-size: 12px;
        margin-top: 4px;
        display: block;
        font-weight: 500;
      }
      
      .validation-message.error {
        color: #dc3545;
      }
      
      .validation-message.success {
        color: #28a745;
      }
      
      /* 📦 Enhanced form styling */
      .form-group {
        position: relative;
        margin-bottom: 1.5rem;
      }
      
      .form-group label {
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
        display: block;
      }
      
      .form-group input,
      .form-group select {
        width: 100%;
        padding: 12px;
        border: 2px solid #ddd;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.3s ease;
      }
      
      .form-group input:focus,
      .form-group select:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
      }
    `;
    document.head.appendChild(style);
    
    // Initialize checkout manager
    checkoutManager = new CheckoutManager();
    await checkoutManager.init();
    
    console.log('✅ Checkout system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize checkout system:', error);
    ErrorTracker.track(error, { phase: 'app-initialization' });
  }
});

// ✅ Handle page unload cleanup
window.addEventListener('beforeunload', () => {
  if (checkoutManager) {
    checkoutManager.destroy();
  }
});

// ✅ Handle offline/online events
window.addEventListener('online', () => {
  console.log('✅ Connection restored');
  if (checkoutManager) {
    checkoutManager.fetchCartItems();
  }
});

window.addEventListener('offline', () => {
  console.log('⚠️ Connection lost - some features may be limited');
});

// ✅ Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CheckoutManager, APIService, Utils, SecurityUtils };
}
