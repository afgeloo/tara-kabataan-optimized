
import Header from "../header";
import EmailUs from "./emailus";
import GetInTouch from "./getintouch";

function ContactPage(){
    return (
        <div className="contact-page">
                <Header />
            <div>
                <EmailUs/>
                <GetInTouch/>
            </div>
        </div>
    )
}

export default ContactPage;