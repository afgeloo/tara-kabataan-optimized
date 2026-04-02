import "./css/admin-events.css";
import president from "../assets/aboutpage/council/president.jpg";
import { BsThreeDots } from "react-icons/bs";
import { FaSearch, FaBell, FaPlus } from "react-icons/fa";
import { useEffect, useState, useRef, useMemo } from "react";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaImage,
  FaListUl,
  FaUndo,
  FaRedo,
  FaTimes,
} from "react-icons/fa";
import select from "../assets/adminpage/blogs/select.png";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "./utils/cropImage";

const AdminEvents = () => {
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

  const [events, setEvents] = useState<Event[]>([]);
  const [openCategory, setOpenCategory] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [openCreatedAt, setOpenCreatedAt] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [createdSortOrder, setCreatedSortOrder] = useState("Newest First");
  const [count, setCount] = useState(-1);
  const [open, setOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [dropdownCategory, setDropdownCategory] = useState<string | null>(null);
  const [dropdownStatus, setDropdownStatus] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableEvent, setEditableEvent] = useState<Event | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [bulkConfirmVisible, setBulkConfirmVisible] = useState(false);
  const [bulkActionStatus, setBulkActionStatus] = useState<string>("");
  const [bulkActionType, setBulkActionType] = useState<
    "delete" | "status" | null
  >(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [notification, setNotification] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileEmail, setProfileEmail] = useState(
    loggedInUser?.user_email || ""
  );
  const [profilePhone, setProfilePhone] = useState(
    loggedInUser?.user_contact || ""
  );
  const [profilePassword, setProfilePassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpRequired, setOtpRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const otpRefs = useRef<HTMLInputElement[]>([]);
  const [showCropper, setShowCropper] = useState(false);
  const [cropSrc, setCropSrc] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropMode, setCropMode] = useState<"new" | "edit">("new");
  const [croppedArea, setCroppedArea] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "new" | "edit"
  ) => {
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

  const [loading, setLoading] = useState<boolean>(true);

  const applyCrop = async () => {
    try {
      const blob = await getCroppedImg(cropSrc, croppedArea);

      const form = new FormData();
      form.append("image", blob, "cropped.jpg");

      let endpoint: string;
      if (cropMode === "new") {
        endpoint = `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/add_new_event_image.php`;
      } else {
        endpoint = `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/upload_event_image.php`;
        form.append("event_id", editableEvent!.event_id);
      }

      const res = await fetch(endpoint, { method: "POST", body: form });
      const data = await res.json();

      if (data.success && data.image_url) {
        if (cropMode === "new") {
          setNewImageUrl(data.image_url);
        } else {
          setTempImageUrl(data.image_url);
        }
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while uploading");
    } finally {
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
        const verifyRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/verify_old_password.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profileEmail,
              old_password: oldPassword,
            }),
          }
        );

        const verifyData = await verifyRes.json();
        if (!verifyData.valid) {
          toast.error("Old password is incorrect.");
          return;
        }
      } catch (err) {
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
        const prevRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/check_previous_password.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profileEmail,
              new_password: profilePassword,
            }),
          }
        );
        const prevData = await prevRes.json();
        if (prevData.same === true) {
          toast.error(
            "New password must be different from the previous password."
          );
          return;
        }
      } catch {
        toast.error("Failed to check previous password.");
        return;
      }
    }

    const toastId = toast.loading("Sending OTP...");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/send_otp.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: profileEmail }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        toast.update(toastId, {
          render: (
            <div>
              <strong>OTP sent to your email.</strong>
              <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>
                Check spam folder if not found.
              </div>
            </div>
          ),
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: data.message || "Failed to send OTP.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (err) {
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
        const prevRes = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/check_previous_password.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profileEmail,
              new_password: profilePassword,
            }),
          }
        );
        const prevData = await prevRes.json();
        if (prevData.same === true) {
          toast.error(
            "New password must be different from the previous password."
          );
          return;
        }
      } catch {
        toast.error("Failed to check previous password.");
        return;
      }
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/update_profile.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: loggedInUser?.user_id,
            email: profileEmail,
            phone: profilePhone,
            password: profilePassword,
          }),
        }
      );

      const text = await res.text();

      try {
        const data = JSON.parse(text);
        if (data.success) {
          toast.success("Profile updated!");
          setLoggedInUser(data.user);
          localStorage.setItem("admin-user", JSON.stringify(data.user));
          setShowProfileModal(false);
        } else {
          toast.error(data.message || "Failed to update profile.");
        }
      } catch (err) {
        console.error("Invalid JSON from update_profile.php:", text);
        toast.error("Invalid server response.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Server error.");
    }
  };

  const handleVerifyOTP = async () => {
    const toastId = toast.loading("Verifying OTP...");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/verify_otp.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: profileEmail, otp: otpInput }),
        }
      );

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
      } else {
        toast.update(toastId, {
          render: "Incorrect OTP.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (err) {
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
      } catch {
        console.error("Failed to parse stored user");
      }
    }
  }, []);

  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: 14.5995,
    lng: 120.9842,
  });

  const handleMarkerDragEnd = async (e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();
    if (lat && lng) {
      setMarkerPosition({ lat, lng });

      const apiKey = "YOUR_GOOGLE_MAPS_API_KEY";
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = await response.json();

      if (data.status === "OK") {
        const address = data.results[0]?.formatted_address || "";
        if (isEditing && editableEvent) {
          setEditableEvent({ ...editableEvent, event_venue: address });
        }
      } else {
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
    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/events1.php`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("EVENTS DATA:", data);
        const now = new Date();

        const updatedEvents = (data.events || []).map((event: Event) => {
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

              fetch(
                `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/update_event_status.php`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    event_id: event.event_id,
                    new_status: "ONGOING",
                  }),
                }
              ).catch((err) =>
                console.error("Failed to update backend to ONGOING:", err)
              );
            } else if (now > eventEndDatetime) {
              event.event_status = "COMPLETED";

              fetch(
                `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/update_event_status.php`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    event_id: event.event_id,
                    new_status: "COMPLETED",
                  }),
                }
              ).catch((err) =>
                console.error("Failed to update backend to COMPLETED:", err)
              );
            }
          }

          return event;
        });

        setEvents(updatedEvents);
      })
      .catch((err) => console.error("Failed to fetch events:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (timestamp: string): string => {
    if (!timestamp) return "—";
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
      const matchCategory =
        selectedCategory === "All" ||
        event.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchStatus =
        selectedStatus === "All" ||
        event.event_status.toLowerCase() === selectedStatus.toLowerCase();

      const searchLower = searchQuery.toLowerCase();

      const matchSearch =
        event.event_id.toLowerCase().includes(searchLower) ||
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

  const formatTime = (timeString: string): string => {
    if (!timeString) return "—";
    const [hourStr, minuteStr] = timeString.split(":");
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    if (isNaN(hour) || isNaN(minute)) return "—";

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
    if (!editableEvent) return;

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

    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/update_event.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editableEvent),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const updated = { ...editableEvent };
          setEvents((prev) =>
            prev.map((e) => (e.event_id === updated.event_id ? updated : e))
          );
          setSelectedEvent(updated);
          setEditableEvent(null);
          setTempImageUrl(null);
          setIsEditing(false);
          setNotification("Event updated successfully!");
          setSelectedStatus("All");
          setTimeout(() => setNotification(""), 4000);
        } else {
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
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/add_new_event.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

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
      } else {
        setNotification("Failed to add new event.");
        console.error("Add error:", data.error);
      }
    } catch (err) {
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
    if (!selectedEvent) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/delete_event.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: selectedEvent.event_id }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setNotification("Event deleted successfully!");
        setEvents((prev) =>
          prev.filter((e) => e.event_id !== selectedEvent.event_id)
        );
        setSelectedEvent(null);
        setIsEditing(false);
      } else {
        setNotification(
          "Failed to delete event: " + (data.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Delete error:", error);
      setNotification("An error occurred while deleting.");
    }

    setTimeout(() => setNotification(""), 4000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/upload_event_image.php`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (data.success && data.image_url) {
        console.log("Uploaded image URL:", data.image_url);
        setTempImageUrl(data.image_url);
      } else {
        alert("Image upload failed.");
      }
    } catch (error) {
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

  const getFullImageUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
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

  const applyFormatting = (command: "bold" | "italic" | "underline") => {
    restoreSelection();
    document.execCommand(command, false);
  };

  const applyList = () => {
    restoreSelection();
    document.execCommand("insertUnorderedList", false);
  };

  const handleBulkDelete = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/delete_bulk_events.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_ids: selectedEventIds }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setEvents((prev) =>
          prev.filter((e) => !selectedEventIds.includes(e.event_id))
        );
        setSelectedEventIds([]);
        setSelectMode(false);
      } else {
        alert("Failed to delete events.");
      }
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Error occurred during bulk delete.");
    }
  };

  const applyBulkStatus = async (newStatus: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/update_bulk_event_status.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_ids: selectedEventIds,
            new_status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setEvents((prev) =>
          prev.map((event) =>
            selectedEventIds.includes(event.event_id)
              ? { ...event, event_status: newStatus }
              : event
          )
        );
        setSelectedEventIds([]);
        setSelectMode(false);
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
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

  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);

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
    if (editor) editor.innerHTML = "";
  };

  const isFieldLocked =
    selectedEvent?.event_status === "COMPLETED" ||
    selectedEvent?.event_status === "CANCELLED";
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(
    null
  );

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

  interface Participant {
    participant_id: string;
    event_id: string;
    name: string;
    email: string;
    contact: string | null;
    expectations: string | null;
    created_at: string;
  }

  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    if (!selectedEvent) return;
    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/event_attendees.php?event_id=${selectedEvent.event_id}`
    )
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

  return (
    <div className="admin-events">
      {showCropper && (
        <div className="cropper-overlay">
          <div className="cropper-container">
            <button
              className="cropper-close-btn"
              onClick={() => setShowCropper(false)}
            >
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

      <div className="admin-events-header">
        <div className="admin-events-search-container">
          <FaSearch className="admin-events-search-icon" />
          <input
            type="text"
            name="fakeusernameremembered"
            style={{ display: "none" }}
          />
          <input
            type="password"
            name="fakepasswordremembered"
            style={{ display: "none" }}
          />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            name="search-blog"
            id="search-blog"
          />
        </div>
        <div className="admin-events-header-right">
          <div
            className="admin-blogs-userinfo"
            onClick={() => setShowProfileModal(true)}
            style={{ cursor: "pointer" }}
          >
            <div className="userinfo-label">Logged in as:</div>
            <div className="userinfo-details">
              <p className="userinfo-name">
                {loggedInUser?.user_name || "Admin"}
              </p>
              <p className="userinfo-email">{loggedInUser?.user_email || ""}</p>
            </div>
          </div>
          {showProfileModal && (
            <div className="admin-profile-modal">
              <div className="admin-profile-modal-box">
                <div
                  className="modal-close-icon"
                  onClick={() => {
                    setShowProfileModal(false);
                    resetProfileModal();
                  }}
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
                      <input
                        type="text"
                        name="fakeusernameremembered"
                        style={{ display: "none" }}
                      />
                      <input
                        type="password"
                        name="fakepasswordremembered"
                        style={{ display: "none" }}
                      />
                      <form autoComplete="off">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your current password"
                          autoComplete="current-password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          style={{ width: "100%" }}
                          required
                        />
                      </form>
                      <label>New Password:</label>
                      <input
                        type="text"
                        name="fakeusernameremembered"
                        style={{ display: "none" }}
                      />
                      <input
                        type="password"
                        name="fakepasswordremembered"
                        style={{ display: "none" }}
                      />
                      <form autoComplete="off">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter a New Password"
                          autoComplete="new-password"
                          value={profilePassword}
                          readOnly={!isEditingProfile}
                          onChange={(e) => setProfilePassword(e.target.value)}
                          style={{
                            width: "100%",
                            color: !isEditingProfile ? "#999" : "inherit",
                            cursor: !isEditingProfile ? "default" : "text",
                          }}
                        />
                      </form>
                    </div>
                  </>
                )}
                <div className="admin-profile-buttons">
                  {!isEditingProfile ? (
                    <button onClick={() => setIsEditingProfile(true)}>
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          handleSendOTP();
                          setOtpRequired(true);
                        }}
                      >
                        Send OTP
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileModal(false);
                          resetProfileModal();
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
                        .map((_, index) => (
                          <input
                            key={index}
                            ref={(el) => {
                              otpRefs.current[index] = el;
                            }}
                            type="text"
                            maxLength={1}
                            className="otp-box"
                            value={otpInput[index] || ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (!val) return;
                              const updated = [...otpInput];
                              updated[index] = val[0];
                              setOtpInput(updated.join(""));
                              if (index < 5 && val) {
                                otpRefs.current[index + 1]?.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace") {
                                const updated = [...otpInput];
                                if (otpInput[index]) {
                                  updated[index] = "";
                                  setOtpInput(updated.join(""));
                                } else if (index > 0) {
                                  otpRefs.current[index - 1]?.focus();
                                }
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
            <>
              <div className="admin-events-lower-header-select">
                <button
                  onClick={() => {
                    setSelectMode(!selectMode);
                    setSelectedEventIds([]);
                  }}
                >
                  <img
                    src={select}
                    className="admin-blogs-lower-header-select-img"
                  />
                  {selectMode ? "Cancel" : "Select"}
                </button>
              </div>
            </>
          ) : (
            <div className="admin-blogs-lower-header-show">
              <p>Category</p>
              <div
                className="admin-blogs-lower-header-category"
                onClick={() => setOpenCategory(!openCategory)}
              >
                {selectedCategory}
                <span className="dropdown-arrow">▾</span>
                {openCategory && (
                  <div className="admin-events-dropdown-menu">
                    {[
                      "All",
                      "Kalusugan",
                      "Kalikasan",
                      "Karunungan",
                      "Kultura",
                      "Kasarian",
                    ].map((item) => (
                      <div
                        key={item}
                        className="admin-events-dropdown-item"
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
            </div>
          )}
        </div>
        <div className="admin-events-lower-header-right">
          <div className="admin-blogs-toggle-newblog">
            <div className="admin-blogs-toggle-wrapper">
              <button
                className={`admin-blogs-toggle-button ${viewMode === "table" ? "active" : ""}`}
                onClick={() => setViewMode("table")}
              >
                Table View
              </button>
              <button
                className={`admin-blogs-toggle-button ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
              >
                Grid View
              </button>
            </div>
            <div className="admin-events-lower-header-new-event">
              <button onClick={() => setIsAddingNew(true)}>
                <FaPlus className="admin-icon-left" />
                Add New Event
              </button>
            </div>
          </div>
        </div>
      </div>
      {selectMode && (
        <div className="admin-events-bulk-actions">
          <button
            className="bulk-delete-btn"
            onClick={() => {
              setBulkActionType("delete");
              setBulkConfirmVisible(true);
            }}
          >
            DELETE
          </button>
        </div>
      )}
      {viewMode === "table" ? (
        <div className="admin-events-main-content">
          <div className="admin-events-scrollable-table">
            <table className="admin-events-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>
                    <div
                      className="admin-events-dropdown-trigger"
                      onClick={() => setOpenCategory(!openCategory)}
                    >
                      Category{" "}
                      <span className="admin-header-dropdown-arrow">▾</span>
                      {openCategory && (
                        <div className="admin-header-dropdown-menu">
                          {[
                            "All",
                            "Kalusugan",
                            "Kalikasan",
                            "Karunungan",
                            "Kultura",
                            "Kasarian",
                          ].map((item) => (
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
                  <th>Title</th>
                  <th>
                    <div
                      className="admin-events-dropdown-trigger"
                      onClick={() => setOpenCreatedAt(!openCreatedAt)}
                    >
                      Date{" "}
                      <span className="admin-header-dropdown-arrow">▾</span>
                      {openCreatedAt && (
                        <div className="admin-header-dropdown-menu">
                          {["Newest First", "Oldest First"].map((order) => (
                            <div
                              key={order}
                              className="admin-header-dropdown-item"
                              onClick={() => {
                                setCreatedSortOrder(order);
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
                  <th>Venue</th>
                  <th>
                    <div
                      className="admin-events-dropdown-trigger"
                      onClick={() => setOpenStatus(!openStatus)}
                    >
                      Status{" "}
                      <span className="admin-header-dropdown-arrow">▾</span>
                      {openStatus && (
                        <div className="admin-header-dropdown-menu">
                          {[
                            "All",
                            "Upcoming",
                            "Ongoing",
                            "Completed",
                            "Cancelled",
                          ].map((status) => (
                            <div
                              key={status}
                              className="admin-header-dropdown-item"
                              onClick={() => {
                                setSelectedStatus(status);
                                setOpenStatus(false);
                              }}
                            >
                              {status}
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
                <col style={{ width: "80px" }} />
                <col style={{ width: "70px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "60px" }} />
                <col style={{ width: "40px" }} />
              </colgroup>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="no-blogs-message">
                      <span className="loading-spinner"></span> Loading events…
                    </td>
                  </tr>
                ) : pagedEvents.length > 0 ? (
                  pagedEvents.map((event) => (
                    <tr
                      key={event.event_id}
                      className="admin-events-table-content"
                      style={{ cursor: selectMode ? "default" : "pointer" }}
                      onClick={() => {
                        if (!selectMode) setSelectedEvent(event);
                      }}
                    >
                      <td className="admin-events-id-content">
                        {event.event_id}
                      </td>
                      <td className="admin-events-category-content category-tag">
                        {event.category?.toUpperCase() || "UNSPECIFIED"}
                      </td>
                      <td className="admin-events-title-content">
                        {event.title}
                      </td>
                      <td className="admin-events-date-content">
                        {formatDate(event.event_date)}
                      </td>
                      <td className="admin-events-venue-content">
                        {event.event_venue}
                      </td>
                      <td
                        className={`event-status status-${event.event_status.toLowerCase()}`}
                      >
                        {event.event_status.toUpperCase()}
                      </td>
                      <td className="admin-events-more-button">
                        {selectMode ? (
                          <input
                            type="checkbox"
                            checked={selectedEventIds.includes(event.event_id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEventIds((prev) => [
                                  ...prev,
                                  event.event_id,
                                ]);
                              } else {
                                setSelectedEventIds((prev) =>
                                  prev.filter((id) => id !== event.event_id)
                                );
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
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
                      No Event Found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination-container">
            {totalEventPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setEventsPage((p) => p - 1)}
                  disabled={eventsPage === 1}
                >
                  ‹ Prev
                </button>
                {[...Array(totalEventPages)].map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      className={p === eventsPage ? "active" : ""}
                      onClick={() => setEventsPage(p)}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setEventsPage((p) => p + 1)}
                  disabled={eventsPage === totalEventPages}
                >
                  Next ›
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="admin-events-main-content">
          <div>
            <div className="admin-blogs-grid-view">
              {filteredEvents.length > 0 ? (
                <div className="blog-grid-scrollable-wrapper">
                  <div className="blog-grid-container">
                    {filteredEvents.map((event) => (
                      <div
                        key={event.event_id}
                        className={`blog-grid-card grid-status-${event.event_status.toLowerCase()}`}
                        onClick={() => setSelectedEvent(event)}
                      >
                        <img
                          src={getFullImageUrl(event.image_url)}
                          alt={event.title}
                          className="blog-grid-image"
                        />
                        <div className="blog-grid-overlay">
                          <h3 className="blog-overlay-title">{event.title}</h3>
                          <p className="blog-overlay-category">
                            {event.category}
                          </p>
                          <p className="blog-overlay-date">
                            {formatDate(event.event_date)}
                          </p>
                          <p className="blog-overlay-venue">
                            {event.event_venue}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ marginTop: "20px" }}>No events found.</p>
              )}
            </div>
          </div>
        </div>
      )}
      {selectedEvent && (
        <div className="admin-events-view-more">
          <div className="admin-events-modal">
            <div className="admin-events-modal-content">
              <div className="admin-events-float-buttons">
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
                    <button className="delete-btn" onClick={handleDelete}>
                      Delete
                    </button>
                  </>
                )}
              </div>
              <button
                className="admin-events-modal-close"
                onClick={() => {
                  setIsEditing(false);
                  setEditableEvent(null);
                  setTempImageUrl(null);
                  setSelectedEvent(null);
                }}
              >
                ✕
              </button>
              <div className="admin-events-inner-content-modal">
                {notification && (
                  <div
                    className={`blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`}
                  >
                    {notification}
                  </div>
                )}
                <div className="admin-events-inner-content-modal-top">
                  <div className="admin-events-inner-content-modal-top-left">
                    <h2>Event Details</h2>
                    <div className="admin-events-inner-content-modal-id">
                      <p>
                        <strong>ID</strong>
                      </p>
                      <p className="admin-events-inner-content-modal-id-content">
                        {selectedEvent.event_id}
                      </p>
                    </div>
                    <div className="admin-events-inner-content-modal-title">
                      <p>
                        <strong>
                          Title{" "}
                          {editMissing.title && (
                            <span style={{ color: "red" }}>*</span>
                          )}
                        </strong>
                      </p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableEvent?.title || ""}
                          onChange={(e) =>
                            setEditableEvent({
                              ...editableEvent!,
                              title: e.target.value,
                            })
                          }
                          className="admin-events-inner-content-modal-title-content"
                          disabled={!isEditing}
                        />
                      ) : (
                        <p className="admin-events-inner-content-modal-title-content">
                          {selectedEvent.title}
                        </p>
                      )}
                    </div>
                    <div className="admin-events-inner-content-modal-category">
                      <p>
                        <strong>Category</strong>
                      </p>
                      <select
                        className="admin-events-inner-content-modal-category-content pink-category"
                        value={dropdownCategory ?? ""}
                        onChange={(e) => {
                          setDropdownCategory(e.target.value);
                          setEditableEvent((prev) =>
                            prev ? { ...prev, category: e.target.value } : prev
                          );
                        }}
                        disabled={!isEditing}
                      >
                        {[
                          "KALUSUGAN",
                          "KALIKASAN",
                          "KARUNUNGAN",
                          "KULTURA",
                          "KASARIAN",
                        ].map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-events-inner-content-modal-venue">
                      <p>
                        <strong>
                          Venue{" "}
                          {editMissing.event_venue && (
                            <span style={{ color: "red" }}>*</span>
                          )}
                        </strong>
                      </p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editableEvent?.event_venue || ""}
                          onChange={(e) =>
                            setEditableEvent((prev) =>
                              prev
                                ? { ...prev, event_venue: e.target.value }
                                : prev
                            )
                          }
                          onBlur={() =>
                            setEditableEvent((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    event_venue:
                                      prev.event_venue.trim() === ""
                                        ? "Manila, Philippines"
                                        : prev.event_venue,
                                  }
                                : prev
                            )
                          }
                          className="admin-events-inner-content-modal-venue-content"
                          disabled={!isEditing || isFieldLocked}
                        />
                      ) : (
                        <p className="admin-events-inner-content-modal-venue-content">
                          {selectedEvent.event_venue}
                        </p>
                      )}
                    </div>
                    {(isEditing
                      ? editableEvent?.event_venue
                      : selectedEvent.event_venue) && (
                      <div className="admin-events-google-map">
                        <iframe
                          src={`https://www.google.com/maps?q=${encodeURIComponent(
                            isEditing
                              ? (editableEvent?.event_venue ?? "")
                              : selectedEvent.event_venue
                          )}&z=18&output=embed`}
                          width="100%"
                          height="250"
                          loading="lazy"
                          style={{
                            border: "0",
                            borderRadius: "10px",
                            marginTop: "15px",
                          }}
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                  </div>
                  <div className="admin-events-inner-content-modal-top-right">
                    <div className="admin-events-inner-content-modal-status">
                      <p>
                        <strong>Status</strong>
                      </p>
                      <select
                        className={`admin-events-inner-content-modal-status-content status-${dropdownStatus?.toLowerCase()}`}
                        value={dropdownStatus ?? ""}
                        onChange={(e) => {
                          setDropdownStatus(e.target.value);
                          setEditableEvent((prev) =>
                            prev
                              ? { ...prev, event_status: e.target.value }
                              : prev
                          );
                        }}
                        disabled={!isEditing || isFieldLocked}
                      >
                        {dropdownStatus &&
                          !["UPCOMING", "CANCELLED"].includes(
                            dropdownStatus
                          ) && (
                            <option value={dropdownStatus} disabled>
                              {dropdownStatus}
                            </option>
                          )}
                        {["UPCOMING", "CANCELLED"].map((stat) => (
                          <option key={stat} value={stat}>
                            {stat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-events-inner-content-modal-date">
                      <p>
                        <strong>Date</strong>
                      </p>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editableEvent?.event_date || ""}
                          onChange={(e) =>
                            setEditableEvent({
                              ...editableEvent!,
                              event_date: e.target.value,
                            })
                          }
                          className="admin-events-inner-content-modal-date-content"
                          disabled={!isEditing || isFieldLocked}
                        />
                      ) : (
                        <p className="admin-events-inner-content-modal-date-content">
                          {formatDate(selectedEvent.event_date)}
                        </p>
                      )}
                    </div>
                    <div className="admin-events-inner-content-modal-time">
                      <div className="admin-events-inner-content-modal-time-start">
                        <p>
                          <strong>Start Time</strong>
                        </p>
                        {isEditing ? (
                          <input
                            type="time"
                            value={editableEvent?.event_start_time || ""}
                            onChange={(e) =>
                              setEditableEvent({
                                ...editableEvent!,
                                event_start_time: e.target.value,
                              })
                            }
                            className="admin-events-inner-content-modal-time-start-content"
                            disabled={!isEditing || isFieldLocked}
                          />
                        ) : (
                          <p className="admin-events-inner-content-modal-time-start-content">
                            {formatTime(selectedEvent.event_start_time)}
                          </p>
                        )}
                      </div>
                      <div className="admin-events-inner-content-modal-time-end">
                        <p>
                          <strong>End Time</strong>
                        </p>
                        {isEditing ? (
                          <input
                            type="time"
                            value={editableEvent?.event_end_time || ""}
                            onChange={(e) =>
                              setEditableEvent({
                                ...editableEvent!,
                                event_end_time: e.target.value,
                              })
                            }
                            className="admin-events-inner-content-modal-time-end-content"
                            disabled={!isEditing || isFieldLocked}
                          />
                        ) : (
                          <p className="admin-events-inner-content-modal-time-end-content">
                            {formatTime(selectedEvent.event_end_time)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="admin-events-inner-content-modal-speakers">
                      <p>
                        <strong>
                          Speakers{" "}
                          {editMissing.event_speakers && (
                            <span style={{ color: "red" }}>*</span>
                          )}
                        </strong>
                      </p>
                      {isEditing ? (
                        <textarea
                          value={editableEvent?.event_speakers || ""}
                          onChange={(e) =>
                            setEditableEvent({
                              ...editableEvent!,
                              event_speakers: e.target.value,
                            })
                          }
                          className="admin-events-inner-content-modal-speakers-content"
                        />
                      ) : (
                        <p
                          className="admin-events-inner-content-modal-speakers-content"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {selectedEvent.event_speakers}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="admin-events-inner-content-modal-bot">
                  <div className="admin-events-inner-content-modal-bot-left">
                    <div className="admin-events-inner-content-modal-image">
                      <p>
                        <strong>
                          Image{" "}
                          {editMissing.image_url && (
                            <span style={{ color: "red" }}>*</span>
                          )}
                        </strong>
                      </p>
                      {getFullImageUrl(
                        isEditing
                          ? tempImageUrl !== null
                            ? tempImageUrl
                            : editableEvent?.image_url || ""
                          : selectedEvent.image_url
                      ) ? (
                        <img
                          src={getFullImageUrl(
                            isEditing
                              ? tempImageUrl !== null
                                ? tempImageUrl
                                : editableEvent?.image_url || ""
                              : selectedEvent.image_url
                          )}
                          alt="Event"
                          style={{ cursor: "zoom-in" }}
                          onClick={() =>
                            setFullscreenImageUrl(
                              getFullImageUrl(
                                isEditing
                                  ? tempImageUrl !== null
                                    ? tempImageUrl
                                    : editableEvent?.image_url || ""
                                  : selectedEvent.image_url
                              )
                            )
                          }
                        />
                      ) : (
                        <div
                          style={{
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
                          }}
                        >
                          No Event Image
                        </div>
                      )}
                      <input
                        type="file"
                        id="event-image-upload"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleImageSelect(e, "edit")} // ← crop handler
                      />

                      <div className="admin-blogs-image-buttons">
                        <button
                          className="upload-btn"
                          disabled={!isEditing}
                          onClick={() =>
                            document
                              .getElementById("event-image-upload")
                              ?.click()
                          }
                        >
                          Upload
                        </button>
                        <button
                          className="remove-btn"
                          disabled={!isEditing}
                          onClick={handleImageRemove}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="admin-events-inner-content-modal-bot-right">
                    <div className="admin-events-inner-content-modal-desc">
                      <p>
                        <strong>
                          Event Content{" "}
                          {editMissing.content && (
                            <span style={{ color: "red" }}>*</span>
                          )}
                        </strong>
                      </p>
                      {isEditing ? (
                        <>
                          <div className="admin-blogs-content-image-tools">
                            <button
                              className="format-btn undo"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                saveSelection();
                              }}
                              onClick={() =>
                                document.execCommand("undo", false)
                              }
                            >
                              <FaUndo />
                            </button>
                            <button
                              className="format-btn redo"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                saveSelection();
                              }}
                              onClick={() =>
                                document.execCommand("redo", false)
                              }
                            >
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
                              onClick={() =>
                                document
                                  .getElementById("new-content-image-input")
                                  ?.click()
                              }
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
                                    `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/upload_event_image.php`,
                                    {
                                      method: "POST",
                                      body: formData,
                                    }
                                  );

                                  const data = await res.json();
                                  if (data.success && data.image_url) {
                                    const img = `<img src="${import.meta.env.VITE_API_BASE_URL}${data.image_url}" alt="event image" style="max-width:100%; margin: 10px 0; display:block;" />`;
                                    const div = document.getElementById(
                                      "new-event-content-editor"
                                    );
                                    if (div) {
                                      div.innerHTML += img;
                                      setEditableEvent((prev) =>
                                        prev
                                          ? { ...prev, content: div.innerHTML }
                                          : prev
                                      );
                                    }
                                  } else {
                                    alert("Image upload failed.");
                                  }
                                } catch (err) {
                                  console.error("Upload failed:", err);
                                  alert("An error occurred during upload.");
                                }
                              }}
                            />
                          </div>
                          <div
                            id="new-event-content-editor"
                            ref={textareaRef}
                            className="admin-blogs-modal-desc-content editable"
                            contentEditable
                            onBlur={() => {
                              if (textareaRef.current) {
                                const updatedContent =
                                  textareaRef.current.innerHTML;
                                setEditableEvent((prev) =>
                                  prev
                                    ? { ...prev, content: updatedContent }
                                    : prev
                                );
                              }
                            }}
                          />
                        </>
                      ) : (
                        <div className="admin-blogs-modal-desc-content">
                          <div className="admin-blogs-content-images-wrapper">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: selectedEvent.content,
                              }}
                            />
                          </div>
                        </div>
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
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Contact</th>
                              <th>Expectations</th>
                              <th>Signed Up</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedParticipants.map((p) => (
                              <tr key={p.participant_id}>
                                <td>{p.name}</td>
                                <td>{p.email}</td>
                                <td>{p.contact || "—"}</td>
                                <td>{p.expectations || "—"}</td>
                                <td>
                                  {new Date(p.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* pagination controls */}
                      {totalPages > 1 && (
                        <div className="pagination">
                          <button
                            onClick={() => setCurrentPage((p) => p - 1)}
                            disabled={currentPage === 1}
                          >
                            ‹ Prev
                          </button>
                          {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            return (
                              <button
                                key={page}
                                className={page === currentPage ? "active" : ""}
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setCurrentPage((p) => p + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next ›
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="no-participants">No one has signed up yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {bulkConfirmVisible && (
        <div className="blogs-confirmation-popup show">
          <div className="blogs-confirmation-box">
            <p>
              {bulkActionType === "delete" &&
              bulkActionStatus === "SINGLE_DELETE"
                ? "Are you sure you want to delete this event and all its images?"
                : bulkActionType === "delete"
                  ? "Are you sure you want to delete the selected events?"
                  : `Do you really want to mark the selected events as ${bulkActionStatus}?`}
            </p>
            <div className="blogs-confirmation-actions">
              <button
                className="confirm-yes"
                onClick={() => {
                  if (bulkActionType === "delete") {
                    if (bulkActionStatus === "SINGLE_DELETE") {
                      confirmSingleDelete();
                    } else {
                      handleBulkDelete();
                    }
                  } else {
                    applyBulkStatus(bulkActionStatus);
                  }
                  setBulkConfirmVisible(false);
                }}
              >
                Yes
              </button>
              <button
                className="confirm-no"
                onClick={() => setBulkConfirmVisible(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
      {isAddingNew && (
        <div className="admin-new-event">
          <div className="admin-new-event-modal">
            <div className="admin-new-event-modal-content">
              <div className="admin-new-event-float-buttons">
                <button className="save-btn" onClick={handleAddNewEventSave}>
                  Save
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setIsAddingNew(false);
                    resetNewEvent();
                  }}
                >
                  Cancel
                </button>
              </div>
              <button
                className="admin-new-event-modal-close"
                onClick={() => {
                  setIsAddingNew(false);
                  resetNewEvent();
                }}
              >
                ✕
              </button>
              <div className="admin-new-event-inner-content-modal">
                {notification && (
                  <div
                    className={`blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`}
                  >
                    {notification}
                  </div>
                )}
                <div className="admin-new-event-inner-content-modal-top">
                  <div className="admin-new-event-inner-content-modal-top-left">
                    <h2>Event Details</h2>
                    <p>
                      <strong>
                        Title{" "}
                        {missing.title && (
                          <span style={{ color: "red" }}>*</span>
                        )}
                      </strong>
                    </p>
                    <input
                      className="admin-new-event-inner-content-modal-title-content"
                      type="text"
                      value={newEvent.title}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, title: e.target.value })
                      }
                    />
                    <div className="admin-new-event-inner-content-modal-category">
                      <p>
                        <strong>
                          Category{" "}
                          {missing.category && (
                            <span style={{ color: "red" }}>*</span>
                          )}
                        </strong>
                      </p>
                      <select
                        className="admin-events-inner-content-modal-category-content pink-category"
                        value={newEvent.category}
                        onChange={(e) =>
                          setNewEvent({ ...newEvent, category: e.target.value })
                        }
                      >
                        {[
                          "KALUSUGAN",
                          "KALIKASAN",
                          "KARUNUNGAN",
                          "KULTURA",
                          "KASARIAN",
                        ].map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-new-event-inner-content-modal-venue">
                      <p>
                        <strong>
                          Venue{" "}
                          {missing.event_venue && (
                            <span style={{ color: "red" }}>*</span>
                          )}
                        </strong>
                      </p>
                      <input
                        type="text"
                        className="admin-new-event-inner-content-modal-venue-content"
                        value={newEvent.event_venue}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            event_venue: e.target.value,
                          })
                        }
                      />
                    </div>
                    {newEvent.event_venue && (
                      <div className="admin-events-google-map">
                        <iframe
                          src={`https://www.google.com/maps?q=${encodeURIComponent(newEvent.event_venue)}&z=18&output=embed`}
                          width="100%"
                          height="250"
                          loading="lazy"
                          style={{
                            border: "0",
                            borderRadius: "10px",
                            marginTop: "15px",
                          }}
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                  </div>
                  <div className="admin-new-event-inner-content-modal-top-right">
                    <div className="admin-new-event-inner-content-modal-status">
                      <p>
                        <strong>Status</strong>
                      </p>
                      <select
                        className={`admin-events-inner-content-modal-status-content status-${newEvent.event_status.toLowerCase()}`}
                        value={newEvent.event_status}
                        disabled
                      >
                        <option value="UPCOMING">UPCOMING</option>
                      </select>
                    </div>
                    <div className="admin-new-event-inner-content-modal-date">
                      <p>
                        <strong>
                          Date{" "}
                          {missing.event_date && (
                            <span style={{ color: "red" }}>*</span>
                          )}
                        </strong>
                      </p>
                      <input
                        type="date"
                        className="admin-new-event-inner-content-modal-date-content"
                        value={newEvent.event_date}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            event_date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="admin-new-event-inner-content-modal-time">
                      <div className="admin-new-event-inner-content-modal-time-start">
                        <p>
                          <strong>
                            Start Time{" "}
                            {missing.event_start_time && (
                              <span style={{ color: "red" }}>*</span>
                            )}
                          </strong>
                        </p>
                        <input
                          type="time"
                          className="admin-new-event-inner-content-modal-time-start-content"
                          value={newEvent.event_start_time}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              event_start_time: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="admin-new-event-inner-content-modal-time-end">
                        <p>
                          <strong>
                            End Time{" "}
                            {missing.event_end_time && (
                              <span style={{ color: "red" }}>*</span>
                            )}
                          </strong>
                        </p>
                        <input
                          type="time"
                          className="admin-new-event-inner-content-modal-time-end-content"
                          value={newEvent.event_end_time}
                          onChange={(e) =>
                            setNewEvent({
                              ...newEvent,
                              event_end_time: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="admin-events-inner-content-modal-speakers">
                      <p>
                        <strong>
                          Speaker/s{" "}
                          {missing.event_speakers && (
                            <span style={{ color: "red" }}>*</span>
                          )}
                        </strong>
                      </p>
                      <textarea
                        className="admin-new-event-inner-content-modal-speakers-content"
                        value={newEvent.event_speakers}
                        onChange={(e) =>
                          setNewEvent({
                            ...newEvent,
                            event_speakers: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="admin-new-event-inner-content-modal-bot">
                  <div className="admin-new-event-inner-content-modal-bot-left">
                    <div className="admin-new-event-inner-content-modal-bot-left">
                      <div className="admin-new-event-inner-content-modal-image">
                        <p>
                          <strong>
                            Image{" "}
                            {missing.image && (
                              <span style={{ color: "red" }}>*</span>
                            )}
                          </strong>
                        </p>
                        {getFullImageUrl(newImageUrl) ? (
                          <img
                            src={getFullImageUrl(newImageUrl)}
                            alt="Event"
                            style={{ cursor: "zoom-in" }}
                            onClick={() =>
                              setFullscreenImageUrl(
                                getFullImageUrl(newImageUrl)
                              )
                            }
                          />
                        ) : (
                          <div
                            style={{
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
                            }}
                          >
                            No Event Image
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          id="new-event-image-upload"
                          onChange={(e) => handleImageSelect(e, "new")}
                        />

                        <div className="admin-blogs-image-buttons">
                          <button
                            className="upload-btn"
                            onClick={() =>
                              document
                                .getElementById("new-event-image-upload")
                                ?.click()
                            }
                          >
                            Upload
                          </button>
                          <button
                            className="remove-btn"
                            onClick={() => setNewImageUrl(null)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="admin-new-event-inner-content-modal-bot-right">
                    <div className="admin-new-event-inner-content-modal-desc">
                      <p>
                        <strong>
                          Event Content{" "}
                          {missing.content && (
                            <span style={{ color: "red" }}>*</span>
                          )}
                        </strong>
                      </p>
                      <div className="admin-blogs-content-image-tools">
                        <button
                          className="format-btn undo"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            saveSelection();
                          }}
                          onClick={() => document.execCommand("undo", false)}
                        >
                          <FaUndo />
                        </button>
                        <button
                          className="format-btn redo"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            saveSelection();
                          }}
                          onClick={() => document.execCommand("redo", false)}
                        >
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
                          onClick={() =>
                            document
                              .getElementById("add-new-content-image-input")
                              ?.click()
                          }
                        >
                          <FaImage />
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          id="add-new-content-image-input"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const formData = new FormData();
                            formData.append("image", file);
                            try {
                              const res = await fetch(
                                `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/upload_event_image.php`,
                                {
                                  method: "POST",
                                  body: formData,
                                }
                              );

                              const data = await res.json();
                              if (data.success && data.image_url) {
                                const img = `<img src="${import.meta.env.VITE_API_BASE_URL}${data.image_url}" alt="event image" style="max-width:100%; margin: 10px 0; display:block;" />`;
                                const div = document.getElementById(
                                  "add-event-content-editor"
                                );
                                if (div) {
                                  div.innerHTML += img;
                                  setNewEvent((prev) => ({
                                    ...prev,
                                    content: div.innerHTML,
                                  }));
                                }
                              } else {
                                alert("Image upload failed.");
                              }
                            } catch (err) {
                              console.error("Upload failed:", err);
                              alert("An error occurred during upload.");
                            }
                          }}
                        />
                      </div>
                      <div
                        id="add-event-content-editor"
                        className="admin-new-event-inner-content-modal-desc-content editable"
                        contentEditable
                        onBlur={() => {
                          const div = document.getElementById(
                            "add-event-content-editor"
                          );
                          if (div) {
                            setNewEvent({
                              ...newEvent,
                              content: div.innerHTML,
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {fullscreenImageUrl && (
        <div
          className="fullscreen-image-overlay"
          onClick={() => setFullscreenImageUrl(null)}
        >
          <img src={fullscreenImageUrl} alt="Fullscreen" />
        </div>
      )}
      <ToastContainer
        position="top-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default AdminEvents;
