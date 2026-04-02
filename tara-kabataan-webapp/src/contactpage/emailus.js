import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import "./css/emailus.css";
import sendEmailBtnImg from "../assets/contactpage/send-email-btn.png";
const EmailUs = () => {
    const form = useRef(null);
    const [email, setEmail] = useState("");
    const [contact, setContact] = useState("");
    const [emailError, setEmailError] = useState("");
    const [contactError, setContactError] = useState("");
    const [notification, setNotification] = useState("");
    const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com"];
    const validateEmail = (email) => {
        if (email.toLowerCase() === "anonymous") {
            setEmailError("");
            return true;
        }
        const emailParts = email.split("@");
        if (emailParts.length !== 2 || !allowedDomains.includes(emailParts[1].toLowerCase())) {
            setEmailError("Enter a valid email address or type 'Anonymous'");
            return false;
        }
        setEmailError("");
        return true;
    };
    const validateContact = (contact) => {
        if (contact.toLowerCase() === "anonymous") {
            setContactError("");
            return true;
        }
        if (!/^\d+$/.test(contact)) {
            setContactError("Enter a valid phone number or type 'Anonymous'");
            return false;
        }
        if (parseInt(contact, 10) <= 0) {
            setContactError("Enter a valid phone number or type 'Anonymous'");
            return false;
        }
        setContactError("");
        return true;
    };
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        validateEmail(e.target.value);
    };
    const handleContactChange = (e) => {
        const value = e.target.value;
        setContact(value);
        validateContact(value);
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
        emailjs
            .sendForm(SERVICE_ID, TEMPLATE_ID, form.current, PUBLIC_KEY)
            .then((result) => {
            console.log(result.text);
            console.log("Message sent");
            setNotification("Your message has been sent successfully!");
            setTimeout(() => setNotification(""), 5000);
            setEmail("");
            setContact("");
            form.current.reset();
        }, (error) => {
            console.log(error.text);
            setNotification("Failed to send message. Please try again.");
            setTimeout(() => setNotification(""), 5000);
        });
    };
    return (_jsxs("div", { className: "emailus-content-sec", children: [_jsxs("div", { className: "emailus-sec", children: [_jsxs("div", { className: "emailus-content", children: [_jsx("h1", { className: "emailus-header", children: "Email Us" }), _jsx("p", { className: "emailus-description", children: "Got any questions for Tara Kabataan? \uD83D\uDC8C Whether you\u2019re looking to partner, volunteer, support a cause, or simply someone who needs a little help or a kind conversation \u2014 we\u2019re here for you. Our inbox is always open for stories, suggestions, or souls in need of solidarity." })] }), _jsxs("div", { className: "emailus-form", children: [notification && (_jsx("p", { className: `notification-message ${notification.includes("successfully") ? "success" : "error"} show`, children: notification })), _jsxs("form", { ref: form, onSubmit: sendEmail, className: "contact-form", children: [_jsx("label", { children: "Name" }), _jsx("input", { type: "text", name: "user_name", required: true, placeholder: "Enter your name or 'Anonymous'" }), _jsx("label", { children: "Email" }), _jsx("input", { type: "text", name: "user_email", required: true, placeholder: "Enter your email or 'Anonymous'", value: email, onChange: handleEmailChange }), emailError && _jsx("p", { className: "error-message", children: emailError }), _jsx("label", { children: "Contact No." }), _jsx("input", { type: "tel", name: "user_contact", required: true, placeholder: "Enter your contact number or 'Anonymous'", value: contact, onChange: handleContactChange, onKeyPress: (e) => {
                                            if (!/^[0-9A-Za-z]*$/.test(e.key)) {
                                                e.preventDefault();
                                            }
                                        } }), contactError && _jsx("p", { className: "error-message", children: contactError }), _jsx("label", { children: "Message" }), _jsx("textarea", { name: "message", required: true, placeholder: "Write your message here" }), _jsxs("button", { type: "submit", disabled: !!emailError || !!contactError, children: [_jsx("img", { src: sendEmailBtnImg, alt: "Send Email Icon" }), "Send Email"] })] })] })] }), _jsx("hr", { className: "emailus-line" })] }));
};
export default EmailUs;
