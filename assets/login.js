window.addEventListener("DOMContentLoaded", function () {
    document.getElementById("login-identifier").removeAttribute("disabled");
    document.getElementById("login-password").removeAttribute("disabled");
});

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const loginIdentifier = document.getElementById("login-identifier");
    const loginPassword = document.getElementById("login-password");
    const togglePassword = document.getElementById("toggle-password");
    const rememberMe = document.getElementById("remember-me");
    const forgotPassword = document.getElementById("forgot-password");

    let userIdentifier = "";
    let isOtpVerified = false; // ✅ Track OTP verification separately

    // Show/Hide Password Toggle
    togglePassword.addEventListener("click", function () {
        loginPassword.type = loginPassword.type === "password" ? "text" : "password";
        togglePassword.classList.toggle("fa-eye");
        togglePassword.classList.toggle("fa-eye-slash");
    });

    // Auto-fill Remember Me
    if (localStorage.getItem("rememberedUser")) {
        loginIdentifier.value = localStorage.getItem("rememberedUser");
        rememberMe.checked = true;
    }

    // ✅ Login User (Connect to Backend)
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const identifier = loginIdentifier.value.trim();
        const password = loginPassword.value.trim();

        if (!identifier || !password) {
            alert("Email/Phone and Password are required!");
            return;
        }

        try {
            const response = await fetch("https://pureplucks.com/api/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: identifier, phone: identifier, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Login successful! Redirecting to dashboard...");
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 500);
                localStorage.setItem("authToken", data.token);
                localStorage.setItem("loggedInUser", JSON.stringify(data.user));

                if (rememberMe.checked) {
                    localStorage.setItem("rememberedUser", identifier);
                } else {
                    localStorage.removeItem("rememberedUser");
                }
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Login failed. Please try again.");
        }
    });

    // ✅ Forgot Password Section
    const forgotPasswordSection = document.createElement("div");
    forgotPasswordSection.id = "forgot-password-section";
    forgotPasswordSection.style.display = "none";
    forgotPasswordSection.innerHTML = `
        <label for="forgot-email">Enter Your Email</label>
        <input type="text" id="forgot-email" placeholder="Enter registered email">
        <button id="send-otp-btn">Send OTP</button>
        <div id="otp-box" style="display:none;">
            <label for="otp-input">Enter OTP</label>
            <input type="text" id="otp-input" placeholder="Enter OTP">
            <button id="verify-otp-btn">Verify OTP</button>
        </div>
        <div id="reset-password-box" style="display:none;">
            <label for="new-password">New Password</label>
            <input type="password" id="new-password" placeholder="Enter new password">
            <button id="reset-password-btn" disabled>Reset Password</button> <!-- ✅ Initially Disabled -->
        </div>
    `;
    document.body.appendChild(forgotPasswordSection);


    // ✅ Show Forgot Password Section When Clicked
    forgotPassword.addEventListener("click", function (e) {
        e.preventDefault();
        forgotPasswordSection.style.display = "block";
    });

    // ✅ Send OTP
    document.getElementById("send-otp-btn").addEventListener("click", async function () {
        userIdentifier = document.getElementById("forgot-email").value.trim();

        if (!userIdentifier) {
            alert("Please enter your registered email.");
            return;
        }

        const sendOtpBtn = document.getElementById("send-otp-btn");
        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = "Sending...";

        try {
            const response = await fetch("https://pureplucks.com/api/users/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userIdentifier })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); // ✅ Keep only one alert
                document.getElementById("forgot-email").disabled = true;
                sendOtpBtn.style.display = "none";
                document.getElementById("otp-box").style.display = "block";
            }
        } catch (error) {
            console.error("Forgot Password Error:", error);
            alert("Failed to send OTP. Please try again.");
        }

        // ✅ Re-enable button after 30 seconds
        setTimeout(() => {
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = "Send OTP";
        }, 30000);
    });


    // ✅ Verify OTP
    document.getElementById("verify-otp-btn").addEventListener("click", async function () {
        const otpValue = document.getElementById("otp-input").value.trim();

        if (!otpValue) {
            alert("Please enter the OTP.");
            return;
        }

        try {
            const response = await fetch("https://pureplucks.com/api/users/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userIdentifier, otp: otpValue })
            });

            const data = await response.json();

            if (response.ok) {
                alert("OTP Verified! You can now reset your password.");
                document.getElementById("otp-box").style.display = "none";
                document.getElementById("reset-password-box").style.display = "block";
                document.getElementById("reset-password-btn").disabled = false;
                isOtpVerified = true; // ✅ OTP successfully verified
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("OTP Verification Error:", error);
            alert("Failed to verify OTP. Please try again.");
        }
    });


    // ✅ Reset Password (Only After OTP Verification)
    document.getElementById("reset-password-btn").addEventListener("click", async function () {
        if (!isOtpVerified) {
            alert("Please verify the OTP first.");
            return;
        }

        const newPassword = document.getElementById("new-password").value.trim();
        const otpValue = document.getElementById("otp-input").value.trim();

        if (!otpValue) {
            alert("Please enter the OTP.");
            return;
        }

        if (newPassword.length < 6) {
            alert("Password should be at least 6 characters long.");
            return;
        }

        try {
            const response = await fetch("https://pureplucks.com/api/users/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userIdentifier, otp: otpValue, newPassword })
            });

            const data = await response.json();
            if (response.ok) {
                alert("Password reset successful! You can now log in.");
                document.getElementById("reset-password-box").style.display = "none";
                isOtpVerified = false; // ✅ Reset OTP verification flag
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Reset Password Error:", error);
            alert("Failed to reset password. Please try again.");
        }
    });
});
async function syncGuestData() {
    const token = localStorage.getItem("authToken");

    if (!token) return;

    // Sync Guest Cart
    const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
    if (guestCart.length > 0) {
        for (const item of guestCart) {
            await fetch("https://pureplucks.com/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(item)
            });
        }
        localStorage.removeItem("guestCart");
    }

    // Sync Guest Wishlist
    const guestWishlist = JSON.parse(localStorage.getItem("guestWishlist")) || [];
    if (guestWishlist.length > 0) {
        for (const productId of guestWishlist) {
            await fetch("https://pureplucks.com/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ productId })
            });
        }
        localStorage.removeItem("guestWishlist");
    }
}

async function loginUser() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("https://pureplucks.com/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem("authToken", data.token);
            await syncGuestData();
            window.location.href = "dashboard.html";
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Login error:", error);
    }
}
