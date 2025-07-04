document.addEventListener("DOMContentLoaded", function () {
    attachHoverTracking(); // Ensure hover tracking runs
    attachClickTracking(); // Ensure click tracking runs after DOM is ready
});
// 🔹 New function to handle hover tracking dynamically
function attachHoverTracking() {
    console.log("✅ Hover tracking initialized");

    const productCards = document.querySelectorAll(".product-card");

    productCards.forEach(card => {
        let hoverTimer;

        // Remove any existing event listeners before adding new ones
        card.removeEventListener("mouseenter", hoverHandler);
        card.removeEventListener("mouseleave", leaveHandler);

        function hoverHandler() {
            hoverTimer = setTimeout(() => {
                console.log("User hovered long enough on:", card);

                let productId = card.querySelector(".buy-now-btn").getAttribute("data-id");
                let productImage = card.querySelector("img").src;
                let productName = card.querySelector("h3").innerText;
                let productPrice = card.querySelector(".price").innerText;

                let viewedProducts = JSON.parse(localStorage.getItem("recentlyViewed")) || [];

                viewedProducts = viewedProducts.filter(p => p.productId !== productId);
                viewedProducts.unshift({ productId, productImage, productName, productPrice });

                if (viewedProducts.length > 10) {
                    viewedProducts.pop();
                }

                localStorage.setItem("recentlyViewed", JSON.stringify(viewedProducts));
                console.log("Recently viewed updated:", viewedProducts);
            }, 1200);
        }

        function leaveHandler() {
            clearTimeout(hoverTimer);
        }

        // Attach fresh event listeners
        card.addEventListener("mouseenter", hoverHandler);
        card.addEventListener("mouseleave", leaveHandler);
    });
}
function attachClickTracking() {
    console.log("✅ Click tracking initialized");

    const productCards = document.querySelectorAll(".product");

    productCards.forEach(card => {
        card.removeEventListener("click", clickHandler);

        function clickHandler(e) {
            if (
                e.target.closest(".cart-btn") ||
                e.target.closest(".buy-now-btn") ||
                e.target.closest(".add-to-wishlist")
            ) return; // Ignore clicks on action buttons

            let productId = card.querySelector(".buy-now-btn").getAttribute("data-id");
            let productImage = card.querySelector("img").src;
            let productName = card.querySelector("h3").innerText;
            let productPrice = card.querySelector(".price").innerText;

            let viewedProducts = JSON.parse(localStorage.getItem("recentlyViewed")) || [];

            // Ensure no duplicates before adding
            viewedProducts = viewedProducts.filter(p => p.productId !== productId);
            viewedProducts.unshift({ productId, productImage, productName, productPrice });

            if (viewedProducts.length > 10) {
                viewedProducts.pop();
            }

            localStorage.setItem("recentlyViewed", JSON.stringify(viewedProducts));
            console.log("✅ Product Click Recorded:", productName);

            // Redirect to dedicated product page
            window.location.href = `products.html?product=${productId}`;
        }

        card.addEventListener("click", clickHandler);
    });
}
