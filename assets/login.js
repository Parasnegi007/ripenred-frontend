// ✅ Security utilities
function sanitizeInput(input) {
    return input.trim().replace(/[<>"'&]/g, '');
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

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
}

// ✅ Rate limiting
const rateLimiter = {
    attempts: new Map(),
    maxAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    
    isBlocked(identifier) {
        const key = sanitizeInput(identifier);
        const attempt = this.attempts.get(key);
        
        if (!attempt) return false;
        
        const now = Date.now();
        if (now - attempt.lastAttempt > this.lockoutDuration) {
            this.attempts.delete(key);
            return false;
        }
        
        return attempt.count >= this.maxAttempts;
    },
    
    recordAttempt(identifier, success = false) {
        const key = sanitizeInput(identifier);
        const now = Date.now();
        
        if (success) {
            this.attempts.delete(key);
            return;
        }
        
        const existing = this.attempts.get(key) || { count: 0, lastAttempt: 0 };
        
        if (now - existing.lastAttempt > this.lockoutDuration) {
            existing.count = 0;
        }
        
        existing.count++;
        existing.lastAttempt = now;
        this.attempts.set(key, existing);
    },
    
    getRemainingTime(identifier) {
        const key = sanitizeInput(identifier);
        const attempt = this.attempts.get(key);
        
        if (!attempt) return 0;
        
        const elapsed = Date.now() - attempt.lastAttempt;
        const remaining = this.lockoutDuration - elapsed;
        
        return Math.max(0, Math.ceil(remaining / 1000 / 60));
    }
};

// ✅ Session fix
function clearAllSession() {
    ['authToken', 'sessionData', 'loggedInUser', 'userId', 'rememberedUser'].forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
    });
}

// ✅ Global logout
window.logout = function() {
    clearAllSession();
    rateLimiter.attempts.clear();
    window.location.href = 'login.html';
};

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
    let isOtpVerified = false;

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

    // ✅ Login User (with security)
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const identifier = sanitizeInput(loginIdentifier.value);
        const password = loginPassword.value.trim();

        if (!identifier || !password) {
            showNotification("Email/Phone and Password are required!", "warning");
            return;
        }

        // ✅ Rate limiting check
        if (rateLimiter.isBlocked(identifier)) {
            const remainingTime = rateLimiter.getRemainingTime(identifier);
            showNotification(`Too many login attempts. Try again in ${remainingTime} minutes.`, "warning");
            return;
        }

try {

            const response = await fetch(`${getAPIURL()}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: identifier, phone: identifier, password })
            });

            const data = await response.json();

            if (response.ok) {
                // ✅ Success - clear rate limiting
                rateLimiter.recordAttempt(identifier, true);
                
                showNotification("Login successful! Redirecting to dashboard...", "success");
                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 500);
                localStorage.setItem("authToken", data.token);
                localStorage.setItem("loggedInUser", JSON.stringify(data.user));
                localStorage.setItem("sessionData", JSON.stringify({
                    token: data.token,
                    user: data.user,
                    timestamp: Date.now()
                }));

                if (rememberMe.checked) {
                    localStorage.setItem("rememberedUser", identifier);
                } else {
                    localStorage.removeItem("rememberedUser");
                }
            } else {
                // ✅ Failed - record attempt
                rateLimiter.recordAttempt(identifier, false);
                showNotification(data.message, "error");
            }
        } catch (error) {
            console.error("Login Error:", error);
            rateLimiter.recordAttempt(identifier, false);
            showNotification("Login failed. Please try again.", "error");
        }
    });

    // ✅ Forgot Password Section (ORIGINAL DESIGN PRESERVED)
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
            <button id="reset-password-btn" disabled>Reset Password</button>
        </div>
    `;
    document.body.appendChild(forgotPasswordSection);

    // ✅ Show Forgot Password Section When Clicked
    forgotPassword.addEventListener("click", function (e) {
        e.preventDefault();
        forgotPasswordSection.style.display = "block";
    });

    // ✅ Send OTP (with security)
    document.getElementById("send-otp-btn").addEventListener("click", async function () {
        userIdentifier = sanitizeInput(document.getElementById("forgot-email").value);

        if (!userIdentifier) {
            showNotification("Please enter your registered email.", "warning");
            return;
        }

        const sendOtpBtn = document.getElementById("send-otp-btn");
        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = "Sending...";

        try {
            const response = await fetch(`${getAPIURL()}/users/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userIdentifier })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification(data.message, "success");
                document.getElementById("forgot-email").disabled = true;
                sendOtpBtn.style.display = "none";
                document.getElementById("otp-box").style.display = "block";
            }
        } catch (error) {
            console.error("Forgot Password Error:", error);
            showNotification("Failed to send OTP. Please try again.", "error");
        }

        // ✅ Re-enable button after 30 seconds
        setTimeout(() => {
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = "Send OTP";
        }, 30000);
    });

    // ✅ Verify OTP (with security)
    document.getElementById("verify-otp-btn").addEventListener("click", async function () {
        const otpValue = sanitizeInput(document.getElementById("otp-input").value);

        if (!otpValue) {
            showNotification("Please enter the OTP.", "warning");
            return;
        }

        try {
            const response = await fetch(`${getAPIURL()}/users/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userIdentifier, otp: otpValue })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification("OTP Verified! You can now reset your password.", "success");
                document.getElementById("otp-box").style.display = "none";
                document.getElementById("reset-password-box").style.display = "block";
                document.getElementById("reset-password-btn").disabled = false;
                isOtpVerified = true;
            } else {
                showNotification(data.message, "error");
            }
        } catch (error) {
            console.error("OTP Verification Error:", error);
            showNotification("Failed to verify OTP. Please try again.", "error");
        }
    });

    // ✅ Reset Password (with security)
    document.getElementById("reset-password-btn").addEventListener("click", async function () {
        if (!isOtpVerified) {
            showNotification("Please verify the OTP first.", "warning");
            return;
        }

        const newPassword = document.getElementById("new-password").value.trim();
        const otpValue = sanitizeInput(document.getElementById("otp-input").value);

        if (!otpValue) {
            showNotification("Please enter the OTP.", "warning");
            return;
        }

        if (newPassword.length < 6) {
            showNotification("Password should be at least 6 characters long.", "warning");
            return;
        }

        try {
            const response = await fetch(`${getAPIURL()}/users/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userIdentifier, otp: otpValue, newPassword })
            });

            const data = await response.json();
            if (response.ok) {
                showNotification("Password reset successful! You can now log in.", "success");
                document.getElementById("reset-password-box").style.display = "none";
                isOtpVerified = false;
            } else {
                showNotification(data.message, "error");
            }
        } catch (error) {
            console.error("Reset Password Error:", error);
            showNotification("Failed to reset password. Please try again.", "error");
        }
    });
});

// ✅ Original sync functions (with security)
async function syncGuestData() {
    const token = localStorage.getItem("authToken");

    if (!token) return;

    try {
        // Sync Guest Cart
        const guestCart = JSON.parse(localStorage.getItem("guestCart")) || [];
        if (guestCart.length > 0) {
            for (const item of guestCart) {
                await fetch(`${getAPIURL()}/cart`, {
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
                await fetch(`${getAPIURL()}/wishlist`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ productId })
                });
            }
            localStorage.removeItem("guestWishlist");
        }
    } catch (error) {
        console.error("Error syncing guest data:", error);
    }
}

// ✅ Original loginUser function (with security)
async function loginUser() {
    const email = sanitizeInput(document.getElementById("email").value);
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${getAPIURL()}/users/login`, {
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
            showNotification(data.message, "error");
        }
    } catch (error) {
        console.error("Login error:", error);
    }
}
