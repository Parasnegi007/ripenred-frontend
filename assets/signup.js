
// ✅ Security utilities
function sanitizeInput(input) {
    return input.toString().trim().replace(/[<>"'&]/g, '');
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

function validatePassword(password) {
    if (!password || password.length < 8) {
        return false;
    }
    
    // Check for at least one lowercase, one uppercase, and one number
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return hasLowercase && hasUppercase && hasNumber;
}

// Send signup success email
async function sendSignupSuccessEmail(userEmail, userName) {
    try {
        const emailData = {
            userEmail: userEmail,
            name: userName
        };

        const response = await fetch(`${getAPIURL()}/emails/signup-success`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        if (response.ok) {
            console.log('✅ Signup success email sent');
        } else {
            console.warn('⚠️ Failed to send signup success email');
        }
    } catch (error) {
        console.error('❌ Error sending signup success email:', error);
    }
}

// ✅ Rate limiting
const signupRateLimiter = {
    attempts: new Map(),
    maxAttempts: 3,
    lockoutDuration: 10 * 60 * 1000, // 10 minutes
    
    isBlocked(email) {
        const key = sanitizeInput(email);
        const attempt = this.attempts.get(key);
        if (!attempt) return false;
        const now = Date.now();
        if (now - attempt.lastAttempt > this.lockoutDuration) {
            this.attempts.delete(key);
            return false;
        }
        return attempt.count >= this.maxAttempts;
    },
    
    recordAttempt(email, success = false) {
        const key = sanitizeInput(email);
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
    
    getRemainingTime(email) {
        const key = sanitizeInput(email);
        const attempt = this.attempts.get(key);
        if (!attempt) return 0;
        const elapsed = Date.now() - attempt.lastAttempt;
        const remaining = this.lockoutDuration - elapsed;
        return Math.max(0, Math.ceil(remaining / 1000 / 60));
    }
};

document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signup-form");
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirm-password");
    const showPasswordToggle = document.getElementById("show-password");
    const sendOtpBtn = document.getElementById("send-otp");
    const otpSection = document.getElementById("otp-section");
    const otpInput = document.getElementById("otp");
    const verifyOtpBtn = document.getElementById("verify-otp");
    const signupBtn = document.getElementById("signup-btn");

    // ✅ Check if all required elements exist
    if (!signupForm || !nameInput || !emailInput || !phoneInput || !passwordInput || !confirmPasswordInput) {
        console.error('Required form elements not found');
        return;
    }

    let otpVerified = false;

    // Show/Hide Password Toggle
    if (showPasswordToggle) {
        showPasswordToggle.addEventListener("change", function () {
            passwordInput.type = this.checked ? "text" : "password";
            confirmPasswordInput.type = this.checked ? "text" : "password";
        });
    }

    // Password Strength Check
  if (passwordInput) {
    // Inject password requirements UI dynamically
    const reqList = document.createElement("ul");
    reqList.id = "password-requirements";
    reqList.style.listStyle = "none";
    reqList.style.paddingLeft = "0";
    reqList.innerHTML = `
        <li id="req-uppercase">✖ Must contain uppercase (A-Z)</li>
        <li id="req-lowercase">✖ Must contain lowercase (a-z)</li>
        <li id="req-number">✖ Must contain a number (0-9)</li>
        <li id="req-length">✖ Must be at least 6 characters</li>
    `;
    passwordInput.insertAdjacentElement("afterend", reqList);

    const reqUppercase = document.getElementById("req-uppercase");
    const reqLowercase = document.getElementById("req-lowercase");
    const reqNumber = document.getElementById("req-number");
    const reqLength = document.getElementById("req-length");

    passwordInput.addEventListener("input", function () {
        const value = passwordInput.value;

        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const isLongEnough = value.length >= 6;

        updateRequirement(reqUppercase, hasUpper);
        updateRequirement(reqLowercase, hasLower);
        updateRequirement(reqNumber, hasNumber);
        updateRequirement(reqLength, isLongEnough);

        // Evaluate strength
        const passed = [hasUpper, hasLower, hasNumber, isLongEnough].filter(Boolean).length;

        const strength =
            passed === 4 ? "Strong" :
            passed >= 2 ? "Medium" : "Weak";

        passwordInput.style.borderColor = strength === "Strong" ? "green" :
            strength === "Medium" ? "orange" : "red";
    });

    function updateRequirement(el, condition) {
        if (condition) {
            el.textContent = "✔ " + el.textContent.replace(/✔|✖/, "").trim();
            el.style.color = "green";
        } else {
            el.textContent = "✖ " + el.textContent.replace(/✔|✖/, "").trim();
            el.style.color = "red";
        }
    }
}

// Real-time Password Match Check
if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", function () {
        const message = document.getElementById("password-match-message");
        
        if (!message) {
            console.warn('Password match message element not found');
            return;
        }
        
        if (passwordInput.value === confirmPasswordInput.value) {
            message.textContent = "Passwords match!";
            message.style.color = "green";
            confirmPasswordInput.style.borderColor = "green";
        } else {
            message.textContent = "Passwords do not match.";
            message.style.color = "red";
            confirmPasswordInput.style.borderColor = "red";
        }
    });
}
// Set Send OTP button disabled initially
if (sendOtpBtn) {
    sendOtpBtn.disabled = true;
}

// Live Validation for Email & Phone
function validateInputs() {
    if (!emailInput || !phoneInput || !sendOtpBtn) {
        console.error('Required input elements not found');
        return;
    }

    const isEmailValid = validateEmail(emailInput.value);
    const isPhoneValid = validatePhone(phoneInput.value);

    emailInput.style.borderColor = isEmailValid ? "green" : "red";
    phoneInput.style.borderColor = isPhoneValid ? "green" : "red";

    // Enable Send OTP button only if both are valid
    sendOtpBtn.disabled = !(isEmailValid && isPhoneValid);
    sendOtpBtn.style.cursor = (isEmailValid && isPhoneValid) ? "pointer" : "not-allowed";
}

if (emailInput && phoneInput) {
    emailInput.addEventListener("input", validateInputs);
    phoneInput.addEventListener("input", validateInputs);
}

// OTP Generation & Verification
if (sendOtpBtn) {
    sendOtpBtn.addEventListener("click", async function () {
        const email = sanitizeInput(emailInput.value);

        if (!email) {
            showNotification("Please enter your email.", "warning");
            return;
        }

        if (!validateEmail(email)) {
            showNotification("Please enter a valid email address.", "warning");
            return;
        }

        if (signupRateLimiter.isBlocked(email)) {
            const remainingTime = signupRateLimiter.getRemainingTime(email);
            showNotification(`Too many OTP requests. Please try again in ${remainingTime} minutes.`, "warning");
            return;
        }

        // Disable button while OTP is sent
        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = "Sending...";

        try {
            const response = await fetch(`${getAPIURL()}/users/send-otp-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            showNotification(data.message, "success");

            if (otpSection) {
                otpSection.style.display = "block";
            }
            signupRateLimiter.recordAttempt(email, true);

        } catch (error) {
            console.error("Error sending OTP:", error);
            showNotification("Failed to send OTP. Please try again.", "error");
            signupRateLimiter.recordAttempt(email, false);
        }

        // Re-enable button after 10 seconds
        setTimeout(() => {
            validateInputs();
            sendOtpBtn.textContent = "Send OTP";
        }, 10000);
    });
}

// ✅ Enable Signup Button After OTP Verification
if (verifyOtpBtn) {
    verifyOtpBtn.addEventListener("click", async function () {
        const email = sanitizeInput(emailInput.value);
        const otp = sanitizeInput(otpInput?.value || '');

        if (!email || !otp) {
            showNotification("Please enter OTP.", "warning");
            return;
        }

        if (!validateEmail(email)) {
            showNotification("Please enter a valid email address.", "warning");
            return;
        }

        try {
            const response = await fetch(`${getAPIURL()}/users/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            showNotification("OTP Verified! You can now complete signup.", "success");
            otpVerified = true;
            if (signupBtn) {
                signupBtn.disabled = false;
            }
        } catch (error) {
            console.error("OTP Verification Error:", error);
            const errorMessage = error.message.includes('HTTP') ? 
                "Failed to verify OTP. Please try again." : 
                "Network error. Please check your connection.";
            showNotification(errorMessage, "error");
        }
    });
}

    // ✅ Prevent Form Refresh & Handle Signup
    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();
        registerUser();
    });

    async function registerUser() {
        if (!otpVerified) {
            showNotification("Please verify OTP before signing up.", "warning");
            return;
        }

        // ✅ Sanitize all inputs
        const name = sanitizeInput(nameInput.value);
        const email = sanitizeInput(emailInput.value);
        const phone = sanitizeInput(phoneInput.value);
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const otp = sanitizeInput(otpInput?.value || '');
    
        if (!name || !email || !phone || !password || !otp) {
            showNotification("All fields are required.", "warning");
            return;
        }

        // ✅ Enhanced validation
        if (!validateEmail(email)) {
            showNotification("Please enter a valid email address.", "warning");
            return;
        }

        if (!validatePhone(phone)) {
            showNotification("Please enter a valid 10-digit phone number.", "warning");
            return;
        }

        if (!validatePassword(password)) {
            showNotification("Password must be at least 8 characters with one uppercase, one lowercase, and one number.", "warning");
            return;
        }

        if (password !== confirmPassword) {
            showNotification("Passwords do not match.", "warning");
            return;
        }
    
        try {
            const response = await fetch(`${getAPIURL()}/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, password, otp })
            });
    
            const data = await response.json();
            
            if (response.ok) {
                showNotification("Signup successful! Redirecting to login...", "success");
                
                // Send signup success email
                await sendSignupSuccessEmail(email, name);
                
                // Clear form data before redirect
                signupForm.reset();
                otpVerified = false;
                if (signupBtn) {
                    signupBtn.disabled = true;
                }
                
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1000);
            } else {
                // ✅ Handle specific error cases
                if (response.status === 409 || (data.message && data.message.toLowerCase().includes('already'))) {
                    showNotification("User already registered with this email or phone number. Please use different credentials or login instead.", "warning");
                } else {
                    showNotification(data.message || "Registration failed. Please try again.", "error");
                }
            }
        } catch (error) {
            console.error("Signup error:", error);
            const errorMessage = error.message.includes('HTTP') ? 
                "Registration failed. Please try again." : 
                "Network error. Please check your connection.";
            showNotification(errorMessage, "error");
        }
    }
});
