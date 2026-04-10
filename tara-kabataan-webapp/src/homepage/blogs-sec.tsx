import React, { useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import "./css/blogs-sec.css";
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

const API = `${import.meta.env.VITE_API_BASE_URL}/blogs.php`;
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp-v2.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";
const MAX_ITEMS = 3;

// BULLETPROOF S3 HELPER
const getSafeImageUrl = (url?: string | null) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("//")) return url;

  let cleanPath = url.startsWith("/") ? url.substring(1) : url;

  if (cleanPath.startsWith("tara-kabataan-webapp/uploads/")) {
    cleanPath = cleanPath.replace("tara-kabataan-webapp/uploads/", "");
  } else if (cleanPath.startsWith("tara-kabataan-optimized/tara-kabataan-webapp/uploads/")) {
    cleanPath = cleanPath.replace("tara-kabataan-optimized/tara-kabataan-webapp/uploads/", "");
  }

  if (!cleanPath.includes("/")) {
    cleanPath = `blogs-images/${cleanPath}`;
  }

  const [pathPart, queryPart] = cleanPath.split("?");
  let full = `${IMAGE_BASE}/${pathPart}`;
  if (queryPart) full += `?${queryPart}`;
  
  return full;
};

const stripToText = (html?: string) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

const sortByCreatedDesc = (a: Blog, b: Blog) =>
  (new Date(b.created_at || 0).getTime() || 0) - (new Date(a.created_at || 0).getTime() || 0);

// -- Blog Card Component --
const BlogCard = memo<{ blog: Blog }>(({ blog }) => {
  const { blog_id, title, image_url, category, content } = blog;
  const [imgOk, setImgOk] = useState(true);
  const imgSrc = useMemo(() => getSafeImageUrl(image_url), [image_url]);
  const preview = useMemo(() => stripToText(content), [content]);

  return (
    <Link to={`/blog/${blog_id}`} className="blog-box" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="blogs-image-container">
        {imgOk && imgSrc ? (
          <img src={imgSrc} alt={title || `Blog ${blog_id}`} loading="lazy" onError={() => setImgOk(false)} />
        ) : (
          <div className="no-image-fallback">No Image Available</div>
        )}
      </div>
      <div className="blog-title"><h1>{title}</h1></div>
      <div className="blog-category"><p>{category}</p></div>
      <div className="blog-description">{preview}</div>
    </Link>
  );
});
BlogCard.displayName = "BlogCard";


const BlogsSec: React.FC = () => {
  // ZERO LATENCY FIX: Pull from cache immediately
  const [blogs, setBlogs] = useState<Blog[] | null>(() => {
    const cachedRaw = localStorage.getItem("tk_homepage_blogs");
    return cachedRaw ? JSON.parse(cachedRaw) : null;
  });

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const fetchBlogs = async () => {
      try {
        const res = await fetch(API, { signal: ac.signal, headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const allBlogs: Blog[] = Array.isArray(json?.blogs) ? json.blogs : [];
        
        // Filter for Pinned, sort by date, limit to 3
        const finalItems = allBlogs
          .filter((b) => b.blog_status?.toUpperCase() === "PINNED")
          .sort(sortByCreatedDesc)
          .slice(0, MAX_ITEMS);

        // Update Screen and Cache
        setBlogs(finalItems);
        localStorage.setItem("tk_homepage_blogs", JSON.stringify(finalItems));

      } catch (e: unknown) {
        if ((e as any)?.name === "AbortError") return;
        if (blogs == null) setBlogs([]);
        console.error("BlogsSec fetch error:", e);
      }
    };

    fetchBlogs();
    return () => ac.abort();
  }, []); 

  // Empty state handling
  if (blogs === null || blogs.length === 0) return null;

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