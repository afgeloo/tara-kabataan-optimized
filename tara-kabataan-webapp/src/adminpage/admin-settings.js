import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/adminpage/admin-settings.tsx
import "./css/admin-settings.css";
import { FaSearch, FaPlus, FaEdit, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebookF, FaInstagram, FaTimes, FaTrash, } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { useState, useEffect, useRef, useMemo } from "react";
import select from "../assets/adminpage/blogs/select.png";
import placeholderImg from "../assets/aboutpage/img-placeholder-guy.png";
import { toast, ToastContainer } from "react-toastify";
// --- Extracted Constants & Helpers ---
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp-v2.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";
const TABS = ["About Us", "Members", "Partnerships"];
const PARTNERS_PER_PAGE = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB Limit
const validatePasswordStrength = (password, email) => {
    if (password.length < 8)
        return "Password must be at least 8 characters.";
    const strongPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^\w\s]).+$/;
    if (!strongPattern.test(password))
        return "Password must include letters, numbers, and symbols.";
    const emailParts = email.split(/[@._\-]/).filter(Boolean);
    const passwordLower = password.toLowerCase();
    for (const part of emailParts) {
        if (part && passwordLower.includes(part.toLowerCase())) {
            return "Password should not include parts of your email.";
        }
    }
    return null;
};
const validateImageSize = (file) => {
    if (file.size > MAX_FILE_SIZE) {
        toast.error(`Image size exceeds 5MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
        return false;
    }
    return true;
};
const AdminSettings = () => {
    // --- State Declarations ---
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showRolesModal, setShowRolesModal] = useState(false);
    const [isEditingMember, setIsEditingMember] = useState(false);
    const [editableMember, setEditableMember] = useState(null);
    const [memberImageUrl, setMemberImageUrl] = useState(null);
    const [loggedInUser, setLoggedInUser] = useState(null);
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
    const otpRefs = useRef([]);
    const [roles, setRoles] = useState([]);
    const [showNewUserModal, setShowNewUserModal] = useState(false);
    // Partners State
    const [activeTab, setActiveTab] = useState(0);
    const [partners, setPartners] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [isEditingPartner, setIsEditingPartner] = useState(false);
    const [editablePartner, setEditablePartner] = useState(null);
    const [notification, setNotification] = useState("");
    const [editImageUrl, setEditImageUrl] = useState(null);
    const [newImageUrl, setNewImageUrl] = useState(null);
    const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
    const [selectMode, setSelectMode] = useState(false);
    const [selectedPartnerIds, setSelectedPartnerIds] = useState([]);
    const [bulkConfirmVisible, setBulkConfirmVisible] = useState(false);
    const [bulkActionStatus, setBulkActionStatus] = useState("");
    const [bulkActionType, setBulkActionType] = useState(null);
    // About Us State
    const [aboutData, setAboutData] = useState(null);
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [editableContact, setEditableContact] = useState(null);
    const [emailError, setEmailError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [emailInvalid, setEmailInvalid] = useState(false);
    const [phoneInvalid, setPhoneInvalid] = useState(false);
    const [isEditingPageContent, setIsEditingPageContent] = useState(false);
    const [pageContentField, setPageContentField] = useState(null);
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
    const [selectedCoreValue, setSelectedCoreValue] = useState("core_kapwa");
    const [selectedAdvocacy, setSelectedAdvocacy] = useState("adv_kalusugan");
    const [searchQuery, setSearchQuery] = useState("");
    const [fullscreenImageUrl, setFullscreenImageUrl] = useState(null);
    const [viewMode, setViewMode] = useState("table");
    const [newUserForm, setNewUserForm] = useState({ member_id: "", phone: "", email: "" });
    const [newRoleName, setNewRoleName] = useState("");
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [editingRoleName, setEditingRoleName] = useState("");
    const [roleToDelete, setRoleToDelete] = useState(null);
    const [confirmRoleDeleteVisible, setConfirmRoleDeleteVisible] = useState(false);
    const [currentPagePartners, setCurrentPagePartners] = useState(1);
    const [isAddingNewMember, setIsAddingNewMember] = useState(false);
    const [newMember, setNewMember] = useState({
        member_name: "",
        member_image: "",
        role_id: "",
    });
    const [confirmMemberDeleteVisible, setConfirmMemberDeleteVisible] = useState(false);
    const [isAddingNewPartner, setIsAddingNewPartner] = useState(false);
    const [newPartner, setNewPartner] = useState({
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
            .then((data) => { if (data.success)
            setMembers(data.members); })
            .catch((err) => console.error("Failed to fetch members:", err));
        fetch(`${API_BASE}/roles.php`)
            .then((res) => res.json())
            .then((data) => { if (data.success)
            setRoles(data.roles); })
            .catch((err) => console.error("Failed to fetch roles:", err));
        fetch(`${API_BASE}/partners.php`)
            .then((res) => res.json())
            .then((data) => setPartners(data.partners || []))
            .catch((err) => console.error("Failed to fetch partners:", err));
        fetch(`${API_BASE}/aboutus.php`)
            .then((res) => res.json())
            .then((data) => { if (!data.error)
            setAboutData(data); })
            .catch((err) => console.error("Failed to fetch About Us data:", err));
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
        return members.filter((member) => [member.member_id, member.role_id, member.member_name, member.role_name].some(val => val?.toLowerCase().includes(query)));
    }, [members, searchQuery]);
    const filteredPartners = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return partners.filter((partner) => [partner.partner_id, partner.partner_name, partner.partner_dec, partner.partner_contact_email, partner.partner_phone_number].some(val => val?.toLowerCase().includes(query)));
    }, [partners, searchQuery]);
    const totalPartnerPages = Math.ceil(filteredPartners.length / PARTNERS_PER_PAGE);
    const paginatedPartners = useMemo(() => {
        return filteredPartners.slice((currentPagePartners - 1) * PARTNERS_PER_PAGE, currentPagePartners * PARTNERS_PER_PAGE);
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
    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(""), 4000);
    };
    const handleMemberImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !editableMember?.role_id)
            return;
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
            }
            else {
                showNotification("Member image upload failed.");
            }
        }
        catch (err) {
            console.error("Member image upload error:", err);
            showNotification("Error occurred during member image upload.");
        }
    };
    const handleMemberImageRemove = () => {
        setMemberImageUrl(null);
        const input = document.getElementById("member-image-upload");
        const newFileInput = document.getElementById("new-member-image-upload");
        if (input)
            input.value = "";
        if (newFileInput)
            newFileInput.value = "";
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
                const fileInput = document.getElementById("new-member-image-upload");
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
            }
            else {
                showNotification("Failed to add member.");
            }
        }
        catch (err) {
            console.error("Add member error:", err);
            showNotification("An error occurred while adding the member.");
        }
    };
    const handleDeleteMember = async () => {
        if (!selectedMember)
            return;
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
            }
            else {
                showNotification("Failed to delete member.");
            }
        }
        catch (err) {
            console.error("Delete member error:", err);
            showNotification("An error occurred while deleting the member.");
        }
    };
    const handleSendOTP = async () => {
        if (!profileEmail)
            return toast.error("Email not found.");
        if (!profilePhone && !profilePassword)
            return toast.error("At least one of phone or password must be provided.");
        if (profilePassword) {
            if (!oldPassword)
                return toast.error("Please enter your current password.");
            try {
                const verifyRes = await fetch(`${API_BASE}/verify_old_password.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: profileEmail, old_password: oldPassword }),
                });
                const verifyData = await verifyRes.json();
                if (!verifyData.valid)
                    return toast.error("Old password is incorrect.");
            }
            catch (err) {
                return toast.error("Failed to verify old password.");
            }
            const passError = validatePasswordStrength(profilePassword, profileEmail);
            if (passError)
                return toast.error(passError);
            try {
                const prevRes = await fetch(`${API_BASE}/check_previous_password.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: profileEmail, new_password: profilePassword }),
                });
                const prevData = await prevRes.json();
                if (prevData.same === true)
                    return toast.error("New password must be different from the previous password.");
            }
            catch {
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
            toast.update(toastId, { render: "Error sending OTP.", type: "error", isLoading: false, autoClose: 3000 });
            console.error(err);
        }
    };
    const handleProfileUpdate = async () => {
        if (!profilePhone && !profilePassword)
            return toast.error("At least one of phone or password must be provided.");
        if (profilePassword) {
            const passError = validatePasswordStrength(profilePassword, profileEmail);
            if (passError)
                return toast.error(passError);
            try {
                const prevRes = await fetch(`${API_BASE}/check_previous_password.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: profileEmail, new_password: profilePassword }),
                });
                const prevData = await prevRes.json();
                if (prevData.same === true)
                    return toast.error("New password must be different from the previous password.");
            }
            catch {
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
            }
            else {
                toast.update(toastId, { render: "Incorrect OTP.", type: "error", isLoading: false, autoClose: 3000 });
            }
        }
        catch (err) {
            toast.update(toastId, { render: "Error verifying OTP.", type: "error", isLoading: false, autoClose: 3000 });
            console.error(err);
        }
    };
    const getFullImageUrl = (url) => {
        if (!url)
            return "";
        // 1. Keep local upload previews working
        if (url.startsWith("blob:"))
            return url;
        // 2. Ignore already absolute URLs
        if (/^https?:\/\//i.test(url) || url.startsWith("//"))
            return url;
        // 3. Preserve cache-busting queries while cleaning the path
        const [path, query] = url.split("?");
        let cleanPath = path.startsWith("/") ? path.substring(1) : path;
        // 4. Strip redundant S3 folders (The fix for Partner images!)
        if (cleanPath.startsWith("tara-kabataan-webapp/uploads/")) {
            cleanPath = cleanPath.replace("tara-kabataan-webapp/uploads/", "");
        }
        else if (cleanPath.startsWith("tara-kabataan-optimized/tara-kabataan-webapp/uploads/")) {
            cleanPath = cleanPath.replace("tara-kabataan-optimized/tara-kabataan-webapp/uploads/", "");
        }
        let full = `${IMAGE_BASE}/${cleanPath}`;
        if (query)
            full += `?${query}`;
        return full;
    };
    const getFullImageUrlCouncil = (url) => {
        if (!url || url.trim() === "")
            return placeholderImg;
        if (url.startsWith("blob:"))
            return url;
        if (/^https?:\/\//i.test(url) || url.startsWith("//"))
            return url;
        const [path, query] = url.split("?");
        let cleanPath = path.startsWith("/") ? path.substring(1) : path;
        if (cleanPath.startsWith("tara-kabataan-webapp/uploads/")) {
            cleanPath = cleanPath.replace("tara-kabataan-webapp/uploads/", "");
        }
        else if (cleanPath.startsWith("tara-kabataan-optimized/tara-kabataan-webapp/uploads/")) {
            cleanPath = cleanPath.replace("tara-kabataan-optimized/tara-kabataan-webapp/uploads/", "");
        }
        if (!cleanPath.includes("/")) {
            cleanPath = `members-images/${cleanPath}`;
        }
        let full = `${IMAGE_BASE}/${cleanPath}`;
        if (query)
            full += `?${query}`;
        return full;
    };
    const handleSavePartnerUpdate = async () => {
        if (!editablePartner)
            return;
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
            }
            else {
                showNotification("Failed to update partner.");
            }
        }
        catch (error) {
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
                    const imageFileInput = document.getElementById("new-partner-image-upload");
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
            }
            else {
                showNotification("Failed to add new partner.");
            }
        }
        catch (err) {
            console.error("Add partner error:", err);
            showNotification("An error occurred while adding the partner.");
        }
    };
    const handleImageUpload = async (e, mode) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (!validateImageSize(file)) {
            e.target.value = ""; // Reset input
            return;
        }
        const tempPreviewUrl = URL.createObjectURL(file);
        if (mode === "edit") {
            setEditImageUrl(tempPreviewUrl);
        }
        else {
            setNewImageUrl(tempPreviewUrl);
            return;
        }
        const formData = new FormData();
        formData.append("image", file);
        if (editablePartner?.partner_id)
            formData.append("partner_id", editablePartner.partner_id);
        try {
            const res = await fetch(`${API_BASE}/upload_partner_image.php`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success && data.image_url) {
                setEditImageUrl(`${data.image_url}?t=${Date.now()}`);
            }
            else {
                alert("Image upload failed.");
            }
        }
        catch (err) {
            console.error("Upload error:", err);
            alert("An error occurred during upload.");
        }
    };
    const handleImageRemove = (mode) => {
        if (mode === "edit") {
            setEditImageUrl(null);
            const input = document.getElementById("partner-image-upload");
            if (input)
                input.value = "";
        }
        else {
            setNewImageUrl(null);
            const input = document.getElementById("new-partner-image-upload");
            if (input)
                input.value = "";
        }
    };
    const handleSingleDelete = () => {
        setBulkActionType("delete");
        setBulkActionStatus("SINGLE_DELETE");
        setBulkConfirmVisible(true);
    };
    const confirmSingleDelete = async () => {
        if (!selectedPartner)
            return;
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
            }
            else {
                showNotification("Failed to delete partner.");
            }
        }
        catch (error) {
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
            }
            else {
                alert("Failed to delete partners.");
            }
        }
        catch (err) {
            console.error("Bulk delete error:", err);
            alert("Error occurred during bulk delete.");
        }
    };
    const updateAboutUsData = async (updatedData, successMsg, failMsg, callback) => {
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
            }
            else {
                showNotification(failMsg);
            }
        }
        catch (err) {
            console.error("Error updating About Us:", err);
            showNotification(`An error occurred while updating ${failMsg.toLowerCase()}`);
        }
        if (callback)
            callback();
    };
    const handleSaveCoreValues = () => {
        if (!aboutData)
            return;
        updateAboutUsData({ ...aboutData, ...editableCoreValues }, "Core Values updated successfully!", "Failed to update Core Values.", () => setIsEditingCoreValues(false));
    };
    const handleSaveAdvocacies = () => {
        if (!aboutData)
            return;
        updateAboutUsData({ ...aboutData, ...editableAdvocacies }, "Advocacies updated successfully!", "Failed to update Advocacies.", () => setIsEditingAdvocacies(false));
    };
    const handleNewUserSubmit = async (e) => {
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
            }
            else {
                toast.error(data.error || "Failed to create user");
            }
        }
        catch (err) {
            console.error(err);
            toast.error("Server error, please try again.");
        }
    };
    const closeNewUserModal = () => {
        setNewUserForm({ member_id: "", phone: "", email: "" });
        setShowNewUserModal(false);
    };
    const handleAddRole = async () => {
        if (!newRoleName.trim())
            return showNotification("Role name is required.");
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
            }
            else {
                showNotification(data.message || "Failed to add role.");
            }
        }
        catch (err) {
            console.error(err);
            showNotification("Error adding role.");
        }
    };
    const handleEditRole = (role_id, role_name) => {
        setEditingRoleId(role_id);
        setEditingRoleName(role_name);
    };
    const handleCancelEdit = () => {
        setEditingRoleId(null);
        setEditingRoleName("");
    };
    const handleUpdateRole = async () => {
        if (!editingRoleId || !editingRoleName.trim())
            return;
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
            }
            else {
                showNotification(data.message || "Failed to update role.");
            }
        }
        catch (err) {
            console.error(err);
            showNotification("Error updating role.");
        }
        handleCancelEdit();
    };
    const deleteRole = async (role_id) => {
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
            }
            else {
                showNotification(data.message || "Failed to delete role.");
            }
        }
        catch (err) {
            console.error(err);
            showNotification("Error deleting role.");
        }
    };
    return (_jsxs("div", { className: "admin-settings", children: [notification && (_jsx("div", { className: `blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`, children: notification })), _jsxs("div", { className: "admin-settings-header", children: [_jsxs("div", { className: "admin-settings-search-container", children: [_jsx(FaSearch, { className: "admin-settings-search-icon" }), _jsx("input", { type: "text", name: "fakeusernameremembered", style: { display: "none" } }), _jsx("input", { type: "password", name: "fakepasswordremembered", style: { display: "none" } }), _jsx("input", { type: "text", placeholder: "Search", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), autoComplete: "off", name: "search-blog", id: "search-blog" })] }), _jsxs("div", { className: "admin-settings-header-right", children: [_jsxs("button", { className: "admin-settings-create-user", onClick: () => setShowNewUserModal(true), children: [_jsx(FaPlus, { className: "create-user-icon" }), _jsx("span", { children: "Create New User" })] }), showNewUserModal && (_jsx("div", { className: "create-user-modal-backdrop", onClick: closeNewUserModal, children: _jsxs("div", { className: "create-user-modal-content", onClick: (e) => e.stopPropagation(), children: [_jsx("button", { className: "create-user-modal-close", onClick: closeNewUserModal, children: "\u2715" }), _jsx("h2", { children: "New User" }), _jsxs("form", { onSubmit: handleNewUserSubmit, children: [_jsxs("label", { className: "create-user-label", children: ["Name", _jsx("div", { className: "create-user-select-wrapper", children: _jsxs("select", { className: "create-user-select", name: "member_id", value: newUserForm.member_id, required: true, onChange: (e) => setNewUserForm((f) => ({ ...f, member_id: e.target.value })), children: [_jsx("option", { value: "", children: "Select a member\u2026" }), members.map((m) => (_jsx("option", { value: m.member_id, children: m.member_name }, m.member_id)))] }) })] }), _jsxs("label", { className: "create-user-modal-label", children: ["Phone Number", _jsx("input", { type: "text", name: "phone", value: newUserForm.phone, required: true, onChange: (e) => setNewUserForm((f) => ({ ...f, phone: e.target.value })) })] }), _jsxs("label", { className: "create-user-modal-label", children: ["Email", _jsx("input", { type: "email", name: "email", value: newUserForm.email, required: true, onChange: (e) => setNewUserForm((f) => ({ ...f, email: e.target.value })) })] }), _jsxs("div", { className: "create-user-modal-actions", children: [_jsx("button", { type: "button", className: "cancel-btn", onClick: closeNewUserModal, children: "Cancel" }), _jsx("button", { type: "submit", className: "save-btn", children: "Save" })] })] })] }) })), _jsxs("div", { className: "admin-blogs-userinfo", onClick: () => setShowProfileModal(true), style: { cursor: "pointer" }, children: [_jsx("div", { className: "userinfo-label", children: "Logged in as:" }), _jsxs("div", { className: "userinfo-details", children: [_jsx("p", { className: "userinfo-name", children: loggedInUser?.user_name || "Admin" }), _jsx("p", { className: "userinfo-email", children: loggedInUser?.user_email || "" })] })] }), showProfileModal && (_jsx("div", { className: "admin-profile-modal", children: _jsxs("div", { className: "admin-profile-modal-box", children: [_jsx("div", { className: "modal-close-icon", onClick: () => { setShowProfileModal(false); resetProfileModal(); }, children: _jsx(FaTimes, {}) }), _jsx("h2", { children: "Change Password" }), _jsx("label", { children: "Email:" }), _jsx("input", { type: "email", value: profileEmail, disabled: true }), isEditingProfile && (_jsx(_Fragment, { children: _jsxs("div", { style: { position: "relative" }, children: [_jsx("label", { children: "Old Password:" }), _jsx("input", { type: "text", name: "fakeusernameremembered", style: { display: "none" } }), _jsx("input", { type: "password", name: "fakepasswordremembered", style: { display: "none" } }), _jsx("form", { autoComplete: "off", children: _jsx("input", { type: showPassword ? "text" : "password", placeholder: "Enter your current password", autoComplete: "current-password", value: oldPassword, onChange: (e) => setOldPassword(e.target.value), style: { width: "100%" }, required: true }) }), _jsx("label", { children: "New Password:" }), _jsx("input", { type: "text", name: "fakeusernameremembered", style: { display: "none" } }), _jsx("input", { type: "password", name: "fakepasswordremembered", style: { display: "none" } }), _jsx("form", { autoComplete: "off", children: _jsx("input", { type: showPassword ? "text" : "password", placeholder: "Enter a New Password", autoComplete: "new-password", value: profilePassword, readOnly: !isEditingProfile, onChange: (e) => setProfilePassword(e.target.value), style: {
                                                                width: "100%",
                                                                color: !isEditingProfile ? "#999" : "inherit",
                                                                cursor: !isEditingProfile ? "default" : "text",
                                                            } }) })] }) })), _jsx("div", { className: "admin-profile-buttons", children: !isEditingProfile ? (_jsx("button", { onClick: () => setIsEditingProfile(true), children: "Edit" })) : (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => { handleSendOTP(); setOtpRequired(true); }, children: "Send OTP" }), _jsx("button", { onClick: () => { setShowProfileModal(false); resetProfileModal(); }, children: "Cancel" })] })) }), otpSent && (_jsxs("div", { className: "otp-verification", children: [_jsx("label", { children: "Enter 6-digit OTP:" }), _jsx("div", { className: "otp-inputs", children: Array(6).fill("").map((_, index) => (_jsx("input", { ref: (el) => { otpRefs.current[index] = el; }, type: "text", maxLength: 1, className: "otp-box", value: otpInput[index] || "", onChange: (e) => {
                                                            const val = e.target.value.replace(/\D/g, "");
                                                            if (!val)
                                                                return;
                                                            const updated = [...otpInput];
                                                            updated[index] = val[0];
                                                            setOtpInput(updated.join(""));
                                                            if (index < 5 && val)
                                                                otpRefs.current[index + 1]?.focus();
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
                                                        } }, index))) }), _jsx("button", { onClick: handleVerifyOTP, children: "Verify OTP & Save" })] }))] }) }))] })] }), _jsxs("div", { className: "admin-settings-lower-header", children: [_jsxs("div", { className: "admin-settings-lower-header-left", children: [_jsx("h1", { children: "Settings" }), activeTab === 2 && (_jsxs(_Fragment, { children: [viewMode === "table" && (_jsx("div", { className: "admin-events-lower-header-select", children: _jsxs("button", { onClick: () => { setSelectMode(!selectMode); setSelectedPartnerIds([]); }, children: [_jsx("img", { src: select, className: "admin-blogs-lower-header-select-img" }), selectMode ? "Cancel" : "Select"] }) })), _jsxs("div", { className: "admin-settings-toggle-newpartner", children: [_jsxs("button", { className: "add-new-partner-btn", onClick: () => {
                                                    setIsAddingNewPartner(true);
                                                    setNewPartner({ partner_image: "", partner_name: "", partner_dec: "", partner_contact_email: "", partner_phone_number: "" });
                                                    setNewImageUrl(null);
                                                }, children: [_jsx(FaPlus, { className: "admin-icon-left" }), " New Partner"] }), _jsxs("div", { className: "admin-blogs-toggle-wrapper", children: [_jsx("button", { className: `admin-blogs-toggle-button ${viewMode === "table" ? "active" : ""}`, onClick: () => setViewMode("table"), children: "Table View" }), _jsx("button", { className: `admin-blogs-toggle-button ${viewMode === "grid" ? "active" : ""}`, onClick: () => setViewMode("grid"), children: "Grid View" })] })] })] })), activeTab === 1 && (_jsx("button", { className: "add-new-partner-btn", onClick: () => setShowRolesModal(true), children: "See Roles" })), showRolesModal && (_jsx("div", { className: "admin-contact-modal", onClick: () => setShowRolesModal(false), children: _jsxs("div", { className: "admin-contact-modal-content", onClick: (e) => e.stopPropagation(), children: [_jsx("button", { className: "admin-contact-modal-close", onClick: () => setShowRolesModal(false), children: "\u2715" }), _jsx("h1", { children: "All Roles" }), _jsx("ul", { className: "roles-list", children: roles.map((r) => (_jsx("li", { className: "role-item", children: editingRoleId === r.role_id ? (_jsxs(_Fragment, { children: [_jsx("input", { type: "text", value: editingRoleName, onChange: (e) => setEditingRoleName(e.target.value), className: "role-edit-input" }), _jsxs("div", { className: "roles-list-buttons", children: [_jsx("div", { children: _jsx("button", { className: "save-btn", onClick: handleUpdateRole, children: "Save" }) }), _jsx("div", { children: _jsx("button", { className: "cancel-btn", onClick: handleCancelEdit, children: "Cancel" }) })] })] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "role-item-content", children: [_jsx("div", { children: _jsx("span", { className: "role-name", children: r.role_name }) }), _jsxs("div", { className: "role-item-actions", children: [_jsx("div", { children: _jsx(FaEdit, { className: "role-edit-icon", onClick: () => handleEditRole(r.role_id, r.role_name) }) }), _jsxs("div", { children: [_jsx(FaTrash, { className: "role-trash-icon", onClick: () => {
                                                                                    setRoleToDelete(r.role_id);
                                                                                    setConfirmRoleDeleteVisible(true);
                                                                                } }), confirmRoleDeleteVisible && (_jsx("div", { className: "roles-confirmation-popup show", children: _jsxs("div", { className: "blogs-confirmation-box", children: [_jsx("p", { children: "Are you sure you want to delete this role?" }), _jsxs("div", { className: "blogs-confirmation-actions", children: [_jsx("button", { className: "confirm-yes", onClick: () => {
                                                                                                        if (roleToDelete)
                                                                                                            deleteRole(roleToDelete);
                                                                                                        setConfirmRoleDeleteVisible(false);
                                                                                                        setRoleToDelete(null);
                                                                                                    }, children: "Yes" }), _jsx("button", { className: "confirm-no", onClick: () => {
                                                                                                        setConfirmRoleDeleteVisible(false);
                                                                                                        setRoleToDelete(null);
                                                                                                    }, children: "No" })] })] }) }))] })] })] }) })) }, r.role_id))) }), _jsx("hr", { style: { margin: "1.5rem 0", borderColor: "#eee" } }), _jsx("div", { className: "admin-contact-edit-fields", children: _jsxs("label", { children: ["Role Name", _jsx("input", { type: "text", value: newRoleName, onChange: (e) => setNewRoleName(e.target.value) })] }) }), _jsx("div", { className: "admin-contact-edit-actions", style: { marginTop: "0" }, children: _jsxs("button", { className: "save-btn", onClick: handleAddRole, children: [_jsx(FaPlus, { style: { marginRight: 6 } }), " Add Role"] }) })] }) }))] }), _jsx("div", { className: "admin-settings-lower-header-right", children: _jsx("div", { className: "admin-settings-tabs-wrapper", children: _jsx("div", { className: "admin-settings-tabs", children: TABS.map((tab, index) => (_jsx("button", { className: `admin-settings-tab ${activeTab === index ? "active" : ""}`, onClick: () => setActiveTab(index), children: tab }, index))) }) }) })] }), selectMode && (_jsx("div", { className: "admin-events-bulk-actions", children: _jsx("button", { className: "bulk-delete-btn", onClick: () => {
                        setBulkActionType("delete");
                        setBulkConfirmVisible(true);
                    }, children: "DELETE" }) })), _jsxs("div", { className: "admin-settings-main-content", children: [activeTab === 0 && (_jsxs("div", { className: "admin-settings-tab-placeholder", children: [_jsxs("div", { className: "admin-settings-aboutus", children: [_jsxs("div", { className: "admin-settings-aboutus-contact-info", children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [_jsxs("div", { className: "admin-settings-aboutus-contact-info-left", children: [_jsx("h1", { className: "admin-settings-aboutus-contact-info-left-h1", children: "Contact Information" }), _jsxs("div", { className: "admin-settings-aboutus-contact-info-phone", children: [_jsx("div", { className: "admin-settings-aboutus-contact-info-phone-icon", children: _jsx(FaPhone, {}) }), _jsxs("div", { className: "admin-settings-aboutus-contact-info-phone-desc", children: [_jsx("h1", { children: "Phone" }), _jsx("p", { children: aboutData?.contact_no || "N/A" })] })] }), _jsxs("div", { className: "admin-settings-aboutus-contact-info-email", children: [_jsx("div", { className: "admin-settings-aboutus-contact-info-email-icon", children: _jsx(FaEnvelope, {}) }), _jsxs("div", { className: "admin-settings-aboutus-contact-info-email-desc", children: [_jsx("h1", { children: "Email" }), _jsx("p", { children: aboutData?.about_email || "N/A" })] })] }), _jsxs("div", { className: "admin-settings-aboutus-contact-info-address", children: [_jsx("div", { className: "admin-settings-aboutus-contact-info-address-icon", children: _jsx(FaMapMarkerAlt, {}) }), _jsxs("div", { className: "admin-settings-aboutus-contact-info-address-desc", children: [_jsx("h1", { children: "Address" }), _jsx("p", { children: aboutData?.address || "N/A" })] })] })] }), _jsx("div", { style: { marginLeft: "2rem" }, children: _jsx(FaEdit, { className: "aboutus-edit-icon", onClick: () => {
                                                                setEditableContact({ ...aboutData });
                                                                setIsEditingContact(true);
                                                            }, style: { cursor: "pointer" } }) })] }), _jsxs("div", { className: "admin-settings-aboutus-contact-info-right", children: [_jsxs("div", { className: "admin-settings-aboutus-contact-info-facebook", children: [_jsx("div", { className: "admin-settings-aboutus-contact-info-facebook-icon", children: _jsx(FaFacebookF, {}) }), _jsxs("div", { className: "admin-settings-aboutus-contact-info-facebook-desc", children: [_jsx("h1", { children: "Facebook" }), _jsx("p", { children: aboutData?.facebook || "N/A" })] })] }), _jsxs("div", { className: "admin-settings-aboutus-contact-info-instagram", children: [_jsx("div", { className: "admin-settings-aboutus-contact-info-instagram-icon", children: _jsx(FaInstagram, {}) }), _jsxs("div", { className: "admin-settings-aboutus-contact-info-instagram-desc", children: [_jsx("h1", { children: "Instagram" }), _jsx("p", { children: aboutData?.instagram || "N/A" })] })] })] })] }), _jsxs("div", { className: "admin-settings-aboutus-page-contents", children: [_jsxs("div", { className: "admin-settings-aboutus-page-contents-left", children: [_jsx("h1", { className: "admin-settings-aboutus-page-contents-left-h1", children: "Page Contents" }), _jsxs("div", { className: "admin-settings-aboutus-core-val", children: [_jsxs("div", { className: "admin-settings-aboutus-core-val-left", children: [_jsx("h1", { children: "Core Values" }), _jsx("p", { children: "Kapwa, Kalinagan, Kaginhawaan" })] }), _jsx("div", { className: "admin-settings-aboutus-core-val-right", children: _jsx(FaEdit, { className: "aboutus-page-contents-edit-icon", onClick: () => {
                                                                        setEditableCoreValues({
                                                                            core_kapwa: aboutData?.core_kapwa || "",
                                                                            core_kalinangan: aboutData?.core_kalinangan || "",
                                                                            core_kaginhawaan: aboutData?.core_kaginhawaan || "",
                                                                        });
                                                                        setIsEditingCoreValues(true);
                                                                    } }) })] }), _jsxs("div", { className: "admin-settings-aboutus-mission", children: [_jsxs("div", { className: "admin-settings-aboutus-mission-left", children: [_jsx("h1", { children: "Mission" }), _jsx("p", { children: aboutData?.mission
                                                                            ? aboutData.mission.length > 50 ? aboutData.mission.slice(0, 50) + "..." : aboutData.mission
                                                                            : "No mission found." })] }), _jsx("div", { className: "admin-settings-aboutus-mission-right", children: _jsx(FaEdit, { className: "aboutus-page-contents-edit-icon", onClick: () => {
                                                                        setPageContentField("mission");
                                                                        setEditablePageContent(aboutData?.mission || "");
                                                                        setIsEditingPageContent(true);
                                                                    } }) })] }), _jsxs("div", { className: "admin-settings-aboutus-vision", children: [_jsxs("div", { className: "admin-settings-aboutus-vision-left", children: [_jsx("h1", { children: "Vision" }), _jsx("p", { children: aboutData?.vision
                                                                            ? aboutData.vision.length > 50 ? aboutData.vision.slice(0, 50) + "..." : aboutData.vision
                                                                            : "No vision found." })] }), _jsx("div", { className: "admin-settings-aboutus-vision-right", children: _jsx(FaEdit, { className: "aboutus-page-contents-edit-icon", onClick: () => {
                                                                        setPageContentField("vision");
                                                                        setEditablePageContent(aboutData?.vision || "");
                                                                        setIsEditingPageContent(true);
                                                                    } }) })] })] }), _jsxs("div", { className: "admin-settings-aboutus-page-contents-right", children: [_jsxs("div", { className: "admin-settings-aboutus-background-text", children: [_jsxs("div", { className: "admin-settings-aboutus-background-text-left", children: [_jsx("h1", { children: "Background" }), _jsx("p", { children: aboutData?.background
                                                                            ? aboutData.background.length > 50 ? aboutData.background.slice(0, 50) + "..." : aboutData.background
                                                                            : "No background found." })] }), _jsx("div", { className: "admin-settings-aboutus-background-text-right", children: _jsx(FaEdit, { className: "aboutus-page-contents-edit-icon", onClick: () => {
                                                                        setPageContentField("background");
                                                                        setEditablePageContent(aboutData?.background || "");
                                                                        setIsEditingPageContent(true);
                                                                    } }) })] }), _jsxs("div", { className: "admin-settings-aboutus-council-text", children: [_jsxs("div", { className: "admin-settings-aboutus-council-text-left", children: [_jsx("h1", { children: "Council" }), _jsx("p", { children: aboutData?.council
                                                                            ? aboutData.council.length > 50 ? aboutData.council.slice(0, 50) + "..." : aboutData.council
                                                                            : "No council found." })] }), _jsx("div", { className: "admin-settings-aboutus-council-text-right", children: _jsx(FaEdit, { className: "aboutus-page-contents-edit-icon", onClick: () => {
                                                                        setPageContentField("council");
                                                                        setEditablePageContent(aboutData?.council || "");
                                                                        setIsEditingPageContent(true);
                                                                    } }) })] }), _jsxs("div", { className: "admin-settings-aboutus-advocacies", children: [_jsxs("div", { className: "admin-settings-aboutus-advocacies-left", children: [_jsx("h1", { children: "Advocacies" }), _jsx("p", { children: "Kalusugan, Kalikasan, Karunungan, Kultura, Kasarian" })] }), _jsx("div", { className: "admin-settings-aboutus-advocacies-right", children: _jsx(FaEdit, { className: "aboutus-page-contents-edit-icon", onClick: () => {
                                                                        setEditableAdvocacies({
                                                                            adv_kalusugan: aboutData?.adv_kalusugan || "",
                                                                            adv_kalikasan: aboutData?.adv_kalikasan || "",
                                                                            adv_karunungan: aboutData?.adv_karunungan || "",
                                                                            adv_kultura: aboutData?.adv_kultura || "",
                                                                            adv_kasarian: aboutData?.adv_kasarian || "",
                                                                        });
                                                                        setIsEditingAdvocacies(true);
                                                                    } }) })] })] })] })] }), isEditingPageContent && pageContentField && (_jsx("div", { className: "admin-contact-modal", children: _jsxs("div", { className: "admin-contact-modal-content", children: [_jsx("button", { className: "admin-contact-modal-close", onClick: () => { setIsEditingPageContent(false); setPageContentField(null); }, children: "\u2715" }), _jsxs("h1", { children: ["Edit ", pageContentField.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase())] }), _jsx("textarea", { className: "admin-pagecontent-text", value: editablePageContent, onChange: (e) => setEditablePageContent(e.target.value) }), _jsxs("div", { className: "admin-contact-edit-actions", children: [_jsx("button", { className: "save-btn", onClick: () => {
                                                        if (!aboutData || !pageContentField)
                                                            return;
                                                        updateAboutUsData({ ...aboutData, [pageContentField]: editablePageContent }, "Page content updated successfully!", "Failed to update page content.", () => { setIsEditingPageContent(false); setPageContentField(null); });
                                                    }, children: "Save" }), _jsx("button", { className: "cancel-btn", onClick: () => { setIsEditingPageContent(false); setPageContentField(null); }, children: "Cancel" })] })] }) })), isEditingCoreValues && (_jsx("div", { className: "admin-contact-modal", children: _jsxs("div", { className: "admin-contact-modal-content", children: [_jsx("button", { className: "admin-contact-modal-close", onClick: () => setIsEditingCoreValues(false), children: "\u2715" }), _jsx("h1", { children: "Edit Core Values" }), _jsxs("div", { className: "admin-contact-edit-fields", children: [_jsx("label", { children: "Select Core Value" }), _jsxs("select", { className: "admin-contact-edit-select", value: selectedCoreValue, onChange: (e) => setSelectedCoreValue(e.target.value), children: [_jsx("option", { value: "core_kapwa", children: "Kapwa" }), _jsx("option", { value: "core_kalinangan", children: "Kalinangan" }), _jsx("option", { value: "core_kaginhawaan", children: "Kaginhawaan" })] }), _jsx("label", { className: "label-page-content", children: "Edit Text" }), _jsx("textarea", { value: editableCoreValues[selectedCoreValue], onChange: (e) => setEditableCoreValues((prev) => ({ ...prev, [selectedCoreValue]: e.target.value })), className: "admin-corevalue-textarea" })] }), _jsxs("div", { className: "admin-contact-edit-actions", children: [_jsx("button", { className: "save-btn", onClick: handleSaveCoreValues, children: "Save" }), _jsx("button", { className: "cancel-btn", onClick: () => setIsEditingCoreValues(false), children: "Cancel" })] })] }) })), isEditingAdvocacies && (_jsx("div", { className: "admin-contact-modal", children: _jsxs("div", { className: "admin-contact-modal-content", children: [_jsx("button", { className: "admin-contact-modal-close", onClick: () => setIsEditingAdvocacies(false), children: "\u2715" }), _jsx("h1", { children: "Edit Advocacies" }), _jsxs("div", { className: "admin-contact-edit-fields", children: [_jsx("label", { children: "Select Advocacy" }), _jsxs("select", { className: "admin-contact-edit-select", value: selectedAdvocacy, onChange: (e) => setSelectedAdvocacy(e.target.value), children: [_jsx("option", { value: "adv_kalusugan", children: "Kalusugan" }), _jsx("option", { value: "adv_kalikasan", children: "Kalikasan" }), _jsx("option", { value: "adv_karunungan", children: "Karunungan" }), _jsx("option", { value: "adv_kultura", children: "Kultura" }), _jsx("option", { value: "adv_kasarian", children: "Kasarian" })] }), _jsx("label", { className: "label-page-content", children: "Edit Text" }), _jsx("textarea", { value: editableAdvocacies[selectedAdvocacy], onChange: (e) => setEditableAdvocacies((prev) => ({ ...prev, [selectedAdvocacy]: e.target.value })), className: "admin-corevalue-textarea" })] }), _jsxs("div", { className: "admin-contact-edit-actions", children: [_jsx("button", { className: "save-btn", onClick: handleSaveAdvocacies, children: "Save" }), _jsx("button", { className: "cancel-btn", onClick: () => setIsEditingAdvocacies(false), children: "Cancel" })] })] }) })), isEditingContact && editableContact && (_jsx("div", { className: "admin-contact-modal", children: _jsxs("div", { className: "admin-contact-modal-content", children: [_jsx("button", { className: "admin-contact-modal-close", onClick: () => { setIsEditingContact(false); setEditableContact(null); }, children: "\u2715" }), _jsx("h1", { children: "Edit Contact Information" }), _jsxs("div", { className: "admin-contact-edit-fields", children: [_jsx("label", { children: "Phone Number" }), _jsx("input", { type: "text", value: editableContact.contact_no || "", maxLength: 11, className: phoneInvalid ? "error-input" : "", onChange: (e) => {
                                                        const newValue = e.target.value.replace(/\D/g, "");
                                                        if (newValue.length <= 11) {
                                                            setEditableContact((prev) => prev ? { ...prev, contact_no: newValue } : prev);
                                                        }
                                                        setPhoneInvalid(false);
                                                    } }), phoneError && _jsx("p", { className: "error-message", children: phoneError }), _jsx("label", { children: "Email" }), _jsx("input", { type: "text", value: editableContact.about_email || "", className: emailInvalid ? "error-input" : "", onChange: (e) => {
                                                        setEditableContact((prev) => prev ? { ...prev, about_email: e.target.value } : prev);
                                                        setEmailInvalid(false);
                                                    } }), emailError && _jsx("p", { className: "error-message", children: emailError }), _jsx("label", { children: "Address" }), _jsx("input", { type: "text", value: editableContact.address || "", onChange: (e) => setEditableContact((prev) => prev ? { ...prev, address: e.target.value } : prev) }), _jsx("label", { children: "Facebook" }), _jsx("input", { type: "text", value: editableContact.facebook || "", onChange: (e) => setEditableContact((prev) => prev ? { ...prev, facebook: e.target.value } : prev) }), _jsx("label", { children: "Instagram" }), _jsx("input", { type: "text", value: editableContact.instagram || "", onChange: (e) => setEditableContact((prev) => prev ? { ...prev, instagram: e.target.value } : prev) })] }), _jsxs("div", { className: "admin-contact-edit-actions", children: [_jsx("button", { className: "save-btn", onClick: () => {
                                                        if (!editableContact)
                                                            return;
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
                                                        if (hasError)
                                                            return;
                                                        updateAboutUsData(editableContact, "Contact Information updated successfully!", "Failed to update Contact Information.", () => { setIsEditingContact(false); setEditableContact(null); });
                                                    }, children: "Save" }), _jsx("button", { className: "cancel-btn", onClick: () => { setIsEditingContact(false); setEditableContact(null); }, children: "Cancel" })] })] }) }))] })), activeTab === 1 && (_jsx("div", { className: "admin-settings-tab-placeholder", children: _jsxs("div", { className: "admin-settings-members", children: [_jsxs("div", { className: "admin-settings-members-cards", children: [filteredMembers.map((member) => (_jsxs("div", { className: "admin-settings-members-cards-content", children: [_jsx("div", { className: "admin-settings-members-cards-content-photo", children: _jsx("img", { src: getFullImageUrlCouncil(member.member_image), alt: "member", className: "admin-settings-members-cards-content-inner-photo", onError: (e) => {
                                                            const target = e.target;
                                                            target.onerror = null;
                                                            target.src = placeholderImg;
                                                        } }) }), _jsx("div", { className: "admin-settings-members-cards-content-bg", children: _jsxs("div", { className: "admin-settings-members-cards-inner-content", children: [_jsxs("div", { className: "admin-settings-members-cards-inner-desc", children: [_jsx("div", { className: "admin-settings-members-cards-inner-content-name", children: member.member_name }), _jsx("div", { className: "admin-settings-members-cards-inner-content-position", children: member.role_name })] }), _jsx(FaEdit, { className: "admin-settings-member-edit-icon", title: "Edit", onClick: () => {
                                                                    setSelectedMember(member);
                                                                    setEditableMember({ ...member });
                                                                    setMemberImageUrl(member.member_image);
                                                                    setIsEditingMember(true);
                                                                } })] }) })] }, member.member_id))), _jsxs("div", { className: "admin-settings-members-cards-content admin-settings-add-member-card", onClick: () => {
                                                setIsAddingNewMember(true);
                                                setNewMember({ member_name: "", member_image: "", role_id: "" });
                                                setMemberImageUrl(null);
                                            }, children: [_jsx("div", { className: "admin-settings-members-cards-content-photo add-member-photo", children: _jsx("span", { className: "add-member-plus", children: "+" }) }), _jsx("div", { className: "admin-settings-members-cards-content-bg", children: _jsx("div", { className: "admin-settings-members-cards-inner-content", children: _jsxs("div", { className: "admin-settings-members-cards-inner-desc", children: [_jsx("div", { className: "admin-settings-members-cards-inner-content-name", children: "Add Member" }), _jsx("div", { className: "admin-settings-members-cards-inner-content-position", children: "Click to add" })] }) }) })] })] }), isEditingMember && selectedMember && (_jsxs("div", { className: "admin-member-modal", children: [notification && (_jsx("div", { className: `blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`, children: notification })), _jsxs("div", { className: "admin-member-modal-content", children: [_jsx("button", { className: "admin-member-modal-close", onClick: () => {
                                                        setIsEditingMember(false);
                                                        setSelectedMember(null);
                                                        setEditableMember(null);
                                                        setMemberImageUrl(null);
                                                    }, children: "\u2715" }), _jsx("h1", { children: "Edit Member" }), _jsxs("div", { className: "admin-member-edit-section", children: [_jsxs("div", { className: "admin-member-edit-image-wrapper", children: [memberImageUrl ? (_jsx("img", { src: getFullImageUrlCouncil(memberImageUrl), onClick: () => setFullscreenImageUrl(getFullImageUrlCouncil(memberImageUrl)), style: { cursor: "zoom-in" }, alt: "Preview", className: "admin-member-edit-photo" })) : (_jsx("div", { className: "admin-member-no-image", children: "No Image" })), _jsx("input", { type: "file", accept: "image/*", id: "member-image-upload", style: { display: "none" }, onChange: handleMemberImageUpload }), _jsxs("div", { className: "admin-member-image-buttons", children: [_jsx("button", { onClick: () => document.getElementById("member-image-upload")?.click(), children: "Upload" }), _jsx("button", { onClick: handleMemberImageRemove, children: "Remove" })] })] }), _jsxs("div", { className: "admin-member-edit-fields", children: [_jsx("label", { children: "Name" }), _jsx("input", { type: "text", value: editableMember?.member_name || "", onChange: (e) => setEditableMember((prev) => prev ? { ...prev, member_name: e.target.value } : prev) }), _jsx("label", { children: "Role" }), _jsxs("select", { value: editableMember?.role_id || "", onChange: (e) => setEditableMember((prev) => prev ? { ...prev, role_id: e.target.value } : prev), children: [_jsx("option", { value: "", disabled: true, children: "Select a role" }), roles.map((role) => (_jsx("option", { value: role.role_id, children: role.role_name }, role.role_id)))] })] })] }), _jsxs("div", { className: "admin-member-edit-actions", children: [_jsx("button", { className: "delete-member-btn", onClick: () => setConfirmMemberDeleteVisible(true), children: "Delete" }), _jsx("button", { className: "save-btn", onClick: async () => {
                                                                if (!editableMember)
                                                                    return;
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
                                                                    }
                                                                    else {
                                                                        showNotification("Failed to update member: " + result.message);
                                                                    }
                                                                }
                                                                catch (error) {
                                                                    console.error("Update error:", error);
                                                                    alert("Error occurred while updating member.");
                                                                }
                                                            }, children: "Save" }), _jsx("button", { className: "cancel-btn", onClick: () => setIsEditingMember(false), children: "Cancel" })] })] })] })), confirmMemberDeleteVisible && (_jsx("div", { className: "blogs-confirmation-popup show", children: _jsxs("div", { className: "blogs-confirmation-box", children: [_jsx("p", { children: "Are you sure you want to delete this member and all their images?" }), _jsxs("div", { className: "blogs-confirmation-actions", children: [_jsx("button", { className: "confirm-yes", onClick: () => { setConfirmMemberDeleteVisible(false); handleDeleteMember(); }, children: "Yes" }), _jsx("button", { className: "confirm-no", onClick: () => setConfirmMemberDeleteVisible(false), children: "No" })] })] }) })), isAddingNewMember && (_jsxs("div", { className: "admin-member-modal", children: [notification && (_jsx("div", { className: `blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`, children: notification })), _jsxs("div", { className: "admin-member-modal-content", children: [_jsx("button", { className: "admin-member-modal-close", onClick: () => {
                                                        setIsAddingNewMember(false);
                                                        setNewMember({ member_name: "", member_image: "", role_id: "" });
                                                        setMemberImageUrl(null);
                                                        setNotification("");
                                                    }, children: "\u2715" }), _jsx("h1", { children: "New Member" }), _jsxs("div", { className: "admin-member-edit-section", children: [_jsxs("div", { className: "admin-member-edit-image-wrapper", children: [memberImageUrl ? (_jsx("img", { src: memberImageUrl?.startsWith("blob:") ? memberImageUrl : getFullImageUrlCouncil(memberImageUrl), alt: "Preview", className: "admin-member-edit-photo" })) : (_jsx("div", { className: "admin-member-no-image", children: "No Image" })), _jsx("input", { type: "file", accept: "image/*", id: "new-member-image-upload", style: { display: "none" }, onChange: (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            if (!validateImageSize(file)) {
                                                                                e.target.value = "";
                                                                                return;
                                                                            }
                                                                            setMemberImageUrl(URL.createObjectURL(file));
                                                                        }
                                                                    } }), _jsxs("div", { className: "admin-member-image-buttons", children: [_jsx("button", { onClick: () => document.getElementById("new-member-image-upload")?.click(), children: "Upload" }), _jsx("button", { onClick: handleMemberImageRemove, children: "Remove" })] })] }), _jsxs("div", { className: "admin-member-edit-fields", children: [_jsx("label", { children: "Name" }), _jsx("input", { type: "text", value: newMember.member_name, onChange: (e) => setNewMember((prev) => ({ ...prev, member_name: e.target.value })) }), _jsx("label", { children: "Role" }), _jsxs("select", { value: newMember.role_id, onChange: (e) => setNewMember((prev) => ({ ...prev, role_id: e.target.value })), children: [_jsx("option", { value: "", disabled: true, children: "Select a role" }), roles.map((role) => (_jsx("option", { value: role.role_id, children: role.role_name }, role.role_id)))] })] })] }), _jsxs("div", { className: "admin-member-edit-actions", children: [_jsx("button", { className: "save-btn", onClick: handleAddNewMemberSave, children: "Save" }), _jsx("button", { className: "cancel-btn", onClick: () => {
                                                                setIsAddingNewMember(false);
                                                                setNewMember({ member_name: "", member_image: "", role_id: "" });
                                                                setNotification("");
                                                            }, children: "Cancel" })] })] })] }))] }) })), activeTab === 2 && (_jsxs("div", { className: "admin-settings-partner-container", children: [viewMode === "table" ? (_jsx("div", { children: _jsxs("table", { className: "admin-settings-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "Name" }), _jsx("th", { children: "Description" }), _jsx("th", { children: "Email" }), _jsx("th", { children: "Contact No." }), _jsx("th", { children: selectMode ? "Select" : "View" })] }) }), _jsxs("colgroup", { children: [_jsx("col", { style: { width: "100px" } }), _jsx("col", { style: { width: "100px" } }), _jsx("col", { style: { width: "150px" } }), _jsx("col", { style: { width: "120px" } }), _jsx("col", { style: { width: "100px" } }), _jsx("col", { style: { width: "50px" } })] }), _jsx("tbody", { children: paginatedPartners.length > 0 ? (paginatedPartners.map((partner) => (_jsxs("tr", { className: "admin-settings-table-content", style: { cursor: selectMode ? "default" : "pointer" }, onClick: () => {
                                                    if (!selectMode) {
                                                        setSelectedPartner(partner);
                                                        setNotification("");
                                                        setConfirmDeleteVisible(false);
                                                        setIsEditingPartner(false);
                                                        setEditablePartner(null);
                                                        setEditImageUrl(null);
                                                    }
                                                }, children: [_jsx("td", { children: partner.partner_id }), _jsx("td", { children: partner.partner_name }), _jsx("td", { children: partner.partner_dec }), _jsx("td", { children: partner.partner_contact_email }), _jsx("td", { children: partner.partner_phone_number }), _jsx("td", { className: "admin-settings-view-content", children: selectMode ? (_jsx("input", { type: "checkbox", checked: selectedPartnerIds.includes(partner.partner_id), onChange: (e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedPartnerIds((prev) => [...prev, partner.partner_id]);
                                                                }
                                                                else {
                                                                    setSelectedPartnerIds((prev) => prev.filter((id) => id !== partner.partner_id));
                                                                }
                                                            }, onClick: (e) => e.stopPropagation() })) : (_jsx("button", { onClick: (e) => {
                                                                e.stopPropagation();
                                                                setSelectedPartner(partner);
                                                                setNotification("");
                                                                setConfirmDeleteVisible(false);
                                                            }, children: _jsx(BsThreeDots, {}) })) })] }, partner.partner_id)))) : (_jsx("tr", { children: _jsx("td", { colSpan: 6, children: "No Partner Data Available" }) })) })] }) })) : (_jsx("div", { className: "admin-settings-grid-view", children: filteredPartners.map((partner) => (_jsxs("div", { className: "admin-settings-grid-card", style: { cursor: selectMode ? "default" : "pointer" }, onClick: () => {
                                        if (!selectMode) {
                                            setSelectedPartner(partner);
                                            setNotification("");
                                            setConfirmDeleteVisible(false);
                                            setIsEditingPartner(false);
                                            setEditablePartner(null);
                                            setEditImageUrl(null);
                                        }
                                    }, children: [selectMode && (_jsx("div", { className: "grid-select-checkbox", children: _jsx("input", { type: "checkbox", checked: selectedPartnerIds.includes(partner.partner_id), onChange: (e) => {
                                                    if (e.target.checked) {
                                                        setSelectedPartnerIds((prev) => [...prev, partner.partner_id]);
                                                    }
                                                    else {
                                                        setSelectedPartnerIds((prev) => prev.filter((id) => id !== partner.partner_id));
                                                    }
                                                }, onClick: (e) => e.stopPropagation() }) })), _jsx("div", { className: "settings-grid-container", children: _jsx("img", { src: getFullImageUrl(partner.partner_image), alt: "partner", className: "settings-grid-img" }) }), _jsxs("div", { className: "admin-settings-grid-card-info", children: [_jsx("p", { className: "settings-overlay-title", children: partner.partner_name }), _jsx("p", { className: "settings-overlay-contact", children: partner.partner_contact_email }), _jsx("p", { className: "settings-overlay-phone", children: partner.partner_phone_number })] })] }, partner.partner_id))) })), selectedPartner && (_jsx("div", { className: "admin-partners-modal-layer", children: _jsxs("div", { className: "admin-partners-modal", children: [selectedPartner && notification && (_jsx("div", { className: `blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`, children: notification })), _jsxs("div", { className: "admin-partners-modal-content", children: [_jsx("div", { className: "admin-partners-float-buttons", children: isEditingPartner ? (_jsxs(_Fragment, { children: [_jsx("button", { className: "save-btn", onClick: handleSavePartnerUpdate, children: "Save" }), _jsx("button", { className: "cancel-btn", onClick: () => setIsEditingPartner(false), children: "Cancel" })] })) : (_jsxs(_Fragment, { children: [_jsx("button", { className: "edit-btn", onClick: () => {
                                                                    setIsEditingPartner(true);
                                                                    setEditablePartner({ ...selectedPartner });
                                                                    setEditImageUrl(selectedPartner?.partner_image || null);
                                                                }, children: "Edit" }), _jsx("button", { className: "delete-btn", onClick: handleSingleDelete, children: "Delete" })] })) }), _jsx("button", { className: "admin-partners-modal-close", onClick: () => {
                                                        setSelectedPartner(null);
                                                        setIsEditingPartner(false);
                                                        setEditImageUrl(null);
                                                        setEditablePartner(null);
                                                        setNotification("");
                                                        setConfirmDeleteVisible(false);
                                                    }, children: "\u2715" }), _jsxs("div", { className: "admin-partners-inner-modal", children: [_jsxs("div", { className: "admin-partners-inner-modal-left", children: [_jsx("h2", { children: "Partner Details" }), _jsxs("div", { className: "admin-partners-inner-modal-id", children: [_jsx("p", { children: _jsx("strong", { children: "ID" }) }), _jsx("p", { className: "admin-partners-inner-modal-id-content", children: selectedPartner.partner_id })] }), _jsxs("div", { className: "admin-partners-inner-modal-name", children: [_jsx("p", { children: _jsx("strong", { children: "Name" }) }), isEditingPartner ? (_jsx("input", { className: "admin-partners-inner-modal-name-content", value: editablePartner?.partner_name || "", onChange: (e) => setEditablePartner((prev) => prev && { ...prev, partner_name: e.target.value }) })) : (_jsx("p", { className: "admin-partners-inner-modal-name-content", children: selectedPartner.partner_name }))] }), _jsxs("div", { className: "admin-partners-inner-modal-image", children: [_jsx("p", { children: _jsx("strong", { children: "Image" }) }), _jsxs("div", { className: "admin-partners-image-wrapper", children: [_jsx("div", { className: "admin-partners-image-preview", children: isEditingPartner ? (editImageUrl ? (_jsx("img", { src: getFullImageUrl(editImageUrl), alt: "Partner" })) : (_jsx("div", { className: "admin-partners-no-image", children: "No Partner Image" }))) : selectedPartner?.partner_image ? (_jsx("img", { src: getFullImageUrl(selectedPartner.partner_image), alt: "Partner", onClick: () => setFullscreenImageUrl(getFullImageUrl(selectedPartner.partner_image)), style: { cursor: "zoom-in" } })) : (_jsx("div", { className: "admin-partners-no-image", children: "No Partner Image" })) }), _jsxs("div", { className: "admin-partners-image-buttons", children: [_jsx("input", { type: "file", accept: "image/*", style: { display: "none" }, id: "partner-image-upload", onChange: (e) => handleImageUpload(e, "edit") }), _jsx("button", { className: "partners-upload-btn", disabled: !isEditingPartner, onClick: () => document.getElementById("partner-image-upload")?.click(), children: "Upload" }), _jsx("button", { className: "partners-remove-btn", disabled: !isEditingPartner, onClick: () => handleImageRemove("edit"), children: "Remove" })] })] })] })] }), _jsxs("div", { className: "admin-partners-inner-modal-right", children: [_jsxs("div", { className: "admin-partners-inner-modal-email", children: [_jsx("p", { children: _jsx("strong", { children: "Email" }) }), isEditingPartner ? (_jsx("input", { className: "admin-partners-inner-modal-email-content", value: editablePartner?.partner_contact_email || "", onChange: (e) => setEditablePartner((prev) => prev && { ...prev, partner_contact_email: e.target.value }) })) : (_jsx("p", { className: "admin-partners-inner-modal-email-content", children: selectedPartner.partner_contact_email }))] }), _jsxs("div", { className: "admin-partners-inner-modal-contact", children: [_jsx("p", { children: _jsx("strong", { children: "Contact" }) }), isEditingPartner ? (_jsx("input", { className: "admin-partners-inner-modal-contact-content", value: editablePartner?.partner_phone_number || "", onChange: (e) => setEditablePartner((prev) => prev && { ...prev, partner_phone_number: e.target.value }) })) : (_jsx("p", { className: "admin-partners-inner-modal-contact-content", children: selectedPartner.partner_phone_number }))] }), _jsxs("div", { className: "admin-partners-inner-modal-desc", children: [_jsx("p", { children: _jsx("strong", { children: "Description" }) }), isEditingPartner ? (_jsx("textarea", { className: "admin-partners-inner-modal-desc-content", value: editablePartner?.partner_dec || "", onChange: (e) => setEditablePartner((prev) => prev && { ...prev, partner_dec: e.target.value }) })) : (_jsx("p", { className: "admin-partners-inner-modal-desc-content", children: selectedPartner.partner_dec }))] })] })] })] })] }) })), isAddingNewPartner && (_jsxs("div", { className: "admin-partners-modal", children: [isAddingNewPartner && notification && (_jsx("div", { className: `blogs-notification-message ${notification.includes("successfully") ? "success" : "error"} show`, children: notification })), _jsxs("div", { className: "admin-partners-modal-content", children: [_jsxs("div", { className: "admin-partners-float-buttons", children: [_jsx("button", { className: "save-btn", onClick: handleAddNewPartnerSave, children: "Save" }), _jsx("button", { className: "cancel-btn", onClick: () => { setIsAddingNewPartner(false); setNotification(""); }, children: "Cancel" })] }), _jsx("button", { className: "admin-partners-modal-close", onClick: () => { setIsAddingNewPartner(false); setNotification(""); }, children: "\u2715" }), _jsxs("div", { className: "admin-partners-inner-modal", children: [_jsxs("div", { className: "admin-partners-inner-modal-left", children: [_jsx("h2", { children: "New Partner" }), _jsxs("div", { className: "admin-partners-inner-modal-name", children: [_jsx("p", { children: _jsx("strong", { children: "Name" }) }), _jsx("input", { className: "admin-partners-inner-modal-name-content", value: newPartner.partner_name, onChange: (e) => setNewPartner({ ...newPartner, partner_name: e.target.value }) })] }), _jsxs("div", { className: "admin-partners-inner-modal-image", children: [_jsx("p", { children: _jsx("strong", { children: "Image" }) }), _jsxs("div", { className: "admin-partners-image-wrapper", children: [_jsx("div", { className: "admin-partners-image-preview", children: newImageUrl ? (_jsx("img", { src: newImageUrl, alt: "Partner" })) : (_jsx("div", { className: "admin-partners-no-image", children: "No Partner Image" })) }), _jsxs("div", { className: "admin-partners-image-buttons", children: [_jsx("input", { type: "file", accept: "image/*", style: { display: "none" }, id: "new-partner-image-upload", onChange: (e) => handleImageUpload(e, "new") }), _jsx("button", { className: "partners-upload-btn", onClick: () => document.getElementById("new-partner-image-upload")?.click(), children: "Upload" }), _jsx("button", { className: "partners-remove-btn", onClick: () => handleImageRemove("new"), children: "Remove" })] })] })] })] }), _jsxs("div", { className: "admin-partners-inner-modal-right", children: [_jsxs("div", { className: "admin-partners-inner-modal-email", children: [_jsx("p", { children: _jsx("strong", { children: "Email" }) }), _jsx("input", { className: "admin-partners-inner-modal-email-content", value: newPartner.partner_contact_email, onChange: (e) => setNewPartner({ ...newPartner, partner_contact_email: e.target.value }) })] }), _jsxs("div", { className: "admin-partners-inner-modal-contact", children: [_jsx("p", { children: _jsx("strong", { children: "Contact" }) }), _jsx("input", { className: "admin-partners-inner-modal-contact-content", value: newPartner.partner_phone_number, onChange: (e) => setNewPartner({ ...newPartner, partner_phone_number: e.target.value }) })] }), _jsxs("div", { className: "admin-partners-inner-modal-desc", children: [_jsx("p", { children: _jsx("strong", { children: "Description" }) }), _jsx("textarea", { className: "admin-partners-inner-modal-desc-content", value: newPartner.partner_dec, onChange: (e) => setNewPartner({ ...newPartner, partner_dec: e.target.value }) })] })] })] })] })] })), bulkConfirmVisible && (_jsx("div", { className: "blogs-confirmation-popup show", children: _jsxs("div", { className: "blogs-confirmation-box", children: [_jsx("p", { children: bulkActionType === "delete" && bulkActionStatus === "SINGLE_DELETE"
                                                ? "Are you sure you want to delete this partner and all its images?"
                                                : "Are you sure you want to delete the selected partners?" }), _jsxs("div", { className: "blogs-confirmation-actions", children: [_jsx("button", { className: "confirm-yes", onClick: () => {
                                                        if (bulkActionType === "delete") {
                                                            if (bulkActionStatus === "SINGLE_DELETE")
                                                                confirmSingleDelete();
                                                            else
                                                                handleBulkDelete();
                                                        }
                                                        setBulkConfirmVisible(false);
                                                    }, children: "Yes" }), _jsx("button", { className: "confirm-no", onClick: () => setBulkConfirmVisible(false), children: "No" })] })] }) }))] })), fullscreenImageUrl && (_jsx("div", { className: "fullscreen-image-modal", onClick: () => setFullscreenImageUrl(null), children: _jsxs("div", { className: "fullscreen-image-wrapper", children: [_jsx("img", { src: fullscreenImageUrl, alt: "Full view" }), _jsx("button", { className: "close-fullscreen-btn", onClick: () => setFullscreenImageUrl(null), children: "\u2715" })] }) })), _jsx(ToastContainer, { position: "top-center", autoClose: 4000, hideProgressBar: false, newestOnTop: false, closeOnClick: true, rtl: false, pauseOnFocusLoss: true, draggable: true, pauseOnHover: true, theme: "light" })] }), activeTab === 2 && viewMode === "table" && (_jsx("div", { className: "pagination-container-partners", children: _jsxs("div", { className: "pagination", children: [_jsx("button", { onClick: () => setCurrentPagePartners((p) => Math.max(p - 1, 1)), disabled: currentPagePartners === 1, children: "\u2039 Prev" }), [...Array(totalPartnerPages)].map((_, i) => {
                            const page = i + 1;
                            return (_jsx("button", { className: page === currentPagePartners ? "active" : "", onClick: () => setCurrentPagePartners(page), children: page }, page));
                        }), _jsx("button", { onClick: () => setCurrentPagePartners((p) => Math.min(p + 1, totalPartnerPages)), disabled: currentPagePartners === totalPartnerPages, children: "Next \u203A" })] }) }))] }));
};
export default AdminSettings;
