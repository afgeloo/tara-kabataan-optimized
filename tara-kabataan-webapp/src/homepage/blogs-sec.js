import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import "./css/blogs-sec.css";
// Prefer bundler-managed assets over raw ./src paths
import BlogsBg from "../assets/homepage/blogs-bg.png";
import BookIcon from "../assets/homepage/book.png";
// -- Config ------------------------------------------------------------------
const API = `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/blogs.php`;
const MAX_ITEMS = 3;
const CACHE_KEY = "blogsSec.cache.v1";
const CACHE_TTL_MS = 60_000; // 1 min (tweak as you like)
const PREVIEW_CHARS = 140;
// -- Utils -------------------------------------------------------------------
const getSafeImageUrl = (url) => {
    if (!url)
        return "";
    // If API already returns absolute, use as-is
    if (/^https?:\/\//i.test(url))
        return url;
    // If it's a server-relative path, prefix base URL
    return `${import.meta.env.VITE_API_BASE_URL}${url}`;
};
const stripToText = (html) => {
    if (!html)
        return "";
    // Avoid regex for HTML; DOMParser is quick & safe in-browser
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
};
const truncate = (s, n) => (s.length > n ? s.slice(0, n).trimEnd() + "…" : s);
// Sort newest first; tolerate missing dates
const sortByCreatedDesc = (a, b) => (new Date(b.created_at || 0).getTime() || 0) - (new Date(a.created_at || 0).getTime() || 0);
// Tiny in-memory dedupe to avoid setState storms on identical payloads
const stableStringify = (v) => {
    try {
        return JSON.stringify(v);
    }
    catch {
        return "";
    }
};
const BlogCard = memo(({ blog }) => {
    const { blog_id, title, image_url, category, content } = blog;
    const [imgOk, setImgOk] = useState(true);
    const imgSrc = useMemo(() => getSafeImageUrl(image_url), [image_url]);
    const preview = useMemo(() => stripToText(content), [content]);
    const onError = useCallback(() => setImgOk(false), []);
    return (_jsxs(Link, { to: `/blog/${blog_id}`, className: "blog-box", style: { textDecoration: "none", color: "inherit" }, "aria-label": `Open blog: ${title}`, children: [_jsx("div", { className: "blogs-image-container", children: imgOk && imgSrc ? (_jsx("img", { src: imgSrc, alt: title || `Blog ${blog_id}`, loading: "lazy", decoding: "async", onError: onError })) : (_jsx("div", { className: "no-image-fallback", "aria-hidden": "true", children: "No Image Available" })) }), _jsx("div", { className: "blog-title", children: _jsx("h1", { children: title }) }), _jsx("div", { className: "blog-category", children: _jsx("p", { children: category }) }), _jsx("div", { className: "blog-description", children: preview })] }));
});
BlogCard.displayName = "BlogCard";
// -- Skeleton (optional; keep super light) -----------------------------------
const BlogCardSkeleton = () => (_jsxs("div", { className: "blog-box skeleton", children: [_jsx("div", { className: "blogs-image-container skeleton-block" }), _jsx("div", { className: "blog-title skeleton-line" }), _jsx("div", { className: "blog-category skeleton-line" }), _jsx("div", { className: "blog-description skeleton-lines" })] }));
// -- Main --------------------------------------------------------------------
const BlogsSec = () => {
    const [blogs, setBlogs] = useState(null);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);
    const mountedRef = useRef(true);
    // Load from cache immediately (for instant paint)
    useEffect(() => {
        const cachedRaw = sessionStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
            try {
                const cached = JSON.parse(cachedRaw);
                if (Date.now() - cached.ts < CACHE_TTL_MS && Array.isArray(cached.data)) {
                    setBlogs(cached.data.slice(0, MAX_ITEMS));
                }
            }
            catch { }
        }
    }, []);
    // Fetch with abort + background revalidate
    useEffect(() => {
        mountedRef.current = true;
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        const run = async () => {
            try {
                setError(null);
                const res = await fetch(API, { signal: ac.signal, headers: { Accept: "application/json" } });
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                const allBlogs = Array.isArray(json?.blogs) ? json.blogs : [];
                const sorted = allBlogs.sort(sortByCreatedDesc).slice(0, MAX_ITEMS);
                if (!mountedRef.current)
                    return;
                // Only update if payload actually changed
                const newStr = stableStringify(sorted);
                const oldStr = stableStringify(blogs);
                if (newStr !== oldStr) {
                    setBlogs(sorted);
                }
                // stash to session cache
                sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: sorted }));
            }
            catch (e) {
                if (e?.name === "AbortError")
                    return;
                setError("Failed to fetch blogs.");
                // If no cache painted yet, ensure we don't leave null forever
                if (blogs == null)
                    setBlogs([]);
                // eslint-disable-next-line no-console
                console.error("BlogsSec fetch error:", e);
            }
        };
        run();
        return () => {
            mountedRef.current = false;
            ac.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // one-shot; cache handles quick paints, this revalidates
    // Nothing to show (after fetch/cached resolve)
    if (error && (!blogs || blogs.length === 0))
        return null;
    if (blogs == null) {
        // show super-light skeletons while first paint
        return (_jsx("div", { className: "blogs-sec", "aria-busy": "true", children: _jsxs("div", { className: "blogs-bg", children: [_jsx("img", { className: "blogs-bg-tk", src: BlogsBg, alt: "", "aria-hidden": "true" }), _jsxs("div", { className: "blogs-content", children: [_jsxs("div", { className: "blogs-container-sec", children: [_jsx("h1", { className: "blogs-header", children: "BLOGS" }), _jsxs("div", { className: "blogs-container", children: [_jsx(BlogCardSkeleton, {}), _jsx(BlogCardSkeleton, {}), _jsx(BlogCardSkeleton, {})] })] }), _jsx("div", { className: "blogs-sec-nav", children: _jsxs(Link, { to: "/Blogs", className: "nav-blogs", "aria-disabled": "true", children: [_jsx("img", { src: BookIcon, alt: "", "aria-hidden": "true" }), "READ MORE"] }) })] })] }) }));
    }
    if (blogs.length === 0)
        return null;
    return (_jsx("div", { className: "blogs-sec", children: _jsxs("div", { className: "blogs-bg", children: [_jsx("img", { className: "blogs-bg-tk", src: BlogsBg, alt: "Blogs Background" }), _jsxs("div", { className: "blogs-content", children: [_jsxs("div", { className: "blogs-container-sec", children: [_jsx("h1", { className: "blogs-header", children: "BLOGS" }), _jsx("div", { className: "blogs-container", children: blogs.map((b) => (_jsx(BlogCard, { blog: b }, b.blog_id))) })] }), _jsx("div", { className: "blogs-sec-nav", children: _jsxs(Link, { to: "/Blogs", className: "nav-blogs", children: [_jsx("img", { src: BookIcon, alt: "Read More Icon" }), "READ MORE"] }) })] })] }) }));
};
export default BlogsSec;
