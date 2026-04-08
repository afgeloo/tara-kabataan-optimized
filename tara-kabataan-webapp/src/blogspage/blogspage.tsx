// src/blogspage/blogspage.tsx

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
  memo,
  useTransition,
} from "react";
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

export interface Blog {
  blog_id: string;
  title: string;
  content: string; // Added so SingleBlog can share this type safely
  image_url: string;
  category: string;
  created_at: string;
  author: string;
  blog_status?: string;
}
export type BlogView = Blog & { _dateText: string };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const CATEGORIES = ["ALL", "KALUSUGAN", "KALIKASAN", "KARUNUNGAN", "KULTURA", "KASARIAN"] as const;
const DATE_FMT = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

// --- ROBUST S3 IMAGE RESOLVER (Exported for SingleBlog to reuse) ---
export const getSafeBlogImageUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("//")) return url;

  const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";
  
  let cleanPath = url
    .replace(/^\/?tara-kabataan-optimized\/tara-kabataan-webapp\/uploads\//, "")
    .replace("blogs-images/blogs-images/", "blogs-images/");

  if (cleanPath.startsWith("/")) cleanPath = cleanPath.substring(1);
  return `${IMAGE_BASE}/${cleanPath}`;
};

// --- ZERO LATENCY GLOBAL CACHE ---
export let _globalBlogsCache: BlogView[] | null = null;
export let _globalPinnedBlogsCache: BlogView[] | null = null;
export let _globalBlogsCacheAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/* ----------------- SUBCOMPONENTS (memoized) ----------------- */

const PinnedBlogsSection = memo(function PinnedBlogsSection({ pinnedBlogs, onOpen }: { pinnedBlogs: BlogView[]; onOpen: (id: string) => void; }) {
  if (!pinnedBlogs.length) return null;

  return (
    <>
      <div className="blogs-page-pinned-header">
        <h2>{pinnedBlogs.length === 1 ? "Pinned Blog" : "Pinned Blogs"}</h2>
      </div>
      <div className="blogs-page-pinned-blogs">
        {pinnedBlogs.length === 1 && (
          <div className="blogs-page-pinned-container blogs-page-pinned-single">
            <div className="blogs-page-pinned-full" style={{ "--bg-image": `url(${getSafeBlogImageUrl(pinnedBlogs[0].image_url)})` } as React.CSSProperties} onClick={() => onOpen(pinnedBlogs[0].blog_id)}>
              <div className="blogs-page-pinned-overlay">
                <p className="blogs-page-pinned-category-1">{pinnedBlogs[0].category}</p>
                <h3 className="blogs-page-pinned-title-1">{pinnedBlogs[0].title}</h3>
                <p className="blogs-page-pinned-meta-1"><img src={timeiconwhite} className="blogs-page-timeiconwhite" />{pinnedBlogs[0]._dateText}<img src={authoriconwhite} className="blogs-page-authoriconwhite" />{pinnedBlogs[0].author}</p>
              </div>
            </div>
          </div>
        )}
        {pinnedBlogs.length === 2 && (
          <div className="blogs-page-pinned-container blogs-page-pinned-double">
            {pinnedBlogs.map((blog) => (
              <div key={blog.blog_id} className="blogs-page-pinned-half" style={{ "--bg-image": `url(${getSafeBlogImageUrl(blog.image_url)})` } as React.CSSProperties} onClick={() => onOpen(blog.blog_id)}>
                <div className="blogs-page-pinned-overlay">
                  <p className="blogs-page-pinned-category-1">{blog.category}</p>
                  <h3 className="blogs-page-pinned-title-1">{blog.title}</h3>
                  <p className="blogs-page-pinned-meta-1"><img src={timeiconwhite} className="blogs-page-timeiconwhite" />{blog._dateText}<img src={authoriconwhite} className="blogs-page-authoriconwhite" />{blog.author}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {pinnedBlogs.length >= 3 && (
          <div className="blogs-page-pinned-container">
            <div className="blogs-page-pinned-main" style={{ "--bg-image": `url(${getSafeBlogImageUrl(pinnedBlogs[0].image_url)})` } as React.CSSProperties} onClick={() => onOpen(pinnedBlogs[0].blog_id)}>
              <div className="blogs-page-pinned-overlay">
                <p className="blogs-page-pinned-category-1">{pinnedBlogs[0].category}</p>
                <h3 className="blogs-page-pinned-title-1">{pinnedBlogs[0].title}</h3>
                <p className="blogs-page-pinned-meta-1"><img src={timeiconwhite} className="blogs-page-timeiconwhite" />{pinnedBlogs[0]._dateText}<img src={authoriconwhite} className="blogs-page-authoriconwhite" />{pinnedBlogs[0].author}</p>
              </div>
            </div>
            <div className="blogs-page-pinned-side">
              {pinnedBlogs.slice(1, 3).map((blog) => (
                <div key={blog.blog_id} className="blogs-page-pinned-item" style={{ "--bg-image": `url(${getSafeBlogImageUrl(blog.image_url)})` } as React.CSSProperties} onClick={() => onOpen(blog.blog_id)}>
                  <div className="blogs-page-pinned-overlay">
                    <p className="blogs-page-pinned-category-2">{blog.category}</p>
                    <h3 className="blogs-page-pinned-title-2">{blog.title}</h3>
                    <p className="blogs-page-pinned-meta-2"><img src={timeiconwhite} className="blogs-page-timeiconwhite" />{blog._dateText}<img src={authoriconwhite} className="blogs-page-authoriconwhite" />{blog.author}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
});

const BlogGrid = memo(function BlogGrid({ blogs, onOpen }: { blogs: BlogView[]; onOpen: (id: string) => void; }) {
  if (!blogs.length) return <div className="no-blogs-container"><p>No blogs found.</p></div>;

  return (
    <div className="blogs-page-blogs-grid">
      {blogs.map((blog) => (
        <div key={blog.blog_id} className="blogs-page-blog-item">
          <img src={getSafeBlogImageUrl(blog.image_url)} alt={blog.title} onClick={() => onOpen(blog.blog_id)} loading="lazy" decoding="async" style={{ cursor: "pointer" }} />
          <div className="blogs-page-pinned-overlay">
            <p className="blogs-page-pinned-category-3">{blog.category}</p>
            <h3 className="blogs-page-pinned-title-3" onClick={() => onOpen(blog.blog_id)} style={{ cursor: "pointer" }}>{blog.title}</h3>
            <p className="blogs-page-pinned-meta-3"><img src={timeblack} className="blogs-page-time-black" />{blog._dateText}<img src={authorblack} className="blogs-page-author-black" />{blog.author}</p>
          </div>
        </div>
      ))}
    </div>
  );
});

/* ----------------- MAIN COMPONENT ----------------- */

export default function BlogsPage() {
  const navigate = useNavigate();
  const sessionRestored = useRef(false);
  const [isPending, startTransition] = useTransition();

  const [selectedCategory, setSelectedCategory] = useState<string>(() => sessionStorage.getItem("blogCategory") || "ALL");
  const [searchQuery, setSearchQuery] = useState<string>(() => sessionStorage.getItem("blogSearchQuery") || "");
  const [showAllBlogs, setShowAllBlogs] = useState<boolean>(() => sessionStorage.getItem("blogShowAll") === "true");

  // Zero-latency init
  const [pinnedBlogs, setPinnedBlogs] = useState<BlogView[]>(_globalPinnedBlogsCache || []);
  const [allBlogs, setAllBlogs] = useState<BlogView[]>(_globalBlogsCache || []);
  const [loading, setLoading] = useState<boolean>(!_globalBlogsCache);
  const [restoringScroll, setRestoringScroll] = useState<boolean>(true);

  const categories = useMemo(() => [...CATEGORIES], []);

  const goToBlog = useCallback((id: string) => {
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
        const mapDate = (b: Blog): BlogView => ({ ...b, _dateText: DATE_FMT.format(new Date(b.created_at)) });

        const published: BlogView[] = (data.blogs as Blog[]).filter((b) => (b.blog_status || "").toUpperCase() === "PUBLISHED").map(mapDate);
        const pinned: BlogView[] = ((data.pinned as Blog[]) ?? []).map(mapDate);
        const merged: BlogView[] = [...pinned, ...published];

        _globalBlogsCache = merged;
        _globalPinnedBlogsCache = pinned;
        _globalBlogsCacheAt = Date.now();

        setPinnedBlogs(pinned);
        setAllBlogs(merged);
      })
      .catch((e) => { if (e?.name !== "AbortError") console.error(e); })
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
  const debouncedSet = useMemo(() => debounce((next: string) => { setSearchFilter(next.toLowerCase()); sessionStorage.setItem("blogSearchQuery", next); }, 300), []);
  useEffect(() => () => debouncedSet.cancel?.(), [debouncedSet]);

  const onSearchChange = useCallback((val: string) => { setSearchQuery(val); debouncedSet(val); }, [debouncedSet]);
  const pinnedSet = useMemo(() => new Set(pinnedBlogs.map((b) => b.blog_id)), [pinnedBlogs]);

  const filteredBlogs = useMemo(() => {
    if (!blogsByCategory.length) return [];
    const q = searchFilter;
    const list = q ? blogsByCategory.filter((b) => b.title.toLowerCase().includes(q)) : blogsByCategory;
    return list.filter((b) => !pinnedSet.has(b.blog_id));
  }, [blogsByCategory, pinnedSet, searchFilter]);

  const displayedBlogs = useMemo(() => (showAllBlogs ? filteredBlogs : filteredBlogs.slice(0, 4)), [filteredBlogs, showAllBlogs]);
  const toggleSeeMore = useCallback(() => { startTransition(() => setShowAllBlogs((v) => !v)); }, []);

  return (
    <div className="blogs-page">
      <Header />
      {pinnedBlogs.length > 0 && <PinnedBlogsSection pinnedBlogs={pinnedBlogs} onOpen={goToBlog} />}
      <div className="blogs-page-blog-categories">
        <h2 className="blogs-page-blogs-header" style={{ fontFamily: "'Bogart Trial', sans-serif" }}>Blogs</h2>
        <div className="blogs-category-dropdown-search-bar">
          <div className="blogs-category-buttons-desktop blogs-page-category-list">
            {categories.map((cat) => (
              <span key={cat} className={selectedCategory === cat ? "active-category" : ""} onClick={() => setSelectedCategory(cat)}>{cat}</span>
            ))}
          </div>
          <div className="blogs-category-dropdown-mobile">
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="blogs-category-select">
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="blog-searchbar-container">
            <input type="text" placeholder="Search blogs..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="blog-searchbar-input" />
            <img src={searchIconEventspage} alt="Search" className="blog-searchbar-icon" />
          </div>
        </div>
      </div>
      <hr className="blogs-page-Hr" />
      <div className="blogs-page-blogs-list">
        {loading || restoringScroll ? <Preloader /> : <BlogGrid blogs={displayedBlogs} onOpen={goToBlog} />}
      </div>
      {filteredBlogs.length > 4 && (
        <button className="blogs-page-see-more-btn" onClick={toggleSeeMore} disabled={isPending}>{showAllBlogs ? "Show Less" : "See More"}</button>
      )}
      <Footer />
    </div>
  );
}