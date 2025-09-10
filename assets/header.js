// Utility functions for security and UX
function sanitizeInput(input) {
    if (!input && input !== 0) return '';
    return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ✅ Announcement carousel with error handling
document.addEventListener('DOMContentLoaded', () => {
  const announcements = document.querySelectorAll('.announcement');
  const leftBtn = document.querySelector('.arrow.left');
  const rightBtn = document.querySelector('.arrow.right');

  if (announcements.length === 0) return; // No announcements, skip

  let current = 0;
  let prev = null;
  let carouselInterval;

  function showSlide(index, direction = 'left') {
    if (index < 0 || index >= announcements.length) return;
    
    announcements.forEach((a, i) => a.className = 'announcement');
    if (prev !== null && announcements[prev]) {
      announcements[prev].classList.add(direction === 'left' ? 'exit-left' : 'exit-right');
    }
    announcements[index].classList.add('active');
    prev = index;
  }

  function nextSlide() {
    current = (current + 1) % announcements.length;
    showSlide(current, 'left');
  }

  function prevSlide() {
    current = (current - 1 + announcements.length) % announcements.length;
    showSlide(current, 'right');
  }

  // Initialize carousel
  showSlide(current);
  carouselInterval = setInterval(nextSlide, 3000);
  
  // Pause on hover
  announcements.forEach(announcement => {
    announcement.addEventListener('mouseenter', () => clearInterval(carouselInterval));
    announcement.addEventListener('mouseleave', () => carouselInterval = setInterval(nextSlide, 3000));
  });

  console.log("✅ Header script loaded successfully");

// ✅ Search functionality with security
function initializeSearch() {
  // Try both possible search element IDs (supporting different page layouts)
  const searchConfigs = [
    {
      box: document.getElementById('searchbox'),
      button: document.getElementById('searchsubmit'),
      container: document.getElementById('searchcontainer'),
      results: document.getElementById('searchresults')
    },
    {
      box: document.getElementById('search-box'),
      button: document.getElementById('search-submit'),
      container: document.getElementById('search-container'),
      results: document.getElementById('search-results')
    }
  ];

  searchConfigs.forEach(config => {
    if (config.box && config.button && config.container && config.results) {
      setupSearchFunctionality(config);
    }
  });
}

function setupSearchFunctionality({ box, button, container, results }) {
  button.addEventListener('click', async () => {
    const query = sanitizeInput(box.value);
    if (!query) return;

    try {
      const response = await fetch(`${getAPIURL()}/products/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const products = await response.json();
      displaySearchResults(products, container, results);
      
    } catch (error) {
      console.error('Search error:', error);
      container.style.display = "block";
      results.innerHTML = '<p>Error fetching results. Please try again.</p>';
    }
  });

  // Close popup when clicking outside
  document.addEventListener("click", (event) => {
    const isClickInside = container.contains(event.target);
    const isSearchButton = event.target === button || button.contains(event.target);
    
    if (!isClickInside && !isSearchButton) {
      container.style.display = "none";
    }
  });
}

function displaySearchResults(products, container, results) {
  results.innerHTML = '';
  container.style.display = "block";

  if (products.length === 0) {
    results.innerHTML = '<p>No products found</p>';
    return;
  }

  products.forEach(product => {
    const productItem = document.createElement('div');
    productItem.className = 'search-result-item';
    
    // ✅ Sanitize product data for display
    const safeName = sanitizeInput(product.name || '');
    const safeCategoryName = sanitizeInput(product.categoryId?.name || 'Unknown');
    
    productItem.innerHTML = `<strong>${safeName}</strong> <span style="font-style: italic; font-size: 13px;">(in ${safeCategoryName})</span>`;

    productItem.addEventListener('click', () => {
      const categoryPage = `${safeCategoryName.toLowerCase()}.html`;
      window.location.href = `${categoryPage}?productName=${encodeURIComponent(safeName)}`;
    });

    results.appendChild(productItem);
  });
}

// Initialize search when DOM is ready
initializeSearch();
});

// ✅ Product scroll functionality
function initializeProductScroll() {
  setTimeout(() => {
    const params = new URLSearchParams(window.location.search);
    const productName = params.get("productName");

    if (!productName) return;

    const productTitles = document.querySelectorAll(".product-title");
    console.log("🔎 Total Products Found:", productTitles.length);

    let foundProduct = false;

    productTitles.forEach(title => {
      const titleText = sanitizeInput(title.textContent || '');
      const searchName = sanitizeInput(productName);
      
      if (titleText.toLowerCase() === searchName.toLowerCase()) {
        console.log("✅ Found Match:", productName);
        
        const productElement = title.closest(".product");
        if (productElement) {
          window.scrollTo({ 
            top: productElement.offsetTop - 100, 
            behavior: "smooth" 
          });
          foundProduct = true;
        }
      }
    });

    if (!foundProduct) {
      console.error("❌ No matching product found for:", productName);
    }
  }, 1500);
}

// ✅ Mobile menu functionality
function initializeMobileMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const sideMenu = document.getElementById("side-menu");

  if (menuToggle && sideMenu) {
    menuToggle.addEventListener("click", (event) => {
      sideMenu.classList.toggle("active");
      event.stopPropagation();
    });

    document.addEventListener("click", (event) => {
      if (!sideMenu.contains(event.target) && !menuToggle.contains(event.target)) {
        sideMenu.classList.remove("active");
      }
    });
  }
}

// ✅ Dashboard responsive visibility
function initializeDashboardVisibility() {
  const dashboardContainer = document.querySelector(".dashboard-container");
  if (!dashboardContainer) return;

  const toggleDashboardVisibility = () => {
    if (window.innerWidth <= 1024) {
      dashboardContainer.style.display = "none";
    } else {
      dashboardContainer.style.display = "flex";
    }
  };

  toggleDashboardVisibility();
  window.addEventListener("resize", toggleDashboardVisibility);
}

// ✅ Header scroll effects
function initializeHeaderScroll() {
  const marqueeContainer = document.querySelector('.text-carousel');
  const header = document.querySelector('header');

  if (marqueeContainer && header) {
    window.addEventListener('scroll', function () {
      const scrollY = window.scrollY;
      const marqueeBottom = marqueeContainer.offsetTop + marqueeContainer.offsetHeight;

      if (scrollY >= marqueeBottom) {
        header.classList.add('fixed');
      } else {
        header.classList.remove('fixed');
      }
    });
  }
}

// ✅ Search button toggle
function initializeSearchButton() {
  const searchBtn = document.getElementById("search-btn");
  if (!searchBtn) return;
  
  searchBtn.addEventListener("click", function () {
    const searchBar = document.getElementById("search-bar");
    const header = document.querySelector("header");

    if (searchBar && header) {
      if (searchBar.style.display === "none" || searchBar.style.display === "") {
        searchBar.style.display = "block";
        header.classList.add("header-expanded");
      } else {
        searchBar.style.display = "none";
        header.classList.remove("header-expanded");
      }
    }
  });
}

// ✅ Cart count with error handling and security
function updateCartCount() {
  const cartCountElement = document.getElementById("cart-count");
  if (!cartCountElement) return;

  const token = localStorage.getItem("authToken");

  if (token) {
    fetch(`${getAPIURL()}/users/cart`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(cart => {
      const totalQuantity = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
      cartCountElement.textContent = totalQuantity || "";
    })
    .catch(error => {
      console.error("❌ Error fetching cart count:", error);
      // Fallback to guest cart on error
      const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
      const totalQuantity = guestCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
      cartCountElement.textContent = totalQuantity || "";
    });
  } else {
    try {
      const cart = JSON.parse(localStorage.getItem("guestCart")) || [];
      const totalQuantity = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
      cartCountElement.textContent = totalQuantity || "";
    } catch (error) {
      console.error("❌ Error reading guest cart:", error);
      cartCountElement.textContent = "";
    }
  }
}

// ✅ Initialize all header functionality
document.addEventListener("DOMContentLoaded", () => {
  initializeProductScroll();
  initializeMobileMenu();
  initializeDashboardVisibility();
  initializeHeaderScroll();
  initializeSearchButton();
  updateCartCount();
});

// ✅ Make updateCartCount globally available
window.updateCartCount = updateCartCount;

