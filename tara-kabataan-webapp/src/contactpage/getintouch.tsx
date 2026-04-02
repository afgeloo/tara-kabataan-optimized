import "./css/getintouch.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import telephoneImg from "../assets/contactpage/telephone.png";
import emailImg from "../assets/contactpage/email.png";
import facebookImg from "../assets/contactpage/facebook.png";
import instagramImg from "../assets/contactpage/instagram.png";

function GetInTouch() {
  const navigate = useNavigate();

  const [contactNo, setContactNo] = useState<string>("Loading...");
  const [email, setEmail] = useState<string>("Loading...");
  const [address, setAddress] = useState<string>("Manila, Philippines");
  const [instagramLink, setInstagramLink] = useState<string>("https://www.instagram.com/tarakabataan");
  const [facebookLink, setFacebookLink] = useState<string>("https://www.facebook.com/TaraKabataanMNL");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/aboutus.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.contact_no) setContactNo(data.contact_no);
        if (data.about_email) setEmail(data.about_email);
        if (data.address) setAddress(data.address);
        if (data.instagram) setInstagramLink(data.instagram);
        if (data.facebook) setFacebookLink(data.facebook);
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

  return (
    <div className="getintouch-sec">
      <div className="getintouch-content">
        <h1 className="getintouch-header">Get in Touch</h1>
        <p className="getintouch-description">
          Reach out to us through any of our contact points below. We're here to listen and connect with you!
        </p>
      </div>

      <div className="getintouch-sub-sec">
        <div className="getintouch-left">
          <div className="contact-telephone">
            <a href={`tel:${contactNo}`} target="_blank" rel="noopener noreferrer">
              <div className="contact-telephone-icon">
                <img src={telephoneImg} alt="Telephone Icon" draggable="false" />
              </div>
            </a>
            <div className="contact-telephone-details">
              <h1 className="contact-telephone-header">Telephone</h1>
              <p className="contact-telephone-no">{contactNo}</p>
            </div>
          </div>

          <div className="contact-email">
            <div
              onClick={() => navigate("/contact")}
              style={{ cursor: "pointer" }}
            >
              <div className="contact-email-icon">
                <img src={emailImg} alt="Email Icon" draggable="false" />
              </div>
            </div>
            <div
              onClick={() => navigate("/contact")}
              style={{ cursor: "pointer" }}
              className="contact-email-details"
            >
              <h1 className="contact-email-header">Email</h1>
              <p className="contact-email">{email}</p>
            </div>
          </div>
        </div>

        <div className="getintouch-right">
          <div className="contact-telephone">
            <a href={facebookLink} target="_blank" rel="noopener noreferrer">
              <div className="contact-telephone-icon">
                <img src={facebookImg} alt="Facebook Icon" draggable="false" />
              </div>
            </a>
            <div className="contact-telephone-details">
              <h1 className="contact-telephone-header">Facebook</h1>
              <p className="contact-telephone-no">Tara Kabataan</p>
            </div>
          </div>

          <div className="contact-email">
            <a href={instagramLink} target="_blank" rel="noopener noreferrer">
              <div className="contact-email-icon">
                <img src={instagramImg} alt="Instagram Icon" draggable="false" />
              </div>
            </a>
            <div className="contact-email-details">
              <h1 className="contact-email-header">Instagram</h1>
              <p className="contact-email">@tarakabataan</p>
            </div>
          </div>
        </div>
      </div>
{/* 
      <div className="getintouch-map">
        <iframe
          src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&z=18&output=embed`}
          allowFullScreen
        ></iframe>
      </div> */}
    </div>
  );
}

export default GetInTouch;
