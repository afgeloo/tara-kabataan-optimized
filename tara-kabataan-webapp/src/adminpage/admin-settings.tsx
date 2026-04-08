// src/adminpage/admin-settings.tsx

import "./css/admin-settings.css";
import {
  FaSearch,
  FaBell,
  FaPlus,
  FaEdit,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebookF,
  FaInstagram,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import president from "../assets/aboutpage/council/president.jpg";
import { BsThreeDots } from "react-icons/bs";
import { useState, useEffect, useRef, useMemo } from "react";
import select from "../assets/adminpage/blogs/select.png";
import placeholderImg from "../assets/aboutpage/img-placeholder-guy.png";
import { toast, ToastContainer } from "react-toastify";

// --- Extracted Constants & Helpers ---
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";
const TABS = ["About Us", "Members", "Partnerships"];
const PARTNERS_PER_PAGE = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB Limit

const validatePasswordStrength = (password: string, email: string): string | null => {
  if (password.length < 8) return "Password must be at least 8 characters.";
  const strongPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).+$/;
  if (!strongPattern.test(password)) return "Password must include letters, numbers, and symbols.";
  
  const emailParts = email.split(/[@._\-]/).filter(Boolean);
  const passwordLower = password.toLowerCase();
  for (const part of emailParts) {
    if (part && passwordLower.includes(part.toLowerCase())) {
      return "Password should not include parts of your email.";
    }
  }
  return null;
};

const validateImageSize = (file: File): boolean => {
  if (file.size > MAX_FILE_SIZE) {
    toast.error(`Image size exceeds 5MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
    return false;
  }
  return true;
};

interface Member {
  member_id: string;
  member_name: string;
  member_image: string;
  role_id: string;
  role_name: string;
}

interface Partner {
  partner_id: string;
  partner_image: string;
  partner_name: string;
  partner_dec: string;
  partner_contact_email: string;
  partner_phone_number: string;
}

interface AboutUs {
  aboutus_id: string;
  background: string;
  overview: string;
  core_kapwa: string;
  core_kalinangan: string;
  core_kaginhawaan: string;
  mission: string;
  vision: string;
  council: string;
  adv_kalusugan: string;
  adv_kalikasan: string;
  adv_karunungan: string;
  adv_kultura: string;
  adv_kasarian: string;
  contact_no: string;
  about_email: string;
  facebook: string;
  instagram: string;
  address: string;
}

const AdminSettings = () => {
  // --- State Declarations ---
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [isEditingMember, setIsEditingMember] = useState(false);
  const [editableMember, setEditableMember] = useState<Member | null>(null);
  const [memberImageUrl, setMemberImageUrl] = useState<string | null>(null);
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
  
  const [roles, setRoles] = useState<{ role_id: string; role_name: string }[]>([]);
  const [showNewUserModal, setShowNewUserModal] = useState(false);

  // Partners State
  const [activeTab, setActiveTab] = useState(0);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isEditingPartner, setIsEditingPartner] = useState(false);
  const [editablePartner, setEditablePartner] = useState<Partner | null>(null);
  const [notification, setNotification] = useState("");
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [bulkConfirmVisible, setBulkConfirmVisible] = useState(false);
  const [bulkActionStatus, setBulkActionStatus] = useState<string>("");
  const [bulkActionType, setBulkActionType] = useState<"delete" | "status" | null>(null);
  
  // About Us State
  const [aboutData, setAboutData] = useState<AboutUs | null>(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editableContact, setEditableContact] = useState<AboutUs | null>(null);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailInvalid, setEmailInvalid] = useState(false);
  const [phoneInvalid, setPhoneInvalid] = useState(false);
  const [isEditingPageContent, setIsEditingPageContent] = useState(false);
  const [pageContentField, setPageContentField] = useState<keyof AboutUs | null>(null);
  const [editablePageContent, setEditablePageContent] = useState("");
  const [isEditingCoreValues, setIsEditingCoreValues] = useState(false);
  
  const [editableCoreValues, setEditableCoreValues] = useState({
    core_kapwa: "",
    core_kalinangan: "",
    core_kaginhawaan: "",
  });
  
  const [isEditingAdvocacies, setIsEditingAdvocacies] = useState(false);
  const [editableAdvocacies, setEditableAdvocacies] = useState({
    adv_kalusugan: "",
    adv_kalikasan: "",
    adv_karunungan: "",
    adv_kultura: "",
    adv_kasarian: "",
  });

  const [selectedCoreValue, setSelectedCoreValue] = useState<keyof typeof editableCoreValues>("core_kapwa");
  const [selectedAdvocacy, setSelectedAdvocacy] = useState<keyof typeof editableAdvocacies>("adv_kalusugan");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [newUserForm, setNewUserForm] = useState({ member_id: "", phone: "", email: "" });
  const [newRoleName, setNewRoleName] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState<string>("");
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [confirmRoleDeleteVisible, setConfirmRoleDeleteVisible] = useState(false);

  const [currentPagePartners, setCurrentPagePartners] = useState(1);
  const [isAddingNewMember, setIsAddingNewMember] = useState(false);
  const [newMember, setNewMember] = useState<Omit<Member, "member_id" | "role_name">>({
    member_name: "",
    member_image: "",
    role_id: "",
  });
  const [confirmMemberDeleteVisible, setConfirmMemberDeleteVisible] = useState(false);
  const [isAddingNewPartner, setIsAddingNewPartner] = useState(false);
  const [newPartner, setNewPartner] = useState<Omit<Partner, "partner_id">>({
    partner_image: "",
    partner_name: "",
    partner_dec: "",
    partner_contact_email: "",
    partner_phone_number: "",
  });

  // --- Effects ---
  useEffect(() => {
    fetch(`${API_BASE}/members.php`)
      .then((res) => res.json())
      .then((data) => { if (data.success) setMembers(data.members); })
      .catch((err) => console.error("Failed to fetch members:", err));

    fetch(`${API_BASE}/roles.php`)
      .then((res) => res.json())
      .then((data) => { if (data.success) setRoles(data.roles); })
      .catch((err) => console.error("Failed to fetch roles:", err));

    fetch(`${API_BASE}/partners.php`)
      .then((res) => res.json())
      .then((data) => setPartners(data.partners || []))
      .catch((err) => console.error("Failed to fetch partners:", err));

    fetch(`${API_BASE}/aboutus.php`)
      .then((res) => res.json())
      .then((data) => { if (!data.error) setAboutData(data); })
      .catch((err) => console.error("Failed to fetch About Us data:", err));
      
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

  useEffect(() => {
    if (loggedInUser) {
      setProfileEmail(loggedInUser.user_email || "");
      setProfilePhone(loggedInUser.user_contact || "");
    }
  }, [loggedInUser]);

  useEffect(() => {
    setCurrentPagePartners(1);
  }, [searchQuery, partners.length]);

  // --- Memoized Derived State ---
  const filteredMembers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return members.filter((member) => 
      [member.member_id, member.role_id, member.member_name, member.role_name].some(
        val => val?.toLowerCase().includes(query)
      )
    );
  }, [members, searchQuery]);

  const filteredPartners = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return partners.filter((partner) => 
      [partner.partner_id, partner.partner_name, partner.partner_dec, partner.partner_contact_email, partner.partner_phone_number].some(
        val => val?.toLowerCase().includes(query)
      )
    );
  }, [partners, searchQuery]);

  const totalPartnerPages = Math.ceil(filteredPartners.length / PARTNERS_PER_PAGE);
  const paginatedPartners = useMemo(() => {
    return filteredPartners.slice(
      (currentPagePartners - 1) * PARTNERS_PER_PAGE,
      currentPagePartners * PARTNERS_PER_PAGE
    );
  }, [filteredPartners, currentPagePartners]);

  // --- Functions ---
  const resetProfileModal = () => {
    setProfilePhone(loggedInUser?.user_contact || "");
    setProfilePassword("");
    setOldPassword("");
    setOtpInput("");
    setOtpSent(false);
    setOtpRequired(false);
    setIsEditingProfile(false);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 4000);
  };

  const handleMemberImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editableMember?.role_id) return;
    
    if (!validateImageSize(file)) {
      e.target.value = ""; // Reset input so user can try again
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("member_id", editableMember.member_id);

    try {
      const res = await fetch(`${API_BASE}/upload_member_image.php`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.image_url) {
        setMemberImageUrl(`${data.image_url}?t=${Date.now()}`);
        showNotification("Member image uploaded successfully!");
      } else {
        showNotification("Member image upload failed.");
      }
    } catch (err) {
      console.error("Member image upload error:", err);
      showNotification("Error occurred during member image upload.");
    }
  };

  const handleMemberImageRemove = () => {
    setMemberImageUrl(null);
    const input = document.getElementById("member-image-upload") as HTMLInputElement;
    const newFileInput = document.getElementById("new-member-image-upload") as HTMLInputElement;
    if (input) input.value = "";
    if (newFileInput) newFileInput.value = "";
  };

  const handleAddNewMemberSave = async () => {
    try {
      const response = await fetch(`${API_BASE}/add_new_member.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newMember, member_image: "" }),
      });
      const data = await response.json();

      if (data.success && data.member) {
        const newId = data.member.member_id;
        let imageUrl = "";
        const fileInput = document.getElementById("new-member-image-upload") as HTMLInputElement;
        const file = fileInput?.files?.[0];
        
        if (file) {
          const formData = new FormData();
          formData.append("image", file);
          formData.append("member_id", newId);

          const uploadRes = await fetch(`${API_BASE}/upload_member_image.php`, {
            method: "POST",
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (uploadData.success && uploadData.image_url) {
            imageUrl = uploadData.image_url;
            await fetch(`${API_BASE}/update_member.php`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...data.member, member_image: imageUrl }),
            });
          }
        }
        setMembers((prev) => [{ ...data.member, member_image: imageUrl }, ...prev]);
        setIsAddingNewMember(false);
        setNewMember({ member_name: "", member_image: "", role_id: "" });
        setMemberImageUrl(null);
        showNotification("New member added successfully!");
      } else {
        showNotification("Failed to add member.");
      }
    } catch (err) {
      console.error("Add member error:", err);
      showNotification("An error occurred while adding the member.");
    }
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;
    try {
      const res = await fetch(`${API_BASE}/delete_member.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: selectedMember.member_id }),
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => m.member_id !== selectedMember.member_id));
        showNotification("Member deleted successfully!");
        setIsEditingMember(false);
        setSelectedMember(null);
        setEditableMember(null);
        setMemberImageUrl(null);
      } else {
        showNotification("Failed to delete member.");
      }
    } catch (err) {
      console.error("Delete member error:", err);
      showNotification("An error occurred while deleting the member.");
    }
  };

  const handleSendOTP = async () => {
    if (!profileEmail) return toast.error("Email not found.");
    if (!profilePhone && !profilePassword) return toast.error("At least one of phone or password must be provided.");

    if (profilePassword) {
      if (!oldPassword) return toast.error("Please enter your current password.");

      try {
        const verifyRes = await fetch(`${API_BASE}/verify_old_password.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: profileEmail, old_password: oldPassword }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.valid) return toast.error("Old password is incorrect.");
      } catch (err) {
        return toast.error("Failed to verify old password.");
      }

      const passError = validatePasswordStrength(profilePassword, profileEmail);
      if (passError) return toast.error(passError);

      try {
        const prevRes = await fetch(`${API_BASE}/check_previous_password.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: profileEmail, new_password: profilePassword }),
        });
        const prevData = await prevRes.json();
        if (prevData.same === true) return toast.error("New password must be different from the previous password.");
      } catch {
        return toast.error("Failed to check previous password.");
      }
    }

    const toastId = toast.loading("Sending OTP...");
    try {
      const res = await fetch(`${API_BASE}/send_otp.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profileEmail }),
      });
      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        toast.update(toastId, {
          render: (
            <div>
              <strong>OTP sent to your email.</strong>
              <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>Check spam folder if not found.</div>
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
      toast.update(toastId, { render: "Error sending OTP.", type: "error", isLoading: false, autoClose: 3000 });
      console.error(err);
    }
  };

  const handleProfileUpdate = async () => {
    if (!profilePhone && !profilePassword) return toast.error("At least one of phone or password must be provided.");

    if (profilePassword) {
      const passError = validatePasswordStrength(profilePassword, profileEmail);
      if (passError) return toast.error(passError);

      try {
        const prevRes = await fetch(`${API_BASE}/check_previous_password.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: profileEmail, new_password: profilePassword }),
        });
        const prevData = await prevRes.json();
        if (prevData.same === true) return toast.error("New password must be different from the previous password.");
      } catch {
        return toast.error("Failed to check previous password.");
      }
    }

    try {
      const res = await fetch(`${API_BASE}/update_profile.php`, {
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
      const res = await fetch(`${API_BASE}/verify_otp.php`, {
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
        toast.update(toastId, { render: "OTP verified. Profile updated.", type: "success", isLoading: false, autoClose: 3000 });
      } else {
        toast.update(toastId, { render: "Incorrect OTP.", type: "error", isLoading: false, autoClose: 3000 });
      }
    } catch (err) {
      toast.update(toastId, { render: "Error verifying OTP.", type: "error", isLoading: false, autoClose: 3000 });
      console.error(err);
    }
  };

  const getFullImageUrl = (url: string | null) => {
    if (!url) return "";
    
    // 1. Keep local upload previews working
    if (url.startsWith("blob:")) return url;
    
    // 2. Ignore already absolute URLs
    if (/^https?:\/\//i.test(url) || url.startsWith("//")) return url;

    // 3. Preserve cache-busting queries while cleaning the path
    const [path, query] = url.split("?");
    let cleanPath = path.startsWith("/") ? path.substring(1) : path;

    // 4. Strip redundant S3 folders (The fix for Partner images!)
    if (cleanPath.startsWith("tara-kabataan-webapp/uploads/")) {
      cleanPath = cleanPath.replace("tara-kabataan-webapp/uploads/", "");
    } else if (cleanPath.startsWith("tara-kabataan-optimized/tara-kabataan-webapp/uploads/")) {
      cleanPath = cleanPath.replace("tara-kabataan-optimized/tara-kabataan-webapp/uploads/", "");
    }

    let full = `${IMAGE_BASE}/${cleanPath}`;
    if (query) full += `?${query}`;
    
    return full;
  };

  const getFullImageUrlCouncil = (url: string | null) => {
    if (!url || url.trim() === "") return placeholderImg;
    if (url.startsWith("blob:")) return url;
    if (/^https?:\/\//i.test(url) || url.startsWith("//")) return url;

    const [path, query] = url.split("?");
    let cleanPath = path.startsWith("/") ? path.substring(1) : path;

    if (cleanPath.startsWith("tara-kabataan-webapp/uploads/")) {
      cleanPath = cleanPath.replace("tara-kabataan-webapp/uploads/", "");
    } else if (cleanPath.startsWith("tara-kabataan-optimized/tara-kabataan-webapp/uploads/")) {
      cleanPath = cleanPath.replace("tara-kabataan-optimized/tara-kabataan-webapp/uploads/", "");
    }

    if (!cleanPath.includes("/")) {
      cleanPath = `members-images/${cleanPath}`;
    }

    let full = `${IMAGE_BASE}/${cleanPath}`;
    if (query) full += `?${query}`;
    return full;
  };

  const handleSavePartnerUpdate = async () => {
    if (!editablePartner) return;
    if (editImageUrl && editImageUrl.startsWith("blob:")) {
      toast.warning("Image is still uploading to S3. Please wait a second before saving!");
      return; 
    }

    const updatedPartner = { ...editablePartner, partner_image: editImageUrl !== null ? editImageUrl : "" };

    try {
      const res = await fetch(`${API_BASE}/update_partners.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPartner),
      });
      const data = await res.json();

      if (data.success) {
        setPartners((prev) => prev.map((p) => p.partner_id === updatedPartner.partner_id ? updatedPartner : p));
        setIsEditingPartner(false);
        setSelectedPartner(updatedPartner);
        setEditablePartner(null);
        showNotification("Partner updated successfully!");
      } else {
        showNotification("Failed to update partner.");
      }
    } catch (error) {
      console.error("Update error:", error);
      showNotification("An error occurred while updating the partner.");
    }
  };

  const handleAddNewPartnerSave = async () => {
    const payload = { ...newPartner, partner_image: newPartner.partner_image || "" };
    try {
      const res = await fetch(`${API_BASE}/add_new_partner.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.partner) {
        const newId = data.partner.partner_id;
        if (newImageUrl) {
          const imageFileInput = document.getElementById("new-partner-image-upload") as HTMLInputElement;
          const file = imageFileInput?.files?.[0];

          if (file) {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("partner_id", newId);

            const imgRes = await fetch(`${API_BASE}/upload_partner_image.php`, {
              method: "POST",
              body: formData,
            });
            const imgData = await imgRes.json();

            if (imgData.success && imgData.image_url) {
              data.partner.partner_image = imgData.image_url;
              await fetch(`${API_BASE}/update_partners.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data.partner, partner_image: imgData.image_url }),
              });
            }
          }
        }
        setPartners((prev) => [data.partner, ...prev]);
        showNotification("New partner added successfully!");
        setNewPartner({ partner_image: "", partner_name: "", partner_dec: "", partner_contact_email: "", partner_phone_number: "" });
        setNewImageUrl(null);
        setIsAddingNewPartner(false);
      } else {
        showNotification("Failed to add new partner.");
      }
    } catch (err) {
      console.error("Add partner error:", err);
      showNotification("An error occurred while adding the partner.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: "edit" | "new") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateImageSize(file)) {
      e.target.value = ""; // Reset input
      return;
    }

    const tempPreviewUrl = URL.createObjectURL(file);
    if (mode === "edit") {
      setEditImageUrl(tempPreviewUrl);
    } else {
      setNewImageUrl(tempPreviewUrl);
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    if (editablePartner?.partner_id) formData.append("partner_id", editablePartner.partner_id);

    try {
      const res = await fetch(`${API_BASE}/upload_partner_image.php`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.image_url) {
        setEditImageUrl(`${data.image_url}?t=${Date.now()}`);
      } else {
        alert("Image upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("An error occurred during upload.");
    }
  };

  const handleImageRemove = (mode: "edit" | "new") => {
    if (mode === "edit") {
      setEditImageUrl(null);
      const input = document.getElementById("partner-image-upload") as HTMLInputElement;
      if (input) input.value = "";
    } else {
      setNewImageUrl(null);
      const input = document.getElementById("new-partner-image-upload") as HTMLInputElement;
      if (input) input.value = "";
    }
  };

  const handleSingleDelete = () => {
    setBulkActionType("delete");
    setBulkActionStatus("SINGLE_DELETE");
    setBulkConfirmVisible(true);
  };

  const confirmSingleDelete = async () => {
    if (!selectedPartner) return;
    try {
      const res = await fetch(`${API_BASE}/delete_partners.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_id: selectedPartner.partner_id }),
      });
      const data = await res.json();

      if (data.success) {
        showNotification("Partner deleted successfully!");
        setPartners((prev) => prev.filter((p) => p.partner_id !== selectedPartner.partner_id));
        setSelectedPartner(null);
      } else {
        showNotification("Failed to delete partner.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showNotification("An error occurred while deleting.");
    }
  };

  const handleBulkDelete = async () => {
    try {
      const response = await fetch(`${API_BASE}/delete_bulk_partners.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partner_ids: selectedPartnerIds }),
      });
      const data = await response.json();

      if (data.success) {
        setPartners((prev) => prev.filter((p) => !selectedPartnerIds.includes(p.partner_id)));
        setSelectedPartnerIds([]);
        setSelectMode(false);
        showNotification("Partners deleted successfully!");
      } else {
        alert("Failed to delete partners.");
      }
    } catch (err) {
      console.error("Bulk delete error:", err);
      alert("Error occurred during bulk delete.");
    }
  };

  const updateAboutUsData = async (updatedData: AboutUs, successMsg: string, failMsg: string, callback?: () => void) => {
    try {
      const res = await fetch(`${API_BASE}/update_aboutus.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      if (data.success) {
        setAboutData(updatedData);
        showNotification(successMsg);
      } else {
        showNotification(failMsg);
      }
    } catch (err) {
      console.error("Error updating About Us:", err);
      showNotification(`An error occurred while updating ${failMsg.toLowerCase()}`);
    }
    if (callback) callback();
  };

  const handleSaveCoreValues = () => {
    if (!aboutData) return;
    updateAboutUsData(
      { ...aboutData, ...editableCoreValues },
      "Core Values updated successfully!",
      "Failed to update Core Values.",
      () => setIsEditingCoreValues(false)
    );
  };

  const handleSaveAdvocacies = () => {
    if (!aboutData) return;
    updateAboutUsData(
      { ...aboutData, ...editableAdvocacies },
      "Advocacies updated successfully!",
      "Failed to update Advocacies.",
      () => setIsEditingAdvocacies(false)
    );
  };

  const handleNewUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/new-user.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: newUserForm.member_id, phone: newUserForm.phone, email: newUserForm.email }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User created!");
        setNewUserForm({ member_id: "", phone: "", email: "" });
        setShowNewUserModal(false);
      } else {
        toast.error(data.error || "Failed to create user");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error, please try again.");
    }
  };

  const closeNewUserModal = () => {
    setNewUserForm({ member_id: "", phone: "", email: "" });
    setShowNewUserModal(false);
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return showNotification("Role name is required.");
    try {
      const res = await fetch(`${API_BASE}/add_role.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_name: newRoleName }),
      });
      const data = await res.json();

      if (data.success) {
        setRoles((prev) => [...prev, data.role]);
        setNewRoleName("");
        showNotification("Role added successfully!");
      } else {
        showNotification(data.message || "Failed to add role.");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error adding role.");
    }
  };

  const handleEditRole = (role_id: string, role_name: string) => {
    setEditingRoleId(role_id);
    setEditingRoleName(role_name);
  };

  const handleCancelEdit = () => {
    setEditingRoleId(null);
    setEditingRoleName("");
  };

  const handleUpdateRole = async () => {
    if (!editingRoleId || !editingRoleName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/update_role.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: editingRoleId, role_name: editingRoleName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setRoles((rs) => rs.map((r) => r.role_id === editingRoleId ? { ...r, role_name: editingRoleName.trim() } : r));
        showNotification("Role updated successfully!");
      } else {
        showNotification(data.message || "Failed to update role.");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error updating role.");
    }
    handleCancelEdit();
  };

  const deleteRole = async (role_id: string) => {
    try {
      const res = await fetch(`${API_BASE}/delete_role.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id }),
      });
      const data = await res.json();
      if (data.success) {
        setRoles((prev) => prev.filter((r) => r.role_id !== role_id));
        showNotification("Role deleted successfully!");
      } else {
        showNotification(data.message || "Failed to delete role.");
      }
    } catch (err) {
      console.error(err);
      showNotification("Error deleting role.");
    }
  };

  return (
    <div className="admin-settings">
      {notification && (
        <div className={`blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`}>
          {notification}
        </div>
      )}
      <div className="admin-settings-header">
        <div className="admin-settings-search-container">
          <FaSearch className="admin-settings-search-icon" />
          <input type="text" name="fakeusernameremembered" style={{ display: "none" }} />
          <input type="password" name="fakepasswordremembered" style={{ display: "none" }} />
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
        <div className="admin-settings-header-right">
          <button className="admin-settings-create-user" onClick={() => setShowNewUserModal(true)}>
            <FaPlus className="create-user-icon" />
            <span>Create New User</span>
          </button>
          {showNewUserModal && (
            <div className="create-user-modal-backdrop" onClick={closeNewUserModal}>
              <div className="create-user-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="create-user-modal-close" onClick={closeNewUserModal}>✕</button>
                <h2>New User</h2>
                <form onSubmit={handleNewUserSubmit}>
                  <label className="create-user-label">
                    Name
                    <div className="create-user-select-wrapper">
                      <select
                        className="create-user-select"
                        name="member_id"
                        value={newUserForm.member_id}
                        required
                        onChange={(e) => setNewUserForm((f) => ({ ...f, member_id: e.target.value }))}
                      >
                        <option value="">Select a member…</option>
                        {members.map((m) => (
                          <option key={m.member_id} value={m.member_id}>{m.member_name}</option>
                        ))}
                      </select>
                    </div>
                  </label>
                  <label className="create-user-modal-label">
                    Phone Number
                    <input
                      type="text"
                      name="phone"
                      value={newUserForm.phone}
                      required
                      onChange={(e) => setNewUserForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </label>
                  <label className="create-user-modal-label">
                    Email
                    <input
                      type="email"
                      name="email"
                      value={newUserForm.email}
                      required
                      onChange={(e) => setNewUserForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </label>
                  <div className="create-user-modal-actions">
                    <button type="button" className="cancel-btn" onClick={closeNewUserModal}>Cancel</button>
                    <button type="submit" className="save-btn">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}
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
                <div className="modal-close-icon" onClick={() => { setShowProfileModal(false); resetProfileModal(); }}>
                  <FaTimes />
                </div>
                <h2>Change Password</h2>
                <label>Email:</label>
                <input type="email" value={profileEmail} disabled />
                {isEditingProfile && (
                  <>
                    <div style={{ position: "relative" }}>
                      <label>Old Password:</label>
                      <input type="text" name="fakeusernameremembered" style={{ display: "none" }} />
                      <input type="password" name="fakepasswordremembered" style={{ display: "none" }} />
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
                      <input type="text" name="fakeusernameremembered" style={{ display: "none" }} />
                      <input type="password" name="fakepasswordremembered" style={{ display: "none" }} />
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
                        <input
                          key={index}
                          ref={(el) => { otpRefs.current[index] = el as HTMLInputElement; }}
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
                            if (index < 5 && val) otpRefs.current[index + 1]?.focus();
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

      <div className="admin-settings-lower-header">
        <div className="admin-settings-lower-header-left">
          <h1>Settings</h1>
          {activeTab === 2 && (
            <>
              {viewMode === "table" && (
                <div className="admin-events-lower-header-select">
                  <button onClick={() => { setSelectMode(!selectMode); setSelectedPartnerIds([]); }}>
                    <img src={select} className="admin-blogs-lower-header-select-img" />
                    {selectMode ? "Cancel" : "Select"}
                  </button>
                </div>
              )}
              <div className="admin-settings-toggle-newpartner">
                <button
                  className="add-new-partner-btn"
                  onClick={() => {
                    setIsAddingNewPartner(true);
                    setNewPartner({ partner_image: "", partner_name: "", partner_dec: "", partner_contact_email: "", partner_phone_number: "" });
                    setNewImageUrl(null);
                  }}
                >
                  <FaPlus className="admin-icon-left" /> New Partner
                </button>
                <div className="admin-blogs-toggle-wrapper">
                  <button className={`admin-blogs-toggle-button ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")}>Table View</button>
                  <button className={`admin-blogs-toggle-button ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}>Grid View</button>
                </div>
              </div>
            </>
          )}
          {activeTab === 1 && (
            <button className="add-new-partner-btn" onClick={() => setShowRolesModal(true)}>See Roles</button>
          )}
          {showRolesModal && (
            <div className="admin-contact-modal" onClick={() => setShowRolesModal(false)}>
              <div className="admin-contact-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="admin-contact-modal-close" onClick={() => setShowRolesModal(false)}>✕</button>
                <h1>All Roles</h1>
                <ul className="roles-list">
                  {roles.map((r) => (
                    <li key={r.role_id} className="role-item">
                      {editingRoleId === r.role_id ? (
                        <>
                          <input
                            type="text"
                            value={editingRoleName}
                            onChange={(e) => setEditingRoleName(e.target.value)}
                            className="role-edit-input"
                          />
                          <div className="roles-list-buttons">
                            <div><button className="save-btn" onClick={handleUpdateRole}>Save</button></div>
                            <div><button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button></div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="role-item-content">
                            <div><span className="role-name">{r.role_name}</span></div>
                            <div className="role-item-actions">
                              <div><FaEdit className="role-edit-icon" onClick={() => handleEditRole(r.role_id, r.role_name)} /></div>
                              <div>
                                <FaTrash
                                  className="role-trash-icon"
                                  onClick={() => {
                                    setRoleToDelete(r.role_id);
                                    setConfirmRoleDeleteVisible(true);
                                  }}
                                />
                                {confirmRoleDeleteVisible && (
                                  <div className="roles-confirmation-popup show">
                                    <div className="blogs-confirmation-box">
                                      <p>Are you sure you want to delete this role?</p>
                                      <div className="blogs-confirmation-actions">
                                        <button
                                          className="confirm-yes"
                                          onClick={() => {
                                            if (roleToDelete) deleteRole(roleToDelete);
                                            setConfirmRoleDeleteVisible(false);
                                            setRoleToDelete(null);
                                          }}
                                        >
                                          Yes
                                        </button>
                                        <button
                                          className="confirm-no"
                                          onClick={() => {
                                            setConfirmRoleDeleteVisible(false);
                                            setRoleToDelete(null);
                                          }}
                                        >
                                          No
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <hr style={{ margin: "1.5rem 0", borderColor: "#eee" }} />
                <div className="admin-contact-edit-fields">
                  <label>
                    Role Name
                    <input type="text" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
                  </label>
                </div>
                <div className="admin-contact-edit-actions" style={{ marginTop: "0" }}>
                  <button className="save-btn" onClick={handleAddRole}>
                    <FaPlus style={{ marginRight: 6 }} /> Add Role
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="admin-settings-lower-header-right">
          <div className="admin-settings-tabs-wrapper">
            <div className="admin-settings-tabs">
              {TABS.map((tab, index) => (
                <button
                  key={index}
                  className={`admin-settings-tab ${activeTab === index ? "active" : ""}`}
                  onClick={() => setActiveTab(index)}
                >
                  {tab}
                </button>
              ))}
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

      <div className="admin-settings-main-content">
        {activeTab === 0 && (
          <div className="admin-settings-tab-placeholder">
            <div className="admin-settings-aboutus">
              <div className="admin-settings-aboutus-contact-info">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="admin-settings-aboutus-contact-info-left">
                    <h1 className="admin-settings-aboutus-contact-info-left-h1">Contact Information</h1>
                    <div className="admin-settings-aboutus-contact-info-phone">
                      <div className="admin-settings-aboutus-contact-info-phone-icon"><FaPhone /></div>
                      <div className="admin-settings-aboutus-contact-info-phone-desc">
                        <h1>Phone</h1>
                        <p>{aboutData?.contact_no || "N/A"}</p>
                      </div>
                    </div>
                    <div className="admin-settings-aboutus-contact-info-email">
                      <div className="admin-settings-aboutus-contact-info-email-icon"><FaEnvelope /></div>
                      <div className="admin-settings-aboutus-contact-info-email-desc">
                        <h1>Email</h1>
                        <p>{aboutData?.about_email || "N/A"}</p>
                      </div>
                    </div>
                    <div className="admin-settings-aboutus-contact-info-address">
                      <div className="admin-settings-aboutus-contact-info-address-icon"><FaMapMarkerAlt /></div>
                      <div className="admin-settings-aboutus-contact-info-address-desc">
                        <h1>Address</h1>
                        <p>{aboutData?.address || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginLeft: "2rem" }}>
                    <FaEdit
                      className="aboutus-edit-icon"
                      onClick={() => {
                        setEditableContact({ ...aboutData! });
                        setIsEditingContact(true);
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </div>
                <div className="admin-settings-aboutus-contact-info-right">
                  <div className="admin-settings-aboutus-contact-info-facebook">
                    <div className="admin-settings-aboutus-contact-info-facebook-icon"><FaFacebookF /></div>
                    <div className="admin-settings-aboutus-contact-info-facebook-desc">
                      <h1>Facebook</h1>
                      <p>{aboutData?.facebook || "N/A"}</p>
                    </div>
                  </div>
                  <div className="admin-settings-aboutus-contact-info-instagram">
                    <div className="admin-settings-aboutus-contact-info-instagram-icon"><FaInstagram /></div>
                    <div className="admin-settings-aboutus-contact-info-instagram-desc">
                      <h1>Instagram</h1>
                      <p>{aboutData?.instagram || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="admin-settings-aboutus-page-contents">
                <div className="admin-settings-aboutus-page-contents-left">
                  <h1 className="admin-settings-aboutus-page-contents-left-h1">Page Contents</h1>
                  <div className="admin-settings-aboutus-core-val">
                    <div className="admin-settings-aboutus-core-val-left">
                      <h1>Core Values</h1>
                      <p>Kapwa, Kalinagan, Kaginhawaan</p>
                    </div>
                    <div className="admin-settings-aboutus-core-val-right">
                      <FaEdit
                        className="aboutus-page-contents-edit-icon"
                        onClick={() => {
                          setEditableCoreValues({
                            core_kapwa: aboutData?.core_kapwa || "",
                            core_kalinangan: aboutData?.core_kalinangan || "",
                            core_kaginhawaan: aboutData?.core_kaginhawaan || "",
                          });
                          setIsEditingCoreValues(true);
                        }}
                      />
                    </div>
                  </div>
                  <div className="admin-settings-aboutus-mission">
                    <div className="admin-settings-aboutus-mission-left">
                      <h1>Mission</h1>
                      <p>
                        {aboutData?.mission
                          ? aboutData.mission.length > 50 ? aboutData.mission.slice(0, 50) + "..." : aboutData.mission
                          : "No mission found."}
                      </p>
                    </div>
                    <div className="admin-settings-aboutus-mission-right">
                      <FaEdit
                        className="aboutus-page-contents-edit-icon"
                        onClick={() => {
                          setPageContentField("mission");
                          setEditablePageContent(aboutData?.mission || "");
                          setIsEditingPageContent(true);
                        }}
                      />
                    </div>
                  </div>
                  <div className="admin-settings-aboutus-vision">
                    <div className="admin-settings-aboutus-vision-left">
                      <h1>Vision</h1>
                      <p>
                        {aboutData?.vision
                          ? aboutData.vision.length > 50 ? aboutData.vision.slice(0, 50) + "..." : aboutData.vision
                          : "No vision found."}
                      </p>
                    </div>
                    <div className="admin-settings-aboutus-vision-right">
                      <FaEdit
                        className="aboutus-page-contents-edit-icon"
                        onClick={() => {
                          setPageContentField("vision");
                          setEditablePageContent(aboutData?.vision || "");
                          setIsEditingPageContent(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="admin-settings-aboutus-page-contents-right">
                  <div className="admin-settings-aboutus-background-text">
                    <div className="admin-settings-aboutus-background-text-left">
                      <h1>Background</h1>
                      <p>
                        {aboutData?.background
                          ? aboutData.background.length > 50 ? aboutData.background.slice(0, 50) + "..." : aboutData.background
                          : "No background found."}
                      </p>
                    </div>
                    <div className="admin-settings-aboutus-background-text-right">
                      <FaEdit
                        className="aboutus-page-contents-edit-icon"
                        onClick={() => {
                          setPageContentField("background");
                          setEditablePageContent(aboutData?.background || "");
                          setIsEditingPageContent(true);
                        }}
                      />
                    </div>
                  </div>
                  <div className="admin-settings-aboutus-council-text">
                    <div className="admin-settings-aboutus-council-text-left">
                      <h1>Council</h1>
                      <p>
                        {aboutData?.council
                          ? aboutData.council.length > 50 ? aboutData.council.slice(0, 50) + "..." : aboutData.council
                          : "No council found."}
                      </p>
                    </div>
                    <div className="admin-settings-aboutus-council-text-right">
                      <FaEdit
                        className="aboutus-page-contents-edit-icon"
                        onClick={() => {
                          setPageContentField("council");
                          setEditablePageContent(aboutData?.council || "");
                          setIsEditingPageContent(true);
                        }}
                      />
                    </div>
                  </div>
                  <div className="admin-settings-aboutus-advocacies">
                    <div className="admin-settings-aboutus-advocacies-left">
                      <h1>Advocacies</h1>
                      <p>Kalusugan, Kalikasan, Karunungan, Kultura, Kasarian</p>
                    </div>
                    <div className="admin-settings-aboutus-advocacies-right">
                      <FaEdit
                        className="aboutus-page-contents-edit-icon"
                        onClick={() => {
                          setEditableAdvocacies({
                            adv_kalusugan: aboutData?.adv_kalusugan || "",
                            adv_kalikasan: aboutData?.adv_kalikasan || "",
                            adv_karunungan: aboutData?.adv_karunungan || "",
                            adv_kultura: aboutData?.adv_kultura || "",
                            adv_kasarian: aboutData?.adv_kasarian || "",
                          });
                          setIsEditingAdvocacies(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {isEditingPageContent && pageContentField && (
              <div className="admin-contact-modal">
                <div className="admin-contact-modal-content">
                  <button
                    className="admin-contact-modal-close"
                    onClick={() => { setIsEditingPageContent(false); setPageContentField(null); }}
                  >✕</button>
                  <h1>Edit {pageContentField.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())}</h1>
                  <textarea
                    className="admin-pagecontent-text"
                    value={editablePageContent}
                    onChange={(e) => setEditablePageContent(e.target.value)}
                  />
                  <div className="admin-contact-edit-actions">
                    <button
                      className="save-btn"
                      onClick={() => {
                        if (!aboutData || !pageContentField) return;
                        updateAboutUsData(
                          { ...aboutData, [pageContentField]: editablePageContent },
                          "Page content updated successfully!",
                          "Failed to update page content.",
                          () => { setIsEditingPageContent(false); setPageContentField(null); }
                        );
                      }}
                    >Save</button>
                    <button className="cancel-btn" onClick={() => { setIsEditingPageContent(false); setPageContentField(null); }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
            {isEditingCoreValues && (
              <div className="admin-contact-modal">
                <div className="admin-contact-modal-content">
                  <button className="admin-contact-modal-close" onClick={() => setIsEditingCoreValues(false)}>✕</button>
                  <h1>Edit Core Values</h1>
                  <div className="admin-contact-edit-fields">
                    <label>Select Core Value</label>
                    <select
                      className="admin-contact-edit-select"
                      value={selectedCoreValue}
                      onChange={(e) => setSelectedCoreValue(e.target.value as keyof typeof editableCoreValues)}
                    >
                      <option value="core_kapwa">Kapwa</option>
                      <option value="core_kalinangan">Kalinangan</option>
                      <option value="core_kaginhawaan">Kaginhawaan</option>
                    </select>
                    <label className="label-page-content">Edit Text</label>
                    <textarea
                      value={editableCoreValues[selectedCoreValue]}
                      onChange={(e) => setEditableCoreValues((prev) => ({ ...prev, [selectedCoreValue]: e.target.value }))}
                      className="admin-corevalue-textarea"
                    />
                  </div>
                  <div className="admin-contact-edit-actions">
                    <button className="save-btn" onClick={handleSaveCoreValues}>Save</button>
                    <button className="cancel-btn" onClick={() => setIsEditingCoreValues(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
            {isEditingAdvocacies && (
              <div className="admin-contact-modal">
                <div className="admin-contact-modal-content">
                  <button className="admin-contact-modal-close" onClick={() => setIsEditingAdvocacies(false)}>✕</button>
                  <h1>Edit Advocacies</h1>
                  <div className="admin-contact-edit-fields">
                    <label>Select Advocacy</label>
                    <select
                      className="admin-contact-edit-select"
                      value={selectedAdvocacy}
                      onChange={(e) => setSelectedAdvocacy(e.target.value as keyof typeof editableAdvocacies)}
                    >
                      <option value="adv_kalusugan">Kalusugan</option>
                      <option value="adv_kalikasan">Kalikasan</option>
                      <option value="adv_karunungan">Karunungan</option>
                      <option value="adv_kultura">Kultura</option>
                      <option value="adv_kasarian">Kasarian</option>
                    </select>
                    <label className="label-page-content">Edit Text</label>
                    <textarea
                      value={editableAdvocacies[selectedAdvocacy]}
                      onChange={(e) => setEditableAdvocacies((prev) => ({ ...prev, [selectedAdvocacy]: e.target.value }))}
                      className="admin-corevalue-textarea"
                    />
                  </div>
                  <div className="admin-contact-edit-actions">
                    <button className="save-btn" onClick={handleSaveAdvocacies}>Save</button>
                    <button className="cancel-btn" onClick={() => setIsEditingAdvocacies(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
            {isEditingContact && editableContact && (
              <div className="admin-contact-modal">
                <div className="admin-contact-modal-content">
                  <button className="admin-contact-modal-close" onClick={() => { setIsEditingContact(false); setEditableContact(null); }}>✕</button>
                  <h1>Edit Contact Information</h1>
                  <div className="admin-contact-edit-fields">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      value={editableContact.contact_no || ""}
                      maxLength={11}
                      className={phoneInvalid ? "error-input" : ""}
                      onChange={(e) => {
                        const newValue = e.target.value.replace(/\D/g, "");
                        if (newValue.length <= 11) {
                          setEditableContact((prev) => prev ? { ...prev, contact_no: newValue } : prev);
                        }
                        setPhoneInvalid(false);
                      }}
                    />
                    {phoneError && <p className="error-message">{phoneError}</p>}
                    <label>Email</label>
                    <input
                      type="text"
                      value={editableContact.about_email || ""}
                      className={emailInvalid ? "error-input" : ""}
                      onChange={(e) => {
                        setEditableContact((prev) => prev ? { ...prev, about_email: e.target.value } : prev);
                        setEmailInvalid(false);
                      }}
                    />
                    {emailError && <p className="error-message">{emailError}</p>}
                    <label>Address</label>
                    <input
                      type="text"
                      value={editableContact.address || ""}
                      onChange={(e) => setEditableContact((prev) => prev ? { ...prev, address: e.target.value } : prev)}
                    />
                    <label>Facebook</label>
                    <input
                      type="text"
                      value={editableContact.facebook || ""}
                      onChange={(e) => setEditableContact((prev) => prev ? { ...prev, facebook: e.target.value } : prev)}
                    />
                    <label>Instagram</label>
                    <input
                      type="text"
                      value={editableContact.instagram || ""}
                      onChange={(e) => setEditableContact((prev) => prev ? { ...prev, instagram: e.target.value } : prev)}
                    />
                  </div>
                  <div className="admin-contact-edit-actions">
                    <button
                      className="save-btn"
                      onClick={() => {
                        if (!editableContact) return;
                        let hasError = false;
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        const phoneRegex = /^09\d{9}$/;

                        if (!emailRegex.test(editableContact.about_email)) {
                          setEmailInvalid(true);
                          hasError = true;
                        }
                        if (!phoneRegex.test(editableContact.contact_no)) {
                          setPhoneInvalid(true);
                          hasError = true;
                        }
                        if (hasError) return;

                        updateAboutUsData(
                          editableContact,
                          "Contact Information updated successfully!",
                          "Failed to update Contact Information.",
                          () => { setIsEditingContact(false); setEditableContact(null); }
                        );
                      }}
                    >Save</button>
                    <button className="cancel-btn" onClick={() => { setIsEditingContact(false); setEditableContact(null); }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 1 && (
          <div className="admin-settings-tab-placeholder">
            <div className="admin-settings-members">
              <div className="admin-settings-members-cards">
                {filteredMembers.map((member) => (
                  <div key={member.member_id} className="admin-settings-members-cards-content">
                    <div className="admin-settings-members-cards-content-photo">
                      <img
                        src={getFullImageUrlCouncil(member.member_image)}
                        alt="member"
                        className="admin-settings-members-cards-content-inner-photo"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = placeholderImg;
                        }}
                      />
                    </div>
                    <div className="admin-settings-members-cards-content-bg">
                      <div className="admin-settings-members-cards-inner-content">
                        <div className="admin-settings-members-cards-inner-desc">
                          <div className="admin-settings-members-cards-inner-content-name">{member.member_name}</div>
                          <div className="admin-settings-members-cards-inner-content-position">{member.role_name}</div>
                        </div>
                        <FaEdit
                          className="admin-settings-member-edit-icon"
                          title="Edit"
                          onClick={() => {
                            setSelectedMember(member);
                            setEditableMember({ ...member });
                            setMemberImageUrl(member.member_image);
                            setIsEditingMember(true);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div
                  className="admin-settings-members-cards-content admin-settings-add-member-card"
                  onClick={() => {
                    setIsAddingNewMember(true);
                    setNewMember({ member_name: "", member_image: "", role_id: "" });
                    setMemberImageUrl(null);
                  }}
                >
                  <div className="admin-settings-members-cards-content-photo add-member-photo">
                    <span className="add-member-plus">+</span>
                  </div>
                  <div className="admin-settings-members-cards-content-bg">
                    <div className="admin-settings-members-cards-inner-content">
                      <div className="admin-settings-members-cards-inner-desc">
                        <div className="admin-settings-members-cards-inner-content-name">Add Member</div>
                        <div className="admin-settings-members-cards-inner-content-position">Click to add</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {isEditingMember && selectedMember && (
                <div className="admin-member-modal">
                  {notification && (
                    <div className={`blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`}>
                      {notification}
                    </div>
                  )}
                  <div className="admin-member-modal-content">
                    <button
                      className="admin-member-modal-close"
                      onClick={() => {
                        setIsEditingMember(false);
                        setSelectedMember(null);
                        setEditableMember(null);
                        setMemberImageUrl(null);
                      }}
                    >✕</button>
                    <h1>Edit Member</h1>
                    <div className="admin-member-edit-section">
                      <div className="admin-member-edit-image-wrapper">
                        {memberImageUrl ? (
                          <img
                            src={getFullImageUrlCouncil(memberImageUrl)}
                            onClick={() => setFullscreenImageUrl(getFullImageUrlCouncil(memberImageUrl))}
                            style={{ cursor: "zoom-in" }}
                            alt="Preview"
                            className="admin-member-edit-photo"
                          />
                        ) : (
                          <div className="admin-member-no-image">No Image</div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          id="member-image-upload"
                          style={{ display: "none" }}
                          onChange={handleMemberImageUpload}
                        />
                        <div className="admin-member-image-buttons">
                          <button onClick={() => document.getElementById("member-image-upload")?.click()}>Upload</button>
                          <button onClick={handleMemberImageRemove}>Remove</button>
                        </div>
                      </div>
                      <div className="admin-member-edit-fields">
                        <label>Name</label>
                        <input
                          type="text"
                          value={editableMember?.member_name || ""}
                          onChange={(e) => setEditableMember((prev) => prev ? { ...prev, member_name: e.target.value } : prev)}
                        />
                        <label>Role</label>
                        <select
                          value={editableMember?.role_id || ""}
                          onChange={(e) => setEditableMember((prev) => prev ? { ...prev, role_id: e.target.value } : prev)}
                        >
                          <option value="" disabled>Select a role</option>
                          {roles.map((role) => (
                            <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="admin-member-edit-actions">
                      <button className="delete-member-btn" onClick={() => setConfirmMemberDeleteVisible(true)}>Delete</button>
                      <button
                        className="save-btn"
                        onClick={async () => {
                          if (!editableMember) return;
                          const originalImage = selectedMember?.member_image;
                          const updatedImage = memberImageUrl || "";

                          if (!memberImageUrl && originalImage) {
                            await fetch(`${API_BASE}/delete_member_image.php`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ image_url: originalImage }),
                            });
                          }
                          const updatedMember = { ...editableMember, member_image: updatedImage };

                          try {
                            const response = await fetch(`${API_BASE}/update_member.php`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(updatedMember),
                            });
                            const result = await response.json();
                            if (result.success && result.member) {
                              setMembers((prev) => prev.map((u) => u.member_id === result.member.member_id ? result.member : u));
                              setIsEditingMember(false);
                              setSelectedMember(null);
                              setEditableMember(null);
                              setMemberImageUrl(null);
                              showNotification("Member updated successfully!");
                            } else {
                              showNotification("Failed to update member: " + result.message);
                            }
                          } catch (error) {
                            console.error("Update error:", error);
                            alert("Error occurred while updating member.");
                          }
                        }}
                      >Save</button>
                      <button className="cancel-btn" onClick={() => setIsEditingMember(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
              {confirmMemberDeleteVisible && (
                <div className="blogs-confirmation-popup show">
                  <div className="blogs-confirmation-box">
                    <p>Are you sure you want to delete this member and all their images?</p>
                    <div className="blogs-confirmation-actions">
                      <button
                        className="confirm-yes"
                        onClick={() => { setConfirmMemberDeleteVisible(false); handleDeleteMember(); }}
                      >Yes</button>
                      <button className="confirm-no" onClick={() => setConfirmMemberDeleteVisible(false)}>No</button>
                    </div>
                  </div>
                </div>
              )}
              {isAddingNewMember && (
                <div className="admin-member-modal">
                  {notification && (
                    <div className={`blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`}>
                      {notification}
                    </div>
                  )}
                  <div className="admin-member-modal-content">
                    <button
                      className="admin-member-modal-close"
                      onClick={() => {
                        setIsAddingNewMember(false);
                        setNewMember({ member_name: "", member_image: "", role_id: "" });
                        setMemberImageUrl(null);
                        setNotification("");
                      }}
                    >✕</button>
                    <h1>New Member</h1>
                    <div className="admin-member-edit-section">
                      <div className="admin-member-edit-image-wrapper">
                        {memberImageUrl ? (
                          <img
                            src={memberImageUrl?.startsWith("blob:") ? memberImageUrl : getFullImageUrlCouncil(memberImageUrl)}
                            alt="Preview"
                            className="admin-member-edit-photo"
                          />
                        ) : (
                          <div className="admin-member-no-image">No Image</div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          id="new-member-image-upload"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (!validateImageSize(file)) {
                                e.target.value = "";
                                return;
                              }
                              setMemberImageUrl(URL.createObjectURL(file));
                            }
                          }}
                        />
                        <div className="admin-member-image-buttons">
                          <button onClick={() => document.getElementById("new-member-image-upload")?.click()}>Upload</button>
                          <button onClick={handleMemberImageRemove}>Remove</button>
                        </div>
                      </div>
                      <div className="admin-member-edit-fields">
                        <label>Name</label>
                        <input
                          type="text"
                          value={newMember.member_name}
                          onChange={(e) => setNewMember((prev) => ({ ...prev, member_name: e.target.value }))}
                        />
                        <label>Role</label>
                        <select
                          value={newMember.role_id}
                          onChange={(e) => setNewMember((prev) => ({ ...prev, role_id: e.target.value }))}
                        >
                          <option value="" disabled>Select a role</option>
                          {roles.map((role) => (
                            <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="admin-member-edit-actions">
                      <button className="save-btn" onClick={handleAddNewMemberSave}>Save</button>
                      <button
                        className="cancel-btn"
                        onClick={() => {
                          setIsAddingNewMember(false);
                          setNewMember({ member_name: "", member_image: "", role_id: "" });
                          setNotification("");
                        }}
                      >Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 2 && (
          <div className="admin-settings-partner-container">
            {viewMode === "table" ? (
              <div>
                <table className="admin-settings-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Email</th>
                      <th>Contact No.</th>
                      <th>{selectMode ? "Select" : "View"}</th>
                    </tr>
                  </thead>
                  <colgroup>
                    <col style={{ width: "100px" }} />
                    <col style={{ width: "100px" }} />
                    <col style={{ width: "150px" }} />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "100px" }} />
                    <col style={{ width: "50px" }} />
                  </colgroup>
                  <tbody>
                    {paginatedPartners.length > 0 ? (
                      paginatedPartners.map((partner) => (
                        <tr
                          key={partner.partner_id}
                          className="admin-settings-table-content"
                          style={{ cursor: selectMode ? "default" : "pointer" }}
                          onClick={() => {
                            if (!selectMode) {
                              setSelectedPartner(partner);
                              setNotification("");
                              setConfirmDeleteVisible(false);
                              setIsEditingPartner(false);
                              setEditablePartner(null);
                              setEditImageUrl(null);
                            }
                          }}
                        >
                          <td>{partner.partner_id}</td>
                          <td>{partner.partner_name}</td>
                          <td>{partner.partner_dec}</td>
                          <td>{partner.partner_contact_email}</td>
                          <td>{partner.partner_phone_number}</td>
                          <td className="admin-settings-view-content">
                            {selectMode ? (
                              <input
                                type="checkbox"
                                checked={selectedPartnerIds.includes(partner.partner_id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPartnerIds((prev) => [...prev, partner.partner_id]);
                                  } else {
                                    setSelectedPartnerIds((prev) => prev.filter((id) => id !== partner.partner_id));
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPartner(partner);
                                  setNotification("");
                                  setConfirmDeleteVisible(false);
                                }}
                              >
                                <BsThreeDots />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>No Partner Data Available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-settings-grid-view">
                {filteredPartners.map((partner) => (
                  <div
                    key={partner.partner_id}
                    className="admin-settings-grid-card"
                    style={{ cursor: selectMode ? "default" : "pointer" }}
                    onClick={() => {
                      if (!selectMode) {
                        setSelectedPartner(partner);
                        setNotification("");
                        setConfirmDeleteVisible(false);
                        setIsEditingPartner(false);
                        setEditablePartner(null);
                        setEditImageUrl(null);
                      }
                    }}
                  >
                    {selectMode && (
                      <div className="grid-select-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedPartnerIds.includes(partner.partner_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPartnerIds((prev) => [...prev, partner.partner_id]);
                            } else {
                              setSelectedPartnerIds((prev) => prev.filter((id) => id !== partner.partner_id));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    <div className="settings-grid-container">
                      <img src={getFullImageUrl(partner.partner_image)} alt="partner" className="settings-grid-img" />
                    </div>
                    <div className="admin-settings-grid-card-info">
                      <p className="settings-overlay-title">{partner.partner_name}</p>
                      <p className="settings-overlay-contact">{partner.partner_contact_email}</p>
                      <p className="settings-overlay-phone">{partner.partner_phone_number}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedPartner && (
              <div className="admin-partners-modal-layer">
                <div className="admin-partners-modal">
                  {selectedPartner && notification && (
                    <div className={`blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`}>
                      {notification}
                    </div>
                  )}
                  <div className="admin-partners-modal-content">
                    <div className="admin-partners-float-buttons">
                      {isEditingPartner ? (
                        <>
                          <button className="save-btn" onClick={handleSavePartnerUpdate}>Save</button>
                          <button className="cancel-btn" onClick={() => setIsEditingPartner(false)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button
                            className="edit-btn"
                            onClick={() => {
                              setIsEditingPartner(true);
                              setEditablePartner({ ...selectedPartner! });
                              setEditImageUrl(selectedPartner?.partner_image || null);
                            }}
                          >Edit</button>
                          <button className="delete-btn" onClick={handleSingleDelete}>Delete</button>
                        </>
                      )}
                    </div>
                    <button
                      className="admin-partners-modal-close"
                      onClick={() => {
                        setSelectedPartner(null);
                        setIsEditingPartner(false);
                        setEditImageUrl(null);
                        setEditablePartner(null);
                        setNotification("");
                        setConfirmDeleteVisible(false);
                      }}
                    >✕</button>
                    <div className="admin-partners-inner-modal">
                      <div className="admin-partners-inner-modal-left">
                        <h2>Partner Details</h2>
                        <div className="admin-partners-inner-modal-id">
                          <p><strong>ID</strong></p>
                          <p className="admin-partners-inner-modal-id-content">{selectedPartner.partner_id}</p>
                        </div>
                        <div className="admin-partners-inner-modal-name">
                          <p><strong>Name</strong></p>
                          {isEditingPartner ? (
                            <input
                              className="admin-partners-inner-modal-name-content"
                              value={editablePartner?.partner_name || ""}
                              onChange={(e) => setEditablePartner((prev) => prev && { ...prev, partner_name: e.target.value })}
                            />
                          ) : (
                            <p className="admin-partners-inner-modal-name-content">{selectedPartner.partner_name}</p>
                          )}
                        </div>
                        <div className="admin-partners-inner-modal-image">
                          <p><strong>Image</strong></p>
                          <div className="admin-partners-image-wrapper">
                            <div className="admin-partners-image-preview">
                              {isEditingPartner ? (
                                editImageUrl ? (
                                  <img src={getFullImageUrl(editImageUrl)} alt="Partner" />
                                ) : (
                                  <div className="admin-partners-no-image">No Partner Image</div>
                                )
                              ) : selectedPartner?.partner_image ? (
                                <img
                                  src={getFullImageUrl(selectedPartner.partner_image)}
                                  alt="Partner"
                                  onClick={() => setFullscreenImageUrl(getFullImageUrl(selectedPartner.partner_image))}
                                  style={{ cursor: "zoom-in" }}
                                />
                              ) : (
                                <div className="admin-partners-no-image">No Partner Image</div>
                              )}
                            </div>
                            <div className="admin-partners-image-buttons">
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                id="partner-image-upload"
                                onChange={(e) => handleImageUpload(e, "edit")}
                              />
                              <button
                                className="partners-upload-btn"
                                disabled={!isEditingPartner}
                                onClick={() => document.getElementById("partner-image-upload")?.click()}
                              >Upload</button>
                              <button
                                className="partners-remove-btn"
                                disabled={!isEditingPartner}
                                onClick={() => handleImageRemove("edit")}
                              >Remove</button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="admin-partners-inner-modal-right">
                        <div className="admin-partners-inner-modal-email">
                          <p><strong>Email</strong></p>
                          {isEditingPartner ? (
                            <input
                              className="admin-partners-inner-modal-email-content"
                              value={editablePartner?.partner_contact_email || ""}
                              onChange={(e) => setEditablePartner((prev) => prev && { ...prev, partner_contact_email: e.target.value })}
                            />
                          ) : (
                            <p className="admin-partners-inner-modal-email-content">{selectedPartner.partner_contact_email}</p>
                          )}
                        </div>
                        <div className="admin-partners-inner-modal-contact">
                          <p><strong>Contact</strong></p>
                          {isEditingPartner ? (
                            <input
                              className="admin-partners-inner-modal-contact-content"
                              value={editablePartner?.partner_phone_number || ""}
                              onChange={(e) => setEditablePartner((prev) => prev && { ...prev, partner_phone_number: e.target.value })}
                            />
                          ) : (
                            <p className="admin-partners-inner-modal-contact-content">{selectedPartner.partner_phone_number}</p>
                          )}
                        </div>
                        <div className="admin-partners-inner-modal-desc">
                          <p><strong>Description</strong></p>
                          {isEditingPartner ? (
                            <textarea
                              className="admin-partners-inner-modal-desc-content"
                              value={editablePartner?.partner_dec || ""}
                              onChange={(e) => setEditablePartner((prev) => prev && { ...prev, partner_dec: e.target.value })}
                            />
                          ) : (
                            <p className="admin-partners-inner-modal-desc-content">{selectedPartner.partner_dec}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {isAddingNewPartner && (
              <div className="admin-partners-modal">
                {isAddingNewPartner && notification && (
                  <div className={`blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`}>
                    {notification}
                  </div>
                )}
                <div className="admin-partners-modal-content">
                  <div className="admin-partners-float-buttons">
                    <button className="save-btn" onClick={handleAddNewPartnerSave}>Save</button>
                    <button className="cancel-btn" onClick={() => { setIsAddingNewPartner(false); setNotification(""); }}>Cancel</button>
                  </div>
                  <button className="admin-partners-modal-close" onClick={() => { setIsAddingNewPartner(false); setNotification(""); }}>✕</button>
                  <div className="admin-partners-inner-modal">
                    <div className="admin-partners-inner-modal-left">
                      <h2>New Partner</h2>
                      <div className="admin-partners-inner-modal-name">
                        <p><strong>Name</strong></p>
                        <input
                          className="admin-partners-inner-modal-name-content"
                          value={newPartner.partner_name}
                          onChange={(e) => setNewPartner({ ...newPartner, partner_name: e.target.value })}
                        />
                      </div>
                      <div className="admin-partners-inner-modal-image">
                        <p><strong>Image</strong></p>
                        <div className="admin-partners-image-wrapper">
                          <div className="admin-partners-image-preview">
                            {newImageUrl ? (
                              <img src={newImageUrl} alt="Partner" />
                            ) : (
                              <div className="admin-partners-no-image">No Partner Image</div>
                            )}
                          </div>
                          <div className="admin-partners-image-buttons">
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              id="new-partner-image-upload"
                              onChange={(e) => handleImageUpload(e, "new")}
                            />
                            <button className="partners-upload-btn" onClick={() => document.getElementById("new-partner-image-upload")?.click()}>Upload</button>
                            <button className="partners-remove-btn" onClick={() => handleImageRemove("new")}>Remove</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="admin-partners-inner-modal-right">
                      <div className="admin-partners-inner-modal-email">
                        <p><strong>Email</strong></p>
                        <input
                          className="admin-partners-inner-modal-email-content"
                          value={newPartner.partner_contact_email}
                          onChange={(e) => setNewPartner({ ...newPartner, partner_contact_email: e.target.value })}
                        />
                      </div>
                      <div className="admin-partners-inner-modal-contact">
                        <p><strong>Contact</strong></p>
                        <input
                          className="admin-partners-inner-modal-contact-content"
                          value={newPartner.partner_phone_number}
                          onChange={(e) => setNewPartner({ ...newPartner, partner_phone_number: e.target.value })}
                        />
                      </div>
                      <div className="admin-partners-inner-modal-desc">
                        <p><strong>Description</strong></p>
                        <textarea
                          className="admin-partners-inner-modal-desc-content"
                          value={newPartner.partner_dec}
                          onChange={(e) => setNewPartner({ ...newPartner, partner_dec: e.target.value })}
                        />
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
                    {bulkActionType === "delete" && bulkActionStatus === "SINGLE_DELETE"
                      ? "Are you sure you want to delete this partner and all its images?"
                      : "Are you sure you want to delete the selected partners?"}
                  </p>
                  <div className="blogs-confirmation-actions">
                    <button
                      className="confirm-yes"
                      onClick={() => {
                        if (bulkActionType === "delete") {
                          if (bulkActionStatus === "SINGLE_DELETE") confirmSingleDelete();
                          else handleBulkDelete();
                        }
                        setBulkConfirmVisible(false);
                      }}
                    >Yes</button>
                    <button className="confirm-no" onClick={() => setBulkConfirmVisible(false)}>No</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {fullscreenImageUrl && (
          <div className="fullscreen-image-modal" onClick={() => setFullscreenImageUrl(null)}>
            <div className="fullscreen-image-wrapper">
              <img src={fullscreenImageUrl} alt="Full view" />
              <button className="close-fullscreen-btn" onClick={() => setFullscreenImageUrl(null)}>✕</button>
            </div>
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
      {activeTab === 2 && viewMode === "table" && (
        <div className="pagination-container-partners">
          <div className="pagination">
            <button
              onClick={() => setCurrentPagePartners((p) => Math.max(p - 1, 1))}
              disabled={currentPagePartners === 1}
            >‹ Prev</button>

            {[...Array(totalPartnerPages)].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  className={page === currentPagePartners ? "active" : ""}
                  onClick={() => setCurrentPagePartners(page)}
                >{page}</button>
              );
            })}

            <button
              onClick={() => setCurrentPagePartners((p) => Math.min(p + 1, totalPartnerPages))}
              disabled={currentPagePartners === totalPartnerPages}
            >Next ›</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;