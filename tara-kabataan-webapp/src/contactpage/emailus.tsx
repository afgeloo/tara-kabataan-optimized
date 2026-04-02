import React, { useRef, useState } from "react";
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

  // Helper: Converts empty, whitespace, or any case of "anonymous" to "Anonymous"
  const normalizeValue = (val) => {
    if (!val || val.trim() === "" || val.trim().toLowerCase() === "anonymous") {
      return "Anonymous";
    }
    return val.trim();
  };

  const validateEmail = (val) => {
    // 1. Allow blank (will be treated as Anonymous)
    if (!val || val.trim() === "") {
      setEmailError("");
      return true;
    }
    // 2. Allow any case variation of "anonymous"
    if (val.trim().toLowerCase() === "anonymous") {
      setEmailError("");
      return true;
    }
    // 3. If they typed something else, it must be a valid email format
    const emailParts = val.split("@");
    if (emailParts.length !== 2 || !allowedDomains.includes(emailParts[1].toLowerCase())) {
      setEmailError("Enter a valid email or leave blank for 'Anonymous'");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateContact = (val) => {
    // 1. Allow blank
    if (!val || val.trim() === "") {
      setContactError("");
      return true;
    }
    // 2. Allow "anonymous"
    if (val.trim().toLowerCase() === "anonymous") {
      setContactError("");
      return true;
    }
    // 3. Must be numeric if provided
    if (!/^\d+$/.test(val)) {
      setContactError("Enter a valid phone number or leave blank");
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
    setContact(e.target.value);
    validateContact(e.target.value);
  };

  const sendEmail = (e) => {
    e.preventDefault();
    if (!form.current) return;

    // Final validation check before sending
    const isEmailValid = validateEmail(email);
    const isContactValid = validateContact(contact);
    if (!isEmailValid || !isContactValid) return;

    const SERVICE_ID = import.meta.env.VITE_SERVICE_ID;
    const TEMPLATE_ID = import.meta.env.VITE_TEMPLATE_ID;
    const PUBLIC_KEY = import.meta.env.VITE_PUBLIC_KEY;

    // Extract raw values from the form
    const formData = new FormData(form.current);
    
    // Create the cleaned-up data object
    const templateParams = {
      user_name: normalizeValue(formData.get("user_name")),
      user_email: normalizeValue(email),
      user_contact: normalizeValue(contact),
      message: formData.get("message"), // This is required by the HTML attribute
    };

    emailjs
      .send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY)
      .then(
        () => {
          setNotification("Your message has been sent successfully!"); 
          setTimeout(() => setNotification(""), 5000); 
          setEmail("");
          setContact("");
          form.current.reset();
        },
        (error) => {
          console.error("EmailJS Error:", error);
          setNotification("Failed to send message. Please try again.");
        }
      );
  };

  return (
    <div className="emailus-content-sec">
      <div className="emailus-sec">
        <div className="emailus-content">
          <h1 className="emailus-header">Email Us</h1>
          <p className="emailus-description">
            Got any questions? Whether you’re looking to partner or just need a kind conversation — we’re here for you.
          </p>
        </div>
        <div className="emailus-form">
          {notification && (
            <p className={`notification-message ${notification.includes("successfully") ? "success" : "error"} show`}>
                {notification}
            </p>
          )}

          <form ref={form} onSubmit={sendEmail} className="contact-form">
            <label>Name</label>
            <input 
              type="text" 
              name="user_name" 
              placeholder="Name or 'Anonymous' (Optional)" 
            />

            <label>Email</label>
            <input 
              type="text"  
              name="user_email" 
              placeholder="Email or 'Anonymous' (Optional)"
              value={email}
              onChange={handleEmailChange}
            />
            {emailError && <p className="error-message">{emailError}</p>}

            <label>Contact No.</label>
            <input 
              type="tel" 
              name="user_contact" 
              placeholder="Contact No. or 'Anonymous' (Optional)" 
              value={contact}
              onChange={handleContactChange}
            />
            {contactError && <p className="error-message">{contactError}</p>}

            <label>Message</label>
            <textarea 
              name="message" 
              required 
              placeholder="Write your message here (Required)" 
            />

            <button type="submit" disabled={!!emailError || !!contactError}>
              <img src={sendEmailBtnImg} alt="Send Email Icon" />
              Send Email
            </button>
          </form>
        </div>
      </div>
      <hr className="emailus-line" />
    </div>
  );
};

export default EmailUs;