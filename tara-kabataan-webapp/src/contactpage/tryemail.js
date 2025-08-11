import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from "react";
import emailjs from "@emailjs/browser";
import styled from "styled-components";
const Contact = () => {
    const form = useRef(null);
    const sendEmail = (e) => {
        e.preventDefault();
        if (!form.current)
            return;
        emailjs
            .sendForm("service_w0c2a9c", "template_oem6l2b", form.current, "3a9dLP6EzzCge5l5G")
            .then((result) => {
            console.log(result.text);
            console.log("message sent");
        }, (error) => {
            console.log(error.text);
        });
    };
    return (_jsx(StyledContactForm, { children: _jsxs("form", { ref: form, onSubmit: sendEmail, children: [_jsx("label", { children: "Name" }), _jsx("input", { type: "text", name: "user_name", required: true }), _jsx("label", { children: "Email" }), _jsx("input", { type: "email", name: "user_email", required: true }), _jsx("label", { children: "Message" }), _jsx("textarea", { name: "message", required: true }), _jsx("input", { type: "submit", value: "Send" })] }) }));
};
export default Contact;
// Styles
const StyledContactForm = styled.div `
  width: 400px;

  form {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    width: 100%;
    font-size: 16px;

    input {
      width: 100%;
      height: 35px;
      padding: 7px;
      outline: none;
      border-radius: 5px;
      border: 1px solid rgb(220, 220, 220);

      &:focus {
        border: 2px solid rgba(0, 206, 158, 1);
      }
    }

    textarea {
      max-width: 100%;
      min-width: 100%;
      width: 100%;
      max-height: 100px;
      min-height: 100px;
      padding: 7px;
      outline: none;
      border-radius: 5px;
      border: 1px solid rgb(220, 220, 220);

      &:focus {
        border: 2px solid rgba(0, 206, 158, 1);
      }
    }

    label {
      margin-top: 1rem;
    }

    input[type="submit"] {
      margin-top: 2rem;
      cursor: pointer;
      background: rgb(249, 105, 14);
      color: white;
      border: none;
    }
  }
`;
