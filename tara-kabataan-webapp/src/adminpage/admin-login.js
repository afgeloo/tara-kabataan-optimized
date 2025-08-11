import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/admin-login.css";
import logo from "../assets/header/tarakabataanlogo2.png";
import { FaTimes } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
const AdminLogin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [resetMessage, setResetMessage] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
    const otpRefs = Array(6)
        .fill(null)
        .map(() => React.createRef());
    const [otpError, setOtpError] = useState("");
    const [resetOtpError, setResetOtpError] = useState("");
    const [resetStep, setResetStep] = useState("method");
    const [resetContact, setResetContact] = useState("");
    const [resetOtp, setResetOtp] = useState(Array(6).fill(""));
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [otpAttempts, setOtpAttempts] = useState(0);
    const [isOtpLocked, setIsOtpLocked] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [resetOtpAttempts, setResetOtpAttempts] = useState(0);
    const [resetOtpLocked, setResetOtpLocked] = useState(false);
    const [resetOtpLockRemaining, setResetOtpLockRemaining] = useState(0);
    const [lockRemaining, setLockRemaining] = useState(0);
    const [isPhoneLogin, setIsPhoneLogin] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [phoneOtpSent, setPhoneOtpSent] = useState(false);
    const [phoneOtp, setPhoneOtp] = useState(Array(6).fill(""));
    const [phoneOtpError, setPhoneOtpError] = useState("");
    const phoneOtpRefs = Array(6)
        .fill(null)
        .map(() => React.createRef());
    const [phoneOtpAttempts, setPhoneOtpAttempts] = useState(0);
    const [isPhoneOtpLocked, setIsPhoneOtpLocked] = useState(false);
    React.useEffect(() => {
        if (isLocked && lockRemaining > 0) {
            const timer = setInterval(() => {
                setLockRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setIsLocked(false);
                        setLoginAttempts(0);
                        setError("");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isLocked, lockRemaining]);
    const closeResetModal = () => {
        setShowResetModal(false);
        setResetStep("method");
        setResetContact("");
        setResetOtp(Array(6).fill(""));
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
        setOtpError("");
        setResetMessage("");
    };
    const navigate = useNavigate();
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        if (isLocked) {
            setError(`Too many failed attempts. Try again in ${lockRemaining}s.`);
            return;
        }
        const simulateOTP = false;
        try {
            const loginPayload = isPhoneLogin
                ? { phone: phoneNumber, password }
                : { email, password };
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/adminlogin.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loginPayload),
            });
            const data = await res.json();
            if (data.success) {
                setLoginAttempts(0);
                localStorage.setItem("admin-user-temp", JSON.stringify(data.user));
                if (simulateOTP) {
                    if (isPhoneLogin) {
                        setPhoneOtpSent(true);
                    }
                    else {
                        setOtpSent(true);
                    }
                }
                else {
                    if (isPhoneLogin) {
                        setPhoneOtpSent(true);
                        const toastId = toast.loading("Sending OTP to phone...");
                        const otpRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/send_phone_otp.php`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ phone: phoneNumber }),
                        });
                        const otpData = await otpRes.json();
                        if (otpData.success) {
                            toast.update(toastId, {
                                render: "OTP sent to your phone number.",
                                type: "success",
                                isLoading: false,
                                autoClose: 3000,
                            });
                        }
                        else {
                            toast.update(toastId, {
                                render: otpData?.message || "Phone OTP sending failed.",
                                type: "error",
                                isLoading: false,
                                autoClose: 3000,
                            });
                            setError("Phone OTP sending failed.");
                        }
                    }
                    else {
                        setOtpSent(true);
                        const toastId = toast.loading("Sending OTP...");
                        const otpRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/send_otp.php`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email }),
                        });
                        const otpData = await otpRes.json();
                        if (otpData.success) {
                            toast.update(toastId, {
                                render: (_jsxs("div", { children: [_jsx("strong", { children: "OTP sent to your email." }), _jsx("div", { style: { fontSize: "0.8rem", marginTop: "4px" }, children: "Please check in your spam inbox if not found." })] })),
                                type: "success",
                                isLoading: false,
                                autoClose: 3000,
                            });
                        }
                        else {
                            toast.update(toastId, {
                                render: otpData?.phpmailer_error ||
                                    otpData?.exception ||
                                    otpData?.message ||
                                    "OTP sending failed.",
                                type: "error",
                                isLoading: false,
                                autoClose: 3000,
                            });
                            setError("OTP sending failed.");
                        }
                    }
                }
            }
            else if (data.exists) {
                setLoginAttempts((prev) => {
                    const updated = prev + 1;
                    if (updated >= 3) {
                        setIsLocked(true);
                        setLockRemaining(30);
                        toast.error("Too many failed attempts. Try again in 30 seconds.");
                        return updated;
                    }
                    setError(data.message || "Login failed.");
                    return updated;
                });
            }
            else {
                setError(data.message ||
                    (isPhoneLogin ? "Phone number not found." : "Email does not exist."));
            }
        }
        catch (err) {
            console.error("Login error:", err);
            setError("Server error. Please try again.");
        }
    };
    const handlePasswordReset = async () => {
        if (!resetContact || !newPassword || !confirmPassword) {
            setPasswordError("All fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters.");
            return;
        }
        const strongPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).+$/;
        if (!strongPattern.test(newPassword)) {
            setPasswordError("Password must include letters, numbers, and symbols.");
            return;
        }
        const emailParts = resetContact.split(/[@._\-]/).filter(Boolean);
        const passwordLower = newPassword.toLowerCase();
        for (const part of emailParts) {
            if (part && passwordLower.includes(part.toLowerCase())) {
                setPasswordError("Password should not include parts of your email.");
                return;
            }
        }
        const prevRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/check_previous_password.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: resetContact,
                new_password: newPassword,
            }),
        });
        const prevData = await prevRes.json();
        if (prevData.same === true) {
            setPasswordError("New password must be different from the previous password.");
            return;
        }
        setPasswordError("");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/resetadminpass.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: resetContact,
                    new_password: newPassword,
                }),
            });
            const data = await res.json();
            setResetMessage(data.message);
            if (data.success) {
                setTimeout(() => closeResetModal(), 2000);
            }
        }
        catch {
            setResetMessage("Server error.");
        }
    };
    return (_jsxs("div", { className: "admin-login-container", children: [_jsxs("div", { className: "admin-login-box", children: [_jsx("div", { className: "admin-logo-wrapper", children: _jsx("img", { src: logo, alt: "Tara Kabataan", className: "admin-login-logo" }) }), _jsxs("form", { onSubmit: handleLogin, children: [isPhoneLogin ? (_jsxs(_Fragment, { children: [_jsx("label", { htmlFor: "phone", children: "Enter Phone Number:" }), _jsx("input", { id: "phone", type: "tel", placeholder: "09XXXXXXXXX", value: phoneNumber, onChange: (e) => setPhoneNumber(e.target.value), required: isPhoneLogin }), _jsx("label", { htmlFor: "phone-password", children: "Enter Password:" }), _jsx("div", { className: "password-input-wrapper", children: _jsx("input", { id: "phone-password", type: showPassword ? "text" : "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), required: isPhoneLogin }) })] })) : (_jsxs(_Fragment, { children: [_jsx("label", { htmlFor: "email", children: "Enter Email:" }), _jsx("input", { id: "email", type: "email", placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value), required: !isPhoneLogin }), _jsx("label", { htmlFor: "password", children: "Enter Password:" }), _jsx("div", { className: "password-input-wrapper", children: _jsx("input", { id: "password", type: showPassword ? "text" : "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), required: isPhoneLogin ? phoneNumber !== "" : email !== "" }) })] })), error && _jsx("div", { className: "admin-login-error", children: error }), isLocked && (_jsxs("div", { className: "admin-login-error", children: ["Locked out. Please wait ", lockRemaining, " second", lockRemaining !== 1 && "s", "."] })), _jsx("button", { type: "submit", className: "admin-login-button", children: "Log-in" }), _jsxs("div", { className: "forgot-password-wrapper", children: [_jsx("div", { className: "forgot-password", children: _jsx("a", { href: "#", onClick: () => setShowResetModal(true), children: "Forgot Password?" }) }), _jsx("div", { className: "forgot-password", children: _jsx("a", { href: "#", onClick: (e) => {
                                                e.preventDefault();
                                                setIsPhoneLogin(!isPhoneLogin);
                                                setEmail("");
                                                setPassword("");
                                                setPhoneNumber("");
                                                setError("");
                                                setOtpSent(false);
                                                setPhoneOtpSent(false);
                                            } }) })] })] }), otpSent && (_jsxs("div", { className: "otp-box-wrapper", children: [_jsx("label", { children: "Enter 6-digit OTP:" }), _jsx("div", { className: "otp-inputs", children: otpDigits.map((digit, index) => (_jsx("input", { ref: otpRefs[index], type: "text", maxLength: 1, className: "otp-box", value: digit, onChange: (e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        if (!val)
                                            return;
                                        const updated = [...otpDigits];
                                        updated[index] = val[0];
                                        setOtpDigits(updated);
                                        setOtpError("");
                                        if (index < 5 && val) {
                                            otpRefs[index + 1].current?.focus();
                                        }
                                    }, onKeyDown: (e) => {
                                        if (e.key === "Backspace") {
                                            const updated = [...otpDigits];
                                            if (otpDigits[index]) {
                                                updated[index] = "";
                                                setOtpDigits(updated);
                                            }
                                            else if (index > 0) {
                                                otpRefs[index - 1].current?.focus();
                                            }
                                        }
                                    } }, index))) }), phoneOtpSent && isPhoneLogin && (_jsxs("div", { className: "otp-box-wrapper", children: [_jsx("label", { children: "Enter 6-digit Phone OTP:" }), _jsx("div", { className: "otp-inputs", children: phoneOtp.map((digit, index) => (_jsx("input", { ref: phoneOtpRefs[index], type: "text", maxLength: 1, className: "otp-box", value: digit, onChange: (e) => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                if (!val)
                                                    return;
                                                const updated = [...phoneOtp];
                                                updated[index] = val[0];
                                                setPhoneOtp(updated);
                                                setPhoneOtpError("");
                                                if (index < 5 && val) {
                                                    phoneOtpRefs[index + 1].current?.focus();
                                                }
                                            }, onKeyDown: (e) => {
                                                if (e.key === "Backspace") {
                                                    const updated = [...phoneOtp];
                                                    if (phoneOtp[index]) {
                                                        updated[index] = "";
                                                        setPhoneOtp(updated);
                                                    }
                                                    else if (index > 0) {
                                                        phoneOtpRefs[index - 1].current?.focus();
                                                    }
                                                }
                                            } }, index))) }), phoneOtpError && (_jsx("div", { className: "admin-login-error", children: phoneOtpError })), _jsx("button", { className: "admin-login-button", onClick: async () => {
                                            if (isPhoneOtpLocked) {
                                                setPhoneOtpError("Too many OTP attempts. Please request a new one.");
                                                return;
                                            }
                                            const otp = phoneOtp.join("");
                                            try {
                                                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/verify_phone_otp.php`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ phone: phoneNumber, otp }),
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    localStorage.setItem("admin-auth", "true");
                                                    localStorage.setItem("admin-user", JSON.stringify(data.user));
                                                    localStorage.removeItem("admin-user-temp");
                                                    navigate("/admin", { replace: true });
                                                }
                                                else {
                                                    const updatedAttempts = phoneOtpAttempts + 1;
                                                    setPhoneOtpAttempts(updatedAttempts);
                                                    if (updatedAttempts >= 3) {
                                                        setIsPhoneOtpLocked(true);
                                                        setPhoneOtpError("Too many attempts. Try again later.");
                                                    }
                                                    else {
                                                        setPhoneOtpError(data.message || "Invalid OTP.");
                                                    }
                                                }
                                            }
                                            catch {
                                                setPhoneOtpError("OTP verification failed.");
                                            }
                                        }, children: "Verify OTP" })] })), _jsx("button", { className: "admin-login-button", onClick: async () => {
                                    if (isOtpLocked) {
                                        setOtpError("Too many OTP attempts. Please request a new OTP.");
                                        return;
                                    }
                                    const otp = otpDigits.join("");
                                    const simulateOTP = false;
                                    if (simulateOTP) {
                                        if (otp.length === 6) {
                                            const user = localStorage.getItem("admin-user-temp");
                                            if (user) {
                                                localStorage.setItem("admin-auth", "true");
                                                localStorage.setItem("admin-user", user);
                                                localStorage.removeItem("admin-user-temp");
                                                navigate("/admin", { replace: true });
                                            }
                                            else {
                                                setError("Session expired. Please login again.");
                                            }
                                        }
                                        else {
                                            setError("Enter a 6-digit OTP.");
                                        }
                                    }
                                    else {
                                        try {
                                            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/verify_otp.php`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ email, otp, password }),
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                localStorage.setItem("admin-auth", "true");
                                                localStorage.setItem("admin-user", JSON.stringify(data.user));
                                                localStorage.removeItem("admin-user-temp");
                                                navigate("/admin", { replace: true });
                                            }
                                            else {
                                                const updatedAttempts = otpAttempts + 1;
                                                setOtpAttempts(updatedAttempts);
                                                if (updatedAttempts >= 3) {
                                                    setIsOtpLocked(true);
                                                    setOtpError("Too many OTP attempts. Please request a new OTP.");
                                                }
                                                else {
                                                    setOtpError(data.message || "Invalid OTP.");
                                                }
                                            }
                                        }
                                        catch {
                                            setOtpError("OTP verification failed.");
                                        }
                                    }
                                }, children: "Verify OTP" }), otpError && _jsx("div", { className: "admin-login-error", children: otpError })] }))] }), showResetModal && (_jsx("div", { className: "reset-password-modal", children: _jsxs("div", { className: "reset-password-box", children: [resetStep === "method" && (_jsxs(_Fragment, { children: [_jsx("div", { className: "modal-close-icon", onClick: closeResetModal, children: _jsx(FaTimes, {}) }), _jsx("h3", { children: "Reset Password" }), _jsx("div", { className: "admin-reset-button", children: _jsx("button", { className: "admin-login-button", onClick: () => setResetStep("email"), children: "Reset via Email" }) })] })), resetStep === "email" && (_jsxs(_Fragment, { children: [_jsx("div", { className: "modal-close-icon", onClick: closeResetModal, children: _jsx(FaTimes, {}) }), _jsx("h3", { children: "Enter Your Email" }), _jsx("input", { type: "email", placeholder: "Your email", value: resetContact, onChange: (e) => setResetContact(e.target.value) }), _jsxs("div", { className: "modal-buttons", children: [_jsx("button", { onClick: async () => {
                                                const toastId = toast.loading("Sending OTP...");
                                                try {
                                                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/send_otp.php`, {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ email: resetContact }),
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) {
                                                        setResetOtpLocked(false);
                                                        setResetOtpAttempts(0);
                                                        setResetStep("otp");
                                                        setResetOtp(Array(6).fill(""));
                                                        setTimeout(() => {
                                                            otpRefs[0].current?.focus();
                                                        }, 0);
                                                        toast.update(toastId, {
                                                            render: (_jsxs("div", { children: [_jsx("strong", { children: "OTP sent to your email." }), _jsx("div", { style: {
                                                                            fontSize: "0.8rem",
                                                                            marginTop: "4px",
                                                                        }, children: "Please check in your spam inbox if not found." })] })),
                                                            type: "success",
                                                            isLoading: false,
                                                            autoClose: 3000,
                                                        });
                                                    }
                                                    else {
                                                        toast.update(toastId, {
                                                            render: data.message || "OTP sending failed.",
                                                            type: "error",
                                                            isLoading: false,
                                                            autoClose: 3000,
                                                        });
                                                    }
                                                }
                                                catch {
                                                    toast.update(toastId, {
                                                        render: "Server error while sending OTP.",
                                                        type: "error",
                                                        isLoading: false,
                                                        autoClose: 3000,
                                                    });
                                                }
                                            }, children: "Send OTP" }), _jsx("button", { onClick: closeResetModal, children: "Cancel" })] })] })), resetStep === "otp" && (_jsxs(_Fragment, { children: [_jsx("div", { className: "modal-close-icon", onClick: closeResetModal, children: _jsx(FaTimes, {}) }), _jsx("h3", { children: "Verify OTP" }), _jsxs("div", { className: "otp-box-wrapper", children: [_jsx("label", { children: "Enter 6-digit OTP:" }), _jsx("div", { className: "otp-inputs", children: resetOtp.map((digit, index) => (_jsx("input", { ref: otpRefs[index], maxLength: 1, className: "otp-box", value: digit, onChange: (e) => {
                                                    const val = e.target.value.replace(/\D/g, "");
                                                    if (!val)
                                                        return;
                                                    const updated = [...resetOtp];
                                                    updated[index] = val[0];
                                                    setResetOtp(updated);
                                                    setResetOtpError("");
                                                    if (index < 5)
                                                        otpRefs[index + 1].current?.focus();
                                                }, onKeyDown: (e) => {
                                                    if (e.key === "Backspace") {
                                                        const updated = [...resetOtp];
                                                        if (resetOtp[index]) {
                                                            updated[index] = "";
                                                            setResetOtp(updated);
                                                        }
                                                        else if (index > 0) {
                                                            otpRefs[index - 1].current?.focus();
                                                        }
                                                    }
                                                } }, index))) }), resetOtpError && (_jsx("div", { className: "admin-login-error", children: resetOtpError }))] }), _jsxs("div", { className: "modal-buttons", children: [_jsx("button", { onClick: async () => {
                                                if (resetOtpLocked) {
                                                    setResetOtpError("Too many OTP attempts. Please request a new OTP.");
                                                    return;
                                                }
                                                const otp = resetOtp.join("");
                                                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/verify_otp.php`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ email: resetContact, otp }),
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                    setResetStep("newpass");
                                                    setResetOtpAttempts(0);
                                                    setResetOtpLocked(false);
                                                }
                                                else {
                                                    const attempts = resetOtpAttempts + 1;
                                                    setResetOtpAttempts(attempts);
                                                    if (attempts >= 3) {
                                                        setResetOtpLocked(true);
                                                        setResetOtpLockRemaining(30);
                                                        setResetOtpError("Too many OTP attempts. Wait 30s to try again.");
                                                    }
                                                    else {
                                                        setResetOtpError("Incorrect OTP.");
                                                    }
                                                }
                                            }, children: "Verify OTP" }), _jsx("button", { onClick: closeResetModal, children: "Cancel" })] })] })), resetStep === "newpass" && (_jsxs(_Fragment, { children: [_jsx("div", { className: "modal-close-icon", onClick: closeResetModal, children: _jsx(FaTimes, {}) }), _jsx("h3", { children: "Set New Password" }), _jsx("input", { type: "password", placeholder: "New password", value: newPassword, onChange: (e) => setNewPassword(e.target.value) }), _jsx("input", { type: "password", placeholder: "Confirm new password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value) }), passwordError && (_jsx("div", { className: "admin-login-error", children: passwordError })), _jsxs("div", { className: "modal-buttons", children: [_jsx("button", { onClick: handlePasswordReset, children: "Save Password" }), _jsx("button", { onClick: closeResetModal, children: "Cancel" })] }), resetMessage && (_jsx("div", { className: "reset-msg", children: resetMessage }))] }))] }) })), _jsx(ToastContainer, { position: "top-center", autoClose: 5000, hideProgressBar: false, newestOnTop: false, closeOnClick: true, rtl: false, pauseOnFocusLoss: true, draggable: true, pauseOnHover: true, theme: "light" })] }));
};
export default AdminLogin;
