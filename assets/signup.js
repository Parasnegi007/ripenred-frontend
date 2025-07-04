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

    let otpVerified = false; // ✅ Define OTP verification status

    // Show/Hide Password Toggle
    showPasswordToggle.addEventListener("change", function () {
        passwordInput.type = this.checked ? "text" : "password";
        confirmPasswordInput.type = this.checked ? "text" : "password";
    });

    // Password Strength Check
    passwordInput.addEventListener("input", function () {
        const value = passwordInput.value;
        let strength = "Weak";

        if (value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value) && /[^a-zA-Z0-9]/.test(value)) {
            strength = "Strong";
        } else if (value.length >= 6) {
            strength = "Medium";
        }

        passwordInput.style.borderColor = strength === "Strong" ? "green" : strength === "Medium" ? "orange" : "red";
    });
// Real-time Password Match Check
confirmPasswordInput.addEventListener("input", function () {
    const message = document.getElementById("password-match-message");
    
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
// Set Send OTP button disabled initially
sendOtpBtn.disabled = true;

// Live Validation for Email & Phone
function validateInputs() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[0-9]{10}$/;

    const isEmailValid = emailPattern.test(emailInput.value);
    const isPhoneValid = phonePattern.test(phoneInput.value);

    emailInput.style.borderColor = isEmailValid ? "green" : "red";
    phoneInput.style.borderColor = isPhoneValid ? "green" : "red";

    // Enable Send OTP button only if both are valid
    sendOtpBtn.disabled = !(isEmailValid && isPhoneValid);
    sendOtpBtn.style.cursor = (isEmailValid && isPhoneValid) ? "pointer" : "not-allowed"; // ✅ cursor update
}

emailInput.addEventListener("input", validateInputs);
phoneInput.addEventListener("input", validateInputs);

// OTP Generation & Verification
sendOtpBtn.addEventListener("click", async function () {
    const email = emailInput.value.trim();

    if (!email) {
        alert("Please enter your email.");
        return;
    }

    // ✅ Disable button & Change text while OTP is being sent
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = "Sending...";

    try {
        const response = await fetch("https://pureplucks.com/api/users/send-otp-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        alert(data.message);

        if (response.ok) {
            otpSection.style.display = "block"; 
        }

    } catch (error) {
        console.error("Error sending OTP:", error);
        alert("Failed to send OTP. Please try again.");
    }

    // ✅ Re-enable button after 10 seconds
    setTimeout(() => {
        validateInputs(); // Re-validate inputs when timer ends
        sendOtpBtn.textContent = "Send OTP";
    }, 10000);
});

// ✅ Enable Signup Button After OTP Verification
verifyOtpBtn.addEventListener("click", async function () {
    const email = emailInput.value;
    const otp = otpInput.value;

    if (!email || !otp) {
        alert("Please enter OTP.");
        return;
    }

    try {
        const response = await fetch("https://pureplucks.com/api/users/verify-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();

        if (response.ok) {
            alert("OTP Verified! You can now complete signup.");
            otpVerified = true; // ✅ Allow signup
            signupBtn.disabled = false; // ✅ Enable signup button
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("OTP Verification Error:", error);
        alert("Failed to verify OTP. Please try again.");
    }


        // ✅ Re-enable button after 30 seconds
        setTimeout(() => {
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = "Send OTP";
        }, 10000); // 30 seconds delay
    });
    

    // ✅ Fix: Enable Signup Button After OTP Verification
    verifyOtpBtn.addEventListener("click", async function () {
        const email = emailInput.value;
        const otp = otpInput.value;
    
        if (!email || !otp) {
            alert("Please enter OTP.");
            return;
        }
    
        try {
            const response = await fetch("https://pureplucks.com/api/users/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp })
            });
    
            const data = await response.json();
    
            if (response.ok) {
                alert("OTP Verified! You can now complete signup.");
                otpVerified = true; // ✅ Allow signup
                signupBtn.disabled = false; // ✅ Enable signup button
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("OTP Verification Error:", error);
            alert("Failed to verify OTP. Please try again.");
        }
    });

    // ✅ Prevent Form Refresh & Handle Signup
    signupForm.addEventListener("submit", function (event) {
        event.preventDefault(); // ✅ Prevent page refresh
        registerUser();
    });

    async function registerUser() {
        if (!otpVerified) {
            alert("Please verify OTP before signing up.");
            return;
        }

        const name = nameInput.value;
        const email = emailInput.value;
        const phone = phoneInput.value;
        const password = passwordInput.value;
        const otp = otpInput.value;
    
        if (!name || !email || !phone || !password || !otp) {
            alert("All fields are required.");
            return;
        }
    
        try {
            const response = await fetch("https://pureplucks.com/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, password, otp })
            });
    
            const data = await response.json();
    
            if (response.ok) {
                alert("Signup successful! Redirecting to login...");
                window.location.href = "login.html"; // ✅ Redirect to login page
            } else {
                alert(data.message); // Show error message
            }
        } catch (error) {
            console.error("Signup error:", error);
            alert("Signup failed. Please try again.");
        }
    }
});