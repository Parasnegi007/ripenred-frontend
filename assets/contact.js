document.addEventListener("DOMContentLoaded", async function () {
    // ✅ Sync cart count with other pages
    const cartCount = document.getElementById("cart-count");
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalQuantity;

    // ✅ FAQ Toggle Effect
 // Select all FAQ items
const faqItems = document.querySelectorAll('.faq-item');

// Add event listener to each FAQ question
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
        // Toggle the 'open' class for the clicked item
        item.classList.toggle('open');
    });
});
    // ✅ Auto-fill name & email for logged-in users
    const token = localStorage.getItem("authToken");
    if (token) {
        try {
            const response = await fetch("https://pureplucks.com/api/users/me", {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const user = await response.json();
                document.getElementById("name").value = user.name;
                document.getElementById("email").value = user.email;
                document.getElementById("name").readOnly = true;
                document.getElementById("email").readOnly = true;
            }
        } catch (error) {
            console.error("❌ Error fetching user data:", error);
        }
    }

    // ✅ Form Submission (Single Function)
    document.getElementById("contactForm").addEventListener("submit", async function (event) {
        event.preventDefault();
        
        const submitButton = document.getElementById("sendMessageButton"); // ✅ Target button
        submitButton.disabled = true; // ✅ Disable button immediately
        submitButton.textContent = "Sending..."; // ✅ Show "Sending..." text
    
        const formData = {
            name: document.getElementById("name").value,
            email: document.getElementById("email").value,
            message: document.getElementById("message").value,
        };

        const messageBox = document.getElementById("formMessage");

        try {
            const response = await fetch("https://pureplucks.com/api/users/contact", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }), 
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            
            if (response.ok) {
                alert("✅ Message sent successfully!"); // ✅ Success alert
                messageBox.textContent = "✅ Message sent successfully!";
                messageBox.style.color = "green";
                document.getElementById("contactForm").reset();
                
                // Refresh the page to auto-fetch updated fields
                window.location.reload();
            
            
            } else {
                alert(`❌ Error: ${data.message || "Message not sent."}`); // ❌ Error alert
                messageBox.textContent = "❌ Error sending message. Try again.";
                messageBox.style.color = "red";
            }
        } catch (error) {
            console.error("❌ Error:", error);
            alert("❌ Server error. Please try again later."); // ❌ Server error alert
            messageBox.textContent = "❌ Server error. Please try again later.";
            messageBox.style.color = "red";
        }

        // ✅ Keep button disabled for 1 minute (60,000ms)
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.textContent = "Send Message"; // ✅ Restore button text
        }, 1500);
    });
    
        // Query Form Submission
        document.getElementById("queryForm").addEventListener("submit", async function (event) {
            event.preventDefault();
        
            const submitButton = document.getElementById("sendQueryButton");
            submitButton.disabled = true;
            submitButton.textContent = "Sending...";
        
            const queryData = {
                query: document.getElementById("query").value,  // The question entered by the user
            };
        
            const messageBox = document.getElementById("queryMessage");
        
            try {
                const response = await fetch("https://pureplucks.com/api/users/send-query", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("authToken")}`, // ✅ Ensure token is passed here
                    },
                    body: JSON.stringify(queryData),
                });
                
                const data = await response.json();
        
                if (response.ok) {
                    alert("✅ Query sent successfully!");
                    messageBox.textContent = "✅ Query sent successfully!";
                    messageBox.style.color = "green";
                    document.getElementById("queryForm").reset();
                } else {
                    alert(`❌ Error: ${data.message || "Query not sent."}`);
                    messageBox.textContent = "❌ Error sending query. Try again.";
                    messageBox.style.color = "red";
                }
            } catch (error) {
                console.error("❌ Error:", error);
                alert("❌ Server error. Please try again later.");
                messageBox.textContent = "❌ Server error. Please try again later.";
                messageBox.style.color = "red";
            }
        
            // ✅ Keep button disabled for 1 minute (60,000ms)
            setTimeout(() => {
                submitButton.disabled = false;
                submitButton.textContent = "Send Query";
            }, 1500);
        });
    });        