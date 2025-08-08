// AdminBlogs.tsx
import "./css/admin-blogs.css";
import {
  FaSearch,
  FaPlus,
  FaBold,
  FaItalic,
  FaUnderline,
  FaImage,
  FaListUl,
  FaUndo,
  FaRedo,
  FaTimes,
} from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import selectIcon from "../assets/adminpage/blogs/select.png";
import { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "./utils/cropImage";

interface Blog {
  blog_id: string;
  title: string;
  category: string;
  author: string;
  blog_status: "DRAFT" | "PUBLISHED" | "PINNED" | "ARCHIVED" | string;
  created_at: string;
  content: string;
  image_url: string;
  more_images?: string[];
  // Some APIs in your code referenced is_pinned
  is_pinned?: 0 | 1;
}

type ViewMode = "table" | "grid";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const CATEGORIES = ["All", "Kalusugan", "Kalikasan", "Karunungan", "Kultura", "Kasarian"] as const;
const NEW_CATEGORIES = ["KALUSUGAN", "KALIKASAN", "KARUNUNGAN", "KULTURA", "KASARIAN"] as const;
const STATUS_FILTER = ["All", "Draft", "Published", "Pinned", "Archived"] as const;
const STATUS_EDIT_FROM_DRAFT = ["DRAFT", "PUBLISHED"] as const;
const STATUS_EDIT_OTHERS = ["PUBLISHED", "PINNED", "ARCHIVED"] as const;
const STATUS_BULK = ["DRAFT", "PUBLISHED", "PINNED", "ARCHIVED"] as const;
const ITEMS_PER_PAGE = 8;
const MAX_PINNED = 3;

const DT_FMT = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });
const formatDate = (ts: string) => DT_FMT.format(new Date(ts));

const getFullUrl = (path = "") =>
  /^https?:\/\//i.test(path) || path.startsWith("//")
    ? path
    : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

const AdminBlogs = () => {
  // ------------------------------------
  // Core state
  // ------------------------------------
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // UI filters/sorts/paging
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [selectedStatus, setSelectedStatus] = useState<(typeof STATUS_FILTER)[number]>("All");
  const [createdSortOrder, setCreatedSortOrder] = useState<"Newest First" | "Oldest First">("Newest First");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search to reduce work
  const searchDebounceRef = useRef<number | null>(null);
  const onSearchChange = useCallback((val: string) => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = window.setTimeout(() => setSearchQuery(val), 250);
  }, []);

  // Dropdowns
  const [openCategory, setOpenCategory] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [openCreatedAt, setOpenCreatedAt] = useState(false);

  // Bulk & selection
  const [selectMode, setSelectMode] = useState(false);
  const [selectedBlogIds, setSelectedBlogIds] = useState<string[]>([]);
  const [bulkConfirmVisible, setBulkConfirmVisible] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<"delete" | "status" | null>(null);
  const [bulkActionStatus, setBulkActionStatus] = useState<string>("");

  // Modals & selection
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableBlog, setEditableBlog] = useState<Blog | null>(null);
  const [initialStatus, setInitialStatus] = useState<string>("");

  // Notifications (inline UI bar)
  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState<"success" | "error">("success");
  const showNote = useCallback((msg: string, type: "success" | "error" = "success", ms = 4000) => {
    setNotificationType(type);
    setNotification(msg);
    window.setTimeout(() => setNotification(""), ms);
  }, []);

  // ------------------------------------
  // Auth/profile (kept as-is but streamlined)
  // ------------------------------------
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState<string>("");
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [showCropper, setShowCropper] = useState(false);
  const [cropSrc, setCropSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropMode, setCropMode] = useState<"new" | "edit">("new");
  const [croppedArea, setCroppedArea] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  // ------------------------------------
  // New blog state
  // ------------------------------------
  const [newBlogModalOpen, setNewBlogModalOpen] = useState(false);
  const [newBlogTitle, setNewBlogTitle] = useState("");
  const [newBlogCategory, setNewBlogCategory] = useState<(typeof NEW_CATEGORIES)[number]>("KALUSUGAN");
  const [newBlogStatus, setNewBlogStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [newBlogAuthor, setNewBlogAuthor] = useState("");
  const [newBlogAuthorName, setNewBlogAuthorName] = useState("");
  const [newBlogContent, setNewBlogContent] = useState("");
  const [newBlogImage, setNewBlogImage] = useState("");
  const [newBlogMoreImages, setNewBlogMoreImages] = useState<string[]>([]);
  const [showAllImagesModal, setShowAllImagesModal] = useState(false);

  // Edit blog extra images
  const [editableBlogMoreImages, setEditableBlogMoreImages] = useState<string[]>([]);
  const [fullImageUrl, setFullImageUrl] = useState("");
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [confirmThumbDeleteIndex, setConfirmThumbDeleteIndex] = useState<number | null>(null);

  // Content editable ref
  const textareaRef = useRef<HTMLDivElement>(null);
  const rawText = textareaRef.current?.innerText.trim() ?? "";

  // ------------------------------------
  // Fetch blogs (abortable)
  // ------------------------------------
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/blogs.php`, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.blogs && Array.isArray(data.blogs)) {
          setBlogs(
            data.blogs.map((b: Blog) => ({
              ...b,
              more_images: b.more_images ?? [],
            }))
          );
        } else {
          toast.error("Invalid blogs payload.");
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Failed to fetch blogs:", err);
          toast.error("Unable to load blogs.");
        }
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, []);

  // ------------------------------------
  // Logged-in user
  // ------------------------------------
  useEffect(() => {
    const storedUser = localStorage.getItem("admin-user");
    if (!storedUser) return;
    try {
      const parsed = JSON.parse(storedUser);
      setLoggedInUser(parsed);
    } catch {
      console.error("Failed to parse stored user");
    }
  }, []);

  useEffect(() => {
    if (showProfileModal && loggedInUser) {
      setProfileEmail(loggedInUser.user_email || "");
      setProfilePhone(loggedInUser.user_contact || "");
      setProfilePassword("");
      setOldPassword("");
    }
  }, [showProfileModal, loggedInUser]);

  useEffect(() => {
    if (newBlogModalOpen && loggedInUser) {
      setNewBlogAuthor(loggedInUser.user_id);
      setNewBlogAuthorName(loggedInUser.user_name);
    }
  }, [newBlogModalOpen, loggedInUser]);

  // ------------------------------------
  // Filtering & sorting (memoized)
  // ------------------------------------
  const filteredBlogs = useMemo(() => {
    const s = searchQuery.trim().toLowerCase();
    const list = blogs.filter((b) => {
      const matchCategory =
        selectedCategory === "All" || b.category?.toLowerCase() === selectedCategory.toLowerCase();
      const matchStatus =
        selectedStatus === "All" || b.blog_status?.toLowerCase() === selectedStatus.toLowerCase();
      const matchSearch =
        !s ||
        b.blog_id?.toLowerCase().includes(s) ||
        b.title?.toLowerCase().includes(s) ||
        b.category?.toLowerCase().includes(s) ||
        b.author?.toLowerCase().includes(s) ||
        b.blog_status?.toLowerCase().includes(s) ||
        formatDate(b.created_at).toLowerCase().includes(s);

      return matchCategory && matchStatus && matchSearch;
    });

    const sorted = list.sort((a, b) => {
      const pinA = a.blog_status.toLowerCase() === "pinned";
      const pinB = b.blog_status.toLowerCase() === "pinned";
      if (pinA !== pinB) return pinA ? -1 : 1;

      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return createdSortOrder === "Newest First" ? db - da : da - db;
    });

    return sorted;
  }, [blogs, selectedCategory, selectedStatus, createdSortOrder, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedStatus, createdSortOrder, searchQuery]);

  const totalPages = Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE) || 1;
  const paginatedBlogs = useMemo(
    () => filteredBlogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [filteredBlogs, currentPage]
  );

  // ------------------------------------
  // Editing controls
  // ------------------------------------
  const editStatusOptions = useCallback(
    () => (initialStatus === "DRAFT" ? STATUS_EDIT_FROM_DRAFT : STATUS_EDIT_OTHERS),
    [initialStatus]
  );

  const handleEdit = useCallback(() => {
    if (!selectedBlog) return;
    setEditableBlog({ ...selectedBlog });
    setInitialStatus(selectedBlog.blog_status);
    setEditableBlogMoreImages(selectedBlog.more_images || []);
    // seed the editor
    requestIdleCallback?.(() => {
      if (textareaRef.current) textareaRef.current.innerHTML = selectedBlog.content || "";
    });
    setIsEditing(true);
  }, [selectedBlog]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditableBlog(null);
  }, []);

  // Keep contentEditable synced when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current && editableBlog?.content) {
      textareaRef.current.innerHTML = editableBlog.content;
    }
  }, [isEditing, editableBlog?.content]);

  // ------------------------------------
  // Save blog (edit)
  // ------------------------------------
  const [submittedEdit, setSubmittedEdit] = useState(false);
  const handleSave = useCallback(() => {
    setSubmittedEdit(true);
    const updatedHTML = textareaRef.current?.innerHTML ?? "";
    const stripped = updatedHTML.replace(/<[^>]+>/g, "").trim();

    setEditableBlog((prev) => (prev ? { ...prev, content: updatedHTML } : prev));

    if (!editableBlog?.title?.trim() || !editableBlog?.image_url || !updatedHTML.trim() || !stripped) {
      showNote("Please fill out all required fields marked with *", "error");
      return;
    }

    const merged: Blog = {
      ...editableBlog,
      content: updatedHTML,
      more_images: editableBlogMoreImages,
    } as Blog;

    fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/update_blogs.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(merged),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBlogs((prev) => prev.map((b) => (b.blog_id === merged.blog_id ? merged : b)));
          setSelectedBlog(merged);
          setIsEditing(false);
          setSubmittedEdit(false);
          showNote("Blog updated successfully!", "success");
        } else {
          showNote("Failed to update blog.", "error");
        }
      })
      .catch((e) => {
        console.error("Update error:", e);
        showNote("Error occurred while updating blog.", "error");
      });
  }, [editableBlog, editableBlogMoreImages, showNote]);

  // ------------------------------------
  // Image handling (crop + upload)
  // ------------------------------------
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, mode: "new" | "edit") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      setCropSrc(rd.result as string);
      setCropMode(mode);
      setShowCropper(true);
    };
    rd.readAsDataURL(file);
  }, []);

  const applyCrop = useCallback(async () => {
    try {
      const blob = await getCroppedImg(cropSrc, croppedArea);
      const form = new FormData();
      form.append("image", blob, "cropped.jpg");

      let endpoint = "";
      if (cropMode === "new") {
        endpoint = `${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/add_new_blog_image.php`;
      } else {
        endpoint = `${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/upload_blog_image.php`;
        if (editableBlog?.blog_id) form.append("blog_id", editableBlog.blog_id);
      }

      const res = await fetch(endpoint, { method: "POST", body: form });
      const data = await res.json();

      if (data.success && data.image_url) {
        if (cropMode === "new") {
          setNewBlogImage(data.image_url);
        } else {
          setEditableBlog((prev) => (prev ? { ...prev, image_url: data.image_url } : prev));
        }
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      console.error("applyCrop error:", err);
      toast.error("An error occurred while uploading");
    } finally {
      setShowCropper(false);
    }
  }, [cropSrc, croppedArea, cropMode, editableBlog?.blog_id]);

  const handleImageRemove = useCallback(() => {
    if (!editableBlog) return;
    setEditableBlog({ ...editableBlog, image_url: "" });
  }, [editableBlog]);

  // ------------------------------------
  // Delete blog
  // ------------------------------------
  const confirmDeleteBlog = useCallback(() => {
    if (!selectedBlog) return;

    fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/delete_blogs.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blog_id: selectedBlog.blog_id }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBlogs((prev) => prev.filter((b) => b.blog_id !== selectedBlog.blog_id));
          showNote("Blog deleted successfully!", "success", 2500);
          setTimeout(() => setSelectedBlog(null), 2500);
        } else {
          showNote("Failed to delete blog.", "error");
        }
      })
      .catch((e) => {
        console.error("Delete error:", e);
        showNote("Error occurred while deleting blog.", "error");
      });

    setConfirmDeleteVisible(false);
  }, [selectedBlog, showNote]);

  // ------------------------------------
  // Pin/unpin (max 3)
  // ------------------------------------
  const pinnedCount = useMemo(() => blogs.filter((b) => b.blog_status === "PINNED").length, [blogs]);

  const togglePinBlog = useCallback(
    (blogId: string, currentPinned: boolean) => {
      if (!currentPinned && pinnedCount >= MAX_PINNED) {
        showNote("You can only pin up to 3 blogs. Please unpin one first.", "error");
        return;
      }

      fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/update_blog_pin_status.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blog_id: blogId, is_pinned: currentPinned ? 0 : 1 }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setBlogs((prev) =>
              prev.map((blog) =>
                blog.blog_id === blogId ? { ...blog, is_pinned: currentPinned ? 0 : 1 } : blog
              )
            );
            showNote(currentPinned ? "Blog unpinned." : "Blog pinned!", "success");
          } else {
            showNote("Failed to update pin status.", "error");
          }
        })
        .catch((err) => {
          console.error("Pin error:", err);
          showNote("An error occurred while pinning.", "error");
        });
    },
    [pinnedCount, showNote]
  );

  // ------------------------------------
  // Bulk actions
  // ------------------------------------
  const applyBulkStatus = useCallback(
    async (newStatus: string) => {
      if (newStatus === "PINNED") {
        const tryingToPinCount = selectedBlogIds.length;
        const alreadyPinned = blogs.filter((b) => b.blog_status === "PINNED").length;
        if (alreadyPinned + tryingToPinCount > MAX_PINNED) {
          showNote("You can only pin up to 3 blogs. Please unpin one first.", "error");
          return;
        }
      }

      try {
        const res = await fetch(
          `${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/update_bulk_blog_status.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              blog_ids: selectedBlogIds,
              new_status: newStatus,
              more_images: editableBlogMoreImages,
            }),
          }
        );
        const data = await res.json();
        if (data.success) {
          setBlogs((prev) =>
            prev.map((b) => (selectedBlogIds.includes(b.blog_id) ? { ...b, blog_status: newStatus } : b))
          );
          setSelectedBlogIds([]);
          setSelectMode(false);
          showNote(`Successfully updated blogs to ${newStatus}!`, "success");
        } else {
          showNote("Failed to update blog status.", "error");
        }
      } catch (e) {
        console.error("Bulk status update error:", e);
        showNote("Error occurred during bulk status update.", "error");
      }
    },
    [selectedBlogIds, editableBlogMoreImages, blogs, showNote]
  );

  const handleBulkDelete = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/delete_bulk_blogs.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blog_ids: selectedBlogIds }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setBlogs((prev) => prev.filter((b) => !selectedBlogIds.includes(b.blog_id)));
        setSelectedBlogIds([]);
        setSelectMode(false);
        showNote("Deleted selected blogs.", "success");
      } else {
        showNote("Failed to delete blogs.", "error");
      }
    } catch (e) {
      console.error("Bulk delete error:", e);
      showNote("Error occurred during bulk delete.", "error");
    }
  }, [selectedBlogIds, showNote]);

  // ------------------------------------
  // New blog save
  // ------------------------------------
  const [submitted, setSubmitted] = useState(false);

  const resetNewBlogForm = useCallback(() => {
    setNewBlogTitle("");
    setNewBlogContent("");
    setNewBlogCategory("KALUSUGAN");
    setNewBlogStatus("DRAFT");
    setNewBlogImage("");
  }, []);

  const handleNewBlogSave = useCallback(async () => {
    setSubmitted(true);
    if (!newBlogTitle.trim() || !newBlogContent.trim() || !newBlogImage) {
      showNote("Please fill out all required fields marked with *", "error");
      return;
    }

    const blogData = {
      title: newBlogTitle,
      content: newBlogContent,
      category: newBlogCategory,
      blog_status: newBlogStatus,
      image_url: newBlogImage,
      author: newBlogAuthor,
      more_images: newBlogMoreImages,
    };

    try {
      const res = await fetch(
        `${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/add_new_blog.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(blogData),
        }
      );
      const data = await res.json();

      if (data.success && data.blog) {
        // Refresh list (or optimistically add)
        setBlogs((prev) => [...prev, data.blog]);

        // OPTIONAL: fetch fresh list
        try {
          const fresh = await fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/blogs.php`).then(
            (r) => r.json()
          );
          if (fresh?.blogs) setBlogs(fresh.blogs);
        } catch {
          // ignore
        }

        resetNewBlogForm();
        setNewBlogMoreImages([]);
        setShowAllImagesModal(false);
        setNewBlogModalOpen(false);
        showNote("New blog added!", "success");
      } else {
        showNote("Failed to save new blog.", "error");
      }
    } catch (e) {
      console.error("Save error:", e);
      showNote("Error occurred while saving blog.", "error");
    }
  }, [
    newBlogTitle,
    newBlogContent,
    newBlogImage,
    newBlogCategory,
    newBlogStatus,
    newBlogAuthor,
    newBlogMoreImages,
    resetNewBlogForm,
    showNote,
  ]);

  // ------------------------------------
  // Content formatting helpers
  // ------------------------------------
  const selectionRef = useRef<Range | null>(null);
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) selectionRef.current = sel.getRangeAt(0);
  };
  const restoreSelection = () => {
    const sel = window.getSelection();
    if (selectionRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(selectionRef.current);
    }
  };
  const applyFormatting = (cmd: "bold" | "italic" | "underline") => {
    restoreSelection();
    document.execCommand(cmd, false);
  };
  const applyList = () => {
    restoreSelection();
    document.execCommand("insertUnorderedList", false);
  };

  // ------------------------------------
  // Render
  // ------------------------------------
  const imageList = isEditing ? editableBlogMoreImages : newBlogModalOpen ? newBlogMoreImages : selectedBlog?.more_images || [];

  return (
    <div className="admin-blogs">
      {/* CROPPER OVERLAY */}
      {showCropper && (
        <div className="cropper-overlay" role="dialog" aria-modal="true">
          <div className="cropper-container">
            <button className="cropper-close-btn" onClick={() => setShowCropper(false)} aria-label="Close cropper">
              <FaTimes size={20} />
            </button>

            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, area) => setCroppedArea(area)}
            />

            <button className="cropper-confirm-btn" onClick={applyCrop}>
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="admin-blogs-header">
        <div className="admin-blogs-search-container">
          <FaSearch className="admin-blogs-search-icon" />
          <input type="text" name="fakeusernameremembered" style={{ display: "none" }} />
          <input type="password" name="fakepasswordremembered" style={{ display: "none" }} />
          <input
            type="text"
            placeholder="Search"
            defaultValue={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
            name="search-blog"
            id="search-blog"
          />
        </div>

        <div className="admin-blogs-header-right">
          <div className="admin-blogs-userinfo" onClick={() => setShowProfileModal(true)} style={{ cursor: "pointer" }}>
            <div className="userinfo-label">Logged in as:</div>
            <div className="userinfo-details">
              <p className="userinfo-name">{loggedInUser?.user_name || "Admin"}</p>
              <p className="userinfo-email">{loggedInUser?.user_email || ""}</p>
            </div>
          </div>

          {showProfileModal && (
            <div className="admin-profile-modal" role="dialog" aria-modal="true">
              <div className="admin-profile-modal-box">
                <div
                  className="modal-close-icon"
                  onClick={() => {
                    setShowProfileModal(false);
                    setIsEditingProfile(false);
                    setOtpSent(false);
                    setOtpInput("");
                    setProfilePhone(loggedInUser?.user_contact || "");
                    setProfilePassword("");
                    setOldPassword("");
                  }}
                  aria-label="Close profile"
                >
                  <FaTimes />
                </div>

                <h2>Change Password</h2>
                <label>Email:</label>
                <input type="email" value={profileEmail} disabled />

                {isEditingProfile && (
                  <>
                    <div style={{ position: "relative" }}>
                      <label>Old Password:</label>
                      {/* anti autofill bait (already present) */}
                      <input type="text" name="fakeusernameremembered" style={{ display: "none" }} />
                      <input type="password" name="fakepasswordremembered" style={{ display: "none" }} />
                      <form autoComplete="off">
                        <input
                          type="password"
                          placeholder="Enter your current password"
                          autoComplete="current-password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          style={{ width: "100%" }}
                          required
                        />
                      </form>

                      <label>New Password:</label>
                      <form autoComplete="off">
                        <input
                          type="password"
                          placeholder="Enter a New Password"
                          autoComplete="new-password"
                          value={profilePassword}
                          readOnly={!isEditingProfile}
                          onChange={(e) => setProfilePassword(e.target.value)}
                          style={{ width: "100%", color: !isEditingProfile ? "#999" : "inherit", cursor: !isEditingProfile ? "default" : "text" }}
                        />
                      </form>
                    </div>
                  </>
                )}

                <div className="admin-profile-buttons">
                  {!isEditingProfile ? (
                    <button onClick={() => setIsEditingProfile(true)}>Edit</button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          // Validation+OTP kick-off lives in your existing handlers
                          // Keep your existing handleSendOTP implementation (not repeated here for brevity)
                          // @ts-ignore – call the same function you have
                          handleSendOTP();
                        }}
                      >
                        Send OTP
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingProfile(false);
                          setOtpSent(false);
                          setOtpInput("");
                          setProfilePhone(loggedInUser?.user_contact || "");
                          setProfilePassword("");
                          setOldPassword("");
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                {otpSent && (
                  <div className="otp-verification">
                    <label>Enter 6-digit OTP:</label>
                    <div className="otp-inputs">
                      {Array(6)
                        .fill("")
                        .map((_, i) => (
                          <input
                            key={i}
                            ref={(el) => {
                              otpRefs.current[i] = el; // <-- assign only, no return
                            }}
                            type="text"
                            maxLength={1}
                            className="otp-box"
                            value={otpInput[i] || ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (!val) return;
                              const updated = [...otpInput];
                              updated[i] = val[0];
                              setOtpInput(updated.join(""));
                              if (i < 5 && val) otpRefs.current[i + 1]?.focus();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace") {
                                const updated = [...otpInput];
                                if (otpInput[i]) {
                                  updated[i] = "";
                                  setOtpInput(updated.join(""));
                                } else if (i > 0) {
                                  otpRefs.current[i - 1]?.focus();
                                }
                              }
                            }}
                          />
                        ))}
                    </div>
                    <button
                      onClick={() => {
                        // Keep your existing handleVerifyOTP flow
                        // @ts-ignore
                        handleVerifyOTP();
                      }}
                    >
                      Verify OTP & Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {notification && <div className={`blogs-notification-message ${notificationType} show`}>{notification}</div>}
      </div>

      {/* LOWER HEADER */}
      <div className="admin-blogs-lower-header">
        <div className="admin-blogs-lower-header-left">
          <h1>Blogs</h1>

          {viewMode === "table" ? (
            <div className="admin-blogs-lower-header-select">
              <button onClick={() => setSelectMode((v) => !v)}>
                <img src={selectIcon} className="admin-blogs-lower-header-select-img" />
                {selectMode ? "Cancel" : "Select"}
              </button>
            </div>
          ) : (
            <div className="admin-blogs-lower-header-show">
              <p>Category</p>
              <div className="admin-blogs-lower-header-category" onClick={() => setOpenCategory((v) => !v)}>
                {selectedCategory}
                <span className="dropdown-arrow">▾</span>
                {openCategory && (
                  <div className="admin-blogs-dropdown-menu">
                    {CATEGORIES.map((cat) => (
                      <div
                        key={cat}
                        className="admin-blogs-dropdown-item"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setOpenCategory(false);
                        }}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="admin-blogs-lower-header-right">
          <div className="admin-blogs-toggle-newblog">
            <div className="admin-blogs-toggle-wrapper">
              <button className={`admin-blogs-toggle-button ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")}>
                Table View
              </button>
              <button className={`admin-blogs-toggle-button ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}>
                Grid View
              </button>
            </div>

            <div className="admin-blogs-lower-header-new-blog">
              <button
                onClick={() => {
                  resetNewBlogForm();
                  setNewBlogMoreImages([]);
                  setNewBlogImage("");
                  setNewBlogContent("");
                  setShowAllImagesModal(false);
                  setNewBlogModalOpen(true);
                }}
              >
                <FaPlus className="admin-icon-left" />
                Add New Blog
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BULK ACTIONS */}
      {selectMode && (
        <div className="admin-blogs-bulk-actions">
          {STATUS_BULK.map((status) => (
            <button
              key={status}
              onClick={() => {
                setBulkActionType("status");
                setBulkActionStatus(status);
                setBulkConfirmVisible(true);
              }}
            >
              {status}
            </button>
          ))}
          <button
            onClick={() => {
              setBulkActionType("delete");
              setBulkConfirmVisible(true);
            }}
          >
            DELETE
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="admin-blogs-main-content">
        {viewMode === "table" ? (
          <div>
            <div className="admin-blogs-scrollable-table">
              <table className="admin-blogs-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>
                      <div className="admin-blogs-dropdown-trigger" onClick={() => setOpenCategory((v) => !v)}>
                        Category <span className="admin-header-dropdown-arrow">▾</span>
                        {openCategory && (
                          <div className="admin-header-dropdown-menu">
                            {CATEGORIES.map((item) => (
                              <div
                                key={item}
                                className="admin-header-dropdown-item"
                                onClick={() => {
                                  setSelectedCategory(item);
                                  setOpenCategory(false);
                                }}
                              >
                                {item}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </th>
                    <th>Blog Title</th>
                    <th>Author</th>
                    <th>
                      <div className="admin-blogs-dropdown-trigger" onClick={() => setOpenStatus((v) => !v)}>
                        Status <span className="admin-header-dropdown-arrow">▾</span>
                        {openStatus && (
                          <div className="admin-header-dropdown-menu">
                            {STATUS_FILTER.map((st) => (
                              <div
                                key={st}
                                className="admin-header-dropdown-item"
                                onClick={() => {
                                  setSelectedStatus(st);
                                  setOpenStatus(false);
                                }}
                              >
                                {st}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </th>
                    <th>
                      <div className="admin-blogs-dropdown-trigger" onClick={() => setOpenCreatedAt((v) => !v)}>
                        Created At <span className="admin-header-dropdown-arrow">▾</span>
                        {openCreatedAt && (
                          <div className="admin-header-dropdown-menu">
                            {["Newest First", "Oldest First"].map((order) => (
                              <div
                                key={order}
                                className="admin-header-dropdown-item"
                                onClick={() => {
                                  setCreatedSortOrder(order as "Newest First" | "Oldest First");
                                  setOpenCreatedAt(false);
                                }}
                              >
                                {order}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </th>
                    <th>{selectMode ? "Select" : "View"}</th>
                  </tr>
                </thead>
                <colgroup>
                  <col style={{ width: "80px" }} />
                  <col style={{ width: "70px" }} />
                  <col style={{ width: "100px" }} />
                  <col style={{ width: "90px" }} />
                  <col style={{ width: "70px" }} />
                  <col style={{ width: "80px" }} />
                  <col style={{ width: "40px" }} />
                </colgroup>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="no-blogs-message">
                        <span className="loading-spinner"></span> Loading blogs…
                      </td>
                    </tr>
                  ) : paginatedBlogs.length > 0 ? (
                    paginatedBlogs.map((blog) => (
                      <tr
                        key={blog.blog_id}
                        className="admin-blogs-table-content"
                        style={{ cursor: selectMode ? "default" : "pointer" }}
                        onClick={() => !selectMode && setSelectedBlog(blog)}
                      >
                        <td className="admin-blogs-id-content">{blog.blog_id}</td>
                        <td className="admin-blogs-category-content category-tag">{blog.category}</td>
                        <td className="admin-blogs-title-content">{blog.title}</td>
                        <td className="admin-blogs-author-content">{blog.author}</td>
                        <td className={`admin-blogs-status-content status-${blog.blog_status.toLowerCase()}`}>{blog.blog_status}</td>
                        <td className="admin-blogs-created-at-content">{formatDate(blog.created_at)}</td>
                        <td className="admin-blogs-more-button">
                          {selectMode ? (
                            <input
                              type="checkbox"
                              checked={selectedBlogIds.includes(blog.blog_id)}
                              onChange={(e) =>
                                setSelectedBlogIds((prev) =>
                                  e.target.checked ? [...prev, blog.blog_id] : prev.filter((id) => id !== blog.blog_id)
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBlog(blog);
                              }}
                            >
                              <BsThreeDots />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="admin-blogs-table-content no-blogs-row">
                      <td colSpan={7} className="no-blogs-message">
                        No Blog Found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination">
                  <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>
                    ‹ Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button key={page} className={page === currentPage ? "active" : ""} onClick={() => setCurrentPage(page)}>
                      {page}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
                    Next ›
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="admin-blogs-grid-view">
            {filteredBlogs.length > 0 ? (
              <div className="blog-grid-scrollable-wrapper">
                <div className="blog-grid-container">
                  {filteredBlogs.map((blog) => (
                    <div
                      key={blog.blog_id}
                      className={`blog-grid-card grid-status-${blog.blog_status.toLowerCase()}`}
                      onClick={() => setSelectedBlog(blog)}
                    >
                      <img src={getFullUrl(blog.image_url)} alt={blog.title} className="blog-grid-image" loading="lazy" decoding="async" />
                      <div className="blog-grid-overlay">
                        <h3 className="blog-overlay-title">{blog.title}</h3>
                        <p className="blog-overlay-category">{blog.category}</p>
                        <p className="blog-overlay-date">{formatDate(blog.created_at)}</p>
                        <p className="blog-overlay-author">{blog.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ marginTop: "20px" }}>No blogs found.</p>
            )}
          </div>
        )}
      </div>

      {/* VIEW / EDIT MODAL */}
      {selectedBlog && (
        <div className="admin-blogs-view-more" role="dialog" aria-modal="true">
          <div className="admin-blogs-modal">
            <div className="admin-blogs-modal-content">
              <div className="admin-blogs-float-buttons">
                {isEditing ? (
                  <>
                    <button className="save-btn" onClick={handleSave}>
                      Save
                    </button>
                    <button className="cancel-btn" onClick={handleCancel}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button className="edit-btn" onClick={handleEdit}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => setConfirmDeleteVisible(true)}>
                      Delete
                    </button>
                  </>
                )}
              </div>

              <button
                className="admin-blogs-modal-close"
                onClick={() => {
                  if (isEditing) handleCancel();
                  setSelectedBlog(null);
                }}
                aria-label="Close"
              >
                ✕
              </button>

              <div className="admin-blogs-modal-inner-content">
                {notification && (
                  <div className={`blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`}>
                    {notification}
                  </div>
                )}

                {confirmDeleteVisible && (
                  <div className="blogs-confirmation-popup show">
                    <p>Are you sure you want to delete this blog?</p>
                    <div className="blogs-confirmation-actions">
                      <button className="confirm-yes" onClick={confirmDeleteBlog}>
                        Yes
                      </button>
                      <button className="confirm-no" onClick={() => setConfirmDeleteVisible(false)}>
                        No
                      </button>
                    </div>
                  </div>
                )}

                <div className="admin-blogs-modal-inner-content-top">
                  {/* LEFT INFO */}
                  <div className="admin-blogs-modal-left">
                    <h2>Blog Details</h2>

                    <div className="admin-blogs-modal-id">
                      <p>
                        <strong>ID</strong>
                      </p>
                      <p className="admin-blogs-modal-id-content">{selectedBlog.blog_id}</p>
                    </div>

                    <div className="admin-blogs-modal-title">
                      <p>
                        <strong>Title</strong>
                        {submittedEdit && !editableBlog?.title?.trim() && <span style={{ color: "red" }}>*</span>}
                      </p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableBlog?.title || ""}
                          onChange={(e) => editableBlog && setEditableBlog({ ...editableBlog, title: e.target.value })}
                          className="admin-blogs-modal-title-content"
                        />
                      ) : (
                        <p className="admin-blogs-modal-title-content">{selectedBlog.title}</p>
                      )}
                    </div>

                    <div className="admin-blogs-modal-category">
                      <p>
                        <strong>Category</strong>
                      </p>
                      <select
                        className={`admin-blogs-modal-select modal-category-${(isEditing ? editableBlog?.category : selectedBlog.category).toLowerCase()}`}
                        value={isEditing ? editableBlog?.category : selectedBlog.category}
                        disabled={!isEditing}
                        onChange={(e) => setEditableBlog({ ...editableBlog!, category: e.target.value })}
                      >
                        {NEW_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-blogs-modal-author">
                      <p>
                        <strong>Author</strong>
                      </p>
                      <p className="admin-blogs-modal-author-content">{selectedBlog.author}</p>
                    </div>

                    <div className="admin-blogs-modal-status">
                      <p>
                        <strong>Status</strong>
                      </p>
                      <select
                        className={`admin-blogs-modal-select modal-status-${(isEditing ? editableBlog?.blog_status : selectedBlog.blog_status).toLowerCase()}`}
                        value={isEditing ? editableBlog?.blog_status : selectedBlog.blog_status}
                        disabled={!isEditing}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (newStatus === "PINNED") {
                            const pins = blogs.filter((b) => b.blog_status === "PINNED").length;
                            const wasPinned = editableBlog?.blog_status === "PINNED";
                            if (pins >= MAX_PINNED && !wasPinned) {
                              showNote("You can only pin up to 3 blogs. Please unpin one first.", "error");
                              return;
                            }
                          }
                          setEditableBlog({ ...editableBlog!, blog_status: newStatus });
                        }}
                      >
                        {editStatusOptions().map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-blogs-modal-date">
                      <p>
                        <strong>Created At</strong>
                      </p>
                      <p className="admin-blogs-modal-date-content">{formatDate(selectedBlog.created_at)}</p>
                    </div>
                  </div>

                  {/* RIGHT IMAGES */}
                  <div className="admin-blogs-modal-right">
                    <div className="admin-blogs-modal-image">
                      <p>
                        <strong>Main Image</strong>
                        {submittedEdit && !editableBlog?.image_url && <span style={{ color: "red" }}>*</span>}
                      </p>
                      {(isEditing ? editableBlog?.image_url : selectedBlog.image_url) ? (
                        <img
                          src={getFullUrl(isEditing ? editableBlog?.image_url : selectedBlog.image_url)}
                          alt="Blog"
                          style={{ cursor: "zoom-in" }}
                          onClick={() => setFullImageUrl(getFullUrl(isEditing ? editableBlog?.image_url : selectedBlog.image_url))}
                        />
                      ) : (
                        <div className="no-image-placeholder">No Blog Image</div>
                      )}

                      <input type="file" accept="image/*" style={{ display: "none" }} id="upload-image-input" onChange={(e) => handleImageSelect(e, "edit")} />

                      <div className="admin-blogs-image-buttons">
                        <button
                          className="upload-btn"
                          disabled={!isEditing}
                          onClick={() => {
                            if (isEditing) document.getElementById("upload-image-input")?.click();
                          }}
                        >
                          Upload
                        </button>
                        <button className="remove-btn" disabled={!isEditing} onClick={handleImageRemove}>
                          Remove
                        </button>
                      </div>
                    </div>

                    {(isEditing || selectedBlog.more_images) && (
                      <div className="admin-blogs-modal-more-images">
                        <p>
                          <strong>More Images</strong>
                        </p>
                        <div className="blog-more-image-grid">
                          {[...Array(4)].map((_, i) => {
                            const img = isEditing ? editableBlogMoreImages[i] : selectedBlog.more_images?.[i];
                            const total = isEditing ? editableBlogMoreImages.length : selectedBlog.more_images?.length || 0;
                            const isLast = i === 3 && total > 4;

                            if (img) {
                              return (
                                <div key={i} className="blog-image-preview">
                                  <img
                                    src={getFullUrl(img)}
                                    alt={`More Image ${i}`}
                                    onClick={() => setFullImageUrl(getFullUrl(img))}
                                    style={{ cursor: "zoom-in" }}
                                  />
                                  {isLast && (
                                    <div className="blog-image-overlay" onClick={() => setShowAllImagesModal(true)}>
                                      +{total - 3}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return isEditing ? (
                              <label key={i} htmlFor="edit-more-images-input" className="blog-more-image-placeholder-cell clickable">
                                <span className="blog-placeholder-icon">+</span>
                              </label>
                            ) : (
                              <div key={i} className="blog-more-image-placeholder-cell">
                                <span className="blog-placeholder-icon">+</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="edit-more-images-buttons">
                          <button
                            className="upload-btn"
                            onClick={() => document.getElementById("edit-more-images-input")?.click()}
                            disabled={!isEditing}
                          >
                            Add More
                          </button>
                          <button
                            className="remove-btn"
                            onClick={() => {
                              if (isEditing) setEditableBlogMoreImages([]);
                            }}
                            disabled={!isEditing}
                          >
                            Clear All
                          </button>
                        </div>

                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          style={{ display: "none" }}
                          id="edit-more-images-input"
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || !isEditing) return;

                            const uploaded: string[] = [];
                            for (const file of Array.from(files)) {
                              const fd = new FormData();
                              fd.append("image", file);
                              try {
                                const r = await fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/upload_blog_image.php`, {
                                  method: "POST",
                                  body: fd,
                                });
                                const data = await r.json();
                                if (data.success && data.image_url) uploaded.push(data.image_url);
                              } catch (err) {
                                console.error("Upload failed:", err);
                              }
                            }
                            setEditableBlogMoreImages((prev) => [...prev, ...uploaded]);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* CONTENT */}
                <div className="admin-blogs-modal-inner-content-bot">
                  <div className="admin-events-inner-content-modal-desc">
                    <p>
                      <strong>Blog Content</strong>
                      {submittedEdit && !rawText && <span style={{ color: "red" }}>*</span>}
                    </p>

                    {isEditing ? (
                      <>
                        <div className="admin-blogs-content-image-tools">
                          <button className="format-btn undo" onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand("undo", false)}>
                            <FaUndo />
                          </button>
                          <button className="format-btn redo" onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand("redo", false)}>
                            <FaRedo />
                          </button>
                          <button
                            className="format-btn bold"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              saveSelection();
                            }}
                            onClick={() => applyFormatting("bold")}
                          >
                            <FaBold />
                          </button>
                          <button
                            className="format-btn italic"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              saveSelection();
                            }}
                            onClick={() => applyFormatting("italic")}
                          >
                            <FaItalic />
                          </button>
                          <button
                            className="format-btn underline"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              saveSelection();
                            }}
                            onClick={() => applyFormatting("underline")}
                          >
                            <FaUnderline />
                          </button>
                          <button
                            className="format-btn bullet"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              saveSelection();
                            }}
                            onClick={applyList}
                          >
                            <FaListUl />
                          </button>
                          <button
                            className="format-btn image"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => document.getElementById("new-content-image-input")?.click()}
                          >
                            <FaImage />
                          </button>

                          <input
                            type="file"
                            accept="image/*"
                            id="new-content-image-input"
                            style={{ display: "none" }}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const formData = new FormData();
                              formData.append("image", file);
                              try {
                                const res = await fetch(
                                  `${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/upload_blog_image.php`,
                                  { method: "POST", body: formData }
                                );
                                const data = await res.json();
                                if (data.success && data.image_url) {
                                  const img = `<img src="${getFullUrl(data.image_url)}" alt="blog image" style="max-width:100%; margin:10px 0; display:block;" />`;
                                  const div = document.getElementById("new-blog-content-editor");
                                  if (div) {
                                    div.innerHTML += img;
                                    setEditableBlog((prev) => (prev ? { ...prev, content: div.innerHTML } : prev));
                                  }
                                } else {
                                  toast.error("Image upload failed.");
                                }
                              } catch (err) {
                                console.error("Upload failed:", err);
                                toast.error("An error occurred during upload.");
                              }
                            }}
                          />
                        </div>

                        <div
                          id="new-blog-content-editor"
                          ref={textareaRef}
                          className="admin-blogs-modal-desc-content editable"
                          contentEditable
                          onBlur={() => {
                            if (textareaRef.current) {
                              const html = textareaRef.current.innerHTML;
                              setEditableBlog((prev) => (prev ? { ...prev, content: html } : prev));
                            }
                          }}
                        />
                      </>
                    ) : (
                      <div className="admin-blogs-modal-desc-content">
                        <div className="admin-blogs-content-images-wrapper">
                          <div dangerouslySetInnerHTML={{ __html: selectedBlog.content }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW BLOG MODAL */}
      {newBlogModalOpen && (
        <div className="admin-blogs-new-blog" role="dialog" aria-modal="true">
          <div className="admin-blogs-new-blog-modal">
            <div className="admin-blogs-new-blog-modal-content">
              <div className="admin-blogs-new-blog-float-buttons">
                <button className="save-btn" onClick={handleNewBlogSave}>
                  Save
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => {
                    resetNewBlogForm();
                    setNewBlogMoreImages([]);
                    setShowAllImagesModal(false);
                    setNewBlogModalOpen(false);
                  }}
                >
                  Cancel
                </button>
              </div>

              <button
                className="admin-blogs-new-blog-modal-close"
                onClick={() => {
                  resetNewBlogForm();
                  setNewBlogMoreImages([]);
                  setShowAllImagesModal(false);
                  setNewBlogModalOpen(false);
                }}
                aria-label="Close"
              >
                ✕
              </button>

              <div className="admin-blogs-new-blog-modal-inner-content">
                <div className="admin-blogs-new-blog-modal-inner-content-top">
                  <div className="admin-blogs-new-blog-modal-left">
                    <h2>Add New Blog</h2>

                    <div className="admin-blogs-new-blog-modal-title">
                      <p>
                        <strong>
                          Title {!newBlogTitle.trim() && <span style={{ color: "red" }}>*</span>}
                        </strong>
                      </p>
                      <input
                        type="text"
                        className="admin-blogs-new-blog-modal-title-content"
                        value={newBlogTitle}
                        onChange={(e) => setNewBlogTitle(e.target.value)}
                        placeholder="Enter title"
                      />
                    </div>

                    <div className="admin-blogs-new-blog-modal-category">
                      <p>
                        <strong>
                          Category {!newBlogCategory.trim() && <span style={{ color: "red" }}>*</span>}
                        </strong>
                      </p>
                      <select
                        className="admin-blogs-new-blog-modal-select modal-category-pink"
                        value={newBlogCategory}
                        onChange={(e) => setNewBlogCategory(e.target.value as (typeof NEW_CATEGORIES)[number])}
                      >
                        {NEW_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="admin-blogs-new-blog-modal-author">
                      <p>
                        <strong>Author</strong>
                      </p>
                      <p className="admin-blogs-new-blog-modal-author-content">{newBlogAuthorName}</p>
                    </div>

                    <div className="admin-blogs-new-blog-modal-status">
                      <p>
                        <strong>
                          Status {!newBlogStatus.trim() && <span style={{ color: "red" }}>*</span>}
                        </strong>
                      </p>
                      <select
                        className={`admin-blogs-new-blog-modal-select modal-status-${newBlogStatus.toLowerCase()}`}
                        value={newBlogStatus}
                        onChange={(e) => setNewBlogStatus(e.target.value as "DRAFT" | "PUBLISHED")}
                      >
                        {["DRAFT", "PUBLISHED"].map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="admin-blogs-new-blog-modal-right">
                    <div className="admin-blogs-new-blog-modal-image">
                      <p>
                        <strong>
                          Main Image {!newBlogImage && <span style={{ color: "red" }}>*</span>}
                        </strong>
                      </p>

                      {newBlogImage ? (
                        <img
                          src={getFullUrl(newBlogImage)}
                          alt="Preview"
                          style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "4px", cursor: "zoom-in" }}
                          onClick={() => setFullImageUrl(getFullUrl(newBlogImage))}
                        />
                      ) : (
                        <div className="no-image-placeholder">No Blog Image</div>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        id="new-blog-image-input"
                        onChange={(e) => handleImageSelect(e, "new")}
                      />

                      <div className="admin-blogs-image-buttons">
                        <button className="upload-btn" onClick={() => document.getElementById("new-blog-image-input")?.click()}>
                          Upload
                        </button>
                        <button className="remove-btn" onClick={() => setNewBlogImage("")}>
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="admin-blogs-new-blog-modal-image">
                      <p>
                        <strong>More Images</strong>
                      </p>
                      <div className="blog-more-image-grid">
                        {[...Array(4)].map((_, i) => {
                          const image = newBlogMoreImages[i];
                          const total = newBlogMoreImages.length;
                          const isLast = i === 3 && total > 4;

                          if (image) {
                            return (
                              <div key={i} className="blog-image-preview">
                                <img
                                  src={getFullUrl(image)}
                                  alt={`More Image ${i}`}
                                  onClick={() => setFullImageUrl(getFullUrl(image))}
                                  style={{ cursor: "zoom-in" }}
                                />
                                {isLast && (
                                  <div className="blog-image-overlay" onClick={() => setShowAllImagesModal(true)}>
                                    +{total - 3}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return (
                            <label key={i} htmlFor="new-blog-more-images-input" className="blog-more-image-placeholder-cell clickable">
                              <span className="blog-placeholder-icon">+</span>
                            </label>
                          );
                        })}
                      </div>

                      <div className="edit-more-images-buttons">
                        <button className="upload-btn" onClick={() => document.getElementById("new-blog-more-images-input")?.click()}>
                          Add More
                        </button>
                        <button className="remove-btn" onClick={() => setNewBlogMoreImages([])}>
                          Clear All
                        </button>
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                        id="new-blog-more-images-input"
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files) return;
                          const uploaded: string[] = [];
                          for (const file of Array.from(files)) {
                            const fd = new FormData();
                            fd.append("image", file);
                            try {
                              const r = await fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/upload_blog_image.php`, {
                                method: "POST",
                                body: fd,
                              });
                              const data = await r.json();
                              if (data.success && data.image_url) uploaded.push(data.image_url);
                            } catch (err) {
                              console.error("Upload failed:", err);
                            }
                          }
                          setNewBlogMoreImages((prev) => [...prev, ...uploaded]);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="admin-blogs-new-blog-modal-inner-content-bot">
                  <div className="admin-blogs-new-blog-modal-desc">
                    <p>
                      <strong>
                        Blog Content {!newBlogContent.trim() && <span style={{ color: "red" }}>*</span>}
                      </strong>
                    </p>

                    <div className="admin-blogs-new-blog-modal-desc">
                      <div className="admin-blogs-content-image-tools">
                        <button className="format-btn undo" onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand("undo")}>
                          <FaUndo />
                        </button>
                        <button className="format-btn redo" onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand("redo")}>
                          <FaRedo />
                        </button>
                        <button className="format-btn bold" onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand("bold")}>
                          <FaBold />
                        </button>
                        <button className="format-btn italic" onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand("italic")}>
                          <FaItalic />
                        </button>
                        <button className="format-btn underline" onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand("underline")}>
                          <FaUnderline />
                        </button>
                        <button className="format-btn bullet" onMouseDown={(e) => e.preventDefault()} onClick={() => document.execCommand("insertUnorderedList")}>
                          <FaListUl />
                        </button>
                        <button
                          className="format-btn image"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => document.getElementById("new-content-image-input")?.click()}
                        >
                          <FaImage />
                        </button>

                        <input
                          type="file"
                          accept="image/*"
                          id="new-content-image-input"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const fd = new FormData();
                            fd.append("image", file);
                            try {
                              const r = await fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/upload_blog_image.php`, {
                                method: "POST",
                                body: fd,
                              });
                              const data = await r.json();
                              if (data.success && data.image_url) {
                                const img = `<img src="${getFullUrl(data.image_url)}" alt="blog image" style="max-width:100%;" />`;
                                const div = document.getElementById("new-blog-content-editor");
                                if (div) div.innerHTML += img;
                                setNewBlogContent((prev) => prev + img);
                              } else {
                                toast.error("Image upload failed.");
                              }
                            } catch (err) {
                              console.error(err);
                              toast.error("Upload failed.");
                            }
                          }}
                        />
                      </div>

                      <div
                        id="new-blog-content-editor"
                        className="admin-blogs-new-blog-modal-desc-content editable"
                        contentEditable
                        onBlur={(e) => setNewBlogContent(e.currentTarget.innerHTML)}
                        dangerouslySetInnerHTML={{ __html: newBlogContent }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MORE IMAGES MODAL */}
      {showAllImagesModal && (
        <div className="blog-gallery-modal">
          <div className="blog-gallery-overlay" onClick={() => setShowAllImagesModal(false)} />
          <div className="blog-gallery-wrapper">
            <button className="blog-gallery-close" onClick={() => setShowAllImagesModal(false)} aria-label="Close">
              ✕
            </button>

            <div className="blog-gallery-grid">
              {imageList.map((img, index) => (
                <div key={index} className={`blog-gallery-thumb ${isEditing ? "editable-mode" : ""}`}>
                  <div className="thumb-image-wrapper" onClick={() => setFullImageUrl(getFullUrl(img))}>
                    <img src={getFullUrl(img)} alt={`More Image ${index}`} />
                    {(isEditing || newBlogModalOpen) && (
                      <div className="thumb-controls">
                        {index > 0 && (
                          <button
                            className="thumb-swap-left"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updater = isEditing ? setEditableBlogMoreImages : setNewBlogMoreImages;
                              updater((prev) => {
                                const u = [...prev];
                                [u[index - 1], u[index]] = [u[index], u[index - 1]];
                                return u;
                              });
                            }}
                          >
                            ←
                          </button>
                        )}
                        <button
                          className="thumb-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmThumbDeleteIndex(index);
                            const updater = isEditing ? setEditableBlogMoreImages : setNewBlogMoreImages;
                            updater((prev) => prev.filter((_, i) => i !== index));
                          }}
                        >
                          🗑
                        </button>
                        {index < imageList.length - 1 && (
                          <button
                            className="thumb-swap-right"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updater = isEditing ? setEditableBlogMoreImages : setNewBlogMoreImages;
                              updater((prev) => {
                                const u = [...prev];
                                [u[index], u[index + 1]] = [u[index + 1], u[index]];
                                return u;
                              });
                            }}
                          >
                            →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE */}
      {fullImageUrl && (
        <div className="blog-fullscreen-viewer">
          <div className="blog-fullscreen-backdrop" onClick={() => setFullImageUrl("")} />
          <img src={fullImageUrl} alt="Fullscreen" className="blog-fullscreen-image" />
          <button className="blog-fullscreen-exit" onClick={() => setFullImageUrl("")} aria-label="Close">
            ✕
          </button>
        </div>
      )}

      {/* BULK CONFIRM */}
      {bulkConfirmVisible && (
        <div className="blogs-confirmation-popup show">
          <div className="blogs-confirmation-box">
            <p>
              {bulkActionType === "delete"
                ? "Are you sure you want to delete the selected blogs?"
                : `Do you really want to mark the selected blogs as ${bulkActionStatus}?`}
            </p>
            <div className="blogs-confirmation-actions">
              <button
                className="confirm-yes"
                onClick={() => {
                  if (bulkActionType === "delete") {
                    handleBulkDelete();
                  } else {
                    applyBulkStatus(bulkActionStatus);
                  }
                  setBulkConfirmVisible(false);
                }}
              >
                Yes
              </button>
              <button className="confirm-no" onClick={() => setBulkConfirmVisible(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={4000} hideProgressBar={false} closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="light" />
    </div>
  );
};

export default AdminBlogs;
