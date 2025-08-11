import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../header";
import Footer from "../footer";
import "./singleblog.css";
import silverPencil from "../assets/logos/silverPencil.png";
import silverTime from "../assets/logos/silverTime.jpg";
import attachIcon from "../assets/logos/attachicon.jpg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
/* ---------- stable constants/helpers ---------- */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const UPLOADS_BASE = `${API_BASE}/tara-kabataan-optimized/tara-kabataan-webapp/uploads/blogs-images`;
const DATE_FMT = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });
/** Robust resolver: handles absolute, protocol-relative, server-relative, and bare filenames */
const getFullImageUrl = (path) => {
    if (!path)
        return "";
    if (/^https?:\/\//i.test(path) || path.startsWith("//"))
        return path; // already absolute
    if (path.startsWith("/"))
        return `${API_BASE}${path}`; // server-relative
    return `${UPLOADS_BASE}/${path}`; // bare filename
};
function arraysShallowEqual(a, b) {
    if (a === b)
        return true;
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++)
        if (a[i] !== b[i])
            return false;
    return true;
}
export default function SingleBlog() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [moreImages, setMoreImages] = useState([]);
    const [fullImageUrl, setFullImageUrl] = useState(null);
    const [showAllImagesModal, setShowAllImagesModal] = useState(false);
    const sessionRestored = useRef(false);
    /* ---------- scroll restoration BEFORE paint (no flicker) ---------- */
    useLayoutEffect(() => {
        if (!sessionRestored.current) {
            const y = sessionStorage.getItem("singleBlogScrollY");
            if (y)
                window.scrollTo(0, +y);
            sessionStorage.removeItem("singleBlogScrollY");
            sessionRestored.current = true;
        }
    }, []);
    /* ---------- fetch main blog (abortable, guarded) ---------- */
    useEffect(() => {
        if (!id)
            return;
        const ctrl = new AbortController();
        setLoading(true);
        setNotFound(false);
        fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/blogs.php?blog_id=${id}`, {
            signal: ctrl.signal,
            headers: { Accept: "application/json" },
            cache: "no-store",
        })
            .then((res) => res.json())
            .then((data) => {
            if (data?.blog_id) {
                setBlog((prev) => (prev?.blog_id === data.blog_id ? prev : data));
            }
            else {
                setNotFound(true);
            }
        })
            .catch((e) => {
            if (e?.name !== "AbortError")
                setNotFound(true);
        })
            .finally(() => setLoading(false));
        return () => ctrl.abort();
    }, [id]);
    /* ---------- fetch more images (abortable, pre-resolve URLs) ---------- */
    useEffect(() => {
        if (!id)
            return;
        const ctrl = new AbortController();
        fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/get_blog_images.php?blog_id=${id}`, {
            signal: ctrl.signal,
            headers: { Accept: "application/json" },
            cache: "no-store",
        })
            .then((res) => res.json())
            .then(({ success, images }) => {
            if (success && Array.isArray(images)) {
                const resolved = images.map((p) => getFullImageUrl(p));
                setMoreImages((prev) => (arraysShallowEqual(prev, resolved) ? prev : resolved));
            }
        })
            .catch(() => {
            /* ignore */
        });
        return () => ctrl.abort();
    }, [id]);
    /* ---------- lock background scroll when modal/viewer is open ---------- */
    useEffect(() => {
        const lock = showAllImagesModal || !!fullImageUrl;
        const prev = document.body.style.overflow;
        if (lock)
            document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [showAllImagesModal, fullImageUrl]);
    /* ---------- copy link (stable) ---------- */
    const copyBlogLink = useCallback(async () => {
        const link = window.location.href;
        try {
            await navigator.clipboard.writeText(link);
            toast.success("Link copied!");
        }
        catch {
            const ta = document.createElement("textarea");
            ta.value = link;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            toast.success("Link copied!");
        }
    }, []);
    /* ---------- memoized formatted content & date ---------- */
    const formattedContent = useMemo(() => (blog ? blog.content.replace(/\n/g, "<br>").replace(/  /g, " &nbsp;") : ""), [blog]);
    const formattedDate = useMemo(() => (blog ? DATE_FMT.format(new Date(blog.created_at)) : ""), [blog?.created_at]);
    /* ---------- precompute hero URL & stable openers ---------- */
    const heroUrl = useMemo(() => (blog ? getFullImageUrl(blog.image_url) : ""), [blog?.image_url]);
    const openHero = useCallback(() => setFullImageUrl(heroUrl), [heroUrl]);
    const openFull = useCallback((u) => setFullImageUrl(u), []);
    /* ---------- tiny derived slice ---------- */
    const previewImages = useMemo(() => moreImages.slice(0, 4), [moreImages]);
    if (notFound)
        return _jsx("div", { className: "single-blog-not-found", children: "Blog does not exist." });
    if (loading || !blog)
        return null;
    return (_jsxs("div", { className: "single-blog-container", children: [_jsx(Header, {}), _jsxs("main", { className: "single-blog-main", children: [_jsx("button", { className: "back-button", onClick: () => {
                            sessionStorage.setItem("singleBlogScrollY", window.scrollY.toString());
                            navigate(-1);
                        }, children: "\u2190 Go Back" }), _jsx("div", { className: "single-blog-image-wrapper", children: _jsx("img", { src: heroUrl, alt: blog.title, className: "single-blog-image", loading: "lazy", decoding: "async", style: { cursor: "zoom-in" }, onClick: openHero }) }), moreImages.length > 0 && (_jsx("div", { className: "blog-more-image-grid", children: previewImages.map((img, i) => {
                            const isLast = i === 3 && moreImages.length > 4;
                            return (_jsxs("div", { className: "blog-image-preview", children: [_jsx("img", { src: img, alt: `More ${i}`, loading: "lazy", decoding: "async", style: { cursor: "zoom-in" }, onClick: () => openFull(img) }), isLast && (_jsxs("div", { className: "blog-image-overlay", onClick: () => setShowAllImagesModal(true), children: ["+", moreImages.length - 3] }))] }, i));
                        }) })), _jsxs("div", { className: "single-blog-info", children: [_jsx("h1", { className: "single-blog-title", children: blog.title }), _jsxs("div", { className: "single-blog-meta", children: [_jsxs("div", { className: "single-blog-meta-item", children: [_jsx("span", { className: "single-blog-category", children: blog.category }), _jsx("img", { src: silverTime, alt: "Time", className: "single-blog-icon" }), _jsx("span", { children: formattedDate })] }), _jsxs("div", { className: "single-blog-meta-item", children: [_jsx("img", { src: silverPencil, alt: "Author", className: "single-blog-icon" }), _jsx("span", { children: blog.author })] }), _jsxs("button", { className: "single-blog-copy-link", onClick: copyBlogLink, children: [_jsx("img", { src: attachIcon, alt: "Copy" }), _jsx("span", { children: "Copy Blog Link" })] })] }), _jsx("div", { className: "single-blog-content", dangerouslySetInnerHTML: { __html: formattedContent } })] }), showAllImagesModal && (_jsxs("div", { className: "blog-gallery-modal", children: [_jsx("div", { className: "blog-gallery-overlay", onClick: () => setShowAllImagesModal(false) }), _jsxs("div", { className: "blog-gallery-wrapper", children: [_jsx("button", { className: "blog-gallery-close", onClick: () => setShowAllImagesModal(false), children: "\u2715" }), _jsx("div", { className: "blog-gallery-grid", children: moreImages.map((img, idx) => (_jsx("div", { className: "blog-gallery-thumb", children: _jsx("img", { src: img, alt: `Gallery ${idx}`, loading: "lazy", decoding: "async", onClick: () => openFull(img) }) }, idx))) })] })] })), fullImageUrl && (_jsxs("div", { className: "blog-fullscreen-viewer", children: [_jsx("div", { className: "blog-fullscreen-backdrop", onClick: () => setFullImageUrl(null) }), _jsx("img", { src: fullImageUrl, alt: "Fullscreen", className: "blog-fullscreen-image" }), _jsx("button", { className: "blog-fullscreen-exit", onClick: () => setFullImageUrl(null), children: "\u2715" })] }))] }), _jsx(ToastContainer, { position: "top-center", autoClose: 1500, hideProgressBar: true, closeOnClick: true, pauseOnFocusLoss: false, pauseOnHover: false, className: "custom-toast-container", toastClassName: "custom-toast", limit: 1 }), _jsx(Footer, {})] }));
}
