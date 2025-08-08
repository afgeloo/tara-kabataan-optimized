import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import "./css/emailus.css"; 

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

    if (!form.current) return;

    const isEmailValid = validateEmail(email);
    const isContactValid = validateContact(contact);

    if (!isEmailValid || !isContactValid) return;

    const SERVICE_ID = import.meta.env.VITE_SERVICE_ID;
    const TEMPLATE_ID = import.meta.env.VITE_TEMPLATE_ID;
    const PUBLIC_KEY = import.meta.env.VITE_PUBLIC_KEY;

    emailjs
      .sendForm(
        SERVICE_ID,
        TEMPLATE_ID,
        form.current,
        PUBLIC_KEY
      )
      .then(
        (result) => {
          console.log(result.text);
          console.log("Message sent");
          setNotification("Your message has been sent successfully!"); 
          setTimeout(() => setNotification(""), 5000); 

          setEmail("");
          setContact("");
          form.current.reset();
        },
        (error) => {
          console.log(error.text);
          setNotification("Failed to send message. Please try again.");
          setTimeout(() => setNotification(""), 5000);
        }
      );
  };

  return (
    <div className="emailus-content-sec">
        <div className="emailus-sec">
      <div className="emailus-content">
        <h1 className="emailus-header">Email Us</h1>
        <p className="emailus-description">
        Got any questions for Tara Kabataan? 💌 Whether you’re looking to partner, volunteer, support a cause, or simply someone who needs a little help or a kind conversation — we’re here for you.
        Our inbox is always open for stories, suggestions, or souls in need of solidarity. 
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
          <input type="text" name="user_name" required placeholder="Enter your name or 'Anonymous'" />

          <label>Email</label>
          <input 
            type="text"  
            name="user_email" 
            required 
            placeholder="Enter your email or 'Anonymous'"
            value={email}
            onChange={handleEmailChange}
            />
          {emailError && <p className="error-message">{emailError}</p>}

          <label>Contact No.</label>
          <input 
            type="tel" 
            name="user_contact" 
            required 
            placeholder="Enter your contact number or 'Anonymous'" 
            value={contact}
            onChange={handleContactChange}
            onKeyPress={(e) => {
                if (!/^[0-9A-Za-z]*$/.test(e.key)) {
                e.preventDefault();
                }
            }}
          />
          {contactError && <p className="error-message">{contactError}</p>}

          <label>Message</label>
          <textarea name="message" required placeholder="Write your message here" />

          <button type="submit" disabled={!!emailError || !!contactError}>
            <img src="./src/assets/contactpage/send-email-btn.png" alt="Send Email Icon" />
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