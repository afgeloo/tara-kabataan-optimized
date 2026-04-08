// src/adminpage/admin-events.tsx

import "./css/admin-events.css";
import president from "../assets/aboutpage/council/president.jpg";
import select from "../assets/adminpage/blogs/select.png";
import { BsThreeDots } from "react-icons/bs";
import { 
  FaSearch, 
  FaBell, 
  FaPlus, 
  FaBold, 
  FaItalic, 
  FaUnderline, 
  FaImage, 
  FaListUl, 
  FaUndo, 
  FaRedo, 
  FaTimes 
} from "react-icons/fa";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { toast, ToastContainer } from "react-toastify";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "./utils/cropImage";

const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";

const CATEGORIES = ["KALUSUGAN", "KALIKASAN", "KARUNUNGAN", "KULTURA", "KASARIAN"];
const STATUSES = ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"];
const FILTER_CATEGORIES = ["All", "Kalusugan", "Kalikasan", "Karunungan", "Kultura", "Kasarian"];

interface Event {
  event_id: string;
  image_url: string;
  category: string;
  title: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  event_venue: string;
  content: string;
  event_speakers: string;
  event_going: number;
  event_status: string;
  created_at: string;
  updated_at: string | null;
}

interface Participant {
  participant_id: string;
  event_id: string;
  name: string;
  email: string;
  contact: string | null;
  expectations: string | null;
  created_at: string;
}

const validatePasswordSafety = (profilePassword: string, profileEmail: string) => {
  if (profilePassword.length < 8) return "Password must be at least 8 characters.";
  const strongPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).+$/;
  if (!strongPattern.test(profilePassword)) return "Password must include letters, numbers, and symbols.";
  
  const emailParts = profileEmail.split(/[@._\-]/).filter(Boolean);
  const passwordLower = profilePassword.toLowerCase();
  for (const part of emailParts) {
    if (part && passwordLower.includes(part.toLowerCase())) {
      return "Password should not include parts of your email.";
    }
  }
  return null;
};

const AdminEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  // UI & Dropdown States
  const [openCategory, setOpenCategory] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [openCreatedAt, setOpenCreatedAt] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [createdSortOrder, setCreatedSortOrder] = useState("Newest First");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  
  // Modals & Forms
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dropdownCategory, setDropdownCategory] = useState<string | null>(null);
  const [dropdownStatus, setDropdownStatus] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableEvent, setEditableEvent] = useState<Event | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  
  // Bulk Actions
  const [selectMode, setSelectMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [bulkConfirmVisible, setBulkConfirmVisible] = useState(false);
  const [bulkActionStatus, setBulkActionStatus] = useState<string>("");
  const [bulkActionType, setBulkActionType] = useState<"delete" | "status" | null>(null);
  
  // Utilities & Notifications
  const [notification, setNotification] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const textareaRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  
  // Profile & OTP
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpRequired, setOtpRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const otpRefs = useRef<HTMLInputElement[]>([]);
  
  // Cropper
  const [showCropper, setShowCropper] = useState(false);
  const [cropSrc, setCropSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropMode, setCropMode] = useState<"new" | "edit">("new");
  const [croppedArea, setCroppedArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [eventsPage, setEventsPage] = useState(1);
  const eventsPerPage = 8;

  // New Event Form State
  const initialNewEventState = {
    title: "", category: "KALUSUGAN", event_date: "", event_start_time: "",
    event_end_time: "", event_venue: "Manila, Philippines", event_status: "UPCOMING",
    event_speakers: "", content: "", image_url: "",
  };
  const [newEvent, setNewEvent] = useState(initialNewEventState);
  
  const initialMissingState = {
    title: false, category: false, event_date: false, event_start_time: false,
    event_end_time: false, event_venue: false, event_speakers: false, content: false, image_url: false, image: false
  };
  const [editMissing, setEditMissing] = useState(initialMissingState);
  const [missing, setMissing] = useState({ ...initialMissingState, title: true, category: true, event_date: true, event_start_time: true, event_end_time: true, event_venue: true, event_speakers: true, content: true, image: true });

  useEffect(() => {
    const storedUser = localStorage.getItem("admin-user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setLoggedInUser(parsed);
      } catch { console.error("Failed to parse stored user"); }
    }
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      setProfileEmail(loggedInUser.user_email || "");
      setProfilePhone(loggedInUser.user_contact || "");
    }
  }, [loggedInUser]);

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_BASE_URL}/events1.php`)
      .then((res) => res.json())
      .then((data) => {
        const now = new Date();
        const statusUpdatePromises: Promise<any>[] = [];

        const updatedEvents = (data.events || []).map((event: Event) => {
          const [startHour, startMinute] = event.event_start_time.split(":").map(Number);
          const [endHour, endMinute] = event.event_end_time.split(":").map(Number);

          const eventStartDatetime = new Date(event.event_date);
          eventStartDatetime.setHours(startHour, startMinute, 0, 0);

          const eventEndDatetime = new Date(event.event_date);
          eventEndDatetime.setHours(endHour, endMinute, 0, 0);

          if (event.event_status === "UPCOMING") {
            if (now >= eventStartDatetime && now <= eventEndDatetime) {
              event.event_status = "ONGOING";
              statusUpdatePromises.push(updateEventStatusAPI(event.event_id, "ONGOING"));
            } else if (now > eventEndDatetime) {
              event.event_status = "COMPLETED";
              statusUpdatePromises.push(updateEventStatusAPI(event.event_id, "COMPLETED"));
            }
          }
          return event;
        });

        Promise.all(statusUpdatePromises).catch(err => console.error("Failed to update statuses", err));
        setEvents(updatedEvents);
      })
      .catch((err) => console.error("Failed to fetch events:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      setDropdownCategory(selectedEvent.category);
      setDropdownStatus(selectedEvent.event_status);
      setEditMissing(initialMissingState);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (!selectedEvent) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL}/event_attendees.php?event_id=${selectedEvent.event_id}`)
      .then((res) => res.json())
      .then((data) => setParticipants(data.participants || []))
      .catch((err) => console.error("Failed to load participants:", err));
  }, [selectedEvent]);

  useEffect(() => setEventsPage(1), [selectedCategory, selectedStatus, createdSortOrder, searchQuery]);

  const updateEventStatusAPI = async (event_id: string, new_status: string) => {
    return fetch(`${import.meta.env.VITE_API_BASE_URL}/update_event_status.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id, new_status }),
    });
  };

  const getFullImageUrl = (url: string | null) => {
    if (!url) return "";
    if (/^https?:\/\//i.test(url) || url.startsWith("//")) return url;
    return `${IMAGE_BASE}/${url.startsWith("/") ? url.substring(1) : url}`;
  };

  const formatDate = (timestamp: string): string => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const formatTime = (timeString: string): string => {
    if (!timeString) return "—";
    const [hour, minute] = timeString.split(":").map(Number);
    if (isNaN(hour) || isNaN(minute)) return "—";
    const date = new Date();
    date.setHours(hour, minute);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const showTempNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, mode: "new" | "edit") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropMode(mode);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const applyCrop = async () => {
    try {
      const blob = await getCroppedImg(cropSrc, croppedArea);
      const form = new FormData();
      form.append("image", blob, "cropped.jpg");

      let endpoint = `${import.meta.env.VITE_API_BASE_URL}/${cropMode === "new" ? "add_new_event_image.php" : "upload_event_image.php"}`;
      if (cropMode === "edit" && editableEvent) form.append("event_id", editableEvent.event_id);

      const res = await fetch(endpoint, { method: "POST", body: form });
      const data = await res.json();

      if (data.success && data.image_url) {
        cropMode === "new" ? setNewImageUrl(data.image_url) : setTempImageUrl(data.image_url);
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      toast.error("An error occurred while uploading");
    } finally {
      setShowCropper(false);
    }
  };

  const handleSendOTP = async () => {
    if (!profileEmail) return toast.error("Email not found.");
    if (!profilePhone && !profilePassword) return toast.error("Phone or password must be provided.");

    if (profilePassword) {
      if (!oldPassword) return toast.error("Please enter your current password.");
      const errorMsg = validatePasswordSafety(profilePassword, profileEmail);
      if (errorMsg) return toast.error(errorMsg);

      try {
        const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/verify_old_password.php`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: profileEmail, old_password: oldPassword }),
        });
        if (!(await verifyRes.json()).valid) return toast.error("Old password is incorrect.");

        const prevRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/check_previous_password.php`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: profileEmail, new_password: profilePassword }),
        });
        if ((await prevRes.json()).same) return toast.error("New password must be different from previous.");
      } catch {
        return toast.error("Verification failed.");
      }
    }

    const toastId = toast.loading("Sending OTP...");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/send_otp.php`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: profileEmail }),
      });
      const data = await res.json();
      toast.update(toastId, {
        render: data.success ? (<div><strong>OTP sent.</strong><div style={{ fontSize: "0.8rem" }}>Check spam folder.</div></div>) : data.message || "Failed to send OTP.",
        type: data.success ? "success" : "error", isLoading: false, autoClose: 3000,
      });
      if (data.success) setOtpSent(true);
    } catch (err) {
      toast.update(toastId, { render: "Error sending OTP.", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/update_profile.php`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: loggedInUser?.user_id, email: profileEmail, phone: profilePhone, password: profilePassword }),
      });
      const data = JSON.parse(await res.text());
      if (data.success) {
        toast.success("Profile updated!");
        setLoggedInUser(data.user);
        localStorage.setItem("admin-user", JSON.stringify(data.user));
        setShowProfileModal(false);
      } else {
        toast.error(data.message || "Failed to update profile.");
      }
    } catch { toast.error("Server error."); }
  };

  const handleVerifyOTP = async () => {
    const toastId = toast.loading("Verifying OTP...");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/verify_otp.php`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: profileEmail, otp: otpInput }),
      });
      if ((await res.json()).success) {
        await handleProfileUpdate();
        resetProfileModal();
        toast.update(toastId, { render: "OTP verified. Profile updated.", type: "success", isLoading: false, autoClose: 3000 });
      } else {
        toast.update(toastId, { render: "Incorrect OTP.", type: "error", isLoading: false, autoClose: 3000 });
      }
    } catch {
      toast.update(toastId, { render: "Error verifying OTP.", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const resetProfileModal = () => {
    setProfilePhone(loggedInUser?.user_contact || "");
    setProfilePassword(""); setOldPassword(""); setOtpInput("");
    setOtpSent(false); setOtpRequired(false); setIsEditingProfile(false);
  };

  const resetNewEvent = () => {
    setNewEvent(initialNewEventState);
    setNewImageUrl(null);
    const editor = document.getElementById("add-event-content-editor");
    if (editor) editor.innerHTML = "";
  };

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) selectionRef.current = sel.getRangeAt(0);
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (selectionRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(selectionRef.current);
    }
  }, []);

  const applyFormatting = (command: string) => {
    restoreSelection();
    document.execCommand(command, false);
  };

  // Memoized Data
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchCategory = selectedCategory === "All" || event.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchStatus = selectedStatus === "All" || event.event_status.toLowerCase() === selectedStatus.toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = Object.values(event).some(val => String(val).toLowerCase().includes(searchLower)) || formatDate(event.event_date).toLowerCase().includes(searchLower);
      return matchCategory && matchStatus && matchSearch;
    }).sort((a, b) => {
      const dateA = new Date(a.event_date).getTime();
      const dateB = new Date(b.event_date).getTime();
      return createdSortOrder === "Newest First" ? dateB - dateA : dateA - dateB;
    });
  }, [events, selectedCategory, selectedStatus, searchQuery, createdSortOrder]);

  const pagedEvents = useMemo(() => filteredEvents.slice((eventsPage - 1) * eventsPerPage, eventsPage * eventsPerPage), [filteredEvents, eventsPage]);
  const totalEventPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const paginatedParticipants = useMemo(() => participants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [participants, currentPage]);
  const totalPages = Math.ceil(participants.length / itemsPerPage);

  // Form Handlers
  const handleSave = () => {
    if (!editableEvent) return;
    const textContent = textareaRef.current?.textContent?.trim() || "";
    const hasImage = Boolean(textareaRef.current?.querySelector("img"));

    const newEditMissing = {
      title: !editableEvent.title.trim(), category: !editableEvent.category.trim(),
      event_date: !editableEvent.event_date, event_start_time: !editableEvent.event_start_time,
      event_end_time: !editableEvent.event_end_time, event_venue: !editableEvent.event_venue.trim(),
      event_speakers: !editableEvent.event_speakers.trim(), content: !(textContent || hasImage),
      image_url: !tempImageUrl && !editableEvent.image_url, image: false
    };

    setEditMissing(newEditMissing);
    if (Object.values(newEditMissing).some(Boolean)) return showTempNotification("Please fill out all required fields marked with *");

    const eventDate = new Date(editableEvent.event_date);
    const [startHour, startMinute] = editableEvent.event_start_time.split(":").map(Number);
    eventDate.setHours(startHour, startMinute, 0, 0);

    if (editableEvent.event_status !== "COMPLETED" && eventDate < new Date()) {
      return showTempNotification("Cannot set an event date and time in the past!");
    }

    if (tempImageUrl !== null) editableEvent.image_url = tempImageUrl;

    fetch(`${import.meta.env.VITE_API_BASE_URL}/update_event.php`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editableEvent),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setEvents((prev) => prev.map((e) => (e.event_id === editableEvent.event_id ? editableEvent : e)));
          setSelectedEvent(editableEvent); setEditableEvent(null); setTempImageUrl(null); setIsEditing(false);
          showTempNotification("Event updated successfully!");
        } else showTempNotification("Failed to update event.");
      })
      .catch(() => alert("An error occurred while updating."));
  };

  const handleAddNewEventSave = async () => {
    const extractedContent = document.getElementById("add-event-content-editor")?.innerHTML.trim() || "";
    const newMissing = {
      title: !newEvent.title.trim(), category: !newEvent.category.trim(), event_date: !newEvent.event_date,
      event_start_time: !newEvent.event_start_time, event_end_time: !newEvent.event_end_time,
      event_venue: !newEvent.event_venue.trim(), event_speakers: !newEvent.event_speakers.trim(),
      content: !extractedContent, image: !newImageUrl, image_url: false
    };

    setMissing(newMissing);
    if (Object.values(newMissing).some(Boolean)) return showTempNotification("Please fill out all required fields marked with *");

    const selectedDate = new Date(newEvent.event_date);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return showTempNotification("Event date cannot be in the past!");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/add_new_event.php`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEvent, content: extractedContent, image_url: newImageUrl || "" }),
      });
      const data = await res.json();
      if (data.success && data.event) {
        setEvents((prev) => [data.event, ...prev]);
        setIsAddingNew(false); resetNewEvent();
        setMissing(initialMissingState);
        showTempNotification("New event added successfully!");
      } else showTempNotification("Failed to add new event.");
    } catch { showTempNotification("An error occurred while adding the event."); }
  };

  const confirmSingleDelete = async () => {
    if (!selectedEvent) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/delete_event.php`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event_id: selectedEvent.event_id }),
      });
      if ((await res.json()).success) {
        showTempNotification("Event deleted successfully!");
        setEvents((prev) => prev.filter((e) => e.event_id !== selectedEvent.event_id));
        setSelectedEvent(null); setIsEditing(false);
      } else showTempNotification("Failed to delete event.");
    } catch { showTempNotification("An error occurred while deleting."); }
  };

  const handleBulkAction = async (endpoint: string, payload: object, onSuccessCallback: () => void) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if ((await response.json()).success) {
        onSuccessCallback();
        setSelectedEventIds([]); setSelectMode(false);
      } else alert("Action failed.");
    } catch { alert("Error occurred during bulk action."); }
  };

  const handleBulkDelete = () => handleBulkAction("delete_bulk_events.php", { event_ids: selectedEventIds }, () => setEvents((prev) => prev.filter((e) => !selectedEventIds.includes(e.event_id))));
  const applyBulkStatus = (newStatus: string) => handleBulkAction("update_bulk_event_status.php", { event_ids: selectedEventIds, new_status: newStatus }, () => setEvents((prev) => prev.map((event) => selectedEventIds.includes(event.event_id) ? { ...event, event_status: newStatus } : event)));

  const isFieldLocked = selectedEvent?.event_status === "COMPLETED" || selectedEvent?.event_status === "CANCELLED";

  const renderFormatToolbar = (editorId: string, setEventState: any, isAdding: boolean) => (
    <div className="admin-blogs-content-image-tools">
      {[ { cmd: "undo", icon: <FaUndo /> }, { cmd: "redo", icon: <FaRedo /> }, { cmd: "bold", icon: <FaBold /> }, { cmd: "italic", icon: <FaItalic /> }, { cmd: "underline", icon: <FaUnderline /> } ].map(btn => (
        <button key={btn.cmd} className={`format-btn ${btn.cmd}`} onMouseDown={(e) => { e.preventDefault(); saveSelection(); }} onClick={() => applyFormatting(btn.cmd)}>
          {btn.icon}
        </button>
      ))}
      <button className="format-btn bullet" onMouseDown={(e) => { e.preventDefault(); saveSelection(); }} onClick={() => applyFormatting("insertUnorderedList")}><FaListUl /></button>
      <button className="format-btn image" onMouseDown={(e) => e.preventDefault()} onClick={() => document.getElementById(isAdding ? "add-new-content-image-input" : "new-content-image-input")?.click()}><FaImage /></button>
      <input type="file" accept="image/*" id={isAdding ? "add-new-content-image-input" : "new-content-image-input"} style={{ display: "none" }} onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData(); formData.append("image", file);
        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload_event_image.php`, { method: "POST", body: formData });
          const data = await res.json();
          if (data.success && data.image_url) {
            const img = `<img src="${getFullImageUrl(data.image_url)}" alt="event image" style="max-width:100%; margin: 10px 0; display:block;" />`;
            const div = document.getElementById(editorId);
            if (div) { div.innerHTML += img; setEventState((prev: any) => ({ ...prev, content: div.innerHTML })); }
          } else alert("Image upload failed.");
        } catch { alert("An error occurred during upload."); }
      }} />
    </div>
  );

  return (
    <div className="admin-events">
      {showCropper && (
        <div className="cropper-overlay">
          <div className="cropper-container">
            <button className="cropper-close-btn" onClick={() => setShowCropper(false)}><FaTimes size={20} /></button>
            <Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={16 / 9} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, area) => setCroppedArea(area)} />
            <button className="cropper-confirm-btn" onClick={applyCrop}>Confirm</button>
          </div>
        </div>
      )}

      {/* Header section... */}
      <div className="admin-events-header">
        <div className="admin-events-search-container">
          <FaSearch className="admin-events-search-icon" />
          <input type="text" style={{ display: "none" }} />
          <input type="password" style={{ display: "none" }} />
          <input type="text" placeholder="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoComplete="off" name="search-blog" id="search-blog" />
        </div>
        <div className="admin-events-header-right">
          <div className="admin-blogs-userinfo" onClick={() => setShowProfileModal(true)} style={{ cursor: "pointer" }}>
            <div className="userinfo-label">Logged in as:</div>
            <div className="userinfo-details">
              <p className="userinfo-name">{loggedInUser?.user_name || "Admin"}</p>
              <p className="userinfo-email">{loggedInUser?.user_email || ""}</p>
            </div>
          </div>
          {showProfileModal && (
            <div className="admin-profile-modal">
              <div className="admin-profile-modal-box">
                <div className="modal-close-icon" onClick={() => { setShowProfileModal(false); resetProfileModal(); }}><FaTimes /></div>
                <h2>Change Password</h2>
                <label>Email:</label>
                <input type="email" value={profileEmail} disabled />
                {isEditingProfile && (
                  <div style={{ position: "relative" }}>
                    <label>Old Password:</label>
                    <input type="password" placeholder="Enter your current password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} style={{ width: "100%" }} required />
                    <label>New Password:</label>
                    <input type={showPassword ? "text" : "password"} placeholder="Enter a New Password" value={profilePassword} onChange={(e) => setProfilePassword(e.target.value)} style={{ width: "100%" }} />
                  </div>
                )}
                <div className="admin-profile-buttons">
                  {!isEditingProfile ? (
                    <button onClick={() => setIsEditingProfile(true)}>Edit</button>
                  ) : (
                    <>
                      <button onClick={() => { handleSendOTP(); setOtpRequired(true); }}>Send OTP</button>
                      <button onClick={() => { setShowProfileModal(false); resetProfileModal(); }}>Cancel</button>
                    </>
                  )}
                </div>
                {otpSent && (
                  <div className="otp-verification">
                    <label>Enter 6-digit OTP:</label>
                    <div className="otp-inputs">
                      {Array(6).fill("").map((_, index) => (
                        <input key={index} ref={(el) => { otpRefs.current[index] = el!; }} type="text" maxLength={1} className="otp-box" value={otpInput[index] || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (!val) return;
                            const updated = [...otpInput]; updated[index] = val[0]; setOtpInput(updated.join(""));
                            if (index < 5 && val) otpRefs.current[index + 1]?.focus();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace") {
                              const updated = [...otpInput];
                              if (otpInput[index]) { updated[index] = ""; setOtpInput(updated.join("")); } 
                              else if (index > 0) otpRefs.current[index - 1]?.focus();
                            }
                          }}
                        />
                      ))}
                    </div>
                    <button onClick={handleVerifyOTP}>Verify OTP & Save</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="admin-events-lower-header">
        <div className="admin-events-lower-header-left">
          <h1>Events</h1>
          {viewMode === "table" ? (
            <div className="admin-events-lower-header-select">
              <button onClick={() => { setSelectMode(!selectMode); setSelectedEventIds([]); }}>
                <img src={select} className="admin-blogs-lower-header-select-img" /> {selectMode ? "Cancel" : "Select"}
              </button>
            </div>
          ) : (
            <div className="admin-blogs-lower-header-show">
              <p>Category</p>
              <div className="admin-blogs-lower-header-category" onClick={() => setOpenCategory(!openCategory)}>
                {selectedCategory} <span className="dropdown-arrow">▾</span>
                {openCategory && (
                  <div className="admin-events-dropdown-menu">
                    {FILTER_CATEGORIES.map((item) => (
                      <div key={item} className="admin-events-dropdown-item" onClick={() => { setSelectedCategory(item); setOpenCategory(false); }}>{item}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="admin-events-lower-header-right">
          <div className="admin-blogs-toggle-newblog">
            <div className="admin-blogs-toggle-wrapper">
              <button className={`admin-blogs-toggle-button ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")}>Table View</button>
              <button className={`admin-blogs-toggle-button ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}>Grid View</button>
            </div>
            <div className="admin-events-lower-header-new-event">
              <button onClick={() => setIsAddingNew(true)}><FaPlus className="admin-icon-left" /> Add New Event</button>
            </div>
          </div>
        </div>
      </div>

      {selectMode && (
        <div className="admin-events-bulk-actions">
          <button className="bulk-delete-btn" onClick={() => { setBulkActionType("delete"); setBulkConfirmVisible(true); }}>DELETE</button>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === "table" ? (
        <div className="admin-events-main-content">
          <div className="admin-events-scrollable-table">
            <table className="admin-events-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>
                    <div className="admin-events-dropdown-trigger" onClick={() => setOpenCategory(!openCategory)}>
                      Category <span className="admin-header-dropdown-arrow">▾</span>
                      {openCategory && (
                        <div className="admin-header-dropdown-menu">
                          {FILTER_CATEGORIES.map((item) => (
                            <div key={item} className="admin-header-dropdown-item" onClick={() => { setSelectedCategory(item); setOpenCategory(false); }}>{item}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                  <th>Title</th>
                  <th>
                    <div className="admin-events-dropdown-trigger" onClick={() => setOpenCreatedAt(!openCreatedAt)}>
                      Date <span className="admin-header-dropdown-arrow">▾</span>
                      {openCreatedAt && (
                        <div className="admin-header-dropdown-menu">
                          {["Newest First", "Oldest First"].map((order) => (
                            <div key={order} className="admin-header-dropdown-item" onClick={() => { setCreatedSortOrder(order); setOpenCreatedAt(false); }}>{order}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                  <th>Venue</th>
                  <th>
                    <div className="admin-events-dropdown-trigger" onClick={() => setOpenStatus(!openStatus)}>
                      Status <span className="admin-header-dropdown-arrow">▾</span>
                      {openStatus && (
                        <div className="admin-header-dropdown-menu">
                          {["All", "Upcoming", "Ongoing", "Completed", "Cancelled"].map((status) => (
                            <div key={status} className="admin-header-dropdown-item" onClick={() => { setSelectedStatus(status); setOpenStatus(false); }}>{status}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                  <th>{selectMode ? "Select" : "View"}</th>
                </tr>
              </thead>
              <colgroup>
                <col style={{ width: "80px" }} /><col style={{ width: "70px" }} /><col style={{ width: "80px" }} /><col style={{ width: "70px" }} /><col style={{ width: "80px" }} /><col style={{ width: "60px" }} /><col style={{ width: "40px" }} />
              </colgroup>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="no-blogs-message"><span className="loading-spinner"></span> Loading events…</td></tr>
                ) : pagedEvents.length > 0 ? (
                  pagedEvents.map((event) => (
                    <tr key={event.event_id} className="admin-events-table-content" style={{ cursor: selectMode ? "default" : "pointer" }} onClick={() => { if (!selectMode) setSelectedEvent(event); }}>
                      <td className="admin-events-id-content">{event.event_id}</td>
                      <td className="admin-events-category-content category-tag">{event.category?.toUpperCase() || "UNSPECIFIED"}</td>
                      <td className="admin-events-title-content">{event.title}</td>
                      <td className="admin-events-date-content">{formatDate(event.event_date)}</td>
                      <td className="admin-events-venue-content">{event.event_venue}</td>
                      <td className={`event-status status-${event.event_status.toLowerCase()}`}>{event.event_status.toUpperCase()}</td>
                      <td className="admin-events-more-button">
                        {selectMode ? (
                          <input type="checkbox" checked={selectedEventIds.includes(event.event_id)} onClick={(e) => e.stopPropagation()} onChange={(e) => setSelectedEventIds((prev) => e.target.checked ? [...prev, event.event_id] : prev.filter((id) => id !== event.event_id))} />
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}><BsThreeDots /></button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="admin-blogs-table-content no-blogs-row"><td colSpan={7} className="no-blogs-message">No Event Found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination-container">
            {totalEventPages > 1 && (
              <div className="pagination">
                <button onClick={() => setEventsPage((p) => p - 1)} disabled={eventsPage === 1}>‹ Prev</button>
                {[...Array(totalEventPages)].map((_, i) => (
                  <button key={i + 1} className={i + 1 === eventsPage ? "active" : ""} onClick={() => setEventsPage(i + 1)}>{i + 1}</button>
                ))}
                <button onClick={() => setEventsPage((p) => p + 1)} disabled={eventsPage === totalEventPages}>Next ›</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="admin-events-main-content">
          <div className="admin-blogs-grid-view">
            {filteredEvents.length > 0 ? (
              <div className="blog-grid-scrollable-wrapper">
                <div className="blog-grid-container">
                  {filteredEvents.map((event) => (
                    <div key={event.event_id} className={`blog-grid-card grid-status-${event.event_status.toLowerCase()}`} onClick={() => setSelectedEvent(event)}>
                      <img src={getFullImageUrl(event.image_url)} alt={event.title} className="blog-grid-image" />
                      <div className="blog-grid-overlay">
                        <h3 className="blog-overlay-title">{event.title}</h3>
                        <p className="blog-overlay-category">{event.category}</p>
                        <p className="blog-overlay-date">{formatDate(event.event_date)}</p>
                        <p className="blog-overlay-venue">{event.event_venue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p style={{ marginTop: "20px" }}>No events found.</p>}
          </div>
        </div>
      )}

      {/* Edit / View Event Modal */}
      {selectedEvent && (
        <div className="admin-events-view-more">
          <div className="admin-events-modal">
            <div className="admin-events-modal-content">
              <div className="admin-events-float-buttons">
                {isEditing ? (
                  <><button className="save-btn" onClick={handleSave}>Save</button><button className="cancel-btn" onClick={() => { setIsEditing(false); setEditableEvent(null); }}>Cancel</button></>
                ) : (
                  <><button className="edit-btn" onClick={() => { setEditableEvent({ ...selectedEvent }); setIsEditing(true); setTimeout(() => { if (textareaRef.current) textareaRef.current.innerHTML = selectedEvent.content || ""; }, 0); }}>Edit</button><button className="delete-btn" onClick={() => { setBulkActionType("delete"); setBulkActionStatus("SINGLE_DELETE"); setBulkConfirmVisible(true); }}>Delete</button></>
                )}
              </div>
              <button className="admin-events-modal-close" onClick={() => { setIsEditing(false); setEditableEvent(null); setTempImageUrl(null); setSelectedEvent(null); }}>✕</button>
              
              <div className="admin-events-inner-content-modal">
                {notification && <div className={`blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`}>{notification}</div>}
                
                <div className="admin-events-inner-content-modal-top">
                  <div className="admin-events-inner-content-modal-top-left">
                    <h2>Event Details</h2>
                    <div className="admin-events-inner-content-modal-id"><p><strong>ID</strong></p><p className="admin-events-inner-content-modal-id-content">{selectedEvent.event_id}</p></div>
                    <div className="admin-events-inner-content-modal-title">
                      <p><strong>Title {editMissing.title && <span style={{ color: "red" }}>*</span>}</strong></p>
                      {isEditing ? <input type="text" value={editableEvent?.title || ""} onChange={(e) => setEditableEvent({ ...editableEvent!, title: e.target.value })} className="admin-events-inner-content-modal-title-content" /> : <p className="admin-events-inner-content-modal-title-content">{selectedEvent.title}</p>}
                    </div>
                    <div className="admin-events-inner-content-modal-category">
                      <p><strong>Category</strong></p>
                      <select className="admin-events-inner-content-modal-category-content pink-category" value={dropdownCategory ?? ""} onChange={(e) => { setDropdownCategory(e.target.value); setEditableEvent((prev) => prev ? { ...prev, category: e.target.value } : prev); }} disabled={!isEditing}>
                        {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="admin-events-inner-content-modal-venue">
                      <p><strong>Venue {editMissing.event_venue && <span style={{ color: "red" }}>*</span>}</strong></p>
                      {isEditing ? <input type="text" value={editableEvent?.event_venue || ""} onChange={(e) => setEditableEvent((prev) => prev ? { ...prev, event_venue: e.target.value } : prev)} onBlur={() => setEditableEvent((prev) => prev ? { ...prev, event_venue: prev.event_venue.trim() === "" ? "Manila, Philippines" : prev.event_venue } : prev)} className="admin-events-inner-content-modal-venue-content" disabled={isFieldLocked} /> : <p className="admin-events-inner-content-modal-venue-content">{selectedEvent.event_venue}</p>}
                    </div>
                    {(isEditing ? editableEvent?.event_venue : selectedEvent.event_venue) && (
                      <div className="admin-events-google-map">
                        <iframe src={`https://www.google.com/maps?q=${encodeURIComponent((isEditing ? editableEvent?.event_venue : selectedEvent.event_venue) ?? "")}&z=18&output=embed`} width="100%" height="250" loading="lazy" style={{ border: "0", borderRadius: "10px", marginTop: "15px" }} allowFullScreen></iframe>
                      </div>
                    )}
                  </div>
                  
                  <div className="admin-events-inner-content-modal-top-right">
                    <div className="admin-events-inner-content-modal-status">
                      <p><strong>Status</strong></p>
                      <select className={`admin-events-inner-content-modal-status-content status-${dropdownStatus?.toLowerCase()}`} value={dropdownStatus ?? ""} onChange={(e) => { setDropdownStatus(e.target.value); setEditableEvent((prev) => prev ? { ...prev, event_status: e.target.value } : prev); }} disabled={!isEditing || isFieldLocked}>
                        {dropdownStatus && !["UPCOMING", "CANCELLED"].includes(dropdownStatus) && <option value={dropdownStatus} disabled>{dropdownStatus}</option>}
                        {["UPCOMING", "CANCELLED"].map((stat) => <option key={stat} value={stat}>{stat}</option>)}
                      </select>
                    </div>
                    <div className="admin-events-inner-content-modal-date">
                      <p><strong>Date</strong></p>
                      {isEditing ? <input type="date" value={editableEvent?.event_date || ""} onChange={(e) => setEditableEvent({ ...editableEvent!, event_date: e.target.value })} className="admin-events-inner-content-modal-date-content" disabled={isFieldLocked} /> : <p className="admin-events-inner-content-modal-date-content">{formatDate(selectedEvent.event_date)}</p>}
                    </div>
                    <div className="admin-events-inner-content-modal-time">
                      <div className="admin-events-inner-content-modal-time-start">
                        <p><strong>Start Time</strong></p>
                        {isEditing ? <input type="time" value={editableEvent?.event_start_time || ""} onChange={(e) => setEditableEvent({ ...editableEvent!, event_start_time: e.target.value })} className="admin-events-inner-content-modal-time-start-content" disabled={isFieldLocked} /> : <p className="admin-events-inner-content-modal-time-start-content">{formatTime(selectedEvent.event_start_time)}</p>}
                      </div>
                      <div className="admin-events-inner-content-modal-time-end">
                        <p><strong>End Time</strong></p>
                        {isEditing ? <input type="time" value={editableEvent?.event_end_time || ""} onChange={(e) => setEditableEvent({ ...editableEvent!, event_end_time: e.target.value })} className="admin-events-inner-content-modal-time-end-content" disabled={isFieldLocked} /> : <p className="admin-events-inner-content-modal-time-end-content">{formatTime(selectedEvent.event_end_time)}</p>}
                      </div>
                    </div>
                    <div className="admin-events-inner-content-modal-speakers">
                      <p><strong>Speakers {editMissing.event_speakers && <span style={{ color: "red" }}>*</span>}</strong></p>
                      {isEditing ? <textarea value={editableEvent?.event_speakers || ""} onChange={(e) => setEditableEvent({ ...editableEvent!, event_speakers: e.target.value })} className="admin-events-inner-content-modal-speakers-content" /> : <p className="admin-events-inner-content-modal-speakers-content" style={{ whiteSpace: "pre-wrap" }}>{selectedEvent.event_speakers}</p>}
                    </div>
                  </div>
                </div>

                <div className="admin-events-inner-content-modal-bot">
                  <div className="admin-events-inner-content-modal-bot-left">
                    <div className="admin-events-inner-content-modal-image">
                      <p><strong>Image {editMissing.image_url && <span style={{ color: "red" }}>*</span>}</strong></p>
                      {getFullImageUrl(isEditing ? tempImageUrl ?? editableEvent?.image_url ?? "" : selectedEvent.image_url) ? (
                        <img src={getFullImageUrl(isEditing ? tempImageUrl ?? editableEvent?.image_url ?? "" : selectedEvent.image_url)} alt="Event" style={{ cursor: "zoom-in" }} onClick={() => setFullscreenImageUrl(getFullImageUrl(isEditing ? tempImageUrl ?? editableEvent?.image_url ?? "" : selectedEvent.image_url))} />
                      ) : (
                        <div style={{ width: "100%", height: "200px", maxWidth: "100%", maxHeight: "300px", backgroundColor: "#f2f2f2", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "italic", border: "1px dashed #ccc" }}>No Event Image</div>
                      )}
                      <input type="file" id="event-image-upload" accept="image/*" style={{ display: "none" }} onChange={(e) => handleImageSelect(e, "edit")} />
                      <div className="admin-blogs-image-buttons">
                        <button className="upload-btn" disabled={!isEditing} onClick={() => document.getElementById("event-image-upload")?.click()}>Upload</button>
                        <button className="remove-btn" disabled={!isEditing} onClick={() => { setTempImageUrl(null); if (editableEvent) setEditableEvent({ ...editableEvent, image_url: "" }); }}>Remove</button>
                      </div>
                    </div>
                  </div>
                  <div className="admin-events-inner-content-modal-bot-right">
                    <div className="admin-events-inner-content-modal-desc">
                      <p><strong>Event Content {editMissing.content && <span style={{ color: "red" }}>*</span>}</strong></p>
                      {isEditing ? (
                        <>
                          {renderFormatToolbar("new-event-content-editor", setEditableEvent, false)}
                          <div id="new-event-content-editor" ref={textareaRef} className="admin-blogs-modal-desc-content editable" contentEditable onBlur={() => { if (textareaRef.current) { const updatedContent = textareaRef.current.innerHTML; setEditableEvent((prev) => prev ? { ...prev, content: updatedContent } : prev); } }} />
                        </>
                      ) : (
                        <div className="admin-blogs-modal-desc-content"><div className="admin-blogs-content-images-wrapper"><div dangerouslySetInnerHTML={{ __html: selectedEvent.content }} /></div></div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="event-participants card">
                  <h3>Participants</h3>
                  {participants.length > 0 ? (
                    <>
                      <div className="participants-table-wrapper">
                        <table className="participants-table">
                          <thead><tr><th>Name</th><th>Email</th><th>Contact</th><th>Expectations</th><th>Signed Up</th></tr></thead>
                          <tbody>{paginatedParticipants.map((p) => (<tr key={p.participant_id}><td>{p.name}</td><td>{p.email}</td><td>{p.contact || "—"}</td><td>{p.expectations || "—"}</td><td>{new Date(p.created_at).toLocaleDateString()}</td></tr>))}</tbody>
                        </table>
                      </div>
                      {totalPages > 1 && (
                        <div className="pagination">
                          <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>‹ Prev</button>
                          {[...Array(totalPages)].map((_, i) => (<button key={i + 1} className={i + 1 === currentPage ? "active" : ""} onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>))}
                          <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}>Next ›</button>
                        </div>
                      )}
                    </>
                  ) : <p className="no-participants">No one has signed up yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Confirm Modal */}
      {bulkConfirmVisible && (
        <div className="blogs-confirmation-popup show">
          <div className="blogs-confirmation-box">
            <p>
              {bulkActionType === "delete" && bulkActionStatus === "SINGLE_DELETE" ? "Are you sure you want to delete this event and all its images?"
                : bulkActionType === "delete" ? "Are you sure you want to delete the selected events?" : `Do you really want to mark the selected events as ${bulkActionStatus}?`}
            </p>
            <div className="blogs-confirmation-actions">
              <button className="confirm-yes" onClick={() => { if (bulkActionType === "delete") { bulkActionStatus === "SINGLE_DELETE" ? confirmSingleDelete() : handleBulkDelete(); } else { applyBulkStatus(bulkActionStatus); } setBulkConfirmVisible(false); }}>Yes</button>
              <button className="confirm-no" onClick={() => setBulkConfirmVisible(false)}>No</button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Event Modal */}
      {isAddingNew && (
        <div className="admin-new-event">
          <div className="admin-new-event-modal">
            <div className="admin-new-event-modal-content">
              <div className="admin-new-event-float-buttons">
                <button className="save-btn" onClick={handleAddNewEventSave}>Save</button>
                <button className="cancel-btn" onClick={() => { setIsAddingNew(false); resetNewEvent(); }}>Cancel</button>
              </div>
              <button className="admin-new-event-modal-close" onClick={() => { setIsAddingNew(false); resetNewEvent(); }}>✕</button>
              
              <div className="admin-new-event-inner-content-modal">
                {notification && <div className={`blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`}>{notification}</div>}
                
                <div className="admin-new-event-inner-content-modal-top">
                  <div className="admin-new-event-inner-content-modal-top-left">
                    <h2>Event Details</h2>
                    <p><strong>Title {missing.title && <span style={{ color: "red" }}>*</span>}</strong></p>
                    <input className="admin-new-event-inner-content-modal-title-content" type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
                    
                    <div className="admin-new-event-inner-content-modal-category">
                      <p><strong>Category {missing.category && <span style={{ color: "red" }}>*</span>}</strong></p>
                      <select className="admin-events-inner-content-modal-category-content pink-category" value={newEvent.category} onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}>
                        {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>

                    <div className="admin-new-event-inner-content-modal-venue">
                      <p><strong>Venue {missing.event_venue && <span style={{ color: "red" }}>*</span>}</strong></p>
                      <input type="text" className="admin-new-event-inner-content-modal-venue-content" value={newEvent.event_venue} onChange={(e) => setNewEvent({ ...newEvent, event_venue: e.target.value })} />
                    </div>
                    
                    {newEvent.event_venue && (
                      <div className="admin-events-google-map">
                        <iframe src={`https://www.google.com/maps?q=${encodeURIComponent(newEvent.event_venue)}&z=18&output=embed`} width="100%" height="250" loading="lazy" style={{ border: "0", borderRadius: "10px", marginTop: "15px" }} allowFullScreen></iframe>
                      </div>
                    )}
                  </div>

                  <div className="admin-new-event-inner-content-modal-top-right">
                    <div className="admin-new-event-inner-content-modal-status">
                      <p><strong>Status</strong></p>
                      <select className={`admin-events-inner-content-modal-status-content status-${newEvent.event_status.toLowerCase()}`} value={newEvent.event_status} disabled>
                        <option value="UPCOMING">UPCOMING</option>
                      </select>
                    </div>

                    <div className="admin-new-event-inner-content-modal-date">
                      <p><strong>Date {missing.event_date && <span style={{ color: "red" }}>*</span>}</strong></p>
                      <input type="date" className="admin-new-event-inner-content-modal-date-content" value={newEvent.event_date} onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })} />
                    </div>

                    <div className="admin-new-event-inner-content-modal-time">
                      <div className="admin-new-event-inner-content-modal-time-start">
                        <p><strong>Start Time {missing.event_start_time && <span style={{ color: "red" }}>*</span>}</strong></p>
                        <input type="time" className="admin-new-event-inner-content-modal-time-start-content" value={newEvent.event_start_time} onChange={(e) => setNewEvent({ ...newEvent, event_start_time: e.target.value })} />
                      </div>
                      <div className="admin-new-event-inner-content-modal-time-end">
                        <p><strong>End Time {missing.event_end_time && <span style={{ color: "red" }}>*</span>}</strong></p>
                        <input type="time" className="admin-new-event-inner-content-modal-time-end-content" value={newEvent.event_end_time} onChange={(e) => setNewEvent({ ...newEvent, event_end_time: e.target.value })} />
                      </div>
                    </div>

                    <div className="admin-events-inner-content-modal-speakers">
                      <p><strong>Speaker/s {missing.event_speakers && <span style={{ color: "red" }}>*</span>}</strong></p>
                      <textarea className="admin-new-event-inner-content-modal-speakers-content" value={newEvent.event_speakers} onChange={(e) => setNewEvent({ ...newEvent, event_speakers: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="admin-new-event-inner-content-modal-bot">
                  <div className="admin-new-event-inner-content-modal-bot-left">
                    <div className="admin-new-event-inner-content-modal-image">
                      <p><strong>Image {missing.image && <span style={{ color: "red" }}>*</span>}</strong></p>
                      {getFullImageUrl(newImageUrl) ? (
                        <img src={getFullImageUrl(newImageUrl)} alt="Event" style={{ cursor: "zoom-in" }} onClick={() => setFullscreenImageUrl(getFullImageUrl(newImageUrl))} />
                      ) : (
                        <div style={{ width: "100%", height: "200px", maxWidth: "100%", maxHeight: "300px", backgroundColor: "#f2f2f2", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", fontStyle: "italic", border: "1px dashed #ccc" }}>No Event Image</div>
                      )}
                      <input type="file" accept="image/*" style={{ display: "none" }} id="new-event-image-upload" onChange={(e) => handleImageSelect(e, "new")} />
                      <div className="admin-blogs-image-buttons">
                        <button className="upload-btn" onClick={() => document.getElementById("new-event-image-upload")?.click()}>Upload</button>
                        <button className="remove-btn" onClick={() => setNewImageUrl(null)}>Remove</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="admin-new-event-inner-content-modal-bot-right">
                    <div className="admin-new-event-inner-content-modal-desc">
                      <p><strong>Event Content {missing.content && <span style={{ color: "red" }}>*</span>}</strong></p>
                      {renderFormatToolbar("add-event-content-editor", setNewEvent, true)}
                      <div id="add-event-content-editor" className="admin-new-event-inner-content-modal-desc-content editable" contentEditable onBlur={() => { const div = document.getElementById("add-event-content-editor"); if (div) { setNewEvent({ ...newEvent, content: div.innerHTML }); } }} />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {fullscreenImageUrl && (
        <div className="fullscreen-image-overlay" onClick={() => setFullscreenImageUrl(null)}>
          <img src={fullscreenImageUrl} alt="Fullscreen" />
        </div>
      )}
      <ToastContainer position="top-center" autoClose={4000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
    </div>
  );
};

export default AdminEvents;