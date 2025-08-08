import BlogsSec from "./blogs-sec";
import WelcomeSec from "./welcome-sec";
import PartnerSec from "./partner-sec";
import EventsSec from "./events-sec";
import Header from "../header";
import Footer from "../footer";

function HomePage(){
    return(
        <div>
            <Header /> 
            <WelcomeSec />
            <EventsSec/>
            <BlogsSec />
            <PartnerSec />
            <Footer />
        </div>
    )
}

export default HomePage;