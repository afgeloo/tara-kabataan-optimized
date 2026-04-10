import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/blogspage/blogspage.tsx
import { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect, memo, useTransition, } from "react";
import Footer from "../footer";
import Header from "../header";
import "./blogspage.css";
import timeiconwhite from "../assets/logos/time.png";
import authoriconwhite from "../assets/logos/authorwhiteicon.png";
import timeblack from "../assets/logos/timeblack.png";
import authorblack from "../assets/logos/pencilblack.jpg";
import { useNavigate } from "react-router-dom";
import Preloader from "../preloader";
import searchIconEventspage from "../assets/eventspage/Search-icon-events.png";
import debounce from "lodash.debounce";
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const CATEGORIES = ["ALL", "KALUSUGAN", "KALIKASAN", "KARUNUNGAN", "KULTURA", "KASARIAN"];
const DATE_FMT = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });
// --- ROBUST S3 IMAGE RESOLVER (Exported for SingleBlog to reuse) ---
export const getSafeBlogImageUrl = (url) => {
    if (!url)
        return "";
    if (url.startsWith("http") || url.startsWith("//"))
        return url;
    const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp-v2.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";
    let cleanPath = url
        .replace(/^\/?tara-kabataan-optimized\/tara-kabataan-webapp\/uploads\//, "")
        .replace("blogs-images/blogs-images/", "blogs-images/");
    if (cleanPath.startsWith("/"))
        cleanPath = cleanPath.substring(1);
    return `${IMAGE_BASE}/${cleanPath}`;
};
// --- ZERO LATENCY GLOBAL CACHE ---
export let _globalBlogsCache = null;
export let _globalPinnedBlogsCache = null;
export let _globalBlogsCacheAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
/* ----------------- SUBCOMPONENTS (memoized) ----------------- */
const PinnedBlogsSection = memo(function PinnedBlogsSection({ pinnedBlogs, onOpen }) {
    if (!pinnedBlogs.length)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "blogs-page-pinned-header", children: _jsx("h2", { children: pinnedBlogs.length === 1 ? "Pinned Blog" : "Pinned Blogs" }) }), _jsxs("div", { className: "blogs-page-pinned-blogs", children: [pinnedBlogs.length === 1 && (_jsx("div", { className: "blogs-page-pinned-container blogs-page-pinned-single", children: _jsx("div", { className: "blogs-page-pinned-full", style: { "--bg-image": `url(${getSafeBlogImageUrl(pinnedBlogs[0].image_url)})` }, onClick: () => onOpen(pinnedBlogs[0].blog_id), children: _jsxs("div", { className: "blogs-page-pinned-overlay", children: [_jsx("p", { className: "blogs-page-pinned-category-1", children: pinnedBlogs[0].category }), _jsx("h3", { className: "blogs-page-pinned-title-1", children: pinnedBlogs[0].title }), _jsxs("p", { className: "blogs-page-pinned-meta-1", children: [_jsx("img", { src: timeiconwhite, className: "blogs-page-timeiconwhite" }), pinnedBlogs[0]._dateText, _jsx("img", { src: authoriconwhite, className: "blogs-page-authoriconwhite" }), pinnedBlogs[0].author] })] }) }) })), pinnedBlogs.length === 2 && (_jsx("div", { className: "blogs-page-pinned-container blogs-page-pinned-double", children: pinnedBlogs.map((blog) => (_jsx("div", { className: "blogs-page-pinned-half", style: { "--bg-image": `url(${getSafeBlogImageUrl(blog.image_url)})` }, onClick: () => onOpen(blog.blog_id), children: _jsxs("div", { className: "blogs-page-pinned-overlay", children: [_jsx("p", { className: "blogs-page-pinned-category-1", children: blog.category }), _jsx("h3", { className: "blogs-page-pinned-title-1", children: blog.title }), _jsxs("p", { className: "blogs-page-pinned-meta-1", children: [_jsx("img", { src: timeiconwhite, className: "blogs-page-timeiconwhite" }), blog._dateText, _jsx("img", { src: authoriconwhite, className: "blogs-page-authoriconwhite" }), blog.author] })] }) }, blog.blog_id))) })), pinnedBlogs.length >= 3 && (_jsxs("div", { className: "blogs-page-pinned-container", children: [_jsx("div", { className: "blogs-page-pinned-main", style: { "--bg-image": `url(${getSafeBlogImageUrl(pinnedBlogs[0].image_url)})` }, onClick: () => onOpen(pinnedBlogs[0].blog_id), children: _jsxs("div", { className: "blogs-page-pinned-overlay", children: [_jsx("p", { className: "blogs-page-pinned-category-1", children: pinnedBlogs[0].category }), _jsx("h3", { className: "blogs-page-pinned-title-1", children: pinnedBlogs[0].title }), _jsxs("p", { className: "blogs-page-pinned-meta-1", children: [_jsx("img", { src: timeiconwhite, className: "blogs-page-timeiconwhite" }), pinnedBlogs[0]._dateText, _jsx("img", { src: authoriconwhite, className: "blogs-page-authoriconwhite" }), pinnedBlogs[0].author] })] }) }), _jsx("div", { className: "blogs-page-pinned-side", children: pinnedBlogs.slice(1, 3).map((blog) => (_jsx("div", { className: "blogs-page-pinned-item", style: { "--bg-image": `url(${getSafeBlogImageUrl(blog.image_url)})` }, onClick: () => onOpen(blog.blog_id), children: _jsxs("div", { className: "blogs-page-pinned-overlay", children: [_jsx("p", { className: "blogs-page-pinned-category-2", children: blog.category }), _jsx("h3", { className: "blogs-page-pinned-title-2", children: blog.title }), _jsxs("p", { className: "blogs-page-pinned-meta-2", children: [_jsx("img", { src: timeiconwhite, className: "blogs-page-timeiconwhite" }), blog._dateText, _jsx("img", { src: authoriconwhite, className: "blogs-page-authoriconwhite" }), blog.author] })] }) }, blog.blog_id))) })] }))] })] }));
});
const BlogGrid = memo(function BlogGrid({ blogs, onOpen }) {
    if (!blogs.length)
        return _jsx("div", { className: "no-blogs-container", children: _jsx("p", { children: "No blogs found." }) });
    return (_jsx("div", { className: "blogs-page-blogs-grid", children: blogs.map((blog) => (_jsxs("div", { className: "blogs-page-blog-item", children: [_jsx("img", { src: getSafeBlogImageUrl(blog.image_url), alt: blog.title, onClick: () => onOpen(blog.blog_id), loading: "lazy", decoding: "async", style: { cursor: "pointer" } }), _jsxs("div", { className: "blogs-page-pinned-overlay", children: [_jsx("p", { className: "blogs-page-pinned-category-3", children: blog.category }), _jsx("h3", { className: "blogs-page-pinned-title-3", onClick: () => onOpen(blog.blog_id), style: { cursor: "pointer" }, children: blog.title }), _jsxs("p", { className: "blogs-page-pinned-meta-3", children: [_jsx("img", { src: timeblack, className: "blogs-page-time-black" }), blog._dateText, _jsx("img", { src: authorblack, className: "blogs-page-author-black" }), blog.author] })] })] }, blog.blog_id))) }));
});
/* ----------------- MAIN COMPONENT ----------------- */
export default function BlogsPage() {
    const navigate = useNavigate();
    const sessionRestored = useRef(false);
    const [isPending, startTransition] = useTransition();
    const [selectedCategory, setSelectedCategory] = useState(() => sessionStorage.getItem("blogCategory") || "ALL");
    const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("blogSearchQuery") || "");
    const [showAllBlogs, setShowAllBlogs] = useState(() => sessionStorage.getItem("blogShowAll") === "true");
    // Zero-latency init
    const [pinnedBlogs, setPinnedBlogs] = useState(_globalPinnedBlogsCache || []);
    const [allBlogs, setAllBlogs] = useState(_globalBlogsCache || []);
    const [loading, setLoading] = useState(!_globalBlogsCache);
    const [restoringScroll, setRestoringScroll] = useState(true);
    const categories = useMemo(() => [...CATEGORIES], []);
    const goToBlog = useCallback((id) => {
        sessionStorage.setItem("blogScrollY", String(window.scrollY));
        sessionStorage.setItem("blogCategory", selectedCategory);
        sessionStorage.setItem("blogSearchQuery", searchQuery);
        sessionStorage.setItem("blogShowAll", String(showAllBlogs));
        navigate(`/blog/${id}`);
    }, [navigate, selectedCategory, searchQuery, showAllBlogs]);
    useLayoutEffect(() => {
        const savedY = sessionStorage.getItem("blogScrollY");
        if (savedY) {
            window.scrollTo(0, parseInt(savedY, 10));
            sessionStorage.removeItem("blogScrollY");
        }
        setRestoringScroll(false);
    }, []);
    /* ---------- fetch events (Zero Latency) ---------- */
    useEffect(() => {
        const now = Date.now();
        if (_globalBlogsCache && _globalPinnedBlogsCache && (now - _globalBlogsCacheAt < CACHE_TTL)) {
            setAllBlogs(_globalBlogsCache);
            setPinnedBlogs(_globalPinnedBlogsCache);
            setLoading(false);
            sessionRestored.current = true;
            return;
        }
        const ctrl = new AbortController();
        setLoading(true);
        fetch(`${API_BASE}/blogs.php?category=ALL`, {
            signal: ctrl.signal,
            headers: { Accept: "application/json" } // Removed no-store block
        })
            .then((res) => res.json())
            .then((data) => {
            const mapDate = (b) => ({ ...b, _dateText: DATE_FMT.format(new Date(b.created_at)) });
            const published = data.blogs.filter((b) => (b.blog_status || "").toUpperCase() === "PUBLISHED").map(mapDate);
            const pinned = (data.pinned ?? []).map(mapDate);
            const merged = [...pinned, ...published];
            _globalBlogsCache = merged;
            _globalPinnedBlogsCache = pinned;
            _globalBlogsCacheAt = Date.now();
            setPinnedBlogs(pinned);
            setAllBlogs(merged);
        })
            .catch((e) => { if (e?.name !== "AbortError")
            console.error(e); })
            .finally(() => { setLoading(false); sessionRestored.current = true; });
        return () => ctrl.abort();
    }, []);
    useEffect(() => {
        if (!loading && sessionRestored.current) {
            sessionStorage.removeItem("blogCategory");
            sessionStorage.removeItem("blogSearchQuery");
            sessionStorage.removeItem("blogShowAll");
        }
    }, [loading]);
    const blogsByCategory = useMemo(() => (selectedCategory === "ALL" ? allBlogs : allBlogs.filter((b) => b.category === selectedCategory)), [selectedCategory, allBlogs]);
    const [searchFilter, setSearchFilter] = useState(searchQuery.toLowerCase());
    const debouncedSet = useMemo(() => debounce((next) => { setSearchFilter(next.toLowerCase()); sessionStorage.setItem("blogSearchQuery", next); }, 300), []);
    useEffect(() => () => debouncedSet.cancel?.(), [debouncedSet]);
    const onSearchChange = useCallback((val) => { setSearchQuery(val); debouncedSet(val); }, [debouncedSet]);
    const pinnedSet = useMemo(() => new Set(pinnedBlogs.map((b) => b.blog_id)), [pinnedBlogs]);
    const filteredBlogs = useMemo(() => {
        if (!blogsByCategory.length)
            return [];
        const q = searchFilter;
        const list = q ? blogsByCategory.filter((b) => b.title.toLowerCase().includes(q)) : blogsByCategory;
        return list.filter((b) => !pinnedSet.has(b.blog_id));
    }, [blogsByCategory, pinnedSet, searchFilter]);
    const displayedBlogs = useMemo(() => (showAllBlogs ? filteredBlogs : filteredBlogs.slice(0, 4)), [filteredBlogs, showAllBlogs]);
    const toggleSeeMore = useCallback(() => { startTransition(() => setShowAllBlogs((v) => !v)); }, []);
    return (_jsxs("div", { className: "blogs-page", children: [_jsx(Header, {}), pinnedBlogs.length > 0 && _jsx(PinnedBlogsSection, { pinnedBlogs: pinnedBlogs, onOpen: goToBlog }), _jsxs("div", { className: "blogs-page-blog-categories", children: [_jsx("h2", { className: "blogs-page-blogs-header", style: { fontFamily: "'Bogart Trial', sans-serif" }, children: "Blogs" }), _jsxs("div", { className: "blogs-category-dropdown-search-bar", children: [_jsx("div", { className: "blogs-category-buttons-desktop blogs-page-category-list", children: categories.map((cat) => (_jsx("span", { className: selectedCategory === cat ? "active-category" : "", onClick: () => setSelectedCategory(cat), children: cat }, cat))) }), _jsx("div", { className: "blogs-category-dropdown-mobile", children: _jsx("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "blogs-category-select", children: categories.map((cat) => _jsx("option", { value: cat, children: cat }, cat)) }) }), _jsxs("div", { className: "blog-searchbar-container", children: [_jsx("input", { type: "text", placeholder: "Search blogs...", value: searchQuery, onChange: (e) => onSearchChange(e.target.value), className: "blog-searchbar-input" }), _jsx("img", { src: searchIconEventspage, alt: "Search", className: "blog-searchbar-icon" })] })] })] }), _jsx("hr", { className: "blogs-page-Hr" }), _jsx("div", { className: "blogs-page-blogs-list", children: loading || restoringScroll ? _jsx(Preloader, {}) : _jsx(BlogGrid, { blogs: displayedBlogs, onOpen: goToBlog }) }), filteredBlogs.length > 4 && (_jsx("button", { className: "blogs-page-see-more-btn", onClick: toggleSeeMore, disabled: isPending, children: showAllBlogs ? "Show Less" : "See More" })), _jsx(Footer, {})] }));
}
