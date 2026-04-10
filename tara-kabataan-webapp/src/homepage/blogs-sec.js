import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState, memo } from "react";
import { Link } from "react-router-dom";
import "./css/blogs-sec.css";
import BlogsBg from "../assets/homepage/blogs-bg.png";
import BookIcon from "../assets/homepage/book.png";
const API = `${import.meta.env.VITE_API_BASE_URL}/blogs.php`;
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp-v2.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";
const MAX_ITEMS = 3;
// BULLETPROOF S3 HELPER
const getSafeImageUrl = (url) => {
    if (!url)
        return "";
    if (/^https?:\/\//i.test(url) || url.startsWith("//"))
        return url;
    let cleanPath = url.startsWith("/") ? url.substring(1) : url;
    if (cleanPath.startsWith("tara-kabataan-webapp/uploads/")) {
        cleanPath = cleanPath.replace("tara-kabataan-webapp/uploads/", "");
    }
    else if (cleanPath.startsWith("tara-kabataan-optimized/tara-kabataan-webapp/uploads/")) {
        cleanPath = cleanPath.replace("tara-kabataan-optimized/tara-kabataan-webapp/uploads/", "");
    }
    if (!cleanPath.includes("/")) {
        cleanPath = `blogs-images/${cleanPath}`;
    }
    const [pathPart, queryPart] = cleanPath.split("?");
    let full = `${IMAGE_BASE}/${pathPart}`;
    if (queryPart)
        full += `?${queryPart}`;
    return full;
};
const stripToText = (html) => {
    if (!html)
        return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
};
const sortByCreatedDesc = (a, b) => (new Date(b.created_at || 0).getTime() || 0) - (new Date(a.created_at || 0).getTime() || 0);
// -- Blog Card Component --
const BlogCard = memo(({ blog }) => {
    const { blog_id, title, image_url, category, content } = blog;
    const [imgOk, setImgOk] = useState(true);
    const imgSrc = useMemo(() => getSafeImageUrl(image_url), [image_url]);
    const preview = useMemo(() => stripToText(content), [content]);
    return (_jsxs(Link, { to: `/blog/${blog_id}`, className: "blog-box", style: { textDecoration: "none", color: "inherit" }, children: [_jsx("div", { className: "blogs-image-container", children: imgOk && imgSrc ? (_jsx("img", { src: imgSrc, alt: title || `Blog ${blog_id}`, loading: "lazy", onError: () => setImgOk(false) })) : (_jsx("div", { className: "no-image-fallback", children: "No Image Available" })) }), _jsx("div", { className: "blog-title", children: _jsx("h1", { children: title }) }), _jsx("div", { className: "blog-category", children: _jsx("p", { children: category }) }), _jsx("div", { className: "blog-description", children: preview })] }));
});
BlogCard.displayName = "BlogCard";
const BlogsSec = () => {
    // ZERO LATENCY FIX: Pull from cache immediately
    const [blogs, setBlogs] = useState(() => {
        const cachedRaw = localStorage.getItem("tk_homepage_blogs");
        return cachedRaw ? JSON.parse(cachedRaw) : null;
    });
    const abortRef = useRef(null);
    useEffect(() => {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        const fetchBlogs = async () => {
            try {
                const res = await fetch(API, { signal: ac.signal, headers: { Accept: "application/json" } });
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                const allBlogs = Array.isArray(json?.blogs) ? json.blogs : [];
                // Filter for Pinned, sort by date, limit to 3
                const finalItems = allBlogs
                    .filter((b) => b.blog_status?.toUpperCase() === "PINNED")
                    .sort(sortByCreatedDesc)
                    .slice(0, MAX_ITEMS);
                // Update Screen and Cache
                setBlogs(finalItems);
                localStorage.setItem("tk_homepage_blogs", JSON.stringify(finalItems));
            }
            catch (e) {
                if (e?.name === "AbortError")
                    return;
                if (blogs == null)
                    setBlogs([]);
                console.error("BlogsSec fetch error:", e);
            }
        };
        fetchBlogs();
        return () => ac.abort();
    }, []);
    // Empty state handling
    if (blogs === null || blogs.length === 0)
        return null;
    return (_jsx("div", { className: "blogs-sec", children: _jsxs("div", { className: "blogs-bg", children: [_jsx("img", { className: "blogs-bg-tk", src: BlogsBg, alt: "Blogs Background" }), _jsxs("div", { className: "blogs-content", children: [_jsxs("div", { className: "blogs-container-sec", children: [_jsx("h1", { className: "blogs-header", children: "BLOGS" }), _jsx("div", { className: "blogs-container", children: blogs.map((b) => (_jsx(BlogCard, { blog: b }, b.blog_id))) })] }), _jsx("div", { className: "blogs-sec-nav", children: _jsxs(Link, { to: "/Blogs", className: "nav-blogs", children: [_jsx("img", { src: BookIcon, alt: "Read More Icon" }), "READ MORE"] }) })] })] }) }));
};
export default BlogsSec;
