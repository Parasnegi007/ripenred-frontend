window.addEventListener("DOMContentLoaded", async function () {
    const token = localStorage.getItem("authToken");

    if (!token) {
        // 🚫 No token = Guest user
        window.location.href = "guest-dashboard.html";  // 🔁 Redirect to guest dashboard
        return;
    }

    try {
        const response = await fetch("https://pureplucks.com/api/users/profile", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user details");
        }

        const userData = await response.json();



        // ✅ Store user data locally
        localStorage.setItem("loggedInUser", JSON.stringify(userData));

        // ✅ Update dashboard with user data
        document.getElementById("display-name").textContent = userData.name || "Not Provided";
        document.getElementById("display-email").textContent = userData.email || "Not Provided";
        document.getElementById("display-phone").textContent = userData.phone || "Not Provided";

       // ✅ Continue loading full dashboard with userData...
    } catch (error) {
        console.error("Error:", error);
        // 🛠 Optional: fallback to guest dashboard if token is invalid
        localStorage.removeItem("authToken"); // Clean up invalid token
        window.location.href = "guest-dashboard.html"; // 🔁 Redirect to guest dashboard
    }

    // ✅ Logout Functionality
    document.getElementById("logout").addEventListener("click", function () {
        localStorage.removeItem("authToken");
        localStorage.removeItem("loggedInUser");
        window.location.href = "login.html";
    });

    // ✅ Show Edit Profile Section
    const editProfileBtn = document.getElementById("edit-profile");
    if (editProfileBtn) {
        editProfileBtn.addEventListener("click", function () {
            document.getElementById("edit-profile-section").style.display = "block";

            const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
            document.getElementById("edit-name").value = loggedInUser.name;
            document.getElementById("edit-email").value = loggedInUser.email;
            document.getElementById("edit-phone").value = loggedInUser.phone;
        });
    }

    // ✅ Show "Save Changes" Button When Any Field is Edited
    const inputs = ["edit-name", "edit-email", "edit-phone"];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener("input", function () {
            document.getElementById("save-profile").style.display = "block"; // Show Save Changes
        });
    });

    // ✅ Show "Send OTP" Button When Email or Phone Changes
    const emailInput = document.getElementById("edit-email");
    const phoneInput = document.getElementById("edit-phone");
    const sendOtpBtn = document.getElementById("send-otp"); // Single OTP button

    function checkIfChanged() {
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
        const updatedEmail = emailInput.value.trim();
        const updatedPhone = phoneInput.value.trim();

        // Show "Send OTP" button if email or phone is changed
        if ((updatedEmail && updatedEmail !== loggedInUser.email) || 
            (updatedPhone && updatedPhone !== loggedInUser.phone)) {
            sendOtpBtn.style.display = "block";  
        } else {
            sendOtpBtn.style.display = "none";  
        }
    }

    emailInput.addEventListener("input", checkIfChanged);
    phoneInput.addEventListener("input", checkIfChanged);

    // ✅ Email & Phone Validation
    function validateInput(input, pattern) {
        if (pattern.test(input.value.trim())) {
            input.style.border = "2px solid green"; // ✅ Valid
        } else {
            input.style.border = "2px solid red"; // ❌ Invalid
        }
    }

    emailInput.addEventListener("input", function () {
        validateInput(this, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    phoneInput.addEventListener("input", function () {
        validateInput(this, /^[0-9]{10}$/);
    });

    // ✅ Send OTP (Same for Both Email & Phone)
    sendOtpBtn.addEventListener("click", async function () {
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
        const updatedEmail = emailInput.value.trim();
        const updatedPhone = phoneInput.value.trim();

        if (!updatedEmail && !updatedPhone) {
            alert("Enter a valid email or phone number!");
            return;
        }

        sendOtpBtn.textContent = "Sending...";
        sendOtpBtn.disabled = true;

        try {
            const token = localStorage.getItem("authToken");  // Get stored JWT token

            const response = await fetch("https://pureplucks.com/api/users/send-otp-update", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`  // ✅ Include token
                },
                body: JSON.stringify({ email: updatedEmail || loggedInUser.email, phone: updatedPhone || loggedInUser.phone })
            });
            

            const data = await response.json();

            if (response.ok) {
                alert("OTP sent to your email and phone.");
                document.getElementById("email-otp-section").style.display = "block";  // Show OTP input
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("OTP Error:", error);
            alert("Failed to send OTP.");
        }

        setTimeout(() => {
            sendOtpBtn.textContent = "Send OTP";
            sendOtpBtn.disabled = false;
        }, 5000);
    });

    // ✅ Save Profile Updates
    document.getElementById("save-profile").addEventListener("click", async function () {
        const name = document.getElementById("edit-name").value.trim();
        const email = document.getElementById("edit-email").value.trim();
        const phone = document.getElementById("edit-phone").value.trim();
        const otp = document.getElementById("email-otp").value.trim();  // Get OTP

        const token = localStorage.getItem("authToken");  // JWT Token

        let requestBody = { name };  // Only update name if no email/phone change

        if (email && email !== JSON.parse(localStorage.getItem("loggedInUser")).email) {
            requestBody.email = email;
        }

        if (phone && phone !== JSON.parse(localStorage.getItem("loggedInUser")).phone) {
            requestBody.phone = phone;
        }

        // OTP is required if email or phone changes
        if ((email && email !== JSON.parse(localStorage.getItem("loggedInUser")).email) || 
            (phone && phone !== JSON.parse(localStorage.getItem("loggedInUser")).phone)) {
            if (!otp) {
                alert("OTP is required to update email or phone.");
                return;
            }
            requestBody.otp = otp;
        }

        try {
            const response = await fetch("https://pureplucks.com/api/users/update-profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok) {
                alert("Profile updated successfully!");
                localStorage.setItem("loggedInUser", JSON.stringify(data.user));  // Save updated user
                location.reload();  // Refresh page to update displayed details
            } else {
                alert("Error: " + data.message);
            }
        } catch (error) {
            console.error("Update Error:", error);
            alert("Failed to update profile. Please try again.");
        }
    });
});

// Function to fetch user addresses from the backend
async function fetchAddresses() {
    const token = localStorage.getItem("authToken");
    const endpoint = "https://pureplucks.com/api/users/getAddresses";
    console.log("Starting fetch request to:", endpoint);

    if (!token) {
        console.error("Token not found in localStorage.");
        return; // Stop execution if token is missing
    }

    try {
        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}` // Attach token to Authorization header
            }
        });
        console.log("Raw Response:", response);

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Error fetching addresses: ${errorData.message}`);
            alert(`Failed to fetch addresses: ${errorData.message}`);
            return;
        }

        const data = await response.json();

        console.log("Fetched address data:", data);

        if (data.address && data.address.length > 0) {
            displayAddresses(data.address);
        } else {
            displayEmptyMessage(); // Handle case where no addresses are found
        }
    } catch (error) {
        console.error("Error fetching addresses:", error);
        alert("An error occurred while fetching addresses. Please try again.");
    }
}

// Function to display addresses in tile format
function displayAddresses(addresses) {
    const grid = document.getElementById("addresses-grid");
    if (!grid) {
        console.error("Element 'addresses-grid' not found.");
        return;
    }

    addresses.forEach(address => {
        console.log("Rendering Address Object:", address); // Debug log for rendering addresses
        const addressTile = document.createElement("div");
        addressTile.classList.add("address-tile");

        addressTile.innerHTML = `
            <p>${address.street}</p>
            <p>${address.city}, ${address.state}</p>
            <p>${address.zipcode}, ${address.country}</p>
            <button class="delete-button" onclick="deleteAddress('${address._id}')">✖</button>
        `;

        grid.appendChild(addressTile);
    });
}

// Handle case where no addresses are found
function displayEmptyMessage() {
    const grid = document.getElementById("addresses-grid");
    grid.innerHTML = "<p>No saved addresses found.</p>";
}
// Function to handle address deletion
async function deleteAddress(addressId) {
    const confirmDelete = window.confirm("Are you sure you want to delete this address?");

    if (!confirmDelete) {
        console.log("Address deletion canceled by the user.");
        return; // Exit the function if the user cancels
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
        console.error("Token not found in localStorage.");
        alert("You are not authorized. Please log in again.");
        return;
    }

    try {
        const response = await fetch(`https://pureplucks.com/api/users/deleteAddress/${addressId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Error deleting address: ${errorData.message}`);
            alert(`Failed to delete address: ${errorData.message}`);
            return;
        }

        const data = await response.json();
        console.log("Address deletion response:", data);

        // Remove the address from the displayed list
        document.querySelector(`.address-tile button[onclick="deleteAddress('${addressId}')"]`).parentElement.remove();
        alert("Address deleted successfully.");
    } catch (error) {
        console.error("Error deleting address:", error);
        alert("An error occurred while deleting the address. Please try again.");
    }
}

// Call the fetch function when the page loads
document.addEventListener("DOMContentLoaded", fetchAddresses);
// Function to fetch previous orders
// Store orders in memory and track display state
let allOrders = [];
let currentDisplayIndex = 0; // Tracks how many orders are displayed
async function fetchOrders() {
    const token = localStorage.getItem("authToken");
    const endpoint = `https://pureplucks.com/api/orders/my-orders`;

    if (!token) {
        console.error("Token not found in localStorage.");
        alert("You need to log in to view your orders.");
        return;
    }

    try {
        const response = await fetch(endpoint, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}` // Attach token to Authorization header
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Error fetching orders: ${errorData.message}`);
            alert(`Failed to fetch orders: ${errorData.message}`);
            return;
        }

        const data = await response.json();
        console.log("Fetched orders:", data);

        // Sort orders by `orderDate` in descending order (newest first)
        allOrders = data.orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

        displayOrdersInChunks(); // Display the initial orders
    } catch (error) {
        console.error("Error fetching orders:", error);
        alert("An error occurred while fetching your orders. Please try again.");
    }
}

// Function to display orders in chunks
function displayOrdersInChunks() {
    const container = document.getElementById("orders-container");
    const chunkSize = currentDisplayIndex === 0 ? 2 : 3;

    const ordersToDisplay = allOrders.slice(
        currentDisplayIndex,
        currentDisplayIndex + chunkSize
    );
ordersToDisplay.forEach(order => {
    console.log("Final total debug:", order.finalTotal); // ✅ Add this here

        const orderTile = document.createElement("div");
        orderTile.classList.add("order-tile");

        const orderItems = order.orderItems.map(item => `${item.name} (x${item.quantity})`).join(", ");
orderTile.innerHTML = `
    <div class="order-summary" style="cursor: pointer;">
        <div class="order-items-list">
            ${order.orderItems.map(item => `
                <div class="order-item">
                    <div class="item-info">
                        <p><strong>${item.name}</strong></p>
                        <p>Price: ₹${item.price}</p>
                    </div>
                   <img src="${item.image}" alt="${item.name}" class="product-image" />
                </div>
            `).join('')}
        </div>
        <p><strong>Order ID:</strong> ${order.orderId || order._id}</p>
        <p>Status: ${order.orderStatus}</p>
        <p><strong>Total:</strong> ₹${order.finalTotal}</p>
    </div>

    <div class="order-details" style="display: none; margin-top: 10px;">
        <p><strong>Order ID:</strong> ${order.orderId || order._id}</p>
        <p><strong>Tracking ID:</strong> ${order.trackingId || "N/A"}</p>
        <p><strong>Courier Partner:</strong> ${order.courierPartner || "N/A"}</p>
        <p><strong>Name:</strong> ${order.name}</p>
        <p><strong>Email:</strong> ${order.email}</p>
        <p><strong>Phone:</strong> ${order.phone}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
        <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleDateString()}</p>
        <p><strong>Shipping Address:</strong> ${order.shippingAddress.street}, 
        ${order.shippingAddress.city}, ${order.shippingAddress.state}, 
        ${order.shippingAddress.zipcode}, ${order.shippingAddress.country}</p>

        <p><strong>Item Total:</strong> ₹${order.totalPrice}</p>
        <p><strong>Shipping Charges:</strong> ₹${order.shippingCharges}</p>
        <p><strong>Applied Coupons:</strong> ${order.appliedCoupons.length > 0 ? order.appliedCoupons.join(', ') : 'None'}</p>
        <p><strong>Final Total:</strong> ₹${order.finalTotal}</p>

        <button class="track-order-btn" data-order-id="${order._id}">Track Order</button>
    </div>
`;

        // Toggle logic
        orderTile.querySelector(".order-summary").addEventListener("click", () => {
            const details = orderTile.querySelector(".order-details");
            details.style.display = details.style.display === "none" ? "block" : "none";
        });

        container.appendChild(orderTile);
    });

    currentDisplayIndex += chunkSize;

    if (currentDisplayIndex >= allOrders.length) {
        document.getElementById("load-previous-orders").style.display = "none";
    }

    attachTrackOrderListeners();
}

// Function to attach event listeners to Track Order buttons
function attachTrackOrderListeners() {
    const buttons = document.querySelectorAll(".track-order-btn");
    buttons.forEach(button => {
        button.addEventListener("click", (event) => {
            const orderId = event.target.getAttribute("data-order-id");
            trackOrder(orderId);
        });
    });
}

// Function to handle Track Order button click
function trackOrder(orderId) {
    console.log(`Tracking order with ID: ${orderId}`);
    alert(`Tracking details for Order ID: ${orderId} (Demo action)`);
}

// Event listener for the "Load More" button
document.getElementById("load-previous-orders").addEventListener("click", displayOrdersInChunks);

// Initial fetch on page load
document.addEventListener("DOMContentLoaded", fetchOrders);
