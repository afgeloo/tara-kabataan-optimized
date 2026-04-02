import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import BlogsSec from "./blogs-sec";
import WelcomeSec from "./welcome-sec";
import PartnerSec from "./partner-sec";
import EventsSec from "./events-sec";
import Header from "../header";
import Footer from "../footer";
function HomePage() {
    return (_jsxs("div", { children: [_jsx(Header, {}), _jsx(WelcomeSec, {}), _jsx(EventsSec, {}), _jsx(BlogsSec, {}), _jsx(PartnerSec, {}), _jsx(Footer, {})] }));
}
export default HomePage;
