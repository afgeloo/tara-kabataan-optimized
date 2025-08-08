import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./css/getintouch.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
function GetInTouch() {
    const navigate = useNavigate();
    const [contactNo, setContactNo] = useState("Loading...");
    const [email, setEmail] = useState("Loading...");
    const [address, setAddress] = useState("Manila, Philippines");
    const [instagramLink, setInstagramLink] = useState("https://www.instagram.com/tarakabataan");
    const [facebookLink, setFacebookLink] = useState("https://www.facebook.com/TaraKabataanMNL");
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/aboutus.php`)
            .then((res) => res.json())
            .then((data) => {
            if (data.contact_no)
                setContactNo(data.contact_no);
            if (data.about_email)
                setEmail(data.about_email);
            if (data.address)
                setAddress(data.address);
            if (data.instagram)
                setInstagramLink(data.instagram);
            if (data.facebook)
                setFacebookLink(data.facebook);
        })
            .catch((err) => {
            console.error("Error fetching contact info:", err);
            setContactNo("Unavailable");
            setEmail("Unavailable");
            setAddress("Unavailable");
            setInstagramLink("https://www.instagram.com/tarakabataan");
            setFacebookLink("https://www.facebook.com/TaraKabataanMNL");
        });
    }, []);
    return (_jsxs("div", { className: "getintouch-sec", children: [_jsxs("div", { className: "getintouch-content", children: [_jsx("h1", { className: "getintouch-header", children: "Get in Touch" }), _jsx("p", { className: "getintouch-description", children: "Reach out to us through any of our contact points below. We're here to listen and connect with you!" })] }), _jsxs("div", { className: "getintouch-sub-sec", children: [_jsxs("div", { className: "getintouch-left", children: [_jsxs("div", { className: "contact-telephone", children: [_jsx("a", { href: `tel:${contactNo}`, target: "_blank", rel: "noopener noreferrer", children: _jsx("div", { className: "contact-telephone-icon", children: _jsx("img", { src: "./src/assets/contactpage/telephone.png", alt: "Telephone Icon", draggable: "false" }) }) }), _jsxs("div", { className: "contact-telephone-details", children: [_jsx("h1", { className: "contact-telephone-header", children: "Telephone" }), _jsx("p", { className: "contact-telephone-no", children: contactNo })] })] }), _jsxs("div", { className: "contact-email", children: [_jsx("div", { onClick: () => navigate("/contact"), style: { cursor: "pointer" }, children: _jsx("div", { className: "contact-email-icon", children: _jsx("img", { src: "./src/assets/contactpage/email.png", alt: "Email Icon", draggable: "false" }) }) }), _jsxs("div", { onClick: () => navigate("/contact"), style: { cursor: "pointer" }, className: "contact-email-details", children: [_jsx("h1", { className: "contact-email-header", children: "Email" }), _jsx("p", { className: "contact-email", children: email })] })] })] }), _jsxs("div", { className: "getintouch-right", children: [_jsxs("div", { className: "contact-telephone", children: [_jsx("a", { href: facebookLink, target: "_blank", rel: "noopener noreferrer", children: _jsx("div", { className: "contact-telephone-icon", children: _jsx("img", { src: "./src/assets/contactpage/facebook.png", alt: "Facebook Icon", draggable: "false" }) }) }), _jsxs("div", { className: "contact-telephone-details", children: [_jsx("h1", { className: "contact-telephone-header", children: "Facebook" }), _jsx("p", { className: "contact-telephone-no", children: "Tara Kabataan" })] })] }), _jsxs("div", { className: "contact-email", children: [_jsx("a", { href: instagramLink, target: "_blank", rel: "noopener noreferrer", children: _jsx("div", { className: "contact-email-icon", children: _jsx("img", { src: "./src/assets/contactpage/instagram.png", alt: "Instagram Icon", draggable: "false" }) }) }), _jsxs("div", { className: "contact-email-details", children: [_jsx("h1", { className: "contact-email-header", children: "Instagram" }), _jsx("p", { className: "contact-email", children: "@tarakabataan" })] })] })] })] })] }));
}
export default GetInTouch;
