import React, { useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import "./css/blogs-sec.css";

// Prefer bundler-managed assets over raw ./src paths
import BlogsBg from "../assets/homepage/blogs-bg.png";
import BookIcon from "../assets/homepage/book.png";

type Blog = {
  blog_id: string;
  title: string;
  image_url?: string;
  category: string;
  content?: string;
  blog_status?: string;
  created_at?: string;
};

// -- Config ------------------------------------------------------------------

const API = `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan/tara-kabataan-backend/api/blogs.php`;
const MAX_ITEMS = 3;
const CACHE_KEY = "blogsSec.cache.v1";
const CACHE_TTL_MS = 60_000; // 1 min (tweak as you like)
const PREVIEW_CHARS = 140;

// -- Utils -------------------------------------------------------------------

const getSafeImageUrl = (url?: string) => {
  if (!url) return "";
  // If API already returns absolute, use as-is
  if (/^https?:\/\//i.test(url)) return url;
  // If it's a server-relative path, prefix base URL
  return `${import.meta.env.VITE_API_BASE_URL}${url}`;
};

const stripToText = (html?: string) => {
  if (!html) return "";
  // Avoid regex for HTML; DOMParser is quick & safe in-browser
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n).trimEnd() + "…" : s);

// Sort newest first; tolerate missing dates
const sortByCreatedDesc = (a: Blog, b: Blog) =>
  (new Date(b.created_at || 0).getTime() || 0) - (new Date(a.created_at || 0).getTime() || 0);

// Tiny in-memory dedupe to avoid setState storms on identical payloads
const stableStringify = (v: unknown) => {
  try {
    return JSON.stringify(v);
  } catch {
    return "";
  }
};

// -- Blog Card ---------------------------------------------------------------

type BlogCardProps = {
  blog: Blog;
};

const BlogCard = memo<BlogCardProps>(({ blog }) => {
  const { blog_id, title, image_url, category, content } = blog;
  const [imgOk, setImgOk] = useState(true);

  const imgSrc = useMemo(() => getSafeImageUrl(image_url), [image_url]);
  const preview = useMemo(() => stripToText(content), [content]);

  const onError = useCallback(() => setImgOk(false), []);

  return (
    <Link
      to={`/blog/${blog_id}`}
      className="blog-box"
      style={{ textDecoration: "none", color: "inherit" }}
      aria-label={`Open blog: ${title}`}
    >
      <div className="blogs-image-container">
        {imgOk && imgSrc ? (
          <img
            src={imgSrc}
            alt={title || `Blog ${blog_id}`}
            loading="lazy"
            decoding="async"
            onError={onError}
            // Prevent layout shift if you can size via CSS (recommended)
          />
        ) : (
          <div className="no-image-fallback" aria-hidden="true">
            No Image Available
          </div>
        )}
      </div>

      <div className="blog-title">
        <h1>{title}</h1>
      </div>

      <div className="blog-category">
        <p>{category}</p>
      </div>

      <div className="blog-description">{preview}</div>
    </Link>
  );
});
BlogCard.displayName = "BlogCard";

// -- Skeleton (optional; keep super light) -----------------------------------

const BlogCardSkeleton = () => (
  <div className="blog-box skeleton">
    <div className="blogs-image-container skeleton-block" />
    <div className="blog-title skeleton-line" />
    <div className="blog-category skeleton-line" />
    <div className="blog-description skeleton-lines" />
  </div>
);

// -- Main --------------------------------------------------------------------

const BlogsSec: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Load from cache immediately (for instant paint)
  useEffect(() => {
    const cachedRaw = sessionStorage.getItem(CACHE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw) as { ts: number; data: Blog[] };
        if (Date.now() - cached.ts < CACHE_TTL_MS && Array.isArray(cached.data)) {
          setBlogs(cached.data.slice(0, MAX_ITEMS));
        }
      } catch {}
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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const allBlogs: Blog[] = Array.isArray(json?.blogs) ? json.blogs : [];
        const sorted = allBlogs.sort(sortByCreatedDesc).slice(0, MAX_ITEMS);

        if (!mountedRef.current) return;

        // Only update if payload actually changed
        const newStr = stableStringify(sorted);
        const oldStr = stableStringify(blogs);
        if (newStr !== oldStr) {
          setBlogs(sorted);
        }

        // stash to session cache
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: sorted }));
      } catch (e: unknown) {
        if ((e as any)?.name === "AbortError") return;
        setError("Failed to fetch blogs.");
        // If no cache painted yet, ensure we don't leave null forever
        if (blogs == null) setBlogs([]);
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
  if (error && (!blogs || blogs.length === 0)) return null;
  if (blogs == null) {
    // show super-light skeletons while first paint
    return (
      <div className="blogs-sec" aria-busy="true">
        <div className="blogs-bg">
          <img className="blogs-bg-tk" src={BlogsBg} alt="" aria-hidden="true" />
          <div className="blogs-content">
            <div className="blogs-container-sec">
              <h1 className="blogs-header">BLOGS</h1>
              <div className="blogs-container">
                <BlogCardSkeleton />
                <BlogCardSkeleton />
                <BlogCardSkeleton />
              </div>
            </div>
            <div className="blogs-sec-nav">
              <Link to="/Blogs" className="nav-blogs" aria-disabled="true">
                <img src={BookIcon} alt="" aria-hidden="true" />
                READ MORE
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (blogs.length === 0) return null;

  return (
    <div className="blogs-sec">
      <div className="blogs-bg">
        <img className="blogs-bg-tk" src={BlogsBg} alt="Blogs Background" />
        <div className="blogs-content">
          <div className="blogs-container-sec">
            <h1 className="blogs-header">BLOGS</h1>
            <div className="blogs-container">
              {blogs.map((b) => (
                <BlogCard key={b.blog_id} blog={b} />
              ))}
            </div>
          </div>
          <div className="blogs-sec-nav">
            <Link to="/Blogs" className="nav-blogs">
              <img src={BookIcon} alt="Read More Icon" />
              READ MORE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogsSec;
