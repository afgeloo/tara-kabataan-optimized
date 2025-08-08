import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import "./css/admin-events.css";
import { BsThreeDots } from "react-icons/bs";
import { FaSearch, FaPlus } from "react-icons/fa";
import { useEffect, useState, useRef, useMemo } from "react";
import { FaBold, FaItalic, FaUnderline, FaImage, FaListUl, FaUndo, FaRedo, FaTimes, } from "react-icons/fa";
import select from "../assets/adminpage/blogs/select.png";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "./utils/cropImage";
const AdminEvents = () => {
    const [events, setEvents] = useState([]);
    const [openCategory, setOpenCategory] = useState(false);
    const [openStatus, setOpenStatus] = useState(false);
    const [openCreatedAt, setOpenCreatedAt] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [createdSortOrder, setCreatedSortOrder] = useState("Newest First");
    const [count, setCount] = useState(-1);
    const [open, setOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [dropdownCategory, setDropdownCategory] = useState(null);
    const [dropdownStatus, setDropdownStatus] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editableEvent, setEditableEvent] = useState(null);
    const [tempImageUrl, setTempImageUrl] = useState(null);
    const textareaRef = useRef(null);
    const selectionRef = useRef(null);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedEventIds, setSelectedEventIds] = useState([]);
    const [bulkConfirmVisible, setBulkConfirmVisible] = useState(false);
    const [bulkActionStatus, setBulkActionStatus] = useState("");
    const [bulkActionType, setBulkActionType] = useState(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [notification, setNotification] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const [loggedInUser, setLoggedInUser] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileEmail, setProfileEmail] = useState(loggedInUser?.user_email || "");
    const [profilePhone, setProfilePhone] = useState(loggedInUser?.user_contact || "");
    const [profilePassword, setProfilePassword] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpInput, setOtpInput] = useState("");
    const [otpRequired, setOtpRequired] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const otpRefs = useRef([]);
    const [showCropper, setShowCropper] = useState(false);
    const [cropSrc, setCropSrc] = useState("");
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [cropMode, setCropMode] = useState("new");
    const [croppedArea, setCroppedArea] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });
    const handleImageSelect = (e, mode) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => {
            setCropSrc(reader.result);
            setCropMode(mode);
            setShowCropper(true);
        };
        reader.readAsDataURL(file);
    };
    const [loading, setLoading] = useState(true);
    const applyCrop = async () => {
        try {
            const blob = await getCroppedImg(cropSrc, croppedArea);
            const form = new FormData();
            form.append("image", blob, "cropped.jpg");
            let endpoint;
            if (cropMode === "new") {
                endpoint = `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/add_new_event_image.php`;
            }
            else {
                endpoint = `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/upload_event_image.php`;
                form.append("event_id", editableEvent.event_id);
            }
            const res = await fetch(endpoint, { method: "POST", body: form });
            const data = await res.json();
            if (data.success && data.image_url) {
                if (cropMode === "new") {
                    setNewImageUrl(data.image_url);
                }
                else {
                    setTempImageUrl(data.image_url);
                }
            }
            else {
                toast.error("Upload failed");
            }
        }
        catch (err) {
            console.error(err);
            toast.error("An error occurred while uploading");
        }
        finally {
            setShowCropper(false);
        }
    };
    useEffect(() => {
        if (loggedInUser) {
            setProfileEmail(loggedInUser.user_email || "");
            setProfilePhone(loggedInUser.user_contact || "");
        }
    }, [loggedInUser]);
    const handleSendOTP = async () => {
        if (!profileEmail) {
            toast.error("Email not found.");
            return;
        }
        if (!profilePhone && !profilePassword) {
            toast.error("At least one of phone or password must be provided.");
            return;
        }
        if (profilePassword) {
            if (!oldPassword) {
                toast.error("Please enter your current password.");
                return;
            }
            try {
                const verifyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/verify_old_password.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: profileEmail,
                        old_password: oldPassword,
                    }),
                });
                const verifyData = await verifyRes.json();
                if (!verifyData.valid) {
                    toast.error("Old password is incorrect.");
                    return;
                }
            }
            catch (err) {
                toast.error("Failed to verify old password.");
                return;
            }
            if (profilePassword.length < 8) {
                toast.error("Password must be at least 8 characters.");
                return;
            }
            const strongPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).+$/;
            if (!strongPattern.test(profilePassword)) {
                toast.error("Password must include letters, numbers, and symbols.");
                return;
            }
            const emailParts = profileEmail.split(/[@._\-]/).filter(Boolean);
            const passwordLower = profilePassword.toLowerCase();
            for (const part of emailParts) {
                if (part && passwordLower.includes(part.toLowerCase())) {
                    toast.error("Password should not include parts of your email.");
                    return;
                }
            }
            try {
                const prevRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/check_previous_password.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: profileEmail,
                        new_password: profilePassword,
                    }),
                });
                const prevData = await prevRes.json();
                if (prevData.same === true) {
                    toast.error("New password must be different from the previous password.");
                    return;
                }
            }
            catch {
                toast.error("Failed to check previous password.");
                return;
            }
        }
        const toastId = toast.loading("Sending OTP...");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/send_otp.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: profileEmail }),
            });
            const data = await res.json();
            if (data.success) {
                setOtpSent(true);
                toast.update(toastId, {
                    render: (_jsxs("div", { children: [_jsx("strong", { children: "OTP sent to your email." }), _jsx("div", { style: { fontSize: "0.8rem", marginTop: "4px" }, children: "Check spam folder if not found." })] })),
                    type: "success",
                    isLoading: false,
                    autoClose: 3000,
                });
            }
            else {
                toast.update(toastId, {
                    render: data.message || "Failed to send OTP.",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
            }
        }
        catch (err) {
            toast.update(toastId, {
                render: "Error sending OTP.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            console.error(err);
        }
    };
    const handleProfileUpdate = async () => {
        if (!profilePhone && !profilePassword) {
            toast.error("At least one of phone or password must be provided.");
            return;
        }
        if (profilePassword) {
            if (profilePassword.length < 8) {
                toast.error("Password must be at least 8 characters.");
                return;
            }
            const strongPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).+$/;
            if (!strongPattern.test(profilePassword)) {
                toast.error("Password must include letters, numbers, and symbols.");
                return;
            }
            const emailParts = profileEmail.split(/[@._\-]/).filter(Boolean);
            const passwordLower = profilePassword.toLowerCase();
            for (const part of emailParts) {
                if (part && passwordLower.includes(part.toLowerCase())) {
                    toast.error("Password should not include parts of your email.");
                    return;
                }
            }
            try {
                const prevRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/check_previous_password.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: profileEmail,
                        new_password: profilePassword,
                    }),
                });
                const prevData = await prevRes.json();
                if (prevData.same === true) {
                    toast.error("New password must be different from the previous password.");
                    return;
                }
            }
            catch {
                toast.error("Failed to check previous password.");
                return;
            }
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/update_profile.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: loggedInUser?.user_id,
                    email: profileEmail,
                    phone: profilePhone,
                    password: profilePassword,
                }),
            });
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                if (data.success) {
                    toast.success("Profile updated!");
                    setLoggedInUser(data.user);
                    localStorage.setItem("admin-user", JSON.stringify(data.user));
                    setShowProfileModal(false);
                }
                else {
                    toast.error(data.message || "Failed to update profile.");
                }
            }
            catch (err) {
                console.error("Invalid JSON from update_profile.php:", text);
                toast.error("Invalid server response.");
            }
        }
        catch (err) {
            console.error("Fetch error:", err);
            toast.error("Server error.");
        }
    };
    const handleVerifyOTP = async () => {
        const toastId = toast.loading("Verifying OTP...");
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/verify_otp.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: profileEmail, otp: otpInput }),
            });
            const data = await res.json();
            if (data.success) {
                await handleProfileUpdate();
                setOtpSent(false);
                setOtpInput("");
                setIsEditingProfile(false);
                toast.update(toastId, {
                    render: "OTP verified. Profile updated.",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000,
                });
            }
            else {
                toast.update(toastId, {
                    render: "Incorrect OTP.",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
            }
        }
        catch (err) {
            toast.update(toastId, {
                render: "Error verifying OTP.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            console.error(err);
        }
    };
    useEffect(() => {
        const storedUser = localStorage.getItem("admin-user");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setLoggedInUser(parsed);
            }
            catch {
                console.error("Failed to parse stored user");
            }
        }
    }, []);
    const [markerPosition, setMarkerPosition] = useState({
        lat: 14.5995,
        lng: 120.9842,
    });
    const handleMarkerDragEnd = async (e) => {
        const lat = e.latLng?.lat();
        const lng = e.latLng?.lng();
        if (lat && lng) {
            setMarkerPosition({ lat, lng });
            const apiKey = "YOUR_GOOGLE_MAPS_API_KEY";
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
            const data = await response.json();
            if (data.status === "OK") {
                const address = data.results[0]?.formatted_address || "";
                if (isEditing && editableEvent) {
                    setEditableEvent({ ...editableEvent, event_venue: address });
                }
            }
            else {
                console.error("Reverse Geocoding failed:", data.status);
            }
        }
    };
    useEffect(() => {
        if (selectedEvent) {
            setDropdownCategory(selectedEvent.category);
            setDropdownStatus(selectedEvent.event_status);
        }
    }, [selectedEvent]);
    useEffect(() => {
        setLoading(true);
        fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/events1.php`)
            .then((res) => res.json())
            .then((data) => {
            console.log("EVENTS DATA:", data);
            const now = new Date();
            const updatedEvents = (data.events || []).map((event) => {
                const [startHour, startMinute] = event.event_start_time
                    .split(":")
                    .map(Number);
                const [endHour, endMinute] = event.event_end_time
                    .split(":")
                    .map(Number);
                const eventStartDatetime = new Date(event.event_date);
                eventStartDatetime.setHours(startHour, startMinute, 0, 0);
                const eventEndDatetime = new Date(event.event_date);
                eventEndDatetime.setHours(endHour, endMinute, 0, 0);
                const now = new Date();
                if (event.event_status === "UPCOMING") {
                    if (now >= eventStartDatetime && now <= eventEndDatetime) {
                        event.event_status = "ONGOING";
                        fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/update_event_status.php`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                event_id: event.event_id,
                                new_status: "ONGOING",
                            }),
                        }).catch((err) => console.error("Failed to update backend to ONGOING:", err));
                    }
                    else if (now > eventEndDatetime) {
                        event.event_status = "COMPLETED";
                        fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/update_event_status.php`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                event_id: event.event_id,
                                new_status: "COMPLETED",
                            }),
                        }).catch((err) => console.error("Failed to update backend to COMPLETED:", err));
                    }
                }
                return event;
            });
            setEvents(updatedEvents);
        })
            .catch((err) => console.error("Failed to fetch events:", err))
            .finally(() => setLoading(false));
    }, []);
    const formatDate = (timestamp) => {
        if (!timestamp)
            return "—";
        const date = new Date(timestamp);
        return isNaN(date.getTime())
            ? "—"
            : date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
    };
    const filteredEvents = useMemo(() => {
        return events
            .filter((event) => {
            const matchCategory = selectedCategory === "All" ||
                event.category.toLowerCase() === selectedCategory.toLowerCase();
            const matchStatus = selectedStatus === "All" ||
                event.event_status.toLowerCase() === selectedStatus.toLowerCase();
            const searchLower = searchQuery.toLowerCase();
            const matchSearch = event.event_id.toLowerCase().includes(searchLower) ||
                event.title.toLowerCase().includes(searchLower) ||
                event.event_venue.toLowerCase().includes(searchLower) ||
                event.event_speakers.toLowerCase().includes(searchLower) ||
                event.category.toLowerCase().includes(searchLower) ||
                event.event_status.toLowerCase().includes(searchLower) ||
                formatDate(event.event_date).toLowerCase().includes(searchLower);
            return matchCategory && matchStatus && matchSearch;
        })
            .sort((a, b) => {
            const dateA = new Date(a.event_date).getTime();
            const dateB = new Date(b.event_date).getTime();
            return createdSortOrder === "Newest First"
                ? dateB - dateA
                : dateA - dateB;
        });
    }, [events, selectedCategory, selectedStatus, searchQuery, createdSortOrder]);
    const formatTime = (timeString) => {
        if (!timeString)
            return "—";
        const [hourStr, minuteStr] = timeString.split(":");
        const hour = parseInt(hourStr);
        const minute = parseInt(minuteStr);
        if (isNaN(hour) || isNaN(minute))
            return "—";
        const date = new Date();
        date.setHours(hour);
        date.setMinutes(minute);
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
        });
    };
    const handleEdit = () => {
        if (selectedEvent) {
            setEditableEvent({ ...selectedEvent });
            setIsEditing(true);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.innerHTML = selectedEvent.content || "";
                }
            }, 0);
        }
    };
    const handleCancel = () => {
        setIsEditing(false);
        setEditableEvent(null);
    };
    const [editMissing, setEditMissing] = useState({
        title: false,
        category: false,
        event_date: false,
        event_start_time: false,
        event_end_time: false,
        event_venue: false,
        event_speakers: false,
        content: false,
        image_url: false,
    });
    const handleSave = () => {
        if (!editableEvent)
            return;
        const content = textareaRef.current?.innerHTML.trim() || "";
        const textContent = textareaRef.current?.textContent?.trim() || "";
        const hasImage = Boolean(textareaRef.current?.querySelector("img"));
        const newEditMissing = {
            title: !editableEvent.title.trim(),
            category: !editableEvent.category.trim(),
            event_date: !editableEvent.event_date,
            event_start_time: !editableEvent.event_start_time,
            event_end_time: !editableEvent.event_end_time,
            event_venue: !editableEvent.event_venue.trim(),
            event_speakers: !editableEvent.event_speakers.trim(),
            content: !(textContent || hasImage),
            image_url: !tempImageUrl && !editableEvent.image_url,
        };
        setEditMissing(newEditMissing);
        if (Object.values(newEditMissing).some(Boolean)) {
            setNotification("Please fill out all required fields marked with *");
            setTimeout(() => setNotification(""), 4000);
            return;
        }
        const now = new Date();
        const eventDate = new Date(editableEvent.event_date);
        const [startHour, startMinute] = editableEvent.event_start_time
            .split(":")
            .map(Number);
        eventDate.setHours(startHour, startMinute, 0, 0);
        if (editableEvent.event_status !== "COMPLETED" && eventDate < now) {
            setNotification("Cannot set an event date and time in the past!");
            setTimeout(() => setNotification(""), 4000);
            return;
        }
        if (tempImageUrl !== null) {
            editableEvent.image_url = tempImageUrl;
        }
        fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/update_event.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editableEvent),
        })
            .then((res) => res.json())
            .then((data) => {
            if (data.success) {
                const updated = { ...editableEvent };
                setEvents((prev) => prev.map((e) => (e.event_id === updated.event_id ? updated : e)));
                setSelectedEvent(updated);
                setEditableEvent(null);
                setTempImageUrl(null);
                setIsEditing(false);
                setNotification("Event updated successfully!");
                setSelectedStatus("All");
                setTimeout(() => setNotification(""), 4000);
            }
            else {
                setNotification("Failed to update event.");
                setTimeout(() => setNotification(""), 4000);
            }
        })
            .catch((err) => {
            console.error("Update error:", err);
            alert("An error occurred while updating.");
        });
    };
    const handleAddNewEventSave = async () => {
        const editor = document.getElementById("add-event-content-editor");
        const extractedContent = editor ? editor.innerHTML.trim() : "";
        const newMissing = {
            title: !newEvent.title.trim(),
            category: !newEvent.category.trim(),
            event_date: !newEvent.event_date,
            event_start_time: !newEvent.event_start_time,
            event_end_time: !newEvent.event_end_time,
            event_venue: !newEvent.event_venue.trim(),
            event_speakers: !newEvent.event_speakers.trim(),
            content: !extractedContent,
            image: !newImageUrl,
        };
        setMissing(newMissing);
        if (Object.values(newMissing).some(Boolean)) {
            setNotification("Please fill out all required fields marked with *");
            setTimeout(() => setNotification(""), 4000);
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(newEvent.event_date);
        selectedDate.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            setNotification("Event date cannot be in the past!");
            setTimeout(() => setNotification(""), 4000);
            return;
        }
        const payload = {
            ...newEvent,
            event_status: "UPCOMING",
            content: extractedContent,
            image_url: newImageUrl || "",
        };
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/add_new_event.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success && data.event) {
                setEvents((prev) => [data.event, ...prev]);
                setNotification("New event added successfully!");
                setIsAddingNew(false);
                resetNewEvent();
                setMissing({
                    title: false,
                    category: false,
                    event_date: false,
                    event_start_time: false,
                    event_end_time: false,
                    event_venue: false,
                    event_speakers: false,
                    content: false,
                    image: false,
                });
            }
            else {
                setNotification("Failed to add new event.");
                console.error("Add error:", data.error);
            }
        }
        catch (err) {
            console.error("Add event error:", err);
            setNotification("An error occurred while adding the event.");
        }
        setTimeout(() => setNotification(""), 4000);
    };
    const handleDelete = () => {
        setBulkActionType("delete");
        setBulkActionStatus("SINGLE_DELETE");
        setBulkConfirmVisible(true);
    };
    const confirmSingleDelete = async () => {
        if (!selectedEvent)
            return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/delete_event.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id: selectedEvent.event_id }),
            });
            const data = await res.json();
            if (data.success) {
                setNotification("Event deleted successfully!");
                setEvents((prev) => prev.filter((e) => e.event_id !== selectedEvent.event_id));
                setSelectedEvent(null);
                setIsEditing(false);
            }
            else {
                setNotification("Failed to delete event: " + (data.message || "Unknown error"));
            }
        }
        catch (error) {
            console.error("Delete error:", error);
            setNotification("An error occurred while deleting.");
        }
        setTimeout(() => setNotification(""), 4000);
    };
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const formData = new FormData();
        formData.append("image", file);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/upload_event_image.php`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success && data.image_url) {
                console.log("Uploaded image URL:", data.image_url);
                setTempImageUrl(data.image_url);
            }
            else {
                alert("Image upload failed.");
            }
        }
        catch (error) {
            console.error("Upload error:", error);
            alert("An error occurred during upload.");
        }
    };
    const handleImageRemove = () => {
        setTempImageUrl(null);
        if (editableEvent) {
            setEditableEvent({ ...editableEvent, image_url: "" });
        }
    };
    const getFullImageUrl = (url) => {
        if (!url)
            return "";
        if (url.startsWith("http"))
            return url;
        if (url.includes("/tara-kabataan-optimized/")) {
            return `${import.meta.env.VITE_API_BASE_URL}${url}`;
        }
        return `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan${url.startsWith("/") ? "" : "/"}${url}`;
    };
    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            selectionRef.current = sel.getRangeAt(0);
        }
    };
    const restoreSelection = () => {
        const sel = window.getSelection();
        if (selectionRef.current && sel) {
            sel.removeAllRanges();
            sel.addRange(selectionRef.current);
        }
    };
    const applyFormatting = (command) => {
        restoreSelection();
        document.execCommand(command, false);
    };
    const applyList = () => {
        restoreSelection();
        document.execCommand("insertUnorderedList", false);
    };
    const handleBulkDelete = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/delete_bulk_events.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_ids: selectedEventIds }),
            });
            const data = await response.json();
            if (data.success) {
                setEvents((prev) => prev.filter((e) => !selectedEventIds.includes(e.event_id)));
                setSelectedEventIds([]);
                setSelectMode(false);
            }
            else {
                alert("Failed to delete events.");
            }
        }
        catch (err) {
            console.error("Bulk delete error:", err);
            alert("Error occurred during bulk delete.");
        }
    };
    const applyBulkStatus = async (newStatus) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/update_bulk_event_status.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_ids: selectedEventIds,
                    new_status: newStatus,
                }),
            });
            const data = await response.json();
            if (data.success) {
                setEvents((prev) => prev.map((event) => selectedEventIds.includes(event.event_id)
                    ? { ...event, event_status: newStatus }
                    : event));
                setSelectedEventIds([]);
                setSelectMode(false);
            }
            else {
                alert("Failed to update status.");
            }
        }
        catch (err) {
            console.error("Bulk status update error:", err);
            alert("Error occurred during bulk status update.");
        }
    };
    const [newEvent, setNewEvent] = useState({
        title: "",
        category: "KALUSUGAN",
        event_date: "",
        event_start_time: "",
        event_end_time: "",
        event_venue: "Manila, Philippines",
        event_status: "UPCOMING",
        event_speakers: "",
        content: "",
        image_url: "",
    });
    const [missing, setMissing] = useState({
        title: true,
        category: true,
        event_date: true,
        event_start_time: true,
        event_end_time: true,
        event_venue: true,
        event_speakers: true,
        content: true,
        image: true,
    });
    const [newImageUrl, setNewImageUrl] = useState(null);
    const resetNewEvent = () => {
        setNewEvent({
            title: "",
            category: "KALUSUGAN",
            event_date: "",
            event_start_time: "",
            event_end_time: "",
            event_venue: "Manila, Philippines",
            event_status: "UPCOMING",
            event_speakers: "",
            content: "",
            image_url: "",
        });
        setNewImageUrl(null);
        const editor = document.getElementById("add-event-content-editor");
        if (editor)
            editor.innerHTML = "";
    };
    const isFieldLocked = selectedEvent?.event_status === "COMPLETED" ||
        selectedEvent?.event_status === "CANCELLED";
    const [fullscreenImageUrl, setFullscreenImageUrl] = useState(null);
    const resetProfileModal = () => {
        setProfilePhone(loggedInUser?.user_contact || "");
        setProfilePassword("");
        setOldPassword("");
        setOtpInput("");
        setOtpSent(false);
        setOtpRequired(false);
        setIsEditingProfile(false);
    };
    useEffect(() => {
        setEditMissing({
            title: false,
            category: false,
            event_date: false,
            event_start_time: false,
            event_end_time: false,
            event_venue: false,
            event_speakers: false,
            content: false,
            image_url: false,
        });
    }, [selectedEvent]);
    const [participants, setParticipants] = useState([]);
    useEffect(() => {
        if (!selectedEvent)
            return;
        fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/event_attendees.php?event_id=${selectedEvent.event_id}`)
            .then((res) => res.json())
            .then((data) => setParticipants(data.participants || []))
            .catch((err) => console.error("Failed to load participants:", err));
    }, [selectedEvent]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(participants.length / itemsPerPage);
    const paginatedParticipants = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return participants.slice(start, start + itemsPerPage);
    }, [participants, currentPage]);
    const [eventsPage, setEventsPage] = useState(1);
    const eventsPerPage = 8;
    useEffect(() => {
        setEventsPage(1);
    }, [selectedCategory, selectedStatus, createdSortOrder, searchQuery]);
    const totalEventPages = Math.ceil(filteredEvents.length / eventsPerPage);
    const pagedEvents = useMemo(() => {
        const start = (eventsPage - 1) * eventsPerPage;
        return filteredEvents.slice(start, start + eventsPerPage);
    }, [filteredEvents, eventsPage]);
    return (_jsxs("div", { className: "admin-events", children: [showCropper && (_jsx("div", { className: "cropper-overlay", children: _jsxs("div", { className: "cropper-container", children: [_jsx("button", { className: "cropper-close-btn", onClick: () => setShowCropper(false), children: _jsx(FaTimes, { size: 20 }) }), _jsx(Cropper, { image: cropSrc, crop: crop, zoom: zoom, aspect: 16 / 9, onCropChange: setCrop, onZoomChange: setZoom, onCropComplete: (_, area) => setCroppedArea(area) }), _jsx("button", { className: "cropper-confirm-btn", onClick: applyCrop, children: "Confirm" })] }) })), _jsxs("div", { className: "admin-events-header", children: [_jsxs("div", { className: "admin-events-search-container", children: [_jsx(FaSearch, { className: "admin-events-search-icon" }), _jsx("input", { type: "text", name: "fakeusernameremembered", style: { display: "none" } }), _jsx("input", { type: "password", name: "fakepasswordremembered", style: { display: "none" } }), _jsx("input", { type: "text", placeholder: "Search", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), autoComplete: "off", name: "search-blog", id: "search-blog" })] }), _jsxs("div", { className: "admin-events-header-right", children: [_jsxs("div", { className: "admin-blogs-userinfo", onClick: () => setShowProfileModal(true), style: { cursor: "pointer" }, children: [_jsx("div", { className: "userinfo-label", children: "Logged in as:" }), _jsxs("div", { className: "userinfo-details", children: [_jsx("p", { className: "userinfo-name", children: loggedInUser?.user_name || "Admin" }), _jsx("p", { className: "userinfo-email", children: loggedInUser?.user_email || "" })] })] }), showProfileModal && (_jsx("div", { className: "admin-profile-modal", children: _jsxs("div", { className: "admin-profile-modal-box", children: [_jsx("div", { className: "modal-close-icon", onClick: () => {
                                                setShowProfileModal(false);
                                                resetProfileModal();
                                            }, children: _jsx(FaTimes, {}) }), _jsx("h2", { children: "Change Password" }), _jsx("label", { children: "Email:" }), _jsx("input", { type: "email", value: profileEmail, disabled: true }), isEditingProfile && (_jsx(_Fragment, { children: _jsxs("div", { style: { position: "relative" }, children: [_jsx("label", { children: "Old Password:" }), _jsx("input", { type: "text", name: "fakeusernameremembered", style: { display: "none" } }), _jsx("input", { type: "password", name: "fakepasswordremembered", style: { display: "none" } }), _jsx("form", { autoComplete: "off", children: _jsx("input", { type: showPassword ? "text" : "password", placeholder: "Enter your current password", autoComplete: "current-password", value: oldPassword, onChange: (e) => setOldPassword(e.target.value), style: { width: "100%" }, required: true }) }), _jsx("label", { children: "New Password:" }), _jsx("input", { type: "text", name: "fakeusernameremembered", style: { display: "none" } }), _jsx("input", { type: "password", name: "fakepasswordremembered", style: { display: "none" } }), _jsx("form", { autoComplete: "off", children: _jsx("input", { type: showPassword ? "text" : "password", placeholder: "Enter a New Password", autoComplete: "new-password", value: profilePassword, readOnly: !isEditingProfile, onChange: (e) => setProfilePassword(e.target.value), style: {
                                                                width: "100%",
                                                                color: !isEditingProfile ? "#999" : "inherit",
                                                                cursor: !isEditingProfile ? "default" : "text",
                                                            } }) })] }) })), _jsx("div", { className: "admin-profile-buttons", children: !isEditingProfile ? (_jsx("button", { onClick: () => setIsEditingProfile(true), children: "Edit" })) : (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => {
                                                            handleSendOTP();
                                                            setOtpRequired(true);
                                                        }, children: "Send OTP" }), _jsx("button", { onClick: () => {
                                                            setShowProfileModal(false);
                                                            resetProfileModal();
                                                        }, children: "Cancel" })] })) }), otpSent && (_jsxs("div", { className: "otp-verification", children: [_jsx("label", { children: "Enter 6-digit OTP:" }), _jsx("div", { className: "otp-inputs", children: Array(6)
                                                        .fill("")
                                                        .map((_, index) => (_jsx("input", { ref: (el) => {
                                                            otpRefs.current[index] = el;
                                                        }, type: "text", maxLength: 1, className: "otp-box", value: otpInput[index] || "", onChange: (e) => {
                                                            const val = e.target.value.replace(/\D/g, "");
                                                            if (!val)
                                                                return;
                                                            const updated = [...otpInput];
                                                            updated[index] = val[0];
                                                            setOtpInput(updated.join(""));
                                                            if (index < 5 && val) {
                                                                otpRefs.current[index + 1]?.focus();
                                                            }
                                                        }, onKeyDown: (e) => {
                                                            if (e.key === "Backspace") {
                                                                const updated = [...otpInput];
                                                                if (otpInput[index]) {
                                                                    updated[index] = "";
                                                                    setOtpInput(updated.join(""));
                                                                }
                                                                else if (index > 0) {
                                                                    otpRefs.current[index - 1]?.focus();
                                                                }
                                                            }
                                                        } }, index))) }), _jsx("button", { onClick: handleVerifyOTP, children: "Verify OTP & Save" })] }))] }) }))] })] }), _jsxs("div", { className: "admin-events-lower-header", children: [_jsxs("div", { className: "admin-events-lower-header-left", children: [_jsx("h1", { children: "Events" }), viewMode === "table" ? (_jsx(_Fragment, { children: _jsx("div", { className: "admin-events-lower-header-select", children: _jsxs("button", { onClick: () => {
                                            setSelectMode(!selectMode);
                                            setSelectedEventIds([]);
                                        }, children: [_jsx("img", { src: select, className: "admin-blogs-lower-header-select-img" }), selectMode ? "Cancel" : "Select"] }) }) })) : (_jsxs("div", { className: "admin-blogs-lower-header-show", children: [_jsx("p", { children: "Category" }), _jsxs("div", { className: "admin-blogs-lower-header-category", onClick: () => setOpenCategory(!openCategory), children: [selectedCategory, _jsx("span", { className: "dropdown-arrow", children: "\u25BE" }), openCategory && (_jsx("div", { className: "admin-events-dropdown-menu", children: [
                                                    "All",
                                                    "Kalusugan",
                                                    "Kalikasan",
                                                    "Karunungan",
                                                    "Kultura",
                                                    "Kasarian",
                                                ].map((item) => (_jsx("div", { className: "admin-events-dropdown-item", onClick: () => {
                                                        setSelectedCategory(item);
                                                        setOpenCategory(false);
                                                    }, children: item }, item))) }))] })] }))] }), _jsx("div", { className: "admin-events-lower-header-right", children: _jsxs("div", { className: "admin-blogs-toggle-newblog", children: [_jsxs("div", { className: "admin-blogs-toggle-wrapper", children: [_jsx("button", { className: `admin-blogs-toggle-button ${viewMode === "table" ? "active" : ""}`, onClick: () => setViewMode("table"), children: "Table View" }), _jsx("button", { className: `admin-blogs-toggle-button ${viewMode === "grid" ? "active" : ""}`, onClick: () => setViewMode("grid"), children: "Grid View" })] }), _jsx("div", { className: "admin-events-lower-header-new-event", children: _jsxs("button", { onClick: () => setIsAddingNew(true), children: [_jsx(FaPlus, { className: "admin-icon-left" }), "Add New Event"] }) })] }) })] }), selectMode && (_jsx("div", { className: "admin-events-bulk-actions", children: _jsx("button", { className: "bulk-delete-btn", onClick: () => {
                        setBulkActionType("delete");
                        setBulkConfirmVisible(true);
                    }, children: "DELETE" }) })), viewMode === "table" ? (_jsxs("div", { className: "admin-events-main-content", children: [_jsx("div", { className: "admin-events-scrollable-table", children: _jsxs("table", { className: "admin-events-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: _jsxs("div", { className: "admin-events-dropdown-trigger", onClick: () => setOpenCategory(!openCategory), children: ["Category", " ", _jsx("span", { className: "admin-header-dropdown-arrow", children: "\u25BE" }), openCategory && (_jsx("div", { className: "admin-header-dropdown-menu", children: [
                                                                "All",
                                                                "Kalusugan",
                                                                "Kalikasan",
                                                                "Karunungan",
                                                                "Kultura",
                                                                "Kasarian",
                                                            ].map((item) => (_jsx("div", { className: "admin-header-dropdown-item", onClick: () => {
                                                                    setSelectedCategory(item);
                                                                    setOpenCategory(false);
                                                                }, children: item }, item))) }))] }) }), _jsx("th", { children: "Title" }), _jsx("th", { children: _jsxs("div", { className: "admin-events-dropdown-trigger", onClick: () => setOpenCreatedAt(!openCreatedAt), children: ["Date", " ", _jsx("span", { className: "admin-header-dropdown-arrow", children: "\u25BE" }), openCreatedAt && (_jsx("div", { className: "admin-header-dropdown-menu", children: ["Newest First", "Oldest First"].map((order) => (_jsx("div", { className: "admin-header-dropdown-item", onClick: () => {
                                                                    setCreatedSortOrder(order);
                                                                    setOpenCreatedAt(false);
                                                                }, children: order }, order))) }))] }) }), _jsx("th", { children: "Venue" }), _jsx("th", { children: _jsxs("div", { className: "admin-events-dropdown-trigger", onClick: () => setOpenStatus(!openStatus), children: ["Status", " ", _jsx("span", { className: "admin-header-dropdown-arrow", children: "\u25BE" }), openStatus && (_jsx("div", { className: "admin-header-dropdown-menu", children: [
                                                                "All",
                                                                "Upcoming",
                                                                "Ongoing",
                                                                "Completed",
                                                                "Cancelled",
                                                            ].map((status) => (_jsx("div", { className: "admin-header-dropdown-item", onClick: () => {
                                                                    setSelectedStatus(status);
                                                                    setOpenStatus(false);
                                                                }, children: status }, status))) }))] }) }), _jsx("th", { children: selectMode ? "Select" : "View" })] }) }), _jsxs("colgroup", { children: [_jsx("col", { style: { width: "80px" } }), _jsx("col", { style: { width: "70px" } }), _jsx("col", { style: { width: "80px" } }), _jsx("col", { style: { width: "70px" } }), _jsx("col", { style: { width: "80px" } }), _jsx("col", { style: { width: "60px" } }), _jsx("col", { style: { width: "40px" } })] }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsxs("td", { colSpan: 7, className: "no-blogs-message", children: [_jsx("span", { className: "loading-spinner" }), " Loading events\u2026"] }) })) : pagedEvents.length > 0 ? (pagedEvents.map((event) => (_jsxs("tr", { className: "admin-events-table-content", style: { cursor: selectMode ? "default" : "pointer" }, onClick: () => {
                                            if (!selectMode)
                                                setSelectedEvent(event);
                                        }, children: [_jsx("td", { className: "admin-events-id-content", children: event.event_id }), _jsx("td", { className: "admin-events-category-content category-tag", children: event.category?.toUpperCase() || "UNSPECIFIED" }), _jsx("td", { className: "admin-events-title-content", children: event.title }), _jsx("td", { className: "admin-events-date-content", children: formatDate(event.event_date) }), _jsx("td", { className: "admin-events-venue-content", children: event.event_venue }), _jsx("td", { className: `event-status status-${event.event_status.toLowerCase()}`, children: event.event_status.toUpperCase() }), _jsx("td", { className: "admin-events-more-button", children: selectMode ? (_jsx("input", { type: "checkbox", checked: selectedEventIds.includes(event.event_id), onChange: (e) => {
                                                        if (e.target.checked) {
                                                            setSelectedEventIds((prev) => [
                                                                ...prev,
                                                                event.event_id,
                                                            ]);
                                                        }
                                                        else {
                                                            setSelectedEventIds((prev) => prev.filter((id) => id !== event.event_id));
                                                        }
                                                    }, onClick: (e) => e.stopPropagation() })) : (_jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        setSelectedEvent(event);
                                                    }, children: _jsx(BsThreeDots, {}) })) })] }, event.event_id)))) : (_jsx("tr", { className: "admin-blogs-table-content no-blogs-row", children: _jsx("td", { colSpan: 7, className: "no-blogs-message", children: "No Event Found." }) })) })] }) }), _jsx("div", { className: "pagination-container", children: totalEventPages > 1 && (_jsxs("div", { className: "pagination", children: [_jsx("button", { onClick: () => setEventsPage((p) => p - 1), disabled: eventsPage === 1, children: "\u2039 Prev" }), [...Array(totalEventPages)].map((_, i) => {
                                    const p = i + 1;
                                    return (_jsx("button", { className: p === eventsPage ? "active" : "", onClick: () => setEventsPage(p), children: p }, p));
                                }), _jsx("button", { onClick: () => setEventsPage((p) => p + 1), disabled: eventsPage === totalEventPages, children: "Next \u203A" })] })) })] })) : (_jsx("div", { className: "admin-events-main-content", children: _jsx("div", { children: _jsx("div", { className: "admin-blogs-grid-view", children: filteredEvents.length > 0 ? (_jsx("div", { className: "blog-grid-scrollable-wrapper", children: _jsx("div", { className: "blog-grid-container", children: filteredEvents.map((event) => (_jsxs("div", { className: `blog-grid-card grid-status-${event.event_status.toLowerCase()}`, onClick: () => setSelectedEvent(event), children: [_jsx("img", { src: getFullImageUrl(event.image_url), alt: event.title, className: "blog-grid-image" }), _jsxs("div", { className: "blog-grid-overlay", children: [_jsx("h3", { className: "blog-overlay-title", children: event.title }), _jsx("p", { className: "blog-overlay-category", children: event.category }), _jsx("p", { className: "blog-overlay-date", children: formatDate(event.event_date) }), _jsx("p", { className: "blog-overlay-venue", children: event.event_venue })] })] }, event.event_id))) }) })) : (_jsx("p", { style: { marginTop: "20px" }, children: "No events found." })) }) }) })), selectedEvent && (_jsx("div", { className: "admin-events-view-more", children: _jsx("div", { className: "admin-events-modal", children: _jsxs("div", { className: "admin-events-modal-content", children: [_jsx("div", { className: "admin-events-float-buttons", children: isEditing ? (_jsxs(_Fragment, { children: [_jsx("button", { className: "save-btn", onClick: handleSave, children: "Save" }), _jsx("button", { className: "cancel-btn", onClick: handleCancel, children: "Cancel" })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { className: "edit-btn", onClick: handleEdit, children: "Edit" }), _jsx("button", { className: "delete-btn", onClick: handleDelete, children: "Delete" })] })) }), _jsx("button", { className: "admin-events-modal-close", onClick: () => {
                                    setIsEditing(false);
                                    setEditableEvent(null);
                                    setTempImageUrl(null);
                                    setSelectedEvent(null);
                                }, children: "\u2715" }), _jsxs("div", { className: "admin-events-inner-content-modal", children: [notification && (_jsx("div", { className: `blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`, children: notification })), _jsxs("div", { className: "admin-events-inner-content-modal-top", children: [_jsxs("div", { className: "admin-events-inner-content-modal-top-left", children: [_jsx("h2", { children: "Event Details" }), _jsxs("div", { className: "admin-events-inner-content-modal-id", children: [_jsx("p", { children: _jsx("strong", { children: "ID" }) }), _jsx("p", { className: "admin-events-inner-content-modal-id-content", children: selectedEvent.event_id })] }), _jsxs("div", { className: "admin-events-inner-content-modal-title", children: [_jsx("p", { children: _jsxs("strong", { children: ["Title", " ", editMissing.title && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), isEditing ? (_jsx("input", { type: "text", value: editableEvent?.title || "", onChange: (e) => setEditableEvent({
                                                                    ...editableEvent,
                                                                    title: e.target.value,
                                                                }), className: "admin-events-inner-content-modal-title-content", disabled: !isEditing })) : (_jsx("p", { className: "admin-events-inner-content-modal-title-content", children: selectedEvent.title }))] }), _jsxs("div", { className: "admin-events-inner-content-modal-category", children: [_jsx("p", { children: _jsx("strong", { children: "Category" }) }), _jsx("select", { className: "admin-events-inner-content-modal-category-content pink-category", value: dropdownCategory ?? "", onChange: (e) => {
                                                                    setDropdownCategory(e.target.value);
                                                                    setEditableEvent((prev) => prev ? { ...prev, category: e.target.value } : prev);
                                                                }, disabled: !isEditing, children: [
                                                                    "KALUSUGAN",
                                                                    "KALIKASAN",
                                                                    "KARUNUNGAN",
                                                                    "KULTURA",
                                                                    "KASARIAN",
                                                                ].map((cat) => (_jsx("option", { value: cat, children: cat }, cat))) })] }), _jsxs("div", { className: "admin-events-inner-content-modal-venue", children: [_jsx("p", { children: _jsxs("strong", { children: ["Venue", " ", editMissing.event_venue && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), isEditing ? (_jsx("input", { type: "text", value: editableEvent?.event_venue || "", onChange: (e) => setEditableEvent((prev) => prev
                                                                    ? { ...prev, event_venue: e.target.value }
                                                                    : prev), onBlur: () => setEditableEvent((prev) => prev
                                                                    ? {
                                                                        ...prev,
                                                                        event_venue: prev.event_venue.trim() === ""
                                                                            ? "Manila, Philippines"
                                                                            : prev.event_venue,
                                                                    }
                                                                    : prev), className: "admin-events-inner-content-modal-venue-content", disabled: !isEditing || isFieldLocked })) : (_jsx("p", { className: "admin-events-inner-content-modal-venue-content", children: selectedEvent.event_venue }))] }), (isEditing
                                                        ? editableEvent?.event_venue
                                                        : selectedEvent.event_venue) && (_jsx("div", { className: "admin-events-google-map", children: _jsx("iframe", { src: `https://www.google.com/maps?q=${encodeURIComponent(isEditing
                                                                ? (editableEvent?.event_venue ?? "")
                                                                : selectedEvent.event_venue)}&z=18&output=embed`, width: "100%", height: "250", loading: "lazy", style: {
                                                                border: "0",
                                                                borderRadius: "10px",
                                                                marginTop: "15px",
                                                            }, allowFullScreen: true }) }))] }), _jsxs("div", { className: "admin-events-inner-content-modal-top-right", children: [_jsxs("div", { className: "admin-events-inner-content-modal-status", children: [_jsx("p", { children: _jsx("strong", { children: "Status" }) }), _jsxs("select", { className: `admin-events-inner-content-modal-status-content status-${dropdownStatus?.toLowerCase()}`, value: dropdownStatus ?? "", onChange: (e) => {
                                                                    setDropdownStatus(e.target.value);
                                                                    setEditableEvent((prev) => prev
                                                                        ? { ...prev, event_status: e.target.value }
                                                                        : prev);
                                                                }, disabled: !isEditing || isFieldLocked, children: [dropdownStatus &&
                                                                        !["UPCOMING", "CANCELLED"].includes(dropdownStatus) && (_jsx("option", { value: dropdownStatus, disabled: true, children: dropdownStatus })), ["UPCOMING", "CANCELLED"].map((stat) => (_jsx("option", { value: stat, children: stat }, stat)))] })] }), _jsxs("div", { className: "admin-events-inner-content-modal-date", children: [_jsx("p", { children: _jsx("strong", { children: "Date" }) }), isEditing ? (_jsx("input", { type: "date", value: editableEvent?.event_date || "", onChange: (e) => setEditableEvent({
                                                                    ...editableEvent,
                                                                    event_date: e.target.value,
                                                                }), className: "admin-events-inner-content-modal-date-content", disabled: !isEditing || isFieldLocked })) : (_jsx("p", { className: "admin-events-inner-content-modal-date-content", children: formatDate(selectedEvent.event_date) }))] }), _jsxs("div", { className: "admin-events-inner-content-modal-time", children: [_jsxs("div", { className: "admin-events-inner-content-modal-time-start", children: [_jsx("p", { children: _jsx("strong", { children: "Start Time" }) }), isEditing ? (_jsx("input", { type: "time", value: editableEvent?.event_start_time || "", onChange: (e) => setEditableEvent({
                                                                            ...editableEvent,
                                                                            event_start_time: e.target.value,
                                                                        }), className: "admin-events-inner-content-modal-time-start-content", disabled: !isEditing || isFieldLocked })) : (_jsx("p", { className: "admin-events-inner-content-modal-time-start-content", children: formatTime(selectedEvent.event_start_time) }))] }), _jsxs("div", { className: "admin-events-inner-content-modal-time-end", children: [_jsx("p", { children: _jsx("strong", { children: "End Time" }) }), isEditing ? (_jsx("input", { type: "time", value: editableEvent?.event_end_time || "", onChange: (e) => setEditableEvent({
                                                                            ...editableEvent,
                                                                            event_end_time: e.target.value,
                                                                        }), className: "admin-events-inner-content-modal-time-end-content", disabled: !isEditing || isFieldLocked })) : (_jsx("p", { className: "admin-events-inner-content-modal-time-end-content", children: formatTime(selectedEvent.event_end_time) }))] })] }), _jsxs("div", { className: "admin-events-inner-content-modal-speakers", children: [_jsx("p", { children: _jsxs("strong", { children: ["Speakers", " ", editMissing.event_speakers && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), isEditing ? (_jsx("textarea", { value: editableEvent?.event_speakers || "", onChange: (e) => setEditableEvent({
                                                                    ...editableEvent,
                                                                    event_speakers: e.target.value,
                                                                }), className: "admin-events-inner-content-modal-speakers-content" })) : (_jsx("p", { className: "admin-events-inner-content-modal-speakers-content", style: { whiteSpace: "pre-wrap" }, children: selectedEvent.event_speakers }))] })] })] }), _jsxs("div", { className: "admin-events-inner-content-modal-bot", children: [_jsx("div", { className: "admin-events-inner-content-modal-bot-left", children: _jsxs("div", { className: "admin-events-inner-content-modal-image", children: [_jsx("p", { children: _jsxs("strong", { children: ["Image", " ", editMissing.image_url && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), getFullImageUrl(isEditing
                                                            ? tempImageUrl !== null
                                                                ? tempImageUrl
                                                                : editableEvent?.image_url || ""
                                                            : selectedEvent.image_url) ? (_jsx("img", { src: getFullImageUrl(isEditing
                                                                ? tempImageUrl !== null
                                                                    ? tempImageUrl
                                                                    : editableEvent?.image_url || ""
                                                                : selectedEvent.image_url), alt: "Event", style: { cursor: "zoom-in" }, onClick: () => setFullscreenImageUrl(getFullImageUrl(isEditing
                                                                ? tempImageUrl !== null
                                                                    ? tempImageUrl
                                                                    : editableEvent?.image_url || ""
                                                                : selectedEvent.image_url)) })) : (_jsx("div", { style: {
                                                                width: "100%",
                                                                height: "200px",
                                                                maxWidth: "100%",
                                                                maxHeight: "300px",
                                                                backgroundColor: "#f2f2f2",
                                                                color: "#888",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontStyle: "italic",
                                                                border: "1px dashed #ccc",
                                                            }, children: "No Event Image" })), _jsx("input", { type: "file", id: "event-image-upload", accept: "image/*", style: { display: "none" }, onChange: (e) => handleImageSelect(e, "edit") }), _jsxs("div", { className: "admin-blogs-image-buttons", children: [_jsx("button", { className: "upload-btn", disabled: !isEditing, onClick: () => document
                                                                        .getElementById("event-image-upload")
                                                                        ?.click(), children: "Upload" }), _jsx("button", { className: "remove-btn", disabled: !isEditing, onClick: handleImageRemove, children: "Remove" })] })] }) }), _jsx("div", { className: "admin-events-inner-content-modal-bot-right", children: _jsxs("div", { className: "admin-events-inner-content-modal-desc", children: [_jsx("p", { children: _jsxs("strong", { children: ["Event Content", " ", editMissing.content && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), isEditing ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "admin-blogs-content-image-tools", children: [_jsx("button", { className: "format-btn undo", onMouseDown: (e) => {
                                                                                e.preventDefault();
                                                                                saveSelection();
                                                                            }, onClick: () => document.execCommand("undo", false), children: _jsx(FaUndo, {}) }), _jsx("button", { className: "format-btn redo", onMouseDown: (e) => {
                                                                                e.preventDefault();
                                                                                saveSelection();
                                                                            }, onClick: () => document.execCommand("redo", false), children: _jsx(FaRedo, {}) }), _jsx("button", { className: "format-btn bold", onMouseDown: (e) => {
                                                                                e.preventDefault();
                                                                                saveSelection();
                                                                            }, onClick: () => applyFormatting("bold"), children: _jsx(FaBold, {}) }), _jsx("button", { className: "format-btn italic", onMouseDown: (e) => {
                                                                                e.preventDefault();
                                                                                saveSelection();
                                                                            }, onClick: () => applyFormatting("italic"), children: _jsx(FaItalic, {}) }), _jsx("button", { className: "format-btn underline", onMouseDown: (e) => {
                                                                                e.preventDefault();
                                                                                saveSelection();
                                                                            }, onClick: () => applyFormatting("underline"), children: _jsx(FaUnderline, {}) }), _jsx("button", { className: "format-btn bullet", onMouseDown: (e) => {
                                                                                e.preventDefault();
                                                                                saveSelection();
                                                                            }, onClick: applyList, children: _jsx(FaListUl, {}) }), _jsx("button", { className: "format-btn image", onMouseDown: (e) => e.preventDefault(), onClick: () => document
                                                                                .getElementById("new-content-image-input")
                                                                                ?.click(), children: _jsx(FaImage, {}) }), _jsx("input", { type: "file", accept: "image/*", id: "new-content-image-input", style: { display: "none" }, onChange: async (e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (!file)
                                                                                    return;
                                                                                const formData = new FormData();
                                                                                formData.append("image", file);
                                                                                try {
                                                                                    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/upload_event_image.php`, {
                                                                                        method: "POST",
                                                                                        body: formData,
                                                                                    });
                                                                                    const data = await res.json();
                                                                                    if (data.success && data.image_url) {
                                                                                        const img = `<img src="${import.meta.env.VITE_API_BASE_URL}${data.image_url}" alt="event image" style="max-width:100%; margin: 10px 0; display:block;" />`;
                                                                                        const div = document.getElementById("new-event-content-editor");
                                                                                        if (div) {
                                                                                            div.innerHTML += img;
                                                                                            setEditableEvent((prev) => prev
                                                                                                ? { ...prev, content: div.innerHTML }
                                                                                                : prev);
                                                                                        }
                                                                                    }
                                                                                    else {
                                                                                        alert("Image upload failed.");
                                                                                    }
                                                                                }
                                                                                catch (err) {
                                                                                    console.error("Upload failed:", err);
                                                                                    alert("An error occurred during upload.");
                                                                                }
                                                                            } })] }), _jsx("div", { id: "new-event-content-editor", ref: textareaRef, className: "admin-blogs-modal-desc-content editable", contentEditable: true, onBlur: () => {
                                                                        if (textareaRef.current) {
                                                                            const updatedContent = textareaRef.current.innerHTML;
                                                                            setEditableEvent((prev) => prev
                                                                                ? { ...prev, content: updatedContent }
                                                                                : prev);
                                                                        }
                                                                    } })] })) : (_jsx("div", { className: "admin-blogs-modal-desc-content", children: _jsx("div", { className: "admin-blogs-content-images-wrapper", children: _jsx("div", { dangerouslySetInnerHTML: {
                                                                        __html: selectedEvent.content,
                                                                    } }) }) }))] }) })] }), _jsxs("div", { className: "event-participants card", children: [_jsx("h3", { children: "Participants" }), participants.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "participants-table-wrapper", children: _jsxs("table", { className: "participants-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Name" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Contact" }), _jsx("th", { children: "Expectations" }), _jsx("th", { children: "Signed Up" })] }) }), _jsx("tbody", { children: paginatedParticipants.map((p) => (_jsxs("tr", { children: [_jsx("td", { children: p.name }), _jsx("td", { children: p.email }), _jsx("td", { children: p.contact || "—" }), _jsx("td", { children: p.expectations || "—" }), _jsx("td", { children: new Date(p.created_at).toLocaleDateString() })] }, p.participant_id))) })] }) }), totalPages > 1 && (_jsxs("div", { className: "pagination", children: [_jsx("button", { onClick: () => setCurrentPage((p) => p - 1), disabled: currentPage === 1, children: "\u2039 Prev" }), [...Array(totalPages)].map((_, i) => {
                                                                const page = i + 1;
                                                                return (_jsx("button", { className: page === currentPage ? "active" : "", onClick: () => setCurrentPage(page), children: page }, page));
                                                            }), _jsx("button", { onClick: () => setCurrentPage((p) => p + 1), disabled: currentPage === totalPages, children: "Next \u203A" })] }))] })) : (_jsx("p", { className: "no-participants", children: "No one has signed up yet." }))] })] })] }) }) })), bulkConfirmVisible && (_jsx("div", { className: "blogs-confirmation-popup show", children: _jsxs("div", { className: "blogs-confirmation-box", children: [_jsx("p", { children: bulkActionType === "delete" &&
                                bulkActionStatus === "SINGLE_DELETE"
                                ? "Are you sure you want to delete this event and all its images?"
                                : bulkActionType === "delete"
                                    ? "Are you sure you want to delete the selected events?"
                                    : `Do you really want to mark the selected events as ${bulkActionStatus}?` }), _jsxs("div", { className: "blogs-confirmation-actions", children: [_jsx("button", { className: "confirm-yes", onClick: () => {
                                        if (bulkActionType === "delete") {
                                            if (bulkActionStatus === "SINGLE_DELETE") {
                                                confirmSingleDelete();
                                            }
                                            else {
                                                handleBulkDelete();
                                            }
                                        }
                                        else {
                                            applyBulkStatus(bulkActionStatus);
                                        }
                                        setBulkConfirmVisible(false);
                                    }, children: "Yes" }), _jsx("button", { className: "confirm-no", onClick: () => setBulkConfirmVisible(false), children: "No" })] })] }) })), isAddingNew && (_jsx("div", { className: "admin-new-event", children: _jsx("div", { className: "admin-new-event-modal", children: _jsxs("div", { className: "admin-new-event-modal-content", children: [_jsxs("div", { className: "admin-new-event-float-buttons", children: [_jsx("button", { className: "save-btn", onClick: handleAddNewEventSave, children: "Save" }), _jsx("button", { className: "cancel-btn", onClick: () => {
                                            setIsAddingNew(false);
                                            resetNewEvent();
                                        }, children: "Cancel" })] }), _jsx("button", { className: "admin-new-event-modal-close", onClick: () => {
                                    setIsAddingNew(false);
                                    resetNewEvent();
                                }, children: "\u2715" }), _jsxs("div", { className: "admin-new-event-inner-content-modal", children: [notification && (_jsx("div", { className: `blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`, children: notification })), _jsxs("div", { className: "admin-new-event-inner-content-modal-top", children: [_jsxs("div", { className: "admin-new-event-inner-content-modal-top-left", children: [_jsx("h2", { children: "Event Details" }), _jsx("p", { children: _jsxs("strong", { children: ["Title", " ", missing.title && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), _jsx("input", { className: "admin-new-event-inner-content-modal-title-content", type: "text", value: newEvent.title, onChange: (e) => setNewEvent({ ...newEvent, title: e.target.value }) }), _jsxs("div", { className: "admin-new-event-inner-content-modal-category", children: [_jsx("p", { children: _jsxs("strong", { children: ["Category", " ", missing.category && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), _jsx("select", { className: "admin-events-inner-content-modal-category-content pink-category", value: newEvent.category, onChange: (e) => setNewEvent({ ...newEvent, category: e.target.value }), children: [
                                                                    "KALUSUGAN",
                                                                    "KALIKASAN",
                                                                    "KARUNUNGAN",
                                                                    "KULTURA",
                                                                    "KASARIAN",
                                                                ].map((cat) => (_jsx("option", { value: cat, children: cat }, cat))) })] }), _jsxs("div", { className: "admin-new-event-inner-content-modal-venue", children: [_jsx("p", { children: _jsxs("strong", { children: ["Venue", " ", missing.event_venue && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), _jsx("input", { type: "text", className: "admin-new-event-inner-content-modal-venue-content", value: newEvent.event_venue, onChange: (e) => setNewEvent({
                                                                    ...newEvent,
                                                                    event_venue: e.target.value,
                                                                }) })] }), newEvent.event_venue && (_jsx("div", { className: "admin-events-google-map", children: _jsx("iframe", { src: `https://www.google.com/maps?q=${encodeURIComponent(newEvent.event_venue)}&z=18&output=embed`, width: "100%", height: "250", loading: "lazy", style: {
                                                                border: "0",
                                                                borderRadius: "10px",
                                                                marginTop: "15px",
                                                            }, allowFullScreen: true }) }))] }), _jsxs("div", { className: "admin-new-event-inner-content-modal-top-right", children: [_jsxs("div", { className: "admin-new-event-inner-content-modal-status", children: [_jsx("p", { children: _jsx("strong", { children: "Status" }) }), _jsx("select", { className: `admin-events-inner-content-modal-status-content status-${newEvent.event_status.toLowerCase()}`, value: newEvent.event_status, disabled: true, children: _jsx("option", { value: "UPCOMING", children: "UPCOMING" }) })] }), _jsxs("div", { className: "admin-new-event-inner-content-modal-date", children: [_jsx("p", { children: _jsxs("strong", { children: ["Date", " ", missing.event_date && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), _jsx("input", { type: "date", className: "admin-new-event-inner-content-modal-date-content", value: newEvent.event_date, onChange: (e) => setNewEvent({
                                                                    ...newEvent,
                                                                    event_date: e.target.value,
                                                                }) })] }), _jsxs("div", { className: "admin-new-event-inner-content-modal-time", children: [_jsxs("div", { className: "admin-new-event-inner-content-modal-time-start", children: [_jsx("p", { children: _jsxs("strong", { children: ["Start Time", " ", missing.event_start_time && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), _jsx("input", { type: "time", className: "admin-new-event-inner-content-modal-time-start-content", value: newEvent.event_start_time, onChange: (e) => setNewEvent({
                                                                            ...newEvent,
                                                                            event_start_time: e.target.value,
                                                                        }) })] }), _jsxs("div", { className: "admin-new-event-inner-content-modal-time-end", children: [_jsx("p", { children: _jsxs("strong", { children: ["End Time", " ", missing.event_end_time && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), _jsx("input", { type: "time", className: "admin-new-event-inner-content-modal-time-end-content", value: newEvent.event_end_time, onChange: (e) => setNewEvent({
                                                                            ...newEvent,
                                                                            event_end_time: e.target.value,
                                                                        }) })] })] }), _jsxs("div", { className: "admin-events-inner-content-modal-speakers", children: [_jsx("p", { children: _jsxs("strong", { children: ["Speaker/s", " ", missing.event_speakers && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), _jsx("textarea", { className: "admin-new-event-inner-content-modal-speakers-content", value: newEvent.event_speakers, onChange: (e) => setNewEvent({
                                                                    ...newEvent,
                                                                    event_speakers: e.target.value,
                                                                }) })] })] })] }), _jsxs("div", { className: "admin-new-event-inner-content-modal-bot", children: [_jsx("div", { className: "admin-new-event-inner-content-modal-bot-left", children: _jsx("div", { className: "admin-new-event-inner-content-modal-bot-left", children: _jsxs("div", { className: "admin-new-event-inner-content-modal-image", children: [_jsx("p", { children: _jsxs("strong", { children: ["Image", " ", missing.image && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), getFullImageUrl(newImageUrl) ? (_jsx("img", { src: getFullImageUrl(newImageUrl), alt: "Event", style: { cursor: "zoom-in" }, onClick: () => setFullscreenImageUrl(getFullImageUrl(newImageUrl)) })) : (_jsx("div", { style: {
                                                                    width: "100%",
                                                                    height: "200px",
                                                                    maxWidth: "100%",
                                                                    maxHeight: "300px",
                                                                    backgroundColor: "#f2f2f2",
                                                                    color: "#888",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    fontStyle: "italic",
                                                                    border: "1px dashed #ccc",
                                                                }, children: "No Event Image" })), _jsx("input", { type: "file", accept: "image/*", style: { display: "none" }, id: "new-event-image-upload", onChange: (e) => handleImageSelect(e, "new") }), _jsxs("div", { className: "admin-blogs-image-buttons", children: [_jsx("button", { className: "upload-btn", onClick: () => document
                                                                            .getElementById("new-event-image-upload")
                                                                            ?.click(), children: "Upload" }), _jsx("button", { className: "remove-btn", onClick: () => setNewImageUrl(null), children: "Remove" })] })] }) }) }), _jsx("div", { className: "admin-new-event-inner-content-modal-bot-right", children: _jsxs("div", { className: "admin-new-event-inner-content-modal-desc", children: [_jsx("p", { children: _jsxs("strong", { children: ["Event Content", " ", missing.content && (_jsx("span", { style: { color: "red" }, children: "*" }))] }) }), _jsxs("div", { className: "admin-blogs-content-image-tools", children: [_jsx("button", { className: "format-btn undo", onMouseDown: (e) => {
                                                                        e.preventDefault();
                                                                        saveSelection();
                                                                    }, onClick: () => document.execCommand("undo", false), children: _jsx(FaUndo, {}) }), _jsx("button", { className: "format-btn redo", onMouseDown: (e) => {
                                                                        e.preventDefault();
                                                                        saveSelection();
                                                                    }, onClick: () => document.execCommand("redo", false), children: _jsx(FaRedo, {}) }), _jsx("button", { className: "format-btn bold", onMouseDown: (e) => {
                                                                        e.preventDefault();
                                                                        saveSelection();
                                                                    }, onClick: () => applyFormatting("bold"), children: _jsx(FaBold, {}) }), _jsx("button", { className: "format-btn italic", onMouseDown: (e) => {
                                                                        e.preventDefault();
                                                                        saveSelection();
                                                                    }, onClick: () => applyFormatting("italic"), children: _jsx(FaItalic, {}) }), _jsx("button", { className: "format-btn underline", onMouseDown: (e) => {
                                                                        e.preventDefault();
                                                                        saveSelection();
                                                                    }, onClick: () => applyFormatting("underline"), children: _jsx(FaUnderline, {}) }), _jsx("button", { className: "format-btn bullet", onMouseDown: (e) => {
                                                                        e.preventDefault();
                                                                        saveSelection();
                                                                    }, onClick: applyList, children: _jsx(FaListUl, {}) }), _jsx("button", { className: "format-btn image", onMouseDown: (e) => e.preventDefault(), onClick: () => document
                                                                        .getElementById("add-new-content-image-input")
                                                                        ?.click(), children: _jsx(FaImage, {}) }), _jsx("input", { type: "file", accept: "image/*", id: "add-new-content-image-input", style: { display: "none" }, onChange: async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file)
                                                                            return;
                                                                        const formData = new FormData();
                                                                        formData.append("image", file);
                                                                        try {
                                                                            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/upload_event_image.php`, {
                                                                                method: "POST",
                                                                                body: formData,
                                                                            });
                                                                            const data = await res.json();
                                                                            if (data.success && data.image_url) {
                                                                                const img = `<img src="${import.meta.env.VITE_API_BASE_URL}${data.image_url}" alt="event image" style="max-width:100%; margin: 10px 0; display:block;" />`;
                                                                                const div = document.getElementById("add-event-content-editor");
                                                                                if (div) {
                                                                                    div.innerHTML += img;
                                                                                    setNewEvent((prev) => ({
                                                                                        ...prev,
                                                                                        content: div.innerHTML,
                                                                                    }));
                                                                                }
                                                                            }
                                                                            else {
                                                                                alert("Image upload failed.");
                                                                            }
                                                                        }
                                                                        catch (err) {
                                                                            console.error("Upload failed:", err);
                                                                            alert("An error occurred during upload.");
                                                                        }
                                                                    } })] }), _jsx("div", { id: "add-event-content-editor", className: "admin-new-event-inner-content-modal-desc-content editable", contentEditable: true, onBlur: () => {
                                                                const div = document.getElementById("add-event-content-editor");
                                                                if (div) {
                                                                    setNewEvent({
                                                                        ...newEvent,
                                                                        content: div.innerHTML,
                                                                    });
                                                                }
                                                            } })] }) })] })] })] }) }) })), fullscreenImageUrl && (_jsx("div", { className: "fullscreen-image-overlay", onClick: () => setFullscreenImageUrl(null), children: _jsx("img", { src: fullscreenImageUrl, alt: "Fullscreen" }) })), _jsx(ToastContainer, { position: "top-center", autoClose: 4000, hideProgressBar: false, newestOnTop: false, closeOnClick: true, rtl: false, pauseOnFocusLoss: true, draggable: true, pauseOnHover: true, theme: "light" })] }));
};
export default AdminEvents;
