// === about.js (Production Grade: Security, Reliability Enhanced) ===

// Cart count update (if defined elsewhere in your codebase)
document.addEventListener("DOMContentLoaded", function () {
  if (typeof updateCartCount === "function") {
    updateCartCount();
  }

  // --- Image Modal Functionality ---
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  const closeModalBtn = document.querySelector(".modal .close");

  // --- Modal: Open and Close ---
  function openModal(image) {
    if (!modal || !modalImg) return;
    // For security, use only src attribute from known IMG node
    if (typeof image.src === "string") {
      modal.style.display = "flex";
      // Prevent passing any scriptable data to src
      modalImg.src = image.src;
    }
  }

  function closeModal() {
    if (modal) modal.style.display = "none";
    // Optionally clean up src to avoid keeping large images in memory
    if (modalImg) modalImg.src = "";
  }

  // Attach listeners only if modal elements exist
  if (modal && modalImg && closeModalBtn) {
    // Attach event listeners to all gallery images (scoped inside DOMContentLoaded)
    document.querySelectorAll(".gallery img").forEach(img => {
      img.addEventListener("click", function () {
        openModal(this);
      });
    });

    // Close modal when clicking the close button
    closeModalBtn.addEventListener("click", closeModal);

    // Close modal when clicking outside the image (backdrop)
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeModal();
      }
    });

    // Close modal with Esc key
    document.addEventListener("keydown", function (event) {
      if (modal.style.display === "flex" && event.key === "Escape") {
        closeModal();
      }
    });
  }

  // --- Intersection Observer for Mission Sections ---
  const missionContents = document.querySelectorAll(".mission-content");

  if (missionContents.length) {
    // Secure observer options (0.7 = 70% visible triggers)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        } else {
          entry.target.classList.remove("visible");
        }
      });
    }, {
      threshold: 0.7,
    });

    missionContents.forEach(content => observer.observe(content));
  }
});
