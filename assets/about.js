document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("DOMContentLoaded", updateCartCount);
    // Image Modal Functionality
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const closeModalBtn = document.querySelector(".modal .close");

    // Function to open the modal
function openModal(image) {
    const modal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    modal.style.display = "flex"; // Make the modal visible
    modalImage.src = image.src; // Set the modal image source to the clicked image
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById("imageModal");
    modal.style.display = "none"; // Hide the modal
}

    

    // Attach event listeners to all gallery images
    document.querySelectorAll(".gallery img").forEach(img => {
        img.addEventListener("click", function () {
            openModal(this);
        });
    });

    // Close modal when clicking the close button
    closeModalBtn.addEventListener("click", closeModal);

    // Close modal when clicking outside the image
    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    // Close modal with Esc key
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeModal();
        }
    });
});
 // Select all mission-content sections
const missionContents = document.querySelectorAll(".mission-content");

// Observer to track visibility based on scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Add the 'visible' class when the element enters the viewport
            entry.target.classList.add("visible");
        } else {
            // Remove the 'visible' class when the element leaves the viewport
            entry.target.classList.remove("visible");
        }
    });
}, {
    threshold: 0.7 /* Trigger when 50% of the element is visible */
});

// Attach observer to each mission content section
missionContents.forEach(content => observer.observe(content));
