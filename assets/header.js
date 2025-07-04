document.addEventListener('DOMContentLoaded', () => {
  const announcements = document.querySelectorAll('.announcement');
  const leftBtn = document.querySelector('.arrow.left');
  const rightBtn = document.querySelector('.arrow.right');

  let current = 0;
  let prev = null;

  function showSlide(index, direction = 'left') {
    announcements.forEach((a, i) => a.className = 'announcement');
    if (prev !== null) {
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

  showSlide(current);
  setInterval(nextSlide, 3000);


    console.log("🚀 Script Loaded!"); // Verify script is running
console.log("🚀 Script Loaded!"); // Verify script is running

const searchBox1 = document.getElementById('searchbox');
const searchButton1 = document.getElementById('searchsubmit');
const searchContainer1 = document.getElementById('searchcontainer');
const searchResultsContainer1 = document.getElementById('searchresults');

searchButton1.addEventListener('click', async () => {
    const query = searchBox1.value.trim();
    if (!query) return;

    try {
        const response = await fetch(`https://pureplucks.com/api/products/search?query=${query}`);
        const products = await response.json();

        searchResultsContainer1.innerHTML = ''; // Clear previous results
        searchContainer1.style.display = "block"; // Show popup container

        if (products.length === 0) {
            searchResultsContainer1.innerHTML = '<p>No products found</p>';
            return;
        }

        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'search-result-item';
            productItem.innerHTML = `<strong>${product.name}</strong> <span style="font-style: italic; font-size: 13px;">(in ${product.categoryId.name})</span>`;

            productItem.addEventListener('click', () => {
                const categoryPage = `${product.categoryId.name.toLowerCase()}.html`;
                window.location.href = `${categoryPage}?productName=${encodeURIComponent(product.name)}`;
            });

            searchResultsContainer1.appendChild(productItem);
        });
    } catch (error) {
        searchContainer1.style.display = "block";
        searchResultsContainer1.innerHTML = '<p>Error fetching results</p>';
        console.error('Search error:', error);
    }
});
// Close popup when clicking outside of it (for the #searchcontainer version)
document.addEventListener("click", (event) => {
    const isClickInside = searchContainer1.contains(event.target);
    const isSearchButton = event.target === searchButton1 || searchButton1.contains(event.target);
    
    if (!isClickInside && !isSearchButton) {
        searchContainer1.style.display = "none";
    }
});

    
        const searchBox = document.getElementById('search-box');
        const searchButton = document.getElementById('search-submit');
        const searchContainer = document.getElementById('search-container');
        const searchResultsContainer = document.getElementById('search-results');
    
        searchButton.addEventListener('click', async () => {
            const query = searchBox.value.trim();
            if (!query) return;
    
            try {
                const response = await fetch(`https://pureplucks.com/api/products/search?query=${query}`);
                const products = await response.json();
    
                searchResultsContainer.innerHTML = ''; // Clear previous results
    
                if (products.length === 0) {
                    searchContainer.style.display = "block"; // Show popup even if empty
                    searchResultsContainer.innerHTML = '<p>No products found</p>';
                    return;
                }
    
                searchContainer.style.display = "block"; // Show popup when results appear
    
                products.forEach(product => {
                    const productItem = document.createElement('div');
                    productItem.className = 'search-result-item';
                    productItem.innerHTML = `<strong>${product.name}</strong> <span style="font-style: italic; font-size: 13px;">(in ${product.categoryId.name})</span>`;

                    
                    productItem.addEventListener('click', () => {
                        const categoryPage = `${product.categoryId.name.toLowerCase()}.html`;
                        window.location.href = `${categoryPage}?productName=${encodeURIComponent(product.name)}`;
                    });
    
                    searchResultsContainer.appendChild(productItem);
                });
            } catch (error) {
                searchContainer.style.display = "block"; // Show popup to display error message
                searchResultsContainer.innerHTML = '<p>Error fetching results</p>';
                console.error('Search error:', error);
            }
        });
    
        // Close popup when clicking outside of it
        document.addEventListener("click", (event) => {
            if (!searchContainer.contains(event.target) && event.target !== searchButton) {
                searchContainer.style.display = "none"; // Hide when clicking outside
            }
        });
    });
    
    
    // Scroll to Product Function
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            const productName = params.get("productName");
    
            if (!productName) return;
    
            const productTitles = document.querySelectorAll(".product-title");
            console.log("🔎 Total Products Found:", productTitles.length);
    
            let foundProduct = false;
    
            productTitles.forEach(title => {
                console.log("Checking:", title.textContent.trim());
    
                if (title.textContent.trim().toLowerCase() === productName.trim().toLowerCase()) {
                    console.log("✅ Found Match:", productName);
    
                    // Use the working manual scroll method
                    window.scrollTo({ 
                        top: title.closest(".product").offsetTop - 100, 
                        behavior: "smooth" 
                    });
    
                    foundProduct = true;
                }
            });
    
            if (!foundProduct) {
                console.error("❌ No matching product found for:", productName);
            }
        }, 1500); // Slight delay ensures elements are fully loaded
    });
    
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const productName = params.get("productName");

    console.log("🔎 Product Name received from URL:", productName); // Debug log
});




document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menu-toggle");
    const sideMenu = document.getElementById("side-menu");

    // Toggle the side menu on button click
    if (menuToggle && sideMenu) {
        menuToggle.addEventListener("click", (event) => {
            sideMenu.classList.toggle("active");
            event.stopPropagation(); // Prevent click propagation to the document
        });

        // Close the menu when clicking anywhere outside the menu
        document.addEventListener("click", (event) => {
            if (!sideMenu.contains(event.target) && !menuToggle.contains(event.target)) {
                sideMenu.classList.remove("active");
            }
        });
    }
});
document.addEventListener("DOMContentLoaded", () => {
    const dashboardContainer = document.querySelector(".dashboard-container");

    // Function to check screen size and toggle visibility
    const toggleDashboardVisibility = () => {
        if (window.innerWidth <= 1024) {
            // Hide dashboard-container in mobile mode
            dashboardContainer.style.display = "none";
        } else {
            // Show dashboard-container in desktop mode
            dashboardContainer.style.display = "flex";
        }
    };

    // Run the function on page load
    toggleDashboardVisibility();

    // Run the function when resizing the browser window
    window.addEventListener("resize", toggleDashboardVisibility);
});

  document.addEventListener('DOMContentLoaded', function () {
    const marqueeContainer = document.querySelector('.text-carousel');
    const header = document.querySelector('header');

    // Wait until everything is rendered properly
    window.addEventListener('scroll', function () {
      const scrollY = window.scrollY;
      const marqueeBottom = marqueeContainer.offsetTop + marqueeContainer.offsetHeight;

      if (scrollY >= marqueeBottom) {
        header.classList.add('fixed');
      } else {
        header.classList.remove('fixed');
      }
    });
    
  });

//serach button
document.getElementById("search-btn").addEventListener("click", function () {
    const searchBar = document.getElementById("search-bar");
    const header = document.querySelector("header");

    if (searchBar.style.display === "none" || searchBar.style.display === "") {
        searchBar.style.display = "block";
        header.classList.add("header-expanded");
    } else {
        searchBar.style.display = "none";
        header.classList.remove("header-expanded");
    }
});


function updateCartCount() {
    const cartCountElement = document.getElementById("cart-count");
    if (!cartCountElement) return;

    const token = localStorage.getItem("authToken");

    if (token) {
        fetch("https://pureplucks.com/api/users/cart", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(cart => {
            const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCountElement.textContent = totalQuantity || "";
        })
        .catch(error => console.error("❌ Error fetching cart count:", error));
    } else {
        const cart = JSON.parse(localStorage.getItem("guestCart")) || [];
        const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalQuantity || "";
    }
}
    
    
    
    

