import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/contactpage/emailus.tsx
import { useRef, useState, useCallback, memo } from "react";
import emailjs from "@emailjs/browser";
import "./css/emailus.css";
import sendEmailBtnImg from "../assets/contactpage/send-email-btn.png";
const EmailUs = memo(() => {
    const form = useRef(null);
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");
    const [emailError, setEmailError] = useState("");
    const [contactError, setContactError] = useState("");
    const [notification, setNotification] = useState("");
    const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com"];
    const normalizeValue = useCallback((val) => {
        if (!val || val.trim() === "" || val.trim().toLowerCase() === "anonymous") {
            return "Anonymous";
        }
        return val.trim();
    }, []);
    const validateEmail = useCallback((val) => {
        if (!val || val.trim() === "" || val.trim().toLowerCase() === "anonymous") {
            setEmailError("");
            return true;
        }
        const emailParts = val.split("@");
        if (emailParts.length !== 2 || !allowedDomains.includes(emailParts[1].toLowerCase())) {
            setEmailError("Enter a valid email or leave blank");
            return false;
        }
        setEmailError("");
        return true;
    }, [allowedDomains]);
    const validateContact = useCallback((val) => {
        if (!val || val.trim() === "" || val.trim().toLowerCase() === "anonymous") {
            setContactError("");
            return true;
        }
        if (!/^\d+$/.test(val)) {
            setContactError("Enter a valid phone number or leave blank");
            return false;
        }
        setContactError("");
        return true;
    }, []);
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        validateEmail(e.target.value);
    };
    const handleContactChange = (e) => {
        setContact(e.target.value);
        validateContact(e.target.value);
    };
    const sendEmail = (e) => {
        e.preventDefault();
        if (!form.current)
            return;
        const isEmailValid = validateEmail(email);
        const isContactValid = validateContact(contact);
        if (!isEmailValid || !isContactValid)
            return;
        const SERVICE_ID = import.meta.env.VITE_SERVICE_ID;
        const TEMPLATE_ID = import.meta.env.VITE_TEMPLATE_ID;
        const PUBLIC_KEY = import.meta.env.VITE_PUBLIC_KEY;
        const formData = new FormData(form.current);
        const templateParams = {
            user_name: normalizeValue(formData.get("user_name")),
            user_email: normalizeValue(email),
            user_contact: normalizeValue(contact),
            message: formData.get("message"),
        };
        emailjs
            .send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
            .then(() => {
            setNotification("Your message has been sent successfully!");
            setTimeout(() => setNotification(""), 5000);
            setEmail("");
            setContact("");
            form.current?.reset();
        }, (error) => {
            console.error("EmailJS Error:", error);
            setNotification("Failed to send message. Please try again.");
        });
    };
    return (_jsxs("div", { className: "emailus-content-sec", children: [_jsxs("div", { className: "emailus-sec", children: [_jsxs("div", { className: "emailus-content", children: [_jsx("h1", { className: "emailus-header", children: "Email Us" }), _jsx("p", { className: "emailus-description", children: "Got any questions? Whether you\u2019re looking to partner or just need a kind conversation \u2014 we\u2019re here for you." })] }), _jsxs("div", { className: "emailus-form", children: [notification && (_jsx("p", { className: `notification-message ${notification.includes("successfully") ? "success" : "error"} show`, children: notification })), _jsxs("form", { ref: form, onSubmit: sendEmail, className: "contact-form", children: [_jsx("label", { children: "Name" }), _jsx("input", { type: "text", name: "user_name", placeholder: "(Optional)" }), _jsx("label", { children: "Email" }), _jsx("input", { type: "text", name: "user_email", placeholder: "(Optional)", value: email, onChange: handleEmailChange }), emailError && _jsx("p", { className: "error-message", children: emailError }), _jsx("label", { children: "Contact No." }), _jsx("input", { type: "tel", name: "user_contact", placeholder: "(Optional)", value: contact, onChange: handleContactChange }), contactError && _jsx("p", { className: "error-message", children: contactError }), _jsx("label", { children: "Message" }), _jsx("textarea", { name: "message", required: true, placeholder: "Write your message here" }), _jsxs("button", { type: "submit", disabled: !!emailError || !!contactError, children: [_jsx("img", { src: sendEmailBtnImg, alt: "Send Email Icon" }), "Send Email"] })] })] })] }), _jsx("hr", { className: "emailus-line" })] }));
});
export default EmailUs;
