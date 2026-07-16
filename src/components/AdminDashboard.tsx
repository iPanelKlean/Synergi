import React, { useState, useEffect } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { 
  db, 
  firebaseConfig,
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  query,
  where,
  writeBatch
} from "../firebase";
import { 
  UserProfile, 
  Booking, 
  Seat, 
  ConferenceRoom, 
  ConferenceBooking, 
  Agreement, 
  Payment, 
  Complaint, 
  SystemNotification, 
  AppSettings 
} from "../types";
import synergiLogo from "../assets/images/synergi_logo_1783312477576.jpg";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

import { 
  Layers, 
  Users, 
  AlertCircle, 
  CreditCard, 
  FileText, 
  QrCode, 
  Plus, 
  Edit, 
  Check, 
  X, 
  Settings, 
  Send, 
  Bell, 
  FileDown, 
  Trash,
  Sliders,
  CheckCircle,
  HelpCircle,
  Heart,
  LayoutDashboard, 
  Users as UsersIcon, 
  Briefcase, 
  FolderLock, 
  Ticket, 
  MessageSquareCode, 
  CheckSquare, 
  ShieldAlert, 
  ShieldCheck,
  UploadCloud,
  Facebook,
  Phone,
  MessageCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Printer
} from "lucide-react";

const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    viewBox="0 0 448 512" 
    fill="currentColor" 
    className={className}
  >
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
  </svg>
);

const ReviewAdminCard = ({ 
  rev, 
  onApprove, 
  onDelete, 
  onReply 
}: { 
  rev: any; 
  onApprove: (id: string) => void; 
  onDelete: (id: string) => void; 
  onReply: (id: string, text: string) => void;
  key?: any;
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm ${rev.avatarBg || 'bg-slate-500'}`}>
            {rev.avatarLetter}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">{rev.author}</h4>
            <p className="text-[10px] text-slate-500">
              {rev.isLocalGuide ? "Local Guide" : "Google Reviewer"} • {rev.timeAgo || "Just now"}
            </p>
          </div>
        </div>
        
        {/* Rating Hearts */}
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart 
              key={i} 
              className={`w-3.5 h-3.5 ${
                i < rev.rating ? 'fill-red-500 text-red-500' : 'text-slate-200'
              }`} 
            />
          ))}
        </div>
      </div>

      <p className="text-slate-600 text-xs leading-relaxed italic">
        "{rev.text}"
      </p>

      {rev.categories && rev.categories.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rev.categories.map((cat: string) => (
            <span key={cat} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold uppercase tracking-wider border border-blue-100">
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Owner Response Display */}
      {rev.ownerResponse && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <span>↳ Response from Owner</span>
            <span className="text-slate-400 font-medium normal-case font-mono">{rev.ownerResponse.timeAgo}</span>
          </p>
          <p className="text-slate-600 text-xs leading-relaxed italic">
            "{rev.ownerResponse.text}"
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex gap-2">
          {!rev.published && (
            <button
              onClick={() => onApprove(rev.id)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all"
            >
              Verify & Publish
            </button>
          )}
          
          {rev.published && !rev.ownerResponse && !isReplying && (
            <button
              onClick={() => setIsReplying(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all"
            >
              Reply
            </button>
          )}

          <button
            onClick={() => onDelete(rev.id)}
            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg transition-all"
          >
            Delete
          </button>
        </div>
      </div>

      {isReplying && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write owner response..."
            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsReplying(false)}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onReply(rev.id, replyText);
                setIsReplying(false);
                setReplyText("");
              }}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all"
            >
              Submit Response
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface AdminDashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

export default function AdminDashboard({ user, onLogout, onUpdateProfile }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "bookings" | "rooms" | "seats" | "payments" | "agreements" | "complaints" | "notifications" | "superadmin" | "reviews" | "access" | "security">(
    "analytics"
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasLoadedSettingsRef = React.useRef(false);

  // Guard access to tabs based on roles & permissions
  useEffect(() => {
    // Payment settings is strictly Super Admin only
    if (activeTab === "superadmin" && user.role !== "admin") {
      setActiveTab("analytics");
      return;
    }
    
    // Access & Permissions is Super Admin & Admin (staff) only
    if (activeTab === "access" && user.role !== "admin" && user.role !== "staff") {
      setActiveTab("analytics");
      return;
    }

    // User Directory is Super Admin & Admin (staff) only
    if (activeTab === "users" && user.role !== "admin" && user.role !== "staff") {
      setActiveTab("analytics");
      return;
    }

    // Module-based guards for staff / staff_member roles
    if (user.role !== "admin") {
      const moduleMapping: Record<string, string> = {
        bookings: "seats",
        seats: "seats",
        rooms: "conference",
        payments: "payments",
        agreements: "agreements",
        complaints: "complaints",
        reviews: "agreements",
        notifications: "visitor"
      };

      const requiredModule = moduleMapping[activeTab];
      if (requiredModule) {
        const allowed = user.allowedModules || ["conference", "seats", "payments", "complaints", "agreements", "visitor"];
        if (!allowed.includes(requiredModule)) {
          setActiveTab("analytics");
        }
      }
    }
  }, [activeTab, user.role, user.allowedModules]);

  // Custom Alert / Toast & Confirm State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Reception / Security Specific States
  const [securitySearchQuery, setSecuritySearchQuery] = useState("");
  const [securityVerifiedVisitor, setSecurityVerifiedVisitor] = useState<any | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInGuestName, setWalkInGuestName] = useState("");
  const [walkInGuestPhone, setWalkInGuestPhone] = useState("");
  const [walkInGuestEmail, setWalkInGuestEmail] = useState("");
  const [walkInHostCompanyId, setWalkInHostCompanyId] = useState("");
  const [walkInRemarks, setWalkInRemarks] = useState("");
  const [printingPass, setPrintingPass] = useState<any | null>(null);

  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(null);
      }
    });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user.displayName);
  const [profilePhone, setProfilePhone] = useState(user.phone || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Google Drive storage integration state and handlers
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [googleDriveEmail, setGoogleDriveEmail] = useState("");
  const [googleDriveConnectedAt, setGoogleDriveConnectedAt] = useState("");
  const [connectingDrive, setConnectingDrive] = useState(false);

  useEffect(() => {
    const checkDriveStatus = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "google_drive"));
        if (snap.exists()) {
          const data = snap.data();
          if (data.accessToken) {
            setGoogleDriveConnected(true);
            setGoogleDriveEmail(data.connectedEmail || "mis@ipanelklean.com");
            setGoogleDriveConnectedAt(data.updatedAt || "");
          }
        }
      } catch (err) {
        console.warn("Could not load Google Drive settings:", err);
      }
    };
    if (activeTab === "superadmin") {
      checkDriveStatus();
    }
  }, [activeTab]);

  const handleConnectGoogleDrive = async () => {
    setConnectingDrive(true);
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
      const { auth } = await import("../firebase");
      
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/drive");
      provider.addScope("https://www.googleapis.com/auth/drive.file");
      
      provider.setCustomParameters({
        prompt: "select_account"
      });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error("Failed to retrieve Google OAuth access token.");
      }

      const connectedEmail = result.user.email || "mis@ipanelklean.com";
      const nowStr = new Date().toLocaleString();

      const driveData = {
        accessToken: credential.accessToken,
        connectedEmail: connectedEmail,
        updatedAt: nowStr
      };

      await setDoc(doc(db, "settings", "google_drive"), driveData);

      setGoogleDriveConnected(true);
      setGoogleDriveEmail(connectedEmail);
      setGoogleDriveConnectedAt(nowStr);
      triggerToast(`Connected Google Drive to ${connectedEmail}!`, "success");
    } catch (err: any) {
      console.error("Google Drive connection error:", err);
      triggerToast(`Failed to connect Google Drive: ${err?.message || String(err)}`, "error");
    } finally {
      setConnectingDrive(false);
    }
  };

  // Sync state if user prop changes
  useEffect(() => {
    setProfileName(user.displayName);
    setProfilePhone(user.phone || "");
  }, [user]);

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      alert("Name is required.");
      return;
    }
    setIsSavingProfile(true);
    try {
      const updatedUser = {
        ...user,
        displayName: profileName.trim(),
        phone: profilePhone.trim()
      };
      await updateDoc(doc(db, "users", user.uid), {
        displayName: profileName.trim(),
        phone: profilePhone.trim()
      });
      onUpdateProfile(updatedUser);
      setIsEditingProfile(false);
      alert("Your profile has been saved successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`Error saving profile: ${err?.message || String(err)}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  // Real-time lists
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);
  const [seatsList, setSeatsList] = useState<Seat[]>([]);
  const [roomsList, setRoomsList] = useState<ConferenceRoom[]>([]);
  const [confBookingsList, setConfBookingsList] = useState<ConferenceBooking[]>([]);
  const [agreementsList, setAgreementsList] = useState<Agreement[]>([]);
  const [paymentsList, setPaymentsList] = useState<Payment[]>([]);
  const [complaintsList, setComplaintsList] = useState<Complaint[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Synergi Registration Forms state
  const [registrationForms, setRegistrationForms] = useState<any[]>([]);
  const [selectedRegForm, setSelectedRegForm] = useState<any | null>(null);
  const [regFormReviewNotes, setRegFormReviewNotes] = useState("");
  const [activeAgreementsSubTab, setActiveAgreementsSubTab] = useState<"contracts" | "reg_forms">("contracts");
  const [adminBookingsSubTab, setAdminBookingsSubTab] = useState<"desks" | "conference">("desks");
  const [deskBookingsFilter, setDeskBookingsFilter] = useState<"all" | "public_seats" | "registered_seats" | "visits">("all");

  // Admin Pagination States
  const [usersPage, setUsersPage] = useState(1);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [confBookingsPage, setConfBookingsPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [agreementsPage, setAgreementsPage] = useState(1);
  const [complaintsPage, setComplaintsPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [regFormsPage, setRegFormsPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Local state for permissions module
  const [localPerms, setLocalPerms] = useState<Record<string, { role: UserProfile["role"]; allowedModules: string[] }>>({});
  const [accessSearch, setAccessSearch] = useState("");
  const [accessRoleFilter, setAccessRoleFilter] = useState<string>("all");
  const [accessPage, setAccessPage] = useState(1);

  const handleRoleChange = (uid: string, newRole: UserProfile["role"]) => {
    setLocalPerms(prev => ({
      ...prev,
      [uid]: {
        role: newRole,
        allowedModules: prev[uid]?.allowedModules || usersList.find(u => u.uid === uid)?.allowedModules || ["conference", "seats", "payments", "complaints", "agreements", "visitor"]
      }
    }));
  };

  const handleModuleToggle = (uid: string, moduleId: string) => {
    const currentUser = usersList.find(u => u.uid === uid);
    const currentAllowed = localPerms[uid]?.allowedModules || currentUser?.allowedModules || ["conference", "seats", "payments", "complaints", "agreements", "visitor"];
    const isAllowed = currentAllowed.includes(moduleId);
    const updatedAllowed = isAllowed ? currentAllowed.filter(m => m !== moduleId) : [...currentAllowed, moduleId];
    
    setLocalPerms(prev => ({
      ...prev,
      [uid]: {
        role: prev[uid]?.role || currentUser?.role || "customer",
        allowedModules: updatedAllowed
      }
    }));
  };

  const handleSavePermissions = async (u: UserProfile) => {
    const perm = localPerms[u.uid];
    const updatedRole = perm?.role || u.role;
    const updatedModules = perm?.allowedModules || u.allowedModules || ["conference", "seats", "payments", "complaints", "agreements", "visitor"];
    
    try {
      await updateDoc(doc(db, "users", u.uid), {
        role: updatedRole,
        allowedModules: updatedModules
      });
      triggerToast(`Permissions for ${u.displayName} updated successfully in MongoDB Atlas!`, "success");
      setLocalPerms(prev => {
        const next = { ...prev };
        delete next[u.uid];
        return next;
      });
    } catch (err: any) {
      console.error("Save permissions error:", err);
      triggerToast(`Failed to update permissions: ${err?.message || String(err)}`, "error");
    }
  };

  // Administrative Forms / Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [userFormEmail, setUserFormEmail] = useState("");
  const [userFormName, setUserFormName] = useState("");
  const [userFormRole, setUserFormRole] = useState<UserProfile["role"]>("customer");
  const [userFormStatus, setUserFormStatus] = useState<UserProfile["status"]>("active");
  const [userFormPhone, setUserFormPhone] = useState("");
  const [userFormPassword, setUserFormPassword] = useState("");
  const [userFormAllowedModules, setUserFormAllowedModules] = useState<string[]>([]);
  const [userFormMemberId, setUserFormMemberId] = useState("");
  const [userFormSeatRate, setUserFormSeatRate] = useState<number | "">("");
  const [userFormBillingCycle, setUserFormBillingCycle] = useState("Monthly");
  const [userFormCompanyName, setUserFormCompanyName] = useState("");
  const [userFormGstNo, setUserFormGstNo] = useState("");
  const [userFormPanNo, setUserFormPanNo] = useState("");
  const [userFormAddress, setUserFormAddress] = useState("");

  const [usersRowsPerPage, setUsersRowsPerPage] = useState<number>(10);
  const [confBookingsRowsPerPage, setConfBookingsRowsPerPage] = useState<number>(10);
  const [paymentsRowsPerPage, setPaymentsRowsPerPage] = useState<number>(10);
  const [agreementsRowsPerPage, setAgreementsRowsPerPage] = useState<number>(10);
  const [complaintsRowsPerPage, setComplaintsRowsPerPage] = useState<number>(10);
  const [regFormsRowsPerPage, setRegFormsRowsPerPage] = useState<number>(10);
  const [accessRowsPerPage, setAccessRowsPerPage] = useState<number>(10);
  const [reviewsRowsPerPage, setReviewsRowsPerPage] = useState<number>(10);

  const [assignSeatBooking, setAssignSeatBooking] = useState<Booking | null>(null);
  const [assignSeatNumber, setAssignSeatNumber] = useState("");
  const [assignSeatPrice, setAssignSeatPrice] = useState<number>(6999);

  const [bookingsRowsPerPage, setBookingsRowsPerPage] = useState<number>(15);
  const [seatsRowsPerPage, setSeatsRowsPerPage] = useState<number>(15);

  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [editStatus, setEditStatus] = useState<Booking["status"]>("pending");
  const [editSeatNumber, setEditSeatNumber] = useState("");
  const [editSeatAssignments, setEditSeatAssignments] = useState<{ seatNumber: string; employeeName: string }[]>([]);
  const [editSeatPrice, setEditSeatPrice] = useState<number>(6999);

  // Visitor Specific Edit States
  const [editVisitorName, setEditVisitorName] = useState("");
  const [editVisitorEmail, setEditVisitorEmail] = useState("");
  const [editVisitorPhone, setEditVisitorPhone] = useState("");
  const [editVisitorCompanyId, setEditVisitorCompanyId] = useState("");
  const [editVisitorCompanyName, setEditVisitorCompanyName] = useState("");
  const [editVisitorDate, setEditVisitorDate] = useState("");
  const [editVisitorOtp, setEditVisitorOtp] = useState("");
  const [editVisitorPassId, setEditVisitorPassId] = useState("");
  const [editVisitorRemarks, setEditVisitorRemarks] = useState("");

  // Support Tickets Editing States
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [editComplaintStaff, setEditComplaintStaff] = useState("");
  const [editComplaintStatus, setEditComplaintStatus] = useState<"open" | "in_progress" | "resolved">("open");
  const [editComplaintAdminNotes, setEditComplaintAdminNotes] = useState("");

  // Seats Management States
  const [singleSeatNumber, setSingleSeatNumber] = useState("");
  const [bulkSeatPrefix, setBulkSeatPrefix] = useState("");
  const [bulkSeatCount, setBulkSeatCount] = useState<number>(10);
  const [customSeatPrice, setCustomSeatPrice] = useState<number>(6999);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [seatsPage, setSeatsPage] = useState(1);

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomFormName, setRoomFormName] = useState("");
  const [roomFormCapacity, setRoomFormCapacity] = useState(10);
  const [roomFormPrice, setRoomFormPrice] = useState(500);
  const [roomFormType, setRoomFormType] = useState<"Conference Room" | "Meeting Room">("Conference Room");
  const [editRoomId, setEditRoomId] = useState<string | null>(null);

  const [notificationTarget, setNotificationTarget] = useState<"single" | "all">("all");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");
  const [notificationLoading, setNotificationLoading] = useState(false);

  // Super Admin Credentials
  const [superBankName, setSuperBankName] = useState("");
  const [superBankAddress, setSuperBankAddress] = useState("");
  const [superAccountNo, setSuperAccountNo] = useState("");
  const [superIfscCode, setSuperIfscCode] = useState("");
  const [superQrCodeUrl, setSuperQrCodeUrl] = useState("");
  const [superCompanyName, setSuperCompanyName] = useState("");
  const [superAddress, setSuperAddress] = useState("");
  const [superPhone, setSuperPhone] = useState("");
  const [superEmail, setSuperEmail] = useState("");
  const [superWhatsapp, setSuperWhatsapp] = useState("");
  const [superCompanyLogo, setSuperCompanyLogo] = useState("");
  const [superGstNumber, setSuperGstNumber] = useState("");
  const [superSupportEmail, setSuperSupportEmail] = useState("");
  const [superSupportMobile, setSuperSupportMobile] = useState("");
  const [superAccountHolderName, setSuperAccountHolderName] = useState("");
  const [superBranchName, setSuperBranchName] = useState("");
  const [superUpiId, setSuperUpiId] = useState("");
  const [superMerchantName, setSuperMerchantName] = useState("");
  const [superBillingCycle, setSuperBillingCycle] = useState<"Monthly" | "Quarterly" | "Half-Yearly" | "Yearly">("Monthly");
  const [superDefaultRentAmount, setSuperDefaultRentAmount] = useState<number>(6999);
  const [superSecurityDeposit, setSuperSecurityDeposit] = useState<number>(0);
  const [superMaintenanceCharges, setSuperMaintenanceCharges] = useState<number>(0);
  const [superAdminLoading, setSuperAdminLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);

  // Real-time Listening
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const list: UserProfile[] = [];
      snap.forEach(doc => list.push({ uid: doc.id, ...doc.data() } as UserProfile));
      setUsersList(list);
    });

    const unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
      const list: Booking[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Booking));
      // Sort newest first
      list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookingsList(list);
    });

    const unsubSeats = onSnapshot(collection(db, "seats"), (snap) => {
      const list: Seat[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Seat));
      list.sort((a,b) => a.number.localeCompare(b.number));
      setSeatsList(list);
    });

    const unsubRooms = onSnapshot(collection(db, "conferenceRooms"), (snap) => {
      const list: ConferenceRoom[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as ConferenceRoom));
      setRoomsList(list);
    });

    const unsubAgreements = onSnapshot(collection(db, "agreements"), (snap) => {
      const list: Agreement[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Agreement));
      setAgreementsList(list);
    });

    const unsubPayments = onSnapshot(collection(db, "payments"), (snap) => {
      const list: Payment[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Payment));
      list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPaymentsList(list);
    });

    const unsubComplaints = onSnapshot(collection(db, "complaints"), (snap) => {
      const list: Complaint[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Complaint));
      list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComplaintsList(list);
    });

    const unsubReviews = onSnapshot(collection(db, "reviews"), (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a,b) => b.timestamp - a.timestamp);
      setReviewsList(list);
    });

    const unsubRegForms = onSnapshot(collection(db, "registrationForms"), (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setRegistrationForms(list);
    });

    const unsubConfBookings = onSnapshot(collection(db, "conferenceBookings"), (snap) => {
      const list: ConferenceBooking[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as ConferenceBooking));
      // Sort newest first
      list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setConfBookingsList(list);
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppSettings;
        setSettings(data);
        if (data.seatPrice !== undefined) {
          setCustomSeatPrice(data.seatPrice);
        }
        // Load initial forms ONLY ONCE to avoid resetting inputs while typing
        if (!hasLoadedSettingsRef.current) {
          setSuperBankName(data.bankName || "");
          setSuperBankAddress(data.bankAddress || "");
          setSuperAccountNo(data.accountNo || "");
          setSuperIfscCode(data.ifscCode || "");
          setSuperQrCodeUrl(data.qrCodeUrl || "");
          setSuperCompanyName(data.companyName || "");
          setSuperAddress(data.address || "");
          setSuperPhone(data.phone || "");
          setSuperEmail(data.email || "");
          setSuperWhatsapp(data.whatsapp || "");
          setSuperCompanyLogo(data.companyLogo || "");
          setSuperGstNumber(data.gstNumber || "");
          setSuperSupportEmail(data.supportEmail || "");
          setSuperSupportMobile(data.supportMobile || "");
          setSuperAccountHolderName(data.accountHolderName || "");
          setSuperBranchName(data.branchName || "");
          setSuperUpiId(data.upiId || "");
          setSuperMerchantName(data.merchantName || "");
          setSuperBillingCycle(data.billingCycle || "Monthly");
          setSuperDefaultRentAmount(data.defaultRentAmount !== undefined ? data.defaultRentAmount : 6999);
          setSuperSecurityDeposit(data.securityDeposit !== undefined ? data.securityDeposit : 0);
          setSuperMaintenanceCharges(data.maintenanceCharges !== undefined ? data.maintenanceCharges : 0);
          hasLoadedSettingsRef.current = true;
        }
      }
    });

    return () => {
      unsubUsers();
      unsubBookings();
      unsubSeats();
      unsubRooms();
      unsubAgreements();
      unsubPayments();
      unsubComplaints();
      unsubReviews();
      unsubRegForms();
      unsubConfBookings();
      unsubSettings();
    };
  }, []);

  const renderPagination = (
    currentPage: number,
    totalItems: number,
    setPage: (page: number) => void,
    itemsPerPage: number = ITEMS_PER_PAGE
  ) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4 text-xs print:hidden">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
          className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <span className="text-slate-500 font-medium">
          Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({totalItems} items)
        </span>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => setPage(currentPage + 1)}
          className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  };

  const renderPaginationWithDropdown = (
    currentPage: number,
    totalItems: number,
    setPage: (page: number) => void,
    rowsPerPage: number,
    setRowsPerPage: (rows: number) => void,
    options: number[] = [10, 15, 20, 50]
  ) => {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-3 mt-4 text-xs print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Show:</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold focus:outline-none"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt} rows</option>
            ))}
          </select>
          <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">| Total: {totalItems} items</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors font-bold"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          
          <span className="text-slate-500 font-medium">
            Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{totalPages || 1}</strong>
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages || totalPages <= 1}
            onClick={() => setPage(currentPage + 1)}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors font-bold"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  // Compute Occupancy Charts Data
  const availableCount = seatsList.filter(s => s.status === "available").length;
  const occupiedCount = seatsList.filter(s => s.status === "occupied").length;
  const maintenanceCount = seatsList.filter(s => s.status === "maintenance").length;

  const occupancyPieData = [
    { name: "Available", value: availableCount, color: "#10b981" },
    { name: "Occupied", value: occupiedCount, color: "#ef4444" },
    { name: "Under Maintenance", value: maintenanceCount, color: "#f59e0b" }
  ];

  const monthlyRevenueData = [
    { month: "May 2026", revenue: 42000, bookings: 6 },
    { month: "June 2026", revenue: 56000, bookings: 9 },
    { month: "July 2026", revenue: paymentsList.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0) || 48993, bookings: paymentsList.filter(p => p.status === "paid").length || 7 }
  ];

  // Reviews Administration Operations
  const handleApproveReview = async (id: string) => {
    try {
      await updateDoc(doc(db, "reviews", id), { published: true });
      alert("Review successfully published & verified!");
    } catch (err) {
      console.error(err);
      alert("Failed to publish review.");
    }
  };

  const handleDeleteReview = async (id: string) => {
    triggerConfirm(
      "Confirm Review Deletion",
      "Are you sure you want to permanently delete this review?",
      async () => {
        try {
          await deleteDoc(doc(db, "reviews", id));
          triggerToast("Review successfully deleted.");
        } catch (err) {
          console.error(err);
          triggerToast("Failed to delete review.", "error");
        }
      }
    );
  };

  const handleReplyReview = async (id: string, replyText: string) => {
    if (!replyText.trim()) return;
    try {
      await updateDoc(doc(db, "reviews", id), {
        ownerResponse: {
          text: replyText.trim(),
          timeAgo: "Just now"
        }
      });
      alert("Response added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add response.");
    }
  };

  // User Administration Operations
  const handleUserSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormEmail || !userFormName) {
      alert("Full Name and Email coordinates are required.");
      return;
    }
    
    try {
      let uid = editUser ? editUser.uid : "";

      // 0. If it's a new user, check if a profile with this email already exists in Firestore to prevent duplicates
      if (!editUser) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", userFormEmail.toLowerCase().trim()));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          alert("A user profile with this email address already exists in the database. Please edit or view the existing user instead of creating a new one.");
          return;
        }
      }

      // 1. If it's a new user, register them in Firebase Authentication
      if (!editUser) {
        if (!userFormPassword || userFormPassword.length < 6) {
          alert("A valid password of at least 6 characters is required to create a Firebase Auth account.");
          return;
        }

        try {
          // Initialize a secondary temporary app with a unique name to prevent double-initialization blocks
          const tempAppName = `temp-app-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const tempApp = initializeApp(firebaseConfig, tempAppName);
          const tempAuth = getAuth(tempApp);

          // Register in Firebase Auth
          const credential = await createUserWithEmailAndPassword(
            tempAuth,
            userFormEmail.toLowerCase().trim(),
            userFormPassword
          );

          uid = credential.user.uid;

          // Delete temp app instance to free memory and clean up sessions safely
          await deleteApp(tempApp);
        } catch (authErr: any) {
          console.error("Firebase Authentication registration error:", authErr);
          const errMsg = authErr?.message || String(authErr);
          if (errMsg.includes("email-already-in-use") || authErr?.code === "auth/email-already-in-use") {
            alert(
              "Notice: This email address is already registered in Firebase Authentication.\n\nWe will register their profile in the workspace database directly. They can log in immediately using their existing password or Google account."
            );
            // Generate a temporary ID that will automatically be linked/merged on their first login
            uid = `PRE-REG-${Date.now()}`;
          } else {
            alert(`Failed to create Firebase Authentication account: ${errMsg}`);
            return;
          }
        }
      }

      // If uid is still empty (fallback for edge cases)
      if (!uid) {
        uid = `MOCK-UID-${Date.now()}`;
      }

      // 2. Save user profile metadata in Firestore users collection
      const userPayload: any = {
        uid,
        email: userFormEmail.toLowerCase().trim(),
        displayName: userFormName,
        role: userFormRole,
        status: userFormStatus,
        phone: userFormPhone,
        allowedModules: userFormAllowedModules,
        memberId: userFormMemberId || "",
        seatRate: userFormRole === "customer" ? (Number(userFormSeatRate) || 0) : 0,
        billingCycle: userFormRole === "customer" ? (userFormBillingCycle || "Monthly") : "",
        companyName: userFormRole === "customer" ? userFormCompanyName : "",
        gstNo: userFormRole === "customer" ? userFormGstNo : "",
        panNo: userFormRole === "customer" ? userFormPanNo : "",
        address: userFormRole === "customer" ? userFormAddress : "",
        createdAt: editUser ? editUser.createdAt : new Date().toISOString()
      };
      if (userFormPassword) {
        userPayload.password = userFormPassword;
      }

      await setDoc(doc(db, "users", uid), userPayload, { merge: true });

      alert(
        editUser 
          ? "Member profile updated successfully!" 
          : "Success! Account successfully created in Firebase Authentication and registered in Coworking Database!"
      );

      setShowUserModal(false);
      setEditUser(null);
      setUserFormEmail("");
      setUserFormName("");
      setUserFormPhone("");
      setUserFormPassword("");
      setUserFormAllowedModules([]);
      setUserFormMemberId("");
      setUserFormSeatRate("");
      setUserFormBillingCycle("Monthly");
      setUserFormCompanyName("");
      setUserFormGstNo("");
      setUserFormPanNo("");
      setUserFormAddress("");
    } catch (err: any) {
      console.error(err);
      alert(`Error saving user record: ${err?.message || String(err)}`);
    }
  };

  const handleDeactivateUser = async (u: UserProfile) => {
    const nextStatus = u.status === "active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, "users", u.uid), { status: nextStatus });
      alert(`Member status toggled to ${nextStatus}!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuspendUser = async (u: UserProfile) => {
    const nextStatus = u.status === "suspended" ? "active" : "suspended";
    try {
      await updateDoc(doc(db, "users", u.uid), { status: nextStatus });
      alert(`Member account ${nextStatus === "suspended" ? "suspended due to non-payment" : "activated"}!`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (u.uid === user.uid) {
      triggerToast("You cannot delete your own profile.", "error");
      return;
    }
    triggerConfirm(
      "Confirm Deletion",
      `Are you sure you want to permanently delete member ${u.displayName} (${u.email})?`,
      async () => {
        try {
          await deleteDoc(doc(db, "users", u.uid));
          triggerToast("Member profile permanently deleted.", "success");
        } catch (err: any) {
          console.error(err);
          triggerToast(`Error deleting member: ${err?.message || String(err)}`, "error");
        }
      }
    );
  };

  // Walk-In Visitor Registration Submit
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInGuestName || !walkInGuestPhone || !walkInGuestEmail || !walkInHostCompanyId) {
      triggerToast("Please fill in all required fields", "error");
      return;
    }
    try {
      const selectedCompany = usersList.find(u => u.uid === walkInHostCompanyId);
      const passId = "SYN-W-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const todayStr = new Date().toISOString().split("T")[0];

      const walkInDoc = {
        type: "visit",
        source: "registered",
        userName: walkInGuestName,
        userPhone: walkInGuestPhone,
        userEmail: walkInGuestEmail,
        companyId: walkInHostCompanyId,
        companyName: walkInHostCompanyId === "synergi_default" 
          ? "Synergi Coworking Space Pvt Ltd" 
          : (selectedCompany ? (selectedCompany.companyName || selectedCompany.displayName) : "Walk-in Guest"),
        date: todayStr,
        passId,
        otp,
        remarks: walkInRemarks || "Walk-In registered at reception",
        status: "checked_in",
        checkInTime: new Date().toLocaleTimeString(),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "bookings"), walkInDoc);
      triggerToast(`Walk-In pass ${passId} successfully generated & visitor Checked-In!`, "success");

      // Trigger automated email pass with QR code
      if (walkInGuestEmail) {
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "visitor_pass", booking: walkInDoc })
          });
          console.log("Walk-in visitor pass email triggered successfully.");
        } catch (mailErr) {
          console.error("Failed to trigger automated email API for walk-in:", mailErr);
        }
      }

      // Set print pass state to show the print modal immediately
      setPrintingPass(walkInDoc);

      // Reset fields
      setWalkInGuestName("");
      setWalkInGuestPhone("");
      setWalkInGuestEmail("");
      setWalkInHostCompanyId("");
      setWalkInRemarks("");
      setShowWalkInModal(false);
    } catch (err: any) {
      console.error(err);
      triggerToast("Error registering walk-in: " + err.message, "error");
    }
  };

  // Booking & Seat Allotment Operations
  const handleApproveBooking = async (b: Booking) => {
    if (b.type === "seat") {
      if (b.seatAssignments && b.seatAssignments.length > 0) {
        // Automatically approve and allocate pre-assigned seats with employee names
        try {
          const seatPrice = settings?.seatPrice || 6999;
          const seatBatch = writeBatch(db);

          for (const sa of b.seatAssignments) {
            // 1. Update physical seat in Firestore safely using set with merge
            const seatObj = seatsList.find(s => s.number === sa.seatNumber || s.id === sa.seatNumber);
            const seatId = seatObj ? seatObj.id : sa.seatNumber;
            const seatRef = doc(db, "seats", seatId);
            seatBatch.set(seatRef, {
              id: seatId,
              number: sa.seatNumber,
              occupied: true,
              occupiedByEmail: (b.userEmail || "").toLowerCase(),
              assignedToName: sa.employeeName,
              bookedByName: b.userName || "Registered Member",
              status: "occupied"
            }, { merge: true });

            // 2. Generate Legal License Agreement for each seat
            const agreementId = `AGR-${Date.now()}-${sa.seatNumber}`;
            const startDate = b.date || new Date().toISOString().split("T")[0];
            const endDateObj = new Date(startDate);
            endDateObj.setMonth(endDateObj.getMonth() + 11);
            const endDate = endDateObj.toISOString().split("T")[0];

            const agreementRef = doc(db, "agreements", agreementId);
            seatBatch.set(agreementRef, {
              id: agreementId,
              userEmail: (b.userEmail || "").toLowerCase(),
              userName: sa.employeeName, // registered to employee name
              seatNumber: sa.seatNumber,
              startDate,
              endDate,
              rentAmount: seatPrice,
              status: "active",
              createdAt: new Date().toISOString()
            });
          }

          // 3. Update Booking status to approved
          const bookingRef = doc(db, "bookings", b.id);
          seatBatch.update(bookingRef, {
            status: "approved"
          });

          // 4. Send unread notification to member
          const randomNotifId = "notif-" + Math.random().toString(36).substring(2, 11);
          const notifRef = doc(db, "notifications", randomNotifId);
          seatBatch.set(notifRef, {
            userEmail: (b.userEmail || "").toLowerCase(),
            title: "Seat Bookings & License Agreements Active!",
            body: `Congratulations! Your request for ${b.seatAssignments.length} seats (${b.seatAssignments.map(s => s.seatNumber).join(", ")}) has been approved. License agreements are generated under your profile.`,
            read: false,
            type: "seat_assigned",
            createdAt: new Date().toISOString()
          });

          await seatBatch.commit();
          triggerToast(`Successfully approved and allocated ${b.seatAssignments.length} unique seats!`, "success");
        } catch (err: any) {
          console.error(err);
          triggerToast("Error multi-approving seats: " + err.message, "error");
        }
      } else {
        const userEmailNorm = (b.userEmail || "").toLowerCase().trim();
        const matchedUser = usersList.find(u => (u.email || "").toLowerCase().trim() === userEmailNorm);
        setAssignSeatBooking(b);
        setAssignSeatNumber(b.seatNumber || "");
        if (matchedUser && matchedUser.seatRate !== undefined && matchedUser.seatRate > 0) {
          setAssignSeatPrice(matchedUser.seatRate);
        } else {
          setAssignSeatPrice(settings?.seatPrice || 6999);
        }
      }
    } else {
      // Approve site visits instantly
      try {
        await updateDoc(doc(db, "bookings", b.id), { status: "approved" });
        // Send unread notification to member for site visit approval
        const randomNotifId = "notif-" + Math.random().toString(36).substring(2, 11);
        await setDoc(doc(db, "notifications", randomNotifId), {
          userEmail: (b.userEmail || "").toLowerCase(),
          title: "Site Visit Approved! 🚗",
          body: `Great news! Your request for a site visit on ${b.date} has been approved. Our team is excited to show you Noida Zone-C coworking workspaces!`,
          read: false,
          type: "alert",
          createdAt: new Date().toISOString()
        });
        triggerToast("Visit request approved and user notified!", "success");
      } catch (err: any) {
        console.error(err);
        triggerToast("Failed to approve visit: " + err.message, "error");
      }
    }
  };

  const handleAssignSeatComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSeatBooking) {
      triggerToast("No active booking selected.", "error");
      return;
    }
    if (!assignSeatNumber) {
      triggerToast("Please choose a seat number from the dropdown first.", "error");
      return;
    }

    try {
      // 1. Update Booking Status
      await updateDoc(doc(db, "bookings", assignSeatBooking.id), {
        status: "approved",
        seatNumber: assignSeatNumber
      });

      // 2. Update Physical Seat occupancy safely using set with merge
      const seatObj = seatsList.find(s => s.number === assignSeatNumber || s.id === assignSeatNumber);
      const seatId = seatObj ? seatObj.id : assignSeatNumber;
      const seatRef = doc(db, "seats", seatId);
      await setDoc(seatRef, {
        id: seatId,
        number: assignSeatNumber,
        occupied: true,
        occupiedByEmail: (assignSeatBooking.userEmail || "").toLowerCase(),
        assignedToName: assignSeatBooking.userName || "Guest",
        bookedByName: assignSeatBooking.userName || "Guest Visitor",
        status: "occupied"
      }, { merge: true });

      // 3. Auto-Generate Legal License Agreement (Leave & License)
      const agreementId = `AGR-${Date.now()}`;
      const startDate = assignSeatBooking.date || new Date().toISOString().split("T")[0];
      const endDateObj = new Date(startDate);
      endDateObj.setMonth(endDateObj.getMonth() + 11); // standard 11 months license
      const endDate = endDateObj.toISOString().split("T")[0];

      await setDoc(doc(db, "agreements", agreementId), {
        id: agreementId,
        userEmail: (assignSeatBooking.userEmail || "").toLowerCase(),
        userName: assignSeatBooking.userName || "Guest",
        seatNumber: assignSeatNumber,
        startDate,
        endDate,
        rentAmount: assignSeatPrice || 6999,
        status: "active",
        createdAt: new Date().toISOString()
      });

      // 4. Dispatch System In-App Notification
      await addDoc(collection(db, "notifications"), {
        userEmail: (assignSeatBooking.userEmail || "").toLowerCase(),
        title: "Seat Assigned & License Active!",
        body: `Congratulations! Seat ${assignSeatNumber} is assigned to you. Leave & License Agreement INV-${agreementId} has been generated.`,
        read: false,
        type: "allotment",
        createdAt: new Date().toISOString()
      });

      // 5. Dispatch Email to the user
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: "seat_allotment_changed",
            booking: {
              ...assignSeatBooking,
              status: "approved",
              seatNumber: assignSeatNumber,
              seatPrice: assignSeatPrice || 6999
            }
          })
        });
      } catch (mailErr) {
        console.error("Failed to dispatch seat assignment email:", mailErr);
      }

      triggerToast(`Seat ${assignSeatNumber} successfully assigned & email dispatched. License Agreement contract INV-${agreementId} initialized!`, "success");
      setAssignSeatBooking(null);
      setAssignSeatNumber("");
    } catch (err: any) {
      console.error(err);
      triggerToast("Error finalizing seat allotment: " + err.message, "error");
    }
  };

  const handleSaveEditBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBooking) return;

    try {
      const seatPrice = editSeatPrice || 6999;
      const batch = writeBatch(db);

      // 1. FREE UP OLD SEATS (if they were previously assigned)
      const oldSeatNumbers: string[] = [];
      if (editBooking.seatNumber) {
        oldSeatNumbers.push(editBooking.seatNumber);
      }
      if (editBooking.seatAssignments) {
        editBooking.seatAssignments.forEach(sa => {
          if (sa.seatNumber) oldSeatNumbers.push(sa.seatNumber);
        });
      }

      const uniqueOldSeats = Array.from(new Set(oldSeatNumbers));
      for (const num of uniqueOldSeats) {
        if (!num) continue;
        const seatObj = seatsList.find(s => s.number === num || s.id === num);
        const seatId = seatObj ? seatObj.id : num;
        const seatRef = doc(db, "seats", seatId);
        batch.set(seatRef, {
          occupied: false,
          status: "available",
          assignedToName: "",
          occupiedByEmail: "",
          bookedByName: ""
        }, { merge: true });
      }

      // 2. ALLOCATE NEW SEATS IF APPROVED
      const finalSeatNumber = editStatus === "approved" ? editSeatNumber : "";
      const finalSeatAssignments = editStatus === "approved" ? editSeatAssignments : [];

      if (editStatus === "approved") {
        if (editBooking.type === "seat") {
          if (finalSeatAssignments && finalSeatAssignments.length > 0) {
            for (const sa of finalSeatAssignments) {
              if (!sa.seatNumber) {
                triggerToast("Please choose a seat number for all team assignments.", "error");
                return;
              }
              const seatObj = seatsList.find(s => s.number === sa.seatNumber || s.id === sa.seatNumber);
              const seatId = seatObj ? seatObj.id : sa.seatNumber;
              const seatRef = doc(db, "seats", seatId);
              batch.set(seatRef, {
                id: seatId,
                number: sa.seatNumber,
                occupied: true,
                occupiedByEmail: (editBooking.userEmail || "").toLowerCase(),
                assignedToName: sa.employeeName || "Employee",
                bookedByName: editBooking.userName || "Registered Member",
                status: "occupied"
              }, { merge: mergeSeatsEnabled() }); // Safe merge

              // Generate agreement
              const agreementId = `AGR-${Date.now()}-${sa.seatNumber}`;
              const startDate = editBooking.date || new Date().toISOString().split("T")[0];
              const endDateObj = new Date(startDate);
              endDateObj.setMonth(endDateObj.getMonth() + 11);
              const endDate = endDateObj.toISOString().split("T")[0];

              const agreementRef = doc(db, "agreements", agreementId);
              batch.set(agreementRef, {
                id: agreementId,
                userEmail: (editBooking.userEmail || "").toLowerCase(),
                userName: sa.employeeName || "Employee",
                seatNumber: sa.seatNumber,
                startDate,
                endDate,
                rentAmount: seatPrice,
                status: "active",
                createdAt: new Date().toISOString()
              });
            }
          } else if (finalSeatNumber) {
            const seatObj = seatsList.find(s => s.number === finalSeatNumber || s.id === finalSeatNumber);
            const seatId = seatObj ? seatObj.id : finalSeatNumber;
            const seatRef = doc(db, "seats", seatId);
            batch.set(seatRef, {
              id: seatId,
              number: finalSeatNumber,
              occupied: true,
              occupiedByEmail: (editBooking.userEmail || "").toLowerCase(),
              assignedToName: editBooking.userName || "Guest",
              bookedByName: editBooking.userName || "Guest Visitor",
              status: "occupied"
            }, { merge: true });

            // Generate agreement
            const agreementId = `AGR-${Date.now()}-${finalSeatNumber}`;
            const startDate = editBooking.date || new Date().toISOString().split("T")[0];
            const endDateObj = new Date(startDate);
            endDateObj.setMonth(endDateObj.getMonth() + 11);
            const endDate = endDateObj.toISOString().split("T")[0];

            const agreementRef = doc(db, "agreements", agreementId);
            batch.set(agreementRef, {
              id: agreementId,
              userEmail: (editBooking.userEmail || "").toLowerCase(),
              userName: editBooking.userName || "Guest",
              seatNumber: finalSeatNumber,
              startDate,
              endDate,
              rentAmount: seatPrice,
              status: "active",
              createdAt: new Date().toISOString()
            });
          } else {
            triggerToast("Please select a seat number before approving the request.", "error");
            return;
          }
        }
      }

      // Helper helper to avoid typescript warning about empty function
      function mergeSeatsEnabled() { return true; }

      // 3. UPDATE BOOKING DOCUMENT
      const bookingRef = doc(db, "bookings", editBooking.id);
      if (editBooking.type === "visit") {
        batch.update(bookingRef, {
          userName: editVisitorName,
          userEmail: editVisitorEmail,
          userPhone: editVisitorPhone,
          companyId: editVisitorCompanyId,
          companyName: editVisitorCompanyName,
          date: editVisitorDate,
          otp: editVisitorOtp,
          passId: editVisitorPassId,
          remarks: editVisitorRemarks,
          status: editStatus
        });
      } else {
        batch.update(bookingRef, {
          status: editStatus,
          seatNumber: finalSeatNumber,
          seatAssignments: finalSeatAssignments
        });
      }

      // 4. SEND NOTIFICATION TO THE USER
      const notifId = "notif-" + Math.random().toString(36).substring(2, 11);
      const notifRef = doc(db, "notifications", notifId);
      
      let notifTitle = "Workspace Request Updated";
      let notifBody = `Your workspace request has been updated. Status: ${editStatus.toUpperCase()}.`;
      if (editStatus === "approved") {
        notifTitle = "Seat Booking Approved & Seat Assigned!";
        if (finalSeatAssignments.length > 0) {
          notifBody = `Congratulations! Your request is approved and seats (${finalSeatAssignments.map(s => s.seatNumber).join(", ")}) are assigned to your team.`;
        } else if (finalSeatNumber) {
          notifBody = `Congratulations! Your request is approved and Seat ${finalSeatNumber} has been assigned to you.`;
        }
      } else if (editStatus === "rejected") {
        notifTitle = "Workspace Booking Rejected";
        notifBody = `Your request for ${editBooking.type === "seat" ? "seat booking" : "site visit"} has been rejected.`;
      } else if (editStatus === "pending") {
        notifTitle = "Workspace Booking set to Pending";
        notifBody = `Your request status has been updated to pending for review.`;
      }

      batch.set(notifRef, {
        userEmail: (editBooking.userEmail || "").toLowerCase(),
        title: notifTitle,
        body: notifBody,
        read: false,
        type: editStatus === "approved" ? "seat_assigned" : "alert",
        createdAt: new Date().toISOString()
      });

      await batch.commit();

      // 5. DISPATCH EMAIL TO THE USER
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: "seat_allotment_changed",
            booking: {
              ...editBooking,
              status: editStatus,
              seatNumber: finalSeatNumber,
              seatAssignments: finalSeatAssignments,
              seatPrice: seatPrice
            }
          })
        });
      } catch (mailErr) {
        console.error("Failed to dispatch seat allotment change email:", mailErr);
      }

      triggerToast("Booking details and physical seat allocations updated successfully & email dispatched!", "success");
      setEditBooking(null);
    } catch (err: any) {
      console.error(err);
      triggerToast("Error updating booking details: " + err.message, "error");
    }
  };

  const startEditingBooking = (b: Booking) => {
    setEditBooking(b);
    setEditStatus((b.status === "pending" && b.type === "seat") ? "approved" : b.status);
    setEditSeatNumber(b.seatNumber || "");
    setEditSeatAssignments(b.seatAssignments || []);

    setEditVisitorName(b.userName || "");
    setEditVisitorEmail(b.userEmail || "");
    setEditVisitorPhone(b.userPhone || "");
    setEditVisitorCompanyId(b.companyId || "");
    setEditVisitorCompanyName(b.companyName || "");
    setEditVisitorDate(b.date || "");
    setEditVisitorOtp(b.otp || "");
    setEditVisitorPassId(b.passId || "");
    setEditVisitorRemarks(b.remarks || "");
    
    const userEmailNorm = (b.userEmail || "").toLowerCase().trim();
    const matchedUser = usersList.find(u => (u.email || "").toLowerCase().trim() === userEmailNorm);
    if (matchedUser && matchedUser.seatRate !== undefined && matchedUser.seatRate > 0) {
      setEditSeatPrice(matchedUser.seatRate);
    } else {
      // Attempt to find matching custom price in existing agreements for this user & seat
      const matchingAgreement = agreementsList.find(a => 
        (a.userEmail || "").toLowerCase().trim() === userEmailNorm && 
        (a.seatNumber === b.seatNumber || (b.seatAssignments && b.seatAssignments.some(sa => sa.seatNumber === a.seatNumber)))
      );
      if (matchingAgreement && matchingAgreement.rentAmount) {
        setEditSeatPrice(matchingAgreement.rentAmount);
      } else {
        setEditSeatPrice(settings?.seatPrice || 6999);
      }
    }
  };

  const handleRejectBooking = async (b: Booking) => {
    triggerConfirm(
      "Reject Request",
      "Are you sure you want to reject this request? Any assigned physical seats will be vacated and made available.",
      async () => {
        try {
          const batch = writeBatch(db);

          // 1. Update Booking status to rejected
          const bookingRef = doc(db, "bookings", b.id);
          batch.update(bookingRef, { status: "rejected" });

          // 2. Free up physical seats
          const seatNumbersToFree: string[] = [];
          if (b.seatNumber) seatNumbersToFree.push(b.seatNumber);
          if (b.seatAssignments) {
            b.seatAssignments.forEach(sa => {
              if (sa.seatNumber) seatNumbersToFree.push(sa.seatNumber);
            });
          }
          const uniqueSeatsToFree = Array.from(new Set(seatNumbersToFree));

          for (const seatNum of uniqueSeatsToFree) {
            const seatObj = seatsList.find(s => s.number === seatNum || s.id === seatNum);
            const seatId = seatObj ? seatObj.id : seatNum;
            const seatRef = doc(db, "seats", seatId);
            batch.set(seatRef, {
              occupied: false,
              status: "available",
              assignedToName: "",
              occupiedByEmail: "",
              bookedByName: ""
            }, { merge: true });
          }

          // 3. Send unread notification to member
          const randomNotifId = "notif-" + Math.random().toString(36).substring(2, 11);
          const notifRef = doc(db, "notifications", randomNotifId);
          batch.set(notifRef, {
            userEmail: b.userEmail.toLowerCase(),
            title: "Workspace Booking Rejected",
            body: `Your request for ${b.type === "seat" ? "seat booking" : "site visit"} has been rejected. Any assigned physical seats have been released.`,
            read: false,
            type: "alert",
            createdAt: new Date().toISOString()
          });

          await batch.commit();
          triggerToast("Request rejected and physical seats released.", "success");
        } catch (err: any) {
          console.error(err);
          triggerToast("Failed to reject request: " + err.message, "error");
        }
      }
    );
  };

  const handleApproveConfBooking = async (cb: ConferenceBooking) => {
    triggerConfirm(
      "Approve Conference Slot",
      `Are you sure you want to approve the conference booking for "${cb.roomName}" on ${cb.date}?`,
      async () => {
        try {
          // 1. Update Firestore
          await updateDoc(doc(db, "conferenceBookings", cb.id), { status: "approved" });

          // 2. Insert notification
          await addDoc(collection(db, "notifications"), {
            userEmail: cb.userEmail,
            title: "Conference Room Approved! 📋",
            body: `Your conference booking request for "${cb.roomName}" on ${cb.date} has been approved. Confirmation details sent to your registered email.`,
            read: false,
            type: "success",
            createdAt: new Date().toISOString()
          });

          // 3. Dispatch Email confirmation to user
          try {
            await fetch("/api/send-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                type: "booking_approved",
                booking: cb
              })
            });
          } catch (mailErr) {
            console.error("Failed to notify server regarding confirmation email:", mailErr);
          }

          triggerToast("Conference room booking approved! Confirmation email sent to the user.", "success");
        } catch (err: any) {
          console.error(err);
          triggerToast(`Failed to approve booking: ${err?.message || String(err)}`, "error");
        }
      }
    );
  };

  const handleRejectConfBooking = async (cb: ConferenceBooking) => {
    triggerConfirm(
      "Reject Conference Slot",
      `Are you sure you want to reject the conference booking for "${cb.roomName}" on ${cb.date}?`,
      async () => {
        try {
          // 1. Update Firestore
          await updateDoc(doc(db, "conferenceBookings", cb.id), { status: "rejected" });

          // 2. Insert notification
          await addDoc(collection(db, "notifications"), {
            userEmail: cb.userEmail,
            title: "Conference Room Rejected",
            body: `Your conference booking request for "${cb.roomName}" on ${cb.date} was rejected by management due to unavailability.`,
            read: false,
            type: "alert",
            createdAt: new Date().toISOString()
          });

          // 3. Dispatch Email rejection to user
          try {
            await fetch("/api/send-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                type: "booking_rejected",
                booking: cb
              })
            });
          } catch (mailErr) {
            console.error("Failed to notify server regarding rejection email:", mailErr);
          }

          triggerToast("Conference room booking rejected. Rejection email sent to the user.", "success");
        } catch (err: any) {
          console.error(err);
          triggerToast(`Failed to reject booking: ${err?.message || String(err)}`, "error");
        }
      }
    );
  };

  // Conference Setup Operations
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormName) return;
    try {
      const id = editRoomId || `room-${Date.now()}`;
      await setDoc(doc(db, "conferenceRooms", id), {
        id,
        name: roomFormName,
        capacity: Number(roomFormCapacity),
        pricePerHour: Number(roomFormPrice),
        type: roomFormType,
        status: "available"
      }, { merge: true });
      
      if (editRoomId) {
        triggerToast(`Updated room "${roomFormName}" successfully.`, "success");
      } else {
        triggerToast(`Created room "${roomFormName}" successfully.`, "success");
      }
      
      setShowRoomModal(false);
      setRoomFormName("");
      setRoomFormCapacity(10);
      setRoomFormPrice(500);
      setRoomFormType("Conference Room");
      setEditRoomId(null);
    } catch (err: any) {
      console.error(err);
      triggerToast(`Failed to save room: ${err?.message || String(err)}`, "error");
    }
  };

  // Payments / Verification Ledger Operations
  const handleVerifyPayment = async (p: Payment, status: "paid" | "overdue") => {
    try {
      const remarks = prompt(`Enter verification remarks for ${p.userEmail} (optional):`) || "";
      await updateDoc(doc(db, "payments", p.id), { 
        status,
        remarks: remarks || ""
      });
      
      // Send alert
      await addDoc(collection(db, "notifications"), {
        userEmail: p.userEmail,
        title: status === "paid" ? "Payment Receipt Verified" : "Payment Declined / Pending",
        body: status === "paid" 
          ? `Your fee receipt of INR ${p.amount} for ${p.month} has been verified! Remarks: ${remarks || "None"}. Your automated GST Invoice is downloadable.`
          : `Your fee receipt for ${p.month} was flagged. Remarks: ${remarks || "None"}. Support will reach out.`,
        read: false,
        type: "payment",
        createdAt: new Date().toISOString()
      });

      alert(`Payment marked as ${status.toUpperCase()}! Remarks saved.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Registration Form Review Operations
  const handleReviewRegistration = async (form: any, status: "approved" | "rejected", notes: string) => {
    try {
      await updateDoc(doc(db, "registrationForms", form.id), {
        status,
        reviewNotes: notes,
        reviewedAt: new Date().toISOString()
      });

      // Send notification to the user
      await addDoc(collection(db, "notifications"), {
        userEmail: form.userEmail,
        title: status === "approved" ? "Registration Form Approved" : "Registration Form Rejected",
        body: status === "approved"
          ? `Your Synergi Registration Form (${form.submissionType === "digital" ? "Digital Submission" : "Scanned Upload"}) has been approved by the Admin. Review notes: ${notes || "None"}`
          : `Your Synergi Registration Form has been rejected. Reason/Notes: ${notes || "No review notes provided"}. Please submit a corrected form.`,
        read: false,
        type: "agreement",
        createdAt: new Date().toISOString()
      });

      alert(`Form has been marked as ${status.toUpperCase()}!`);
      setSelectedRegForm(null);
    } catch (err) {
      console.error(err);
      alert("Error updating registration form status.");
    }
  };

  // Complaints / Helpdesk Operations
  const handleAssignHelpdesk = async (comp: Complaint, staffName: string) => {
    try {
      await updateDoc(doc(db, "complaints", comp.id), { 
        assignedStaff: staffName,
        status: "in_progress" 
      });
      alert(`Ticket assigned to coordinator: ${staffName}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveHelpdesk = async (comp: Complaint) => {
    try {
      await updateDoc(doc(db, "complaints", comp.id), { status: "resolved" });
      await addDoc(collection(db, "notifications"), {
        userEmail: comp.userEmail,
        title: "Service Ticket Resolved",
        body: `Your complaint regarding "${comp.category}" has been marked as RESOLVED by assigned staff.`,
        read: false,
        type: "complaint",
        createdAt: new Date().toISOString()
      });
      alert("Ticket resolved successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplaint) return;
    try {
      const updateData: any = {
        assignedStaff: editComplaintStaff,
        status: editComplaintStatus,
      };
      if (editComplaintAdminNotes !== undefined) {
        updateData.adminNotes = editComplaintAdminNotes;
      }
      await updateDoc(doc(db, "complaints", editingComplaint.id), updateData);
      
      // If status is resolved, dispatch user notification
      if (editComplaintStatus === "resolved" && editingComplaint.status !== "resolved") {
        await addDoc(collection(db, "notifications"), {
          userEmail: editingComplaint.userEmail,
          title: "Service Ticket Resolved",
          body: `Your complaint regarding "${editingComplaint.category}" has been marked as RESOLVED. Notes: ${editComplaintAdminNotes || "N/A"}`,
          read: false,
          type: "complaint",
          createdAt: new Date().toISOString()
        });
      }

      alert("Service complaint ticket updated successfully!");
      setEditingComplaint(null);
    } catch (err) {
      console.error("Error updating complaint:", err);
      alert("Failed to update complaint ticket.");
    }
  };

  // Dispatch Custom System Notifications
  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationTitle || !notificationBody) return;
    setNotificationLoading(true);
    try {
      if (notificationTarget === "all") {
        // Broadcast to all active emails in user base
        const batchEmails = usersList.map(u => u.email);
        for (const mail of batchEmails) {
          await addDoc(collection(db, "notifications"), {
            userEmail: mail,
            title: notificationTitle,
            body: notificationBody,
            read: false,
            type: "broadcast",
            createdAt: new Date().toISOString()
          });
        }
        alert(`Broadcasted notification to all ${usersList.length} registered members!`);
      } else {
        if (!notificationEmail) {
          alert("Please specify the single target email.");
          setNotificationLoading(false);
          return;
        }
        await addDoc(collection(db, "notifications"), {
          userEmail: notificationEmail.toLowerCase().trim(),
          title: notificationTitle,
          body: notificationBody,
          read: false,
          type: "direct",
          createdAt: new Date().toISOString()
        });
        alert(`Sent direct notification to ${notificationEmail}!`);
      }
      setNotificationTitle("");
      setNotificationBody("");
    } catch (err) {
      console.error(err);
    } finally {
      setNotificationLoading(false);
    }
  };

  // Handle Company Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/agreements/upload-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileBase64: base64
          })
        });
        const result = await res.json();
        if (result.success) {
          setSuperCompanyLogo(result.fileUrl);
          triggerToast("Company logo uploaded successfully!", "success");
        } else {
          triggerToast("Failed to upload company logo.", "error");
        }
        setLogoUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      triggerToast("Error uploading company logo.", "error");
      setLogoUploading(false);
    }
  };

  // Handle UPI QR Code Upload
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/agreements/upload-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileBase64: base64
          })
        });
        const result = await res.json();
        if (result.success) {
          setSuperQrCodeUrl(result.fileUrl);
          triggerToast("UPI QR code uploaded successfully!", "success");
        } else {
          triggerToast("Failed to upload QR code.", "error");
        }
        setQrUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      triggerToast("Error uploading QR code.", "error");
      setQrUploading(false);
    }
  };

  // Super Admin Overrides Save (Locked only to role === admin)
  const handleSaveSuperAdminSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.role !== "admin") {
      triggerToast("Only the super administrator can override billing configurations.", "error");
      return;
    }
    setSuperAdminLoading(true);
    try {
      await setDoc(doc(db, "settings", "global"), {
        id: "global",
        companyName: superCompanyName,
        address: superAddress,
        phone: superPhone,
        email: superEmail,
        whatsapp: superWhatsapp,
        qrCodeUrl: superQrCodeUrl,
        bankName: superBankName,
        bankAddress: superBankAddress,
        accountNo: superAccountNo,
        ifscCode: superIfscCode,
        seatPrice: Number(customSeatPrice || superDefaultRentAmount),
        companyLogo: superCompanyLogo,
        gstNumber: superGstNumber,
        supportEmail: superSupportEmail,
        supportMobile: superSupportMobile,
        accountHolderName: superAccountHolderName,
        branchName: superBranchName,
        upiId: superUpiId,
        merchantName: superMerchantName,
        billingCycle: superBillingCycle,
        defaultRentAmount: Number(superDefaultRentAmount),
        securityDeposit: Number(superSecurityDeposit || 0),
        maintenanceCharges: Number(superMaintenanceCharges || 0)
      });
      triggerToast("Payment and billing configuration saved securely!", "success");
    } catch (err: any) {
      console.error(err);
      triggerToast(`Failed to save settings: ${err?.message || String(err)}`, "error");
    } finally {
      setSuperAdminLoading(false);
    }
  };

  // Excel / CSV Export Helpers
  const handleExportCSV = (collectionName: string, items: any[]) => {
    if (items.length === 0) {
      alert("No records to export.");
      return;
    }
    const keys = Object.keys(items[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [keys.join(","), ...items.map(item => keys.map(k => JSON.stringify(item[k] || "")).join(","))].join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `synergi_${collectionName}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Slice lists for pagination
  const displayedUsers = usersList.slice(
    (usersPage - 1) * usersRowsPerPage,
    usersPage * usersRowsPerPage
  );
  const filteredBookingsList = bookingsList.filter(b => {
    if (deskBookingsFilter === "public_seats") {
      return b.type === "seat" && (b.source === "public" || !b.source);
    }
    if (deskBookingsFilter === "registered_seats") {
      return b.type === "seat" && b.source === "registered";
    }
    if (deskBookingsFilter === "visits") {
      return b.type === "visit";
    }
    return true; // "all"
  });

  const displayedBookings = filteredBookingsList.slice(
    (bookingsPage - 1) * bookingsRowsPerPage,
    bookingsPage * bookingsRowsPerPage
  );
  const displayedSeatsList = seatsList.slice(
    (seatsPage - 1) * seatsRowsPerPage,
    seatsPage * seatsRowsPerPage
  );
  const displayedConfBookings = confBookingsList.slice(
    (confBookingsPage - 1) * confBookingsRowsPerPage,
    confBookingsPage * confBookingsRowsPerPage
  );
  const displayedPayments = paymentsList.slice(
    (paymentsPage - 1) * paymentsRowsPerPage,
    paymentsPage * paymentsRowsPerPage
  );
  const displayedAgreements = agreementsList.slice(
    (agreementsPage - 1) * agreementsRowsPerPage,
    agreementsPage * agreementsRowsPerPage
  );
  const displayedComplaints = complaintsList.slice(
    (complaintsPage - 1) * complaintsRowsPerPage,
    complaintsPage * complaintsRowsPerPage
  );
  const displayedRegForms = registrationForms.slice(
    (regFormsPage - 1) * regFormsRowsPerPage,
    regFormsPage * regFormsRowsPerPage
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row text-slate-800 font-sans relative overflow-x-hidden">
      
      {/* ADMIN SIDEBAR BACKDROP FOR MOBILE */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ADMIN SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-950 text-blue-200 shrink-0 flex flex-col border-r border-blue-900 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden lg:w-0"
      }`}>
        <div className="p-6 border-b border-blue-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img 
              src={synergiLogo} 
              alt="Synergi Logo" 
              className="h-9 w-auto object-contain bg-white p-1.5 rounded-xl" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-sm font-black text-white leading-tight">Synergi</h2>
              <p className="text-[9px] text-blue-400 font-mono tracking-wider uppercase">
                {user.role === "admin" ? "SUPER ADMIN" : user.role === "staff" ? "ADMIN" : user.role === "staff_member" ? "STAFF" : "MEMBER"}
              </p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-blue-200 hover:text-white transition-all"
            title="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto space-y-1">
          {[
            { id: "analytics", label: "Dashboard Analytics", icon: LayoutDashboard, badge: 0 },
            { id: "users", label: "Member Directory", icon: UsersIcon, badge: 0 },
            { id: "access", label: "Access & Permissions", icon: FolderLock, badge: 0 },
            { id: "bookings", label: "Seat & Visit Orders", icon: Briefcase, badge: bookingsList.filter(b => b.status === "pending").length },
            { id: "security", label: "🔒 Reception / Security", icon: ShieldCheck, badge: bookingsList.filter(b => b.type === "visit" && b.status === "approved").length },
            { id: "rooms", label: "Conference Rooms", icon: LayoutDashboard, badge: confBookingsList.filter(cb => cb.status === "pending").length },
            { id: "seats", label: "Seats Setup", icon: Layers, badge: 0 },
            { id: "payments", label: "Billing Receipts", icon: CreditCard, badge: paymentsList.filter(p => p.status === "pending" || p.status === "overdue").length },
            { id: "agreements", label: "Agreements & Licenses", icon: FileText, badge: agreementsList.filter(a => a.status === "pending_signature").length + registrationForms.filter(f => f.status === "pending").length },
            { id: "complaints", label: "Support complaints", icon: Ticket, badge: complaintsList.filter(c => c.status === "open").length },
            { id: "reviews", label: "Reviews Approval", icon: Heart, badge: reviewsList.filter(r => !r.published).length },
            { id: "notifications", label: "Broadcast Dispatcher", icon: MessageSquareCode, badge: 0 },
            { id: "superadmin", label: "Payment Settings", icon: FolderLock, badge: 0 }
          ].filter(item => {
            // Super Admin has access to all modules and settings
            if (user.role === "admin") {
              return true;
            }

            // Payment settings is strictly Super Admin only
            if (item.id === "superadmin") {
              return false;
            }

            // Access Control & Permissions tab is restricted to Super Admin & Admin only
            if (item.id === "access") {
              return user.role === "staff";
            }

            // User Directory is for Super Admin & Admin only
            if (item.id === "users") {
              return user.role === "staff";
            }

            // Analytics is accessible by all staff
            if (item.id === "analytics") {
              return true;
            }

            // Other module-specific tabs
            const moduleMapping: Record<string, string> = {
              bookings: "seats",
              security: "visitor",
              seats: "seats",
              rooms: "conference",
              payments: "payments",
              agreements: "agreements",
              complaints: "complaints",
              reviews: "agreements",
              notifications: "visitor"
            };

            const requiredModule = moduleMapping[item.id];
            if (requiredModule) {
              const allowed = user.allowedModules || ["conference", "seats", "payments", "complaints", "agreements", "visitor"];
              return allowed.includes(requiredModule);
            }

            return true;
          }).map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-700/30" 
                  : "text-blue-300 hover:bg-blue-900 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-blue-950">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-900 bg-blue-950/60">
          {/* Support Social Links */}
          <div className="mb-4 pb-3 border-b border-blue-900/40">
            <p className="text-[10px] text-blue-400 font-mono tracking-wider uppercase mb-2 text-center">Contact Venue Coordinator</p>
            <div className="flex items-center justify-around">
              <a 
                href="https://wa.me/919667388817" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-emerald-400/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                title="WhatsApp Support"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
              <a 
                href="https://www.facebook.com/SynergiCowork" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-blue-900/40 text-blue-300 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                title="Facebook Page"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="tel:+919999028722" 
                className="w-8 h-8 rounded-full bg-orange-400/10 text-orange-400 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                title="Call Support"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {isEditingProfile ? (
            <div className="space-y-3 mb-4 text-left bg-blue-900/30 p-3 rounded-xl border border-blue-900/60">
              <div>
                <label className="text-[10px] text-blue-300 font-bold uppercase block mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-blue-900/80 border border-blue-700 rounded-lg px-2 py-1 text-xs text-white placeholder-blue-400 focus:outline-none focus:border-blue-500"
                  placeholder="Your display name"
                />
              </div>
              <div>
                <label className="text-[10px] text-blue-300 font-bold uppercase block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-blue-900/80 border border-blue-700 rounded-lg px-2 py-1 text-xs text-white placeholder-blue-400 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. +91 99999 99999"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="flex-1 flex items-center justify-center gap-1 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileName(user.displayName);
                    setProfilePhone(user.phone || "");
                    setIsEditingProfile(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-1 bg-blue-800 hover:bg-blue-700 text-blue-200 text-xs font-bold rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 mb-3 bg-blue-900/20 p-2.5 rounded-xl border border-blue-900/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white text-blue-900 flex items-center justify-center font-bold text-xs shrink-0">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-black text-white truncate">{user.displayName}</p>
                  <span className="text-[9px] bg-blue-800 text-blue-100 font-bold uppercase tracking-wider px-2 py-0.2 rounded-full inline-block">
                    {user.role === "admin" ? "Super Admin" : user.role === "staff" ? "Admin" : user.role === "staff_member" ? "Staff" : "Member"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="p-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-300 hover:text-white transition-colors"
                title="Edit Profile"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-900 hover:bg-rose-950 text-blue-300 hover:text-rose-400 text-xs font-semibold rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ADMIN WORKSPACE CONTAINER */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
        
        {/* HEADER AREA */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm transition-all focus:outline-none"
              title="Toggle Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xxs font-bold text-blue-600 uppercase tracking-widest block font-mono">
                {user.role === "admin" ? "Synergi Coworking Super Admin Access" : user.role === "staff" ? "Synergi Coworking Admin Access" : user.role === "staff_member" ? "Synergi Coworking Staff Access" : "Synergi Coworking Member Access"}
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 capitalize">{activeTab}</h1>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => handleExportCSV(activeTab, 
                activeTab === "users" ? usersList :
                activeTab === "bookings" ? bookingsList :
                activeTab === "rooms" ? roomsList :
                activeTab === "payments" ? paymentsList :
                activeTab === "agreements" ? agreementsList :
                activeTab === "complaints" ? complaintsList : []
              )}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              Export to Excel (CSV)
            </button>
          </div>
        </div>

        {/* ==================== 1. ANALYTICS & CHARTS TAB ==================== */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            {/* CORE ANALYTICS STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
                <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Total Seat Capacity</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{seatsList.length}</p>
                <div className="mt-2 text-xxs text-emerald-600 font-semibold flex items-center gap-1">
                  <span>● {availableCount} Available</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
                <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Seat Occupancy</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{seatsList.length > 0 ? Math.round((occupiedCount / seatsList.length) * 100) : 0}%</p>
                <div className="mt-2 text-xxs text-rose-600 font-semibold">
                  ● {occupiedCount} Occupied Seats
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
                <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</p>
                <p className="text-2xl font-black text-blue-600 mt-1">
                  INR {paymentsList.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0) || 48993}
                </p>
                <div className="mt-2 text-[10px] text-slate-500 font-mono">
                  Verified payments cleared.
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm">
                <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Pending Dues</p>
                <p className="text-2xl font-black text-rose-600 mt-1">
                  INR {paymentsList.filter(p => p.status === "pending" || p.status === "overdue").length * 6999}
                </p>
                <div className="mt-2 text-[10px] text-rose-500 font-semibold">
                  {paymentsList.filter(p => p.status === "pending" || p.status === "overdue").length} Pending receipts.
                </div>
              </div>
            </div>

            {/* CHARTS CONTAINER (RECHARTS INTEGRATION) */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* REVENUE BAR CHART */}
              <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-900">Platform Clearance Revenue (INR)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `INR ${value}`} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#6366f1" name="Collected Revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SEAT DISTRIBUTION PIE CHART */}
              <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-900">Seat Occupancy Distribution</h4>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={occupancyPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {occupancyPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* SEAT ASSIGNMENT GRID ACCORDION (Assign specific seat numbers A1-A10, B1-B10) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
              <h4 className="font-bold text-sm text-slate-900">Zone-C Physical Seat Allocations Map</h4>
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-3">
                {seatsList.map(seat => (
                  <div 
                    key={seat.id} 
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center space-y-1 ${
                      seat.status === "occupied" ? "bg-rose-50 border-rose-200" :
                      seat.status === "maintenance" ? "bg-amber-50 border-amber-200" :
                      "bg-emerald-50 border-emerald-200"
                    }`}
                  >
                    <span className="font-mono font-bold text-xs">{seat.number}</span>
                    <span className="text-[8px] font-bold uppercase block tracking-wider">
                      {seat.status === "occupied" ? seat.assignedToName?.split(" ")[0] : seat.status}
                    </span>
                    {/* Move seat trigger */}
                    {seat.status === "occupied" && (
                      <button 
                        onClick={async () => {
                          const toSeat = window.prompt(`Move member ${seat.assignedToName} from ${seat.number} to which available seat?`);
                          if (!toSeat) return;
                          const targetSeat = seatsList.find(s => s.number === toSeat);
                          if (!targetSeat || targetSeat.status !== "available") {
                            alert("Target seat is not available or does not exist.");
                            return;
                          }
                          try {
                            // Update old seat
                            await updateDoc(doc(db, "seats", seat.id), { occupied: false, status: "available", assignedToName: "", occupiedByEmail: "" });
                            // Update new seat
                            await updateDoc(doc(db, "seats", targetSeat.id), { occupied: true, status: "occupied", assignedToName: seat.assignedToName, occupiedByEmail: seat.occupiedByEmail });
                            alert(`Moved member successfully to Seat ${toSeat}!`);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="text-[8px] font-bold text-blue-600 hover:underline border-t border-rose-100 pt-1 w-full mt-1 block"
                      >
                        Move
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. MEMBER DIRECTORY TAB ==================== */}
        {activeTab === "users" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Coworker Membership Profiles</h4>
                <p className="text-xs text-slate-500">Edit, activate, suspend, or configure staff and coworker accounts.</p>
              </div>
              <button 
                onClick={() => {
                  setEditUser(null);
                  setUserFormEmail("");
                  setUserFormName("");
                  setUserFormPhone("");
                  setUserFormRole("customer");
                  setUserFormStatus("active");
                  setUserFormAllowedModules(["conference", "seats", "payments", "complaints", "agreements", "visitor"]);
                  setUserFormMemberId(`SYNERGI-${Math.floor(1000 + Math.random() * 9000)}`);
                  setUserFormSeatRate("");
                  setUserFormBillingCycle("Monthly");
                  setUserFormCompanyName("");
                  setUserFormGstNo("");
                  setUserFormPanNo("");
                  setUserFormAddress("");
                  setShowUserModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-md shadow-blue-100"
              >
                <Plus className="w-4 h-4" /> Add Member Profile
              </button>
            </div>

            {/* USER FORM MODAL */}
            {showUserModal && (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-6">
                <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-4">
                  {editUser ? "Edit Profile" : "Register New Profile"}
                </h5>
                <form onSubmit={handleUserSave} className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={userFormName}
                      onChange={e => setUserFormName(e.target.value)}
                      placeholder="Amit Kumar" 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Coordinates</label>
                    <input 
                      type="email" 
                      required 
                      value={userFormEmail}
                      onChange={e => setUserFormEmail(e.target.value)}
                      placeholder="amit@example.com" 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={userFormPhone}
                      onChange={e => setUserFormPhone(e.target.value)}
                      placeholder="+91 9876543210" 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Credential Password</label>
                    <input 
                      type="text" 
                      value={userFormPassword}
                      onChange={e => setUserFormPassword(e.target.value)}
                      placeholder="Set password (e.g. 123456)" 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Permission Role</label>
                    <select
                      value={userFormRole}
                      onChange={e => setUserFormRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    >
                      <option value="admin">Super Admin</option>
                      <option value="staff">Admin</option>
                      <option value="staff_member">Staff</option>
                      <option value="customer">Member</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Status</label>
                    <select
                      value={userFormStatus}
                      onChange={e => setUserFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Member ID</label>
                    <input 
                      type="text" 
                      required
                      value={userFormMemberId}
                      onChange={e => setUserFormMemberId(e.target.value)}
                      placeholder="e.g. SYNERGI-1001" 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono" 
                    />
                  </div>
                  {userFormRole === "customer" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Seat Rate (₹/Cycle)</label>
                        <input 
                          type="number" 
                          required
                          value={userFormSeatRate}
                          onChange={e => setUserFormSeatRate(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="e.g. 6999" 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Billing Cycle</label>
                        <select
                          value={userFormBillingCycle}
                          onChange={e => setUserFormBillingCycle(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                        >
                          <option value="Monthly">Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Half-Yearly">Half-Yearly</option>
                          <option value="Annually">Annually</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                        <input 
                          type="text" 
                          value={userFormCompanyName}
                          onChange={e => setUserFormCompanyName(e.target.value)}
                          placeholder="e.g. Acme Corp" 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">GST No</label>
                        <input 
                          type="text" 
                          value={userFormGstNo}
                          onChange={e => setUserFormGstNo(e.target.value)}
                          placeholder="e.g. 27AAAAA0000A1Z5" 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">PAN No</label>
                        <input 
                          type="text" 
                          value={userFormPanNo}
                          onChange={e => setUserFormPanNo(e.target.value)}
                          placeholder="e.g. ABCDE1234F" 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono" 
                        />
                      </div>
                      <div className="col-span-full">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Company Address</label>
                        <textarea 
                          value={userFormAddress}
                          onChange={e => setUserFormAddress(e.target.value)}
                          placeholder="Enter complete office address..." 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 h-16" 
                        />
                      </div>
                    </>
                  )}
                  <div className="col-span-full bg-slate-50 p-4 rounded-2xl border border-slate-200/60 mt-1">
                    <p className="text-xs font-bold text-slate-800 mb-2">Module Access Control</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "conference", label: "Conference Rooms" },
                        { id: "seats", label: "Seat Booking" },
                        { id: "payments", label: "Payment Receipt" },
                        { id: "complaints", label: "Support Tickets" },
                        { id: "agreements", label: "Agreements & Forms" },
                        { id: "visitor", label: "Visitor Entry Pass" }
                      ].map(mod => {
                        const isChecked = userFormAllowedModules.includes(mod.id);
                        return (
                          <label key={mod.id} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-700 transition-colors">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setUserFormAllowedModules(userFormAllowedModules.filter(m => m !== mod.id));
                                } else {
                                  setUserFormAllowedModules([...userFormAllowedModules, mod.id]);
                                }
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                            />
                            {mod.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex-1">
                      Save
                    </button>
                    <button type="button" onClick={() => setShowUserModal(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* USERS DIRECTORY GRID */}
            <div className="overflow-x-auto border border-slate-250 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Member ID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Access Modules</th>
                    <th className="p-4">Seat Rate</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedUsers.map(u => (
                    <tr key={u.uid} className="hover:bg-slate-50">
                      <td className="p-4 font-mono font-bold text-blue-600">{u.memberId || "N/A"}</td>
                      <td className="p-4 font-bold text-slate-900">{u.displayName}</td>
                      <td className="p-4 font-mono text-slate-500">{u.email}</td>
                      <td className="p-4">
                        <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded uppercase text-[10px]">
                          {u.role === "admin" ? "Super Admin" : u.role === "staff" ? "Admin" : u.role === "staff_member" ? "Staff" : "Member"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-[240px]">
                          {(u.allowedModules || ["conference", "seats", "payments", "complaints", "agreements", "visitor"]).map(m => (
                            <span key={m} className="bg-slate-100 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                              {m === "conference" ? "Rooms" :
                               m === "seats" ? "Seats" :
                               m === "payments" ? "Payments" :
                               m === "complaints" ? "Support" :
                               m === "agreements" ? "Contracts" :
                               m === "visitor" ? "Visitors" : m}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-medium text-slate-700">
                        {u.seatRate !== undefined ? `₹${u.seatRate}` : "₹6999"} <span className="text-[10px] text-slate-400 font-sans">/ {u.billingCycle || "Monthly"}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === "active" ? "bg-emerald-50 text-emerald-700" :
                          u.status === "suspended" ? "bg-rose-50 text-rose-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4 flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditUser(u);
                            setUserFormName(u.displayName);
                            setUserFormEmail(u.email);
                            setUserFormPhone(u.phone || "");
                            setUserFormRole(u.role);
                            setUserFormStatus(u.status);
                            setUserFormPassword(u.password || "");
                            setUserFormAllowedModules(u.allowedModules || ["conference", "seats", "payments", "complaints", "agreements", "visitor"]);
                            setUserFormMemberId(u.memberId || "");
                            setUserFormSeatRate(u.seatRate !== undefined ? u.seatRate : "");
                            setUserFormBillingCycle(u.billingCycle || "Monthly");
                            setUserFormCompanyName(u.companyName || "");
                            setUserFormGstNo(u.gstNo || "");
                            setUserFormPanNo(u.panNo || "");
                            setUserFormAddress(u.address || "");
                            setShowUserModal(true);
                          }}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeactivateUser(u)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold"
                        >
                          Toggle Active
                        </button>
                        <button
                          onClick={() => handleSuspendUser(u)}
                          className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold"
                          title="Suspend/De-suspend"
                        >
                          {u.status === "suspended" ? "Re-Activate" : "Suspend (Non-Pay)"}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 transition-all"
                          title="Delete Member"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPaginationWithDropdown(usersPage, usersList.length, setUsersPage, usersRowsPerPage, setUsersRowsPerPage)}
          </div>
        )}

        {/* ==================== ACCESS & PERMISSIONS MODULE TAB ==================== */}
        {activeTab === "access" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-100 pb-5">
              <div>
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  🛡️ Access Control & Module Permissions Manager
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Manage coworker permission roles and customize module access checklists in real-time. Changes are saved instantly to MongoDB Atlas.
                </p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/55 p-4 rounded-2xl border border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search member by name or email..."
                  value={accessSearch}
                  onChange={(e) => {
                    setAccessSearch(e.target.value);
                    setAccessPage(1);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 shadow-sm"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              </div>
              <div>
                <select
                  value={accessRoleFilter}
                  onChange={(e) => {
                    setAccessRoleFilter(e.target.value);
                    setAccessPage(1);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Super Admin</option>
                  <option value="staff">Admin</option>
                  <option value="staff_member">Staff</option>
                  <option value="customer">Member</option>
                </select>
              </div>
            </div>

            {/* Access Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
              <table className="w-full border-collapse text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xxs tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="p-4">Member Info</th>
                    <th className="p-4">Permission Role</th>
                    <th className="p-4">Module Permissions Access Control</th>
                    <th className="p-4 text-center">Status / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(() => {
                    const filtered = usersList.filter(u => {
                      const searchMatch = !accessSearch ||
                        u.displayName?.toLowerCase().includes(accessSearch.toLowerCase()) ||
                        u.email?.toLowerCase().includes(accessSearch.toLowerCase());
                      const roleMatch = accessRoleFilter === "all" || u.role === accessRoleFilter;
                      return searchMatch && roleMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-400 font-mono">
                            No member matches found for the selected search queries.
                          </td>
                        </tr>
                      );
                    }

                    const startIndex = (accessPage - 1) * accessRowsPerPage;
                    const paginated = filtered.slice(startIndex, startIndex + accessRowsPerPage);

                    return paginated.map(u => {
                      const isDirty = !!localPerms[u.uid];
                      const currentRole = localPerms[u.uid]?.role || u.role;
                      const allowed = localPerms[u.uid]?.allowedModules || u.allowedModules || ["conference", "seats", "payments", "complaints", "agreements", "visitor"];

                      const modules = [
                        { id: "conference", label: "Conference Rooms", color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
                        { id: "seats", label: "Seat Bookings", color: "bg-sky-50 border-sky-100 text-sky-700" },
                        { id: "payments", label: "Payments Receipt", color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
                        { id: "complaints", label: "Support Tickets", color: "bg-amber-50 border-amber-100 text-amber-700" },
                        { id: "agreements", label: "Agreements & Forms", color: "bg-blue-50 border-blue-100 text-blue-700" },
                        { id: "visitor", label: "Visitor Entry Pass", color: "bg-purple-50 border-purple-100 text-purple-700" },
                      ];

                      return (
                        <tr key={u.uid} className={`hover:bg-slate-50 transition-all ${isDirty ? "bg-amber-50/20" : ""}`}>
                          {/* User Column */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200 shadow-sm">
                                {u.displayName?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-800">{u.displayName}</h5>
                                <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                                <span className="text-[9px] text-blue-600 font-mono block mt-0.5">ID: {u.memberId || "N/A"}</span>
                              </div>
                            </div>
                          </td>

                          {/* Role Select Column */}
                          <td className="p-4">
                            <div className="space-y-1">
                              <select
                                value={currentRole}
                                onChange={(e) => handleRoleChange(u.uid, e.target.value as any)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                              >
                                <option value="admin">Super Admin</option>
                                <option value="staff">Admin</option>
                                <option value="staff_member">Staff</option>
                                <option value="customer">Member</option>
                              </select>
                              {isDirty && (
                                <span className="text-[9px] font-bold text-amber-600 animate-pulse block">
                                  ⚠️ Unsaved changes
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Modules Checklist Column */}
                          <td className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-[480px]">
                              {modules.map(m => {
                                const isChecked = allowed.includes(m.id);
                                return (
                                  <label
                                    key={m.id}
                                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-all hover:bg-slate-50 ${
                                      isChecked
                                        ? `${m.color} border-current`
                                        : "bg-slate-50 border-slate-250 text-slate-400"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleModuleToggle(u.uid, m.id)}
                                      className="rounded text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                                    />
                                    <span className="truncate">{m.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </td>

                          {/* Action Column */}
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              {/* Status badge */}
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                u.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                u.status === "suspended" ? "bg-rose-50 text-rose-700 border border-rose-100" :
                                "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}>
                                {u.status || "active"}
                              </span>

                              <div className="flex gap-1 mt-1.5 justify-center">
                                <button
                                  onClick={() => handleSavePermissions(u)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold transition-all shadow-sm ${
                                    isDirty
                                      ? "bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02]"
                                      : "bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-not-allowed"
                                  }`}
                                  disabled={!isDirty}
                                  title="Save updates to database"
                                >
                                  💾 Save
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition-all shadow-sm"
                                  title="Delete Account"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Pagination for access view */}
            {(() => {
              const filteredCount = usersList.filter(u => {
                const searchMatch = !accessSearch ||
                  u.displayName?.toLowerCase().includes(accessSearch.toLowerCase()) ||
                  u.email?.toLowerCase().includes(accessSearch.toLowerCase());
                const roleMatch = accessRoleFilter === "all" || u.role === accessRoleFilter;
                return searchMatch && roleMatch;
              }).length;

              return renderPaginationWithDropdown(accessPage, filteredCount, setAccessPage, accessRowsPerPage, setAccessRowsPerPage);
            })()}
          </div>
        )}

        {/* ==================== 3. BOOKINGS MANAGEMENT TAB ==================== */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            {/* Sub-Tabs Switcher */}
            <div className="flex bg-white p-1 rounded-2xl border border-slate-150 shadow-sm max-w-md">
              <button
                onClick={() => setAdminBookingsSubTab("desks")}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                  adminBookingsSubTab === "desks"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                🪑 Seats & Visits
              </button>
              <button
                onClick={() => setAdminBookingsSubTab("conference")}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                  adminBookingsSubTab === "conference"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                📋 Conference Bookings ({confBookingsList.length})
              </button>
            </div>

            {adminBookingsSubTab === "desks" ? (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Seat Booking & Site Visit Requests</h4>
                  <p className="text-xs text-slate-500">Approve inquiries, reject requests, and allot physical seat keys inside Zone-C Noida.</p>
                </div>

                {/* Desk Sub-tabs Switcher */}
                <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
                  {[
                    { id: "all", label: "All", count: bookingsList.length },
                    { id: "public_seats", label: "🌐 Inquiries", count: bookingsList.filter(b => b.type === "seat" && (b.source === "public" || !b.source)).length },
                    { id: "registered_seats", label: "🔑 Members", count: bookingsList.filter(b => b.type === "seat" && b.source === "registered").length },
                    { id: "visits", label: "🚗 Visits", count: bookingsList.filter(b => b.type === "visit").length }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setDeskBookingsFilter(tab.id as any);
                        setBookingsPage(1); // Reset page to 1 on filter change
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                        deskBookingsFilter === tab.id
                          ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                {/* SEAT ALLOTMENT OVERLAY FORM */}
                {assignSeatBooking && (
                  <form onSubmit={handleAssignSeatComplete} className="p-6 bg-blue-50 border border-blue-100 rounded-2xl mb-6 space-y-4 max-w-sm">
                    <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      Assign Seat to: <span className="text-blue-700 font-black">{assignSeatBooking.userName}</span>
                    </h5>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Choose Seat Number</label>
                      <select
                        required
                        value={assignSeatNumber}
                        onChange={e => setAssignSeatNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                      >
                        <option value="">-- Choose Seat --</option>
                        {seatsList.filter(s => s.status === "available").map(s => (
                          <option key={s.id} value={s.number}>{s.number} (Available)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Rent / Price (INR)</label>
                      <input
                        type="number"
                        required
                        value={assignSeatPrice}
                        onChange={e => setAssignSeatPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-850 font-bold"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex-1">
                        Confirm Seat Assignment
                      </button>
                      <button type="button" onClick={() => setAssignSeatBooking(null)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* EDIT BOOKING OVERLAY FORM */}
                {editBooking && (
                  <form onSubmit={handleSaveEditBooking} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-6 space-y-4 max-w-lg shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        ✏️ Edit Seat Assignment & Status
                      </h5>
                      <span className="text-[9px] text-slate-400 font-mono">ID: {editBooking.id}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Customer / Guest</label>
                        <p className="font-bold text-xs text-slate-850">{editBooking.userName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{editBooking.userEmail}</p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Request Details</label>
                        <p className="font-bold text-xs text-slate-850 uppercase font-mono">{editBooking.type === "seat" ? "Seat Booking" : "Site Visit"}</p>
                        <p className="text-[10px] text-slate-550">Date: {editBooking.date}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Set Request Status</label>
                      <select
                        value={editStatus}
                        onChange={e => setEditStatus(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        {editBooking.type === "visit" && (
                          <>
                            <option value="checked_in">Checked In (At Reception)</option>
                            <option value="checked_out">Checked Out (Exit)</option>
                            <option value="cancelled">Cancelled</option>
                          </>
                        )}
                      </select>
                    </div>

                    {editBooking.type === "visit" && (
                      <div className="space-y-4 border-t border-slate-150 pt-4">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Edit Guest & VMS Details</p>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xxs font-bold text-slate-700 mb-1">Guest Name</label>
                            <input 
                              type="text"
                              value={editVisitorName}
                              onChange={e => setEditVisitorName(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-850"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xxs font-bold text-slate-700 mb-1">Guest Phone</label>
                            <input 
                              type="text"
                              value={editVisitorPhone}
                              onChange={e => setEditVisitorPhone(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-850"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xxs font-bold text-slate-700 mb-1">Guest Email</label>
                          <input 
                            type="email"
                            value={editVisitorEmail}
                            onChange={e => setEditVisitorEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-850"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xxs font-bold text-slate-700 mb-1">Target Company</label>
                            <select
                              value={editVisitorCompanyId}
                              onChange={e => {
                                const val = e.target.value;
                                setEditVisitorCompanyId(val);
                                if (val === "synergi_default") {
                                  setEditVisitorCompanyName("Synergi Coworking Space Pvt Ltd");
                                } else {
                                  const selectedCompany = usersList.find(u => u.uid === val);
                                  setEditVisitorCompanyName(selectedCompany ? (selectedCompany.companyName || selectedCompany.displayName) : "");
                                }
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-850"
                              required
                            >
                              <option value="">-- Select Company --</option>
                              <option value="synergi_default">Synergi Coworking Space Pvt Ltd</option>
                              {usersList
                                .filter(u => u.uid !== "synergi_default" && u.role === "customer")
                                .map(u => (
                                  <option key={u.uid} value={u.uid}>
                                    {u.companyName || `${u.displayName}'s Company`}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xxs font-bold text-slate-700 mb-1">Visit Date</label>
                            <input 
                              type="date"
                              value={editVisitorDate}
                              onChange={e => setEditVisitorDate(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-850"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xxs font-bold text-slate-700 mb-1">Pass ID</label>
                            <input 
                              type="text"
                              value={editVisitorPassId}
                              onChange={e => setEditVisitorPassId(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-mono font-bold text-indigo-700"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xxs font-bold text-slate-700 mb-1">6-Digit OTP</label>
                            <input 
                              type="text"
                              maxLength={6}
                              value={editVisitorOtp}
                              onChange={e => setEditVisitorOtp(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-mono font-bold text-emerald-700"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xxs font-bold text-slate-700 mb-1">Remarks / Visit Notes</label>
                          <textarea 
                            rows={2}
                            value={editVisitorRemarks}
                            onChange={e => setEditVisitorRemarks(e.target.value)}
                            placeholder="Add host details, visitor badge requests or security remarks..."
                            className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-medium text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {editBooking.type === "seat" && editStatus === "approved" && (
                      <div className="space-y-4 border-t border-slate-100 pt-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Rent / Price (INR)</label>
                          <input
                            type="number"
                            required
                            value={editSeatPrice}
                            onChange={e => setEditSeatPrice(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-850 font-bold"
                          />
                        </div>
                        {editSeatAssignments && editSeatAssignments.length > 0 ? (
                          <div className="space-y-3">
                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Multiple Seat Assignments ({editSeatAssignments.length} seats)</p>
                            {editSeatAssignments.map((sa, idx) => (
                              <div key={idx} className="flex gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-150">
                                <div className="flex-1">
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Seat No.</label>
                                  <select
                                    value={sa.seatNumber}
                                    onChange={e => {
                                      const updated = [...editSeatAssignments];
                                      updated[idx].seatNumber = e.target.value;
                                      setEditSeatAssignments(updated);
                                    }}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-250 rounded-lg text-xxs font-mono"
                                  >
                                    <option value="">-- Choose Seat --</option>
                                    {seatsList.filter(s => s.status === "available" || s.number === sa.seatNumber).map(s => (
                                      <option key={s.id} value={s.number}>{s.number} {s.status === "occupied" && s.number === sa.seatNumber ? "(Current)" : ""}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex-1">
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Employee Name</label>
                                  <input
                                    type="text"
                                    value={sa.employeeName}
                                    onChange={e => {
                                      const updated = [...editSeatAssignments];
                                      updated[idx].employeeName = e.target.value;
                                      setEditSeatAssignments(updated);
                                    }}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-250 rounded-lg text-xxs font-sans font-bold text-slate-800"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Assign Single Seat Number</label>
                            <select
                              value={editSeatNumber}
                              onChange={e => setEditSeatNumber(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                            >
                              <option value="">-- Choose Seat --</option>
                              {seatsList.filter(s => s.status === "available" || s.number === editSeatNumber).map(s => (
                                <option key={s.id} value={s.number}>{s.number} {s.status === "occupied" && s.number === editSeatNumber ? "(Current)" : ""}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex-1 transition-all shadow-md">
                        Save Changes & Notify Member
                      </button>
                      <button type="button" onClick={() => setEditBooking(null)} className="bg-slate-250 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* BOOKINGS TABLE */}
                <div className="overflow-x-auto border border-slate-250 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-4">Customer Details & Source</th>
                        <th className="p-4">Request Type</th>
                        <th className="p-4">Seats Size</th>
                        <th className="p-4">Preferred Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions / Allocated Seats</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {displayedBookings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 italic">No seat bookings or site visit requests.</td>
                        </tr>
                      ) : (
                        displayedBookings.map(b => (
                          <tr key={b.id} className="hover:bg-slate-50">
                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-slate-900">{b.userName}</p>
                                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                    b.type === "visit"
                                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                      : b.source === "registered"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}>
                                    {b.type === "visit" ? "🚗 Corporate Visitor" : b.source === "registered" ? "🔑 Member App" : "🌐 Website Guest"}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  {b.userEmail} {b.userPhone ? `| ${b.userPhone}` : ""}
                                </p>
                                {b.type === "visit" && (
                                  <div className="mt-1 space-y-0.5 text-[10px]">
                                    <p className="text-slate-700">🏢 Host Company: <strong className="text-slate-950">{b.companyName || "N/A"}</strong></p>
                                    <p className="text-slate-600 font-mono">🎫 Pass ID: <span className="font-bold text-indigo-600">{b.passId || "N/A"}</span> | OTP: <span className="font-bold text-emerald-600">{b.otp || "N/A"}</span></p>
                                    {b.remarks && <p className="text-slate-500 italic">"Remarks: {b.remarks}"</p>}
                                    {(b.checkInTime || b.checkOutTime) && (
                                      <p className="text-[9px] text-slate-400 font-mono">
                                        {b.checkInTime && `In: ${b.checkInTime}`} {b.checkOutTime && `| Out: ${b.checkOutTime}`}
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                {b.seatAssignments && b.seatAssignments.length > 0 && (
                                  <div className="mt-2 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-w-sm">
                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Assigned Employees:</p>
                                    {b.seatAssignments.map((sa, idx) => (
                                      <div key={idx} className="text-xxs text-slate-600 font-mono flex justify-between items-center border-b border-dashed border-slate-100 last:border-0 py-0.5">
                                        <span>Seat <strong className="text-blue-600">{sa.seatNumber}</strong>:</span>
                                        <span className="font-sans font-extrabold text-slate-800">{sa.employeeName}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                b.type === "seat" ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-700"
                              }`}>
                                {b.type === "seat" ? "Seat Booking" : "Site Visit"}
                              </span>
                            </td>
                            <td className="p-4 font-bold">{b.numSeats}</td>
                            <td className="p-4 font-mono">{b.date}</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider ${
                                b.status === "approved" || b.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                b.status === "checked_in" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                                b.status === "checked_out" ? "bg-slate-100 text-slate-700 border-slate-200" :
                                b.status === "cancelled" ? "bg-slate-50 text-slate-400 border-slate-200" :
                                b.status === "rejected" || b.status === "inactive" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {b.status?.replace("_", " ")}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="space-y-2 flex flex-col items-center">
                                {b.status === "pending" && (
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={() => {
                                        if (b.type === "seat") {
                                          startEditingBooking(b);
                                        } else {
                                          handleApproveBooking(b);
                                        }
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm"
                                    >
                                      {b.type === "seat" ? "Assign Seat" : "Approve Visit"}
                                    </button>
                                    <button
                                      onClick={() => handleRejectBooking(b)}
                                      className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                                {b.type === "visit" && b.status === "approved" && (
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      onClick={async () => {
                                        try {
                                          await updateDoc(doc(db, "bookings", b.id), {
                                            status: "checked_in",
                                            checkInTime: new Date().toLocaleTimeString()
                                          });
                                          triggerToast("Visitor checked in successfully!", "success");
                                        } catch (err: any) {
                                          console.error(err);
                                        }
                                      }}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm"
                                    >
                                      Check-In (Security)
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await updateDoc(doc(db, "bookings", b.id), {
                                            status: "cancelled"
                                          });
                                          triggerToast("Visit request cancelled.", "success");
                                        } catch (err: any) {
                                          console.error(err);
                                        }
                                      }}
                                      className="bg-slate-500 hover:bg-slate-600 text-white px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                                {b.type === "visit" && b.status === "checked_in" && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, "bookings", b.id), {
                                          status: "checked_out",
                                          checkOutTime: new Date().toLocaleTimeString()
                                        });
                                        triggerToast("Visitor checked out successfully!", "success");
                                      } catch (err: any) {
                                        console.error(err);
                                      }
                                    }}
                                    className="bg-slate-700 hover:bg-slate-800 text-white px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm font-mono"
                                  >
                                    Check-Out (Exit)
                                  </button>
                                )}
                                {b.status === "approved" && b.type === "seat" && (
                                  <div className="inline-block text-left font-mono text-[11px] space-y-0.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                                    {b.seatNumber && (
                                      <p className="text-slate-600">Assigned Seat: <span className="font-extrabold text-slate-900">{b.seatNumber}</span></p>
                                    )}
                                    {b.seatAssignments && b.seatAssignments.length > 0 && (
                                      <div>
                                        <p className="text-slate-600 font-bold">Seats: <span className="text-emerald-700 font-black">{b.seatAssignments.map(s => s.seatNumber).join(", ")}</span></p>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {b.status === "rejected" && (
                                  <span className="text-[10px] text-rose-500 font-bold italic">Request Rejected</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => startEditingBooking(b)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline text-[10px] font-bold flex items-center gap-1 justify-center mt-1"
                                >
                                  ✏️ {b.type === "visit" ? "Edit / Manage Visitor" : "Edit Seat / Status"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPaginationWithDropdown(bookingsPage, filteredBookingsList.length, setBookingsPage, bookingsRowsPerPage, setBookingsRowsPerPage)}
              </div>
            ) : (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-[#673ab7] text-sm">📋 Conference Room Slot Requests</h4>
                    <p className="text-xs text-slate-500">Approve timeslot blocks, manage prices, and send automated confirmation emails.</p>
                  </div>
                  <button
                    onClick={() => handleExportCSV("conference_bookings", confBookingsList)}
                    className="self-start sm:self-center bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    📥 Export Report (CSV)
                  </button>
                </div>

                {/* CONFERENCE TABLE */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider font-mono text-[10px]">
                        <th className="p-4">Room & Company</th>
                        <th className="p-4">Booked By</th>
                        <th className="p-4">Date & Timings</th>
                        <th className="p-4">Attendees & Purpose</th>
                        <th className="p-4 text-right">Price</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {displayedConfBookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 italic">No conference room bookings found.</td>
                        </tr>
                      ) : (
                        displayedConfBookings.map(cb => (
                          <tr key={cb.id} className="hover:bg-slate-50/50">
                            <td className="p-4">
                              <p className="font-bold text-slate-900">{cb.roomName}</p>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-50 text-[#673ab7]">
                                {cb.companyName || "N/A"}
                              </span>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-slate-900">{cb.userName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{cb.userEmail}</p>
                              {cb.userPhone && <p className="text-[10px] text-slate-500 font-mono">{cb.userPhone}</p>}
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-slate-800 font-mono">{cb.date}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{cb.slot}</p>
                              <p className="text-[9px] text-purple-600 font-bold font-mono">Preset: {cb.durationType ? cb.durationType.toUpperCase() : "N/A"}</p>
                            </td>
                            <td className="p-4 max-w-xs">
                              <p className="text-[10px] text-slate-500 font-sans">Meeting Type: <span className="font-bold text-slate-800">{cb.meetingType || "Team Sync"}</span></p>
                              <p className="text-[10px] text-slate-500">Pax size: <span className="font-bold text-slate-800">{cb.attendees || 1}</span></p>
                              <p className="text-[11px] text-slate-700 italic mt-1 font-medium">"{cb.purpose || "N/A"}"</p>
                              {cb.remarks && <p className="text-[10px] text-slate-400 mt-1 font-mono">Remarks: {cb.remarks}</p>}
                            </td>
                            <td className="p-4 text-right font-bold text-slate-900 font-mono">
                              INR {cb.totalPrice}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                cb.status === "approved"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : cb.status === "rejected"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {cb.status}
                              </span>
                            </td>
                            <td className="p-4">
                              {cb.status === "pending" ? (
                                <div className="flex flex-col gap-1.5 items-center">
                                  <button
                                    onClick={() => handleApproveConfBooking(cb)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm"
                                  >
                                    Approve Slot
                                  </button>
                                  <button
                                    onClick={() => handleRejectConfBooking(cb)}
                                    className="w-full bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic text-center block">Handled</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPaginationWithDropdown(confBookingsPage, confBookingsList.length, setConfBookingsPage, confBookingsRowsPerPage, setConfBookingsRowsPerPage)}
              </div>
            )}
          </div>
        )}

        {/* ==================== 4. CONFERENCE ROOMS TAB ==================== */}
        {activeTab === "rooms" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Conference & Meeting Rooms setup</h4>
                <p className="text-xs text-slate-500">Configure meeting locations, seating sizes, and prices.</p>
              </div>
              <button 
                onClick={() => {
                  setEditRoomId(null);
                  setRoomFormName("");
                  setRoomFormCapacity(10);
                  setRoomFormPrice(500);
                  setRoomFormType("Conference Room");
                  setShowRoomModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-md"
              >
                <Plus className="w-4 h-4" /> Add Room
              </button>
            </div>

            {showRoomModal && (
              <form onSubmit={handleCreateRoom} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-6 space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {editRoomId ? `Edit Room Configuration` : "Add New Room"}
                  </h5>
                </div>
                <div className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Room Name</label>
                    <input 
                      type="text" 
                      required 
                      value={roomFormName}
                      onChange={e => setRoomFormName(e.target.value)}
                      placeholder="e.g. Media Suite" 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Room Type</label>
                    <select
                      required
                      value={roomFormType}
                      onChange={e => setRoomFormType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Conference Room">Conference Room</option>
                      <option value="Meeting Room">Meeting Room</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Seating Capacity</label>
                    <input 
                      type="number" 
                      required 
                      value={roomFormCapacity}
                      onChange={e => setRoomFormCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Price per Hour (INR)</label>
                    <input 
                      type="number" 
                      required 
                      value={roomFormPrice}
                      onChange={e => setRoomFormPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all">
                    {editRoomId ? "Update Room" : "Save Room"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowRoomModal(false);
                      setEditRoomId(null);
                      setRoomFormName("");
                      setRoomFormCapacity(10);
                      setRoomFormPrice(500);
                      setRoomFormType("Conference Room");
                    }} 
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid sm:grid-cols-3 gap-6">
              {roomsList.map(r => (
                <div key={r.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <h5 className="font-extrabold text-slate-900 text-sm">{r.name}</h5>
                    <div className="flex gap-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                        {r.type || "Conference Room"}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Seating Capacity: <span className="font-bold text-slate-800">{r.capacity} Members</span></p>
                    <p className="text-xs text-slate-500">Pricing Rate: <span className="font-bold text-blue-600">INR {r.pricePerHour} / hour</span></p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setEditRoomId(r.id);
                        setRoomFormName(r.name);
                        setRoomFormCapacity(r.capacity);
                        setRoomFormPrice(r.pricePerHour);
                        setRoomFormType(r.type || "Conference Room");
                        setShowRoomModal(true);
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-2 rounded-xl text-xs flex-1 transition-all flex items-center justify-center gap-1 border border-blue-200"
                    >
                      Edit Room
                    </button>
                    <button 
                      onClick={() => {
                        triggerConfirm(
                          "Remove Room Configuration",
                          `Are you sure you want to delete "${r.name}" setup?`,
                          async () => {
                            try {
                              await deleteDoc(doc(db, "conferenceRooms", r.id));
                              triggerToast("Room configuration deleted.", "success");
                            } catch (err) {
                              console.error(err);
                              triggerToast("Failed to delete room configuration.", "error");
                            }
                          }
                        );
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-2 rounded-xl text-xs flex-1 transition-all flex items-center justify-center gap-1 border border-rose-200"
                    >
                      Delete Room Setup
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== SEATS SETUP TAB ==================== */}
        {activeTab === "seats" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Seats & Workstation Pods setup</h4>
                <p className="text-xs text-slate-500">Configure unique physical seats, bulk generate seats, and manage monthly rental rates.</p>
              </div>
            </div>

            {/* SEAT PRICE CONFIGURATION CARD (Dynamic editable price set by admin) */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <h5 className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider">Dynamic Seat Pricing Rate</h5>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 max-w-md">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Standard Monthly Seat Rent (INR)</label>
                  <input
                    type="number"
                    value={customSeatPrice}
                    onChange={e => setCustomSeatPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    placeholder="e.g. 6999"
                  />
                </div>
                <button
                  type="button"
                  disabled={isUpdatingPrice}
                  onClick={async () => {
                    if (customSeatPrice <= 0) {
                      triggerToast("Price must be greater than zero.", "error");
                      return;
                    }
                    setIsUpdatingPrice(true);
                    try {
                      await setDoc(doc(db, "settings", "global"), {
                        ...settings,
                        seatPrice: Number(customSeatPrice)
                      }, { merge: true });
                      triggerToast("Dynamic per-seat monthly price updated successfully!", "success");
                    } catch (err: any) {
                      console.error(err);
                      triggerToast("Failed to update seat price: " + err.message, "error");
                    } finally {
                      setIsUpdatingPrice(false);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shrink-0 h-9 flex items-center justify-center"
                >
                  {isUpdatingPrice ? "Updating..." : "Update Seat Price"}
                </button>
              </div>
              <p className="text-xxs text-slate-400">Note: This dynamic pricing is applied in real-time across new user seat allocations and license contracts. It is editable strictly by administrators.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* SINGLE SEAT CREATION */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <h5 className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider">Create Single Workstation Seat</h5>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const num = singleSeatNumber.trim();
                    if (!num) return;
                    if (seatsList.some(s => s.number === num)) {
                      triggerToast(`Seat number "${num}" already exists!`, "error");
                      return;
                    }
                    try {
                      await setDoc(doc(db, "seats", num), {
                        id: num,
                        number: num,
                        occupied: false,
                        status: "available"
                      });
                      triggerToast(`Seat "${num}" created successfully!`, "success");
                      setSingleSeatNumber("");
                    } catch (err: any) {
                      console.error(err);
                      triggerToast("Error creating seat: " + err.message, "error");
                    }
                  }} 
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unique Seat Number / ID</label>
                    <input
                      type="text"
                      required
                      value={singleSeatNumber}
                      onChange={e => setSingleSeatNumber(e.target.value)}
                      placeholder="e.g. C-11, Seat-24"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-sm"
                  >
                    Add Seat
                  </button>
                </form>
              </div>

              {/* BULK SEAT CREATION (How many seats they have) */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <h5 className="font-bold text-xs text-slate-900 border-b border-slate-200 pb-2 uppercase tracking-wider">Bulk Workstations Generator</h5>
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!bulkSeatCount || bulkSeatCount <= 0) {
                      triggerToast("Please enter a valid count of seats.", "error");
                      return;
                    }
                    try {
                      const seatBatch = writeBatch(db);
                      let createdCount = 0;
                      for (let i = 1; i <= bulkSeatCount; i++) {
                        const seatNum = `${bulkSeatPrefix}${i}`;
                        // Check duplicate
                        const exists = seatsList.some(s => s.number === seatNum);
                        if (!exists) {
                          const seatId = seatNum;
                          const ref = doc(db, "seats", seatId);
                          seatBatch.set(ref, {
                            id: seatId,
                            number: seatNum,
                            occupied: false,
                            status: "available"
                          });
                          createdCount++;
                        }
                      }
                      if (createdCount > 0) {
                        await seatBatch.commit();
                        triggerToast(`Successfully generated ${createdCount} new unique seats in the workspace!`, "success");
                      } else {
                        triggerToast("All specified seat numbers already exist.", "info");
                      }
                    } catch (err: any) {
                      console.error(err);
                      triggerToast("Error bulk creating seats: " + err.message, "error");
                    }
                  }} 
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Prefix Name</label>
                      <input
                        type="text"
                        required
                        value={bulkSeatPrefix}
                        onChange={e => setBulkSeatPrefix(e.target.value)}
                        placeholder="e.g. Seat-"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Total Seats (Number)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        value={bulkSeatCount}
                        onChange={e => setBulkSeatCount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-md"
                  >
                    Generate Workspace Seats
                  </button>
                </form>
              </div>
            </div>

            {/* SEAT INVENTORY DIRECTORY */}
            <div className="space-y-4">
              <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Workspace Seat Inventory ({seatsList.length} total seats)</h5>
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider font-mono text-[10px]">
                      <th className="p-4">Seat ID / Number</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Occupied By</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {seatsList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 italic">No seats setup yet. Please generate some.</td>
                      </tr>
                    ) : (
                      displayedSeatsList.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-4 font-mono font-bold text-slate-900">{s.number}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              s.status === "occupied" ? "bg-rose-50 text-rose-700" :
                              s.status === "maintenance" ? "bg-amber-50 text-amber-700" :
                              "bg-emerald-50 text-emerald-700"
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="p-4">
                            {s.status === "occupied" ? (
                              <div className="space-y-1">
                                <div className="bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md inline-block">
                                  <p className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Employee (Sitting)</p>
                                  <p className="text-slate-900 font-extrabold text-[11px]">{s.assignedToName || "Anonymous"}</p>
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium">
                                  <span className="text-slate-400 font-semibold">Booked By: </span>
                                  <span className="font-bold text-slate-700">{s.bookedByName || "Registered Member"}</span>
                                </div>
                                <p className="text-[9px] text-slate-400 font-mono">{s.occupiedByEmail}</p>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono text-xxs">--</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex gap-2 justify-center">
                              {s.status === "occupied" && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    triggerConfirm(
                                      "Vacate Seat",
                                      `Are you sure you want to vacate seat ${s.number}? This will reset its status to available.`,
                                      async () => {
                                        try {
                                          await updateDoc(doc(db, "seats", s.id), {
                                            occupied: false,
                                            status: "available",
                                            assignedToName: "",
                                            occupiedByEmail: ""
                                          });
                                          triggerToast(`Seat ${s.number} is now available!`, "success");
                                        } catch (err: any) {
                                          console.error(err);
                                          triggerToast("Error vacating seat: " + err.message, "error");
                                        }
                                      }
                                    );
                                  }}
                                  className="text-amber-600 hover:text-amber-700 text-xxs font-bold uppercase tracking-wider"
                                >
                                  Vacate Seat
                                </button>
                              )}
                              {s.status === "available" && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await updateDoc(doc(db, "seats", s.id), {
                                        status: "maintenance"
                                      });
                                      triggerToast(`Seat ${s.number} moved to maintenance.`, "info");
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="text-amber-600 hover:text-amber-700 text-xxs font-bold uppercase tracking-wider"
                                >
                                  Put Maintenance
                                </button>
                              )}
                              {s.status === "maintenance" && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await updateDoc(doc(db, "seats", s.id), {
                                        status: "available"
                                      });
                                      triggerToast(`Seat ${s.number} is now available!`, "success");
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  className="text-emerald-600 hover:text-emerald-700 text-xxs font-bold uppercase tracking-wider"
                                >
                                  Make Available
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  triggerConfirm(
                                    "Delete Seat",
                                    `Are you sure you want to permanently delete unique seat ${s.number}?`,
                                    async () => {
                                      try {
                                        await deleteDoc(doc(db, "seats", s.id));
                                        triggerToast(`Seat ${s.number} deleted from inventory.`, "success");
                                      } catch (err: any) {
                                        console.error(err);
                                        triggerToast("Error deleting seat: " + err.message, "error");
                                      }
                                    }
                                  );
                                }}
                                className="text-rose-600 hover:text-rose-700 text-xxs font-bold uppercase tracking-wider"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {renderPaginationWithDropdown(seatsPage, seatsList.length, setSeatsPage, seatsRowsPerPage, setSeatsRowsPerPage)}
            </div>
          </div>
        )}

        {/* ==================== 5. FEES COLLECTION LEDGER TAB ==================== */}
        {activeTab === "payments" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6 animate-fade-in">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Clearance Verification Ledger</h4>
              <p className="text-xs text-slate-500">Audit manual bank transfer coordinates, transaction UTRs, and payment receipts to issue official GST invoices.</p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                    <th className="p-4">Customer Email</th>
                    <th className="p-4">Payment Method & Cycle</th>
                    <th className="p-4">Billing Period</th>
                    <th className="p-4">Dues Amount</th>
                    <th className="p-4">UTR Ref / Remarks</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Receipt Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">No rental verification receipts submitted yet.</td>
                    </tr>
                  ) : (
                    displayedPayments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{p.userEmail}</p>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {p.id.slice(0, 8)}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                            {p.paymentMethod || "Bank Transfer"}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1 font-medium">Cycle: {p.billingCycle || p.month || "Monthly"}</p>
                        </td>
                        <td className="p-4 text-slate-600 font-mono">
                          {p.billingPeriodFrom && p.billingPeriodTo ? (
                            <span>{p.billingPeriodFrom} to {p.billingPeriodTo}</span>
                          ) : (
                            <span className="text-slate-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-slate-900 font-mono">INR {p.amount}</td>
                        <td className="p-4">
                          <p className="font-mono text-slate-800 font-semibold">{p.utr || "N/A"}</p>
                          {p.remarks && (
                            <p className="text-[10px] text-slate-400 italic mt-1 max-w-xs truncate" title={p.remarks}>
                              Tenant Note: "{p.remarks}"
                            </p>
                          )}
                          {p.remarks === undefined && <span className="text-xxs text-slate-300">No notes provided</span>}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xxs font-bold uppercase tracking-wider ${
                            p.status === "paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            p.status === "overdue" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                            "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3 justify-center">
                            {p.screenshotUrl && (
                              <a 
                                href={p.screenshotUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-slate-200 shrink-0 flex items-center justify-center gap-1"
                              >
                                <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
                                View Receipt
                              </a>
                            )}
                            
                            {p.status === "pending" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleVerifyPayment(p, "paid")}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleVerifyPayment(p, "overdue")}
                                  className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-xs"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {renderPaginationWithDropdown(paymentsPage, paymentsList.length, setPaymentsPage, paymentsRowsPerPage, setPaymentsRowsPerPage)}
          </div>
        )}

        {/* ==================== 6. DIGITAL AGREEMENTS TAB ==================== */}
        {activeTab === "agreements" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6">
            {/* SUB-TABS NAVIGATION */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveAgreementsSubTab("contracts")}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
                  activeAgreementsSubTab === "contracts"
                    ? "border-blue-600 text-blue-600 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Leave & License Contracts
              </button>
              <button
                onClick={() => setActiveAgreementsSubTab("reg_forms")}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
                  activeAgreementsSubTab === "reg_forms"
                    ? "border-blue-600 text-blue-600 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Registration Forms Review
              </button>
            </div>

            {activeAgreementsSubTab === "contracts" && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Leave & License Contracts Ledger</h4>
                  <p className="text-xs text-slate-500">Track contract expiration dates and manage seat booking agreements of physical Zone-C Noida.</p>
                </div>

                <div className="overflow-x-auto border border-slate-250 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-4">Member Name</th>
                        <th className="p-4">Seat ID</th>
                        <th className="p-4">Rent Amount</th>
                        <th className="p-4">Expiry Timeline</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Contracts Renewal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {displayedAgreements.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                            No active contracts found.
                          </td>
                        </tr>
                      ) : (
                        displayedAgreements.map(agr => (
                          <tr key={agr.id} className="hover:bg-slate-50">
                            <td className="p-4">
                              <p className="font-bold text-slate-900">{agr.userName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{agr.userEmail}</p>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-800">Seat {agr.seatNumber}</td>
                            <td className="p-4 font-bold">INR {agr.rentAmount}</td>
                            <td className="p-4 font-mono text-slate-500">{agr.startDate} to {agr.endDate}</td>
                            <td className="p-4">
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                                {agr.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={async () => {
                                  const dateObj = new Date(agr.endDate);
                                  dateObj.setMonth(dateObj.getMonth() + 11); // extend contract for another 11 months
                                  const nextDateStr = dateObj.toISOString().split("T")[0];
                                  await updateDoc(doc(db, "agreements", agr.id), {
                                    endDate: nextDateStr,
                                    status: "active"
                                  });
                                  alert(`Extended Leave & License contract of ${agr.userName} to ${nextDateStr}!`);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-[10px] font-bold"
                              >
                                Auto-Renew 11 Mos
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPaginationWithDropdown(agreementsPage, agreementsList.length, setAgreementsPage, agreementsRowsPerPage, setAgreementsRowsPerPage)}
              </div>
            )}

            {activeAgreementsSubTab === "reg_forms" && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Synergi Registration Forms Review Panel</h4>
                  <p className="text-xs text-slate-500">Review digital corporate registration forms and physical scanned copies uploaded by coworkers for verification.</p>
                </div>

                <div className="overflow-x-auto border border-slate-250 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-4">Coworker Email</th>
                        <th className="p-4">Submission Type</th>
                        <th className="p-4">Company Name</th>
                        <th className="p-4">Submitted Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {displayedRegForms.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                            No registration forms submitted yet.
                          </td>
                        </tr>
                      ) : (
                        displayedRegForms.map((form: any) => (
                          <tr key={form.id} className="hover:bg-slate-50">
                            <td className="p-4">
                              <p className="font-bold text-slate-900">{form.userEmail}</p>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                form.submissionType === "digital" ? "bg-purple-50 text-purple-700" : "bg-cyan-50 text-cyan-700"
                              }`}>
                                {form.submissionType === "digital" ? "Digital Form" : "Scanned Upload"}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-slate-800">
                              {form.submissionType === "digital" 
                                ? (form.formData?.companyName || "N/A") 
                                : "Physical Scanned Copy"}
                            </td>
                            <td className="p-4 font-mono text-slate-500">
                              {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : "N/A"}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                form.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                                form.status === "rejected" ? "bg-rose-50 text-rose-700" :
                                "bg-amber-50 text-amber-700"
                              }`}>
                                {form.status?.replace("_", " ")}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedRegForm(form);
                                  setRegFormReviewNotes(form.reviewNotes || "");
                                }}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded text-[10px] font-bold"
                              >
                                Review Form
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPaginationWithDropdown(regFormsPage, registrationForms.length, setRegFormsPage, regFormsRowsPerPage, setRegFormsRowsPerPage)}
              </div>
            )}
          </div>
        )}

        {/* ==================== 7. SUPPORT TICKETS TAB ==================== */}
        {activeTab === "complaints" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Support Service complaints</h4>
              <p className="text-xs text-slate-500">Review infrastructure tickets filed by coworkers. Assign venue staff and track resolution stages.</p>
            </div>

            <div className="overflow-x-auto border border-slate-250 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Reporter Name</th>
                    <th className="p-4">Ticket category</th>
                    <th className="p-4">Issue Description</th>
                    <th className="p-4">Assigned Staff</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedComplaints.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{c.userName || "Customer"}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{c.userEmail}</p>
                      </td>
                      <td className="p-4">
                        <span className="bg-rose-50 text-rose-700 font-bold px-2.5 py-0.5 rounded text-[10px] uppercase">
                          {c.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 max-w-xs truncate" title={c.description}>
                        {c.description}
                      </td>
                      <td className="p-4 font-bold text-blue-600">
                        {c.assignedStaff || "Unassigned"}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.status === "resolved" ? "bg-emerald-50 text-emerald-700" :
                          c.status === "in_progress" ? "bg-amber-50 text-amber-700" :
                          "bg-rose-50 text-rose-700"
                        }`}>
                          {c.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            setEditingComplaint(c);
                            setEditComplaintStaff(c.assignedStaff || "");
                            setEditComplaintStatus(c.status || "open");
                            setEditComplaintAdminNotes((c as any).adminNotes || "");
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-sm flex items-center gap-1 mx-auto"
                        >
                          <Edit className="w-3 h-3" /> Edit & Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPaginationWithDropdown(complaintsPage, complaintsList.length, setComplaintsPage, complaintsRowsPerPage, setComplaintsRowsPerPage)}

            {/* MODERN DETAILED SUPPORT TICKET UPDATE DIALOG */}
            {editingComplaint && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-left">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Update Support Complaint</h4>
                      <p className="text-[11px] text-slate-500">Ticket ID: {editingComplaint.id}</p>
                    </div>
                    <button 
                      onClick={() => setEditingComplaint(null)}
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleUpdateComplaint} className="p-6 space-y-4">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500 font-bold">REPORTER</span>
                        <span className="font-mono text-slate-800 font-bold">{editingComplaint.userName} ({editingComplaint.userEmail})</span>
                      </div>
                      <div className="flex justify-between text-[11px] border-t border-slate-200/60 pt-2">
                        <span className="text-slate-500 font-bold">CATEGORY</span>
                        <span className="font-bold text-rose-600 uppercase">{editingComplaint.category}</span>
                      </div>
                      <div className="border-t border-slate-200/60 pt-2">
                        <span className="block text-[11px] text-slate-500 font-bold mb-1">DESCRIPTION</span>
                        <p className="text-xs text-slate-700 leading-normal max-h-24 overflow-y-auto whitespace-pre-line">{editingComplaint.description}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Assign Coordinator / Staff</label>
                      <select
                        value={editComplaintStaff}
                        onChange={e => setEditComplaintStaff(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                      >
                        <option value="">Unassigned</option>
                        {usersList
                          .filter(u => u.role === "admin" || u.role === "staff" || u.role === "staff_member" || u.role === "superadmin")
                          .map(u => {
                            const roleLabel = u.role === "admin" ? "Super Admin" : u.role === "superadmin" ? "Super Admin" : u.role === "staff" ? "Admin" : "Staff/Coordinator";
                            return (
                              <option key={u.uid} value={u.displayName}>
                                {u.displayName} ({roleLabel})
                              </option>
                            );
                          })}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Or type a custom coordinator name below:</p>
                      <input 
                        type="text"
                        placeholder="Type custom staff name..."
                        value={editComplaintStaff}
                        onChange={e => setEditComplaintStaff(e.target.value)}
                        className="w-full mt-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ticket Resolution Status</label>
                      <select
                        value={editComplaintStatus}
                        onChange={e => setEditComplaintStatus(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                      >
                        <option value="open">Open (Unresolved / New)</option>
                        <option value="in_progress">In Progress (Active Work)</option>
                        <option value="resolved">Resolved (Closed)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Admin Resolution Notes / Remarks</label>
                      <textarea
                        rows={3}
                        placeholder="Describe the action taken to resolve this ticket..."
                        value={editComplaintAdminNotes}
                        onChange={e => setEditComplaintAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-blue-500"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingComplaint(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-100"
                      >
                        Save Ticket Details
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 8. BROADCAST NOTIFICATIONS DISPATCHER TAB ==================== */}
        {activeTab === "notifications" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm max-w-2xl">
            <h4 className="font-bold text-slate-900 text-sm">Unified Broadcast Alert Dispatcher</h4>
            <p className="text-xs text-slate-500 mb-6">Dispatch customized Email/In-App alerts to coworkers regarding billing cycles, venue renovations, or maintenance schedules.</p>

            <form onSubmit={handleDispatchNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Members Audience</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center text-xs font-bold gap-1 text-slate-700">
                    <input 
                      type="radio" 
                      value="all" 
                      checked={notificationTarget === "all"} 
                      onChange={() => setNotificationTarget("all")} 
                      className="text-blue-600"
                    />
                    Broadcast to All Active Members ({usersList.length})
                  </label>
                  <label className="inline-flex items-center text-xs font-bold gap-1 text-slate-700">
                    <input 
                      type="radio" 
                      value="single" 
                      checked={notificationTarget === "single"} 
                      onChange={() => setNotificationTarget("single")} 
                      className="text-blue-600"
                    />
                    Direct Message to Single Member
                  </label>
                </div>
              </div>

              {notificationTarget === "single" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Member Email</label>
                  <input 
                    type="email"
                    placeholder="e.g. coworker@example.com"
                    value={notificationEmail}
                    onChange={e => setNotificationEmail(e.target.value)}
                    required={notificationTarget === "single"}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-850 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Alert Headline Title</label>
                <input 
                  type="text"
                  placeholder="e.g. July Seat Licensing Fees Invoice Due"
                  required
                  value={notificationTitle}
                  onChange={e => setNotificationTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-850 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Alert Content Description</label>
                <textarea
                  rows={5}
                  placeholder="Draft your detailed announcement block here..."
                  required
                  value={notificationBody}
                  onChange={e => setNotificationBody(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-850 focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={notificationLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
              >
                {notificationLoading ? "Broadcasting..." : "Dispatch Notification Block"}
              </button>
            </form>
          </div>
        )}

        {/* ==================== 9. SUPER ADMIN PAYMENT SETTINGS TAB ==================== */}
        {activeTab === "superadmin" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm max-w-4xl space-y-8 animate-fade-in">
            <div className="flex gap-3 items-center text-blue-600 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <FolderLock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">Global Payment & Billing Settings</h4>
                <p className="text-xs text-slate-500">Configure central corporate identity, bank transfer coordinates, UPI accounts, and default billing cycles.</p>
              </div>
            </div>

            <form onSubmit={handleSaveSuperAdminSettings} className="space-y-8">
              
              {/* COMPANY INFORMATION */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-6">
                <div className="border-b border-slate-200 pb-2">
                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Company Information</h5>
                  <p className="text-[10px] text-slate-500">Corporate identity data rendered dynamically on tenant payment boards.</p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Company Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={superCompanyName}
                      onChange={e => setSuperCompanyName(e.target.value)}
                      placeholder="e.g. Synergi Coworking Spaces Ltd"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">GST Number</label>
                    <input 
                      type="text" 
                      value={superGstNumber}
                      onChange={e => setSuperGstNumber(e.target.value)}
                      placeholder="e.g. 09AAACS4129M1ZP"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>



                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Registered Office Address <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={superAddress}
                      onChange={e => setSuperAddress(e.target.value)}
                      placeholder="Corporate Head Office, Noida, Sector 62"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Support Email <span className="text-rose-500">*</span></label>
                    <input 
                      type="email" 
                      required
                      value={superSupportEmail}
                      onChange={e => setSuperSupportEmail(e.target.value)}
                      placeholder="billing@synergispaces.com"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Support Mobile <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={superSupportMobile}
                      onChange={e => setSuperSupportMobile(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Broadcast Support Number</label>
                    <input 
                      type="text" 
                      value={superWhatsapp}
                      onChange={e => setSuperWhatsapp(e.target.value)}
                      placeholder="e.g. 919876543210"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Operations Main Phone (General)</label>
                    <input 
                      type="text" 
                      value={superPhone}
                      onChange={e => setSuperPhone(e.target.value)}
                      placeholder="0120-4567890"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* BANK DETAILS */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Bank Transfer Details</h5>
                  <p className="text-[10px] text-slate-500">Add secure corporate account details for wire and NEFT/IMPS transfers.</p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={superAccountHolderName}
                      onChange={e => setSuperAccountHolderName(e.target.value)}
                      placeholder="e.g. SYNERGI COWORKING CO"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={superBankName}
                      onChange={e => setSuperBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank Ltd"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={superBranchName}
                      onChange={e => setSuperBranchName(e.target.value)}
                      placeholder="e.g. Sector 18 Corporate Branch, Noida"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Number <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={superAccountNo}
                      onChange={e => setSuperAccountNo(e.target.value)}
                      placeholder="e.g. 50200045612398"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={superIfscCode}
                      onChange={e => setSuperIfscCode(e.target.value)}
                      placeholder="e.g. HDFC0000088"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Branch Address / Coordinates</label>
                    <input 
                      type="text" 
                      value={superBankAddress}
                      onChange={e => setSuperBankAddress(e.target.value)}
                      placeholder="Noida UP, India"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* UPI DETAILS */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider">UPI & Merchant QR Configuration</h5>
                  <p className="text-[10px] text-slate-500">Provide VPA addresses and QR graphics for express scanner layouts.</p>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">UPI ID <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={superUpiId}
                      onChange={e => setSuperUpiId(e.target.value)}
                      placeholder="e.g. synergi@ybl"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Merchant Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={superMerchantName}
                      onChange={e => setSuperMerchantName(e.target.value)}
                      placeholder="e.g. Synergi Spaces Noida"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">UPI QR Code Image (URL or Upload below) <span className="text-rose-500">*</span></label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        value={superQrCodeUrl}
                        onChange={e => setSuperQrCodeUrl(e.target.value)}
                        placeholder="https://example.com/qr.png"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <label className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 flex items-center justify-center gap-1">
                        <UploadCloud className="w-4 h-4" />
                        {qrUploading ? "Uploading..." : "Upload QR"}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleQrUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                    {superQrCodeUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={superQrCodeUrl} alt="QR Code preview" className="h-24 w-24 object-contain border border-slate-200 p-1 rounded bg-white" />
                        <span className="text-[10px] text-slate-400 font-mono truncate">{superQrCodeUrl}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>



              <button
                type="submit"
                disabled={superAdminLoading || logoUploading || qrUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-6 rounded-xl text-xs sm:text-sm transition-all shadow-md w-full flex items-center justify-center gap-2"
              >
                {superAdminLoading ? "Saving Configurations..." : "Save Payment Settings"}
              </button>
            </form>

            {/* GOOGLE DRIVE INTEGRATION CARD */}
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm mt-8 space-y-4">
              <div className="flex gap-3 items-center text-emerald-600 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.43 12.98l-6.29-10.9c-.31-.53-.88-.87-1.51-.87s-1.2.34-1.51.87L3.83 12.98c-.31.53-.31 1.2 0 1.73l6.29 10.9c.31.53.88.87 1.51.87s1.2-.34 1.51-.87l6.29-10.9c.31-.53.31-1.2 0-1.73zm-7.8 7.3l-3.14-5.46h6.29l-3.15 5.46zm-4.32-7.5l3.14-5.44 3.14 5.44H7.31z"/>
                  </svg>
                </div>
                <div>
                  <h5 className="font-bold text-sm text-slate-900">Google Drive Document Synchronization</h5>
                  <p className="text-xs text-slate-500 font-medium">Enable automatic cloud backups of all Coworker digital forms and uploaded attachments.</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  By connecting Google Drive, any scanned registration forms, payment receipts, or agreement documents uploaded through the coworking portal will automatically be saved directly inside your Google Drive storage. The live viewable links are stored instantly in the database.
                </p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${googleDriveConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
                      <span className="text-xs font-bold text-slate-800">
                        Status: {googleDriveConnected ? "Active & Syncing" : "Not Linked"}
                      </span>
                    </div>
                    {googleDriveConnected ? (
                      <p className="text-[10px] text-slate-500 font-medium">
                        Linked Account: <span className="text-slate-800 font-bold">{googleDriveEmail}</span> (Updated {googleDriveConnectedAt})
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 font-medium">
                        Recommended account: <span className="font-bold text-slate-600">mis@ipanelklean.com</span>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectGoogleDrive}
                    disabled={connectingDrive}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 ${
                      googleDriveConnected
                        ? "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.43 12.98l-6.29-10.9c-.31-.53-.88-.87-1.51-.87s-1.2.34-1.51.87L3.83 12.98c-.31.53-.31 1.2 0 1.73l6.29 10.9c.31.53.88.87 1.51.87s1.2-.34 1.51-.87l6.29-10.9c.31-.53.31-1.2 0-1.73zm-7.8 7.3l-3.14-5.46h6.29l-3.15 5.46zm-4.32-7.5l3.14-5.44 3.14 5.44H7.31z"/>
                    </svg>
                    {connectingDrive ? "Authenticating..." : googleDriveConnected ? "Reconnect Google Drive" : "Connect Google Drive"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 10. REVIEWS APPROVAL TAB ==================== */}
        {activeTab === "reviews" && (
          <div className="space-y-8 animate-fade-in">
            {/* Header / Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 fill-slate-500 text-slate-500" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900">{reviewsList.length}</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Reviews</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-amber-500 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900">{reviewsList.filter(r => !r.published).length}</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Pending Approval</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900">{reviewsList.filter(r => r.published).length}</h4>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Published Reviews</p>
                </div>
              </div>
            </div>

            {/* Main Area */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              
              {/* Left Column: Pending Reviews */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Pending Verification ({reviewsList.filter(r => !r.published).length})
                </h3>
                
                {reviewsList.filter(r => !r.published).length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border border-slate-150 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">No pending reviews requiring verification.</p>
                  </div>
                ) : (
                  reviewsList.filter(r => !r.published).map((rev) => (
                    <ReviewAdminCard 
                      key={rev.id} 
                      rev={rev} 
                      onApprove={handleApproveReview}
                      onDelete={handleDeleteReview}
                      onReply={handleReplyReview}
                    />
                  ))
                )}
              </div>

              {/* Right Column: Published Reviews */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  Published Reviews ({reviewsList.filter(r => r.published).length})
                </h3>

                {reviewsList.filter(r => r.published).length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border border-slate-150 shadow-sm">
                    <p className="text-sm text-slate-500 font-medium">No published reviews in database yet.</p>
                  </div>
                ) : (
                  reviewsList.filter(r => r.published).map((rev) => (
                    <ReviewAdminCard 
                      key={rev.id} 
                      rev={rev} 
                      onApprove={handleApproveReview}
                      onDelete={handleDeleteReview}
                      onReply={handleReplyReview}
                    />
                  ))
                )}
              </div>

            </div>
          </div>
        )}

        {/* ==================== 11. SECURITY & RECEPTION DESK ==================== */}
        {activeTab === "security" && (
          <div className="space-y-8 animate-fade-in text-left">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl">
              <div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <span>🔒 Reception & Security Gate Management</span>
                </h2>
                <p className="text-xs text-indigo-200 mt-1">Verify visitor QR passes, digital OTP access codes, and register on-the-spot guest entries.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowWalkInModal(true)}
                className="bg-white hover:bg-slate-100 text-slate-900 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
              >
                ➕ Register Walk-In Guest
              </button>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Passes Today</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">
                  {bookingsList.filter(b => b.type === "visit" && b.status === "approved").length}
                </h4>
                <div className="mt-2 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Currently Inside (In)</p>
                <h4 className="text-2xl font-black text-indigo-700 mt-1">
                  {bookingsList.filter(b => b.type === "visit" && b.status === "checked_in").length}
                </h4>
                <div className="mt-2 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: "45%" }}></div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Checked-Out Today</p>
                <h4 className="text-2xl font-black text-emerald-700 mt-1">
                  {bookingsList.filter(b => b.type === "visit" && b.status === "checked_out").length}
                </h4>
                <div className="mt-2 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: "80%" }}></div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Visit Bookings</p>
                <h4 className="text-2xl font-black text-slate-600 mt-1">
                  {bookingsList.filter(b => b.type === "visit").length}
                </h4>
                <div className="mt-2 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>
            </div>

            {/* Instant Verification Scanner Mock */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm">🎫 Instant Pass & OTP Guard Check</h3>
                <p className="text-xs text-slate-500">Scan or type the visitor's Pass ID (e.g., SYN-W-XXXXXX) or their 6-Digit OTP code to authorize instantly.</p>
              </div>

              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                  <input
                    type="text"
                    placeholder="Enter Pass ID, OTP, Guest Name or Contact details..."
                    value={securitySearchQuery}
                    onChange={(e) => setSecuritySearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                {securitySearchQuery && (
                  <button
                    onClick={() => setSecuritySearchQuery("")}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-bold transition-all"
                  >
                    Clear Search
                  </button>
                )}
              </div>

              {/* Exact verified card if search query matches exactly with a pass ID or OTP */}
              {(() => {
                const queryClean = securitySearchQuery.trim().toUpperCase();
                if (!queryClean) return null;

                const matchedVisits = bookingsList.filter(b => 
                  b.type === "visit" && (
                    (b.passId && b.passId.toUpperCase() === queryClean) ||
                    (b.otp && b.otp === queryClean) ||
                    (b.userName && b.userName.toUpperCase().includes(queryClean)) ||
                    (b.userPhone && b.userPhone.includes(queryClean))
                  )
                );

                if (matchedVisits.length === 0) return null;

                return (
                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">🎯 Search Results / Access Authorization Match ({matchedVisits.length})</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {matchedVisits.map(visit => {
                        const isApproved = visit.status === "approved";
                        const isInside = visit.status === "checked_in";
                        
                        return (
                          <div key={visit.id} className="border border-indigo-200 bg-indigo-50/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden">
                            <div className="absolute right-3 top-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                visit.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                                visit.status === "checked_in" ? "bg-indigo-50 text-indigo-700 animate-pulse" :
                                visit.status === "checked_out" ? "bg-slate-100 text-slate-600" :
                                "bg-rose-50 text-rose-700"
                              }`}>
                                {visit.status}
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-extrabold text-sm text-slate-900">{visit.userName}</p>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium">{visit.userEmail} | {visit.userPhone}</p>
                              
                              <div className="mt-3 space-y-1 text-xxs border-t border-indigo-100/50 pt-2.5">
                                <p className="text-slate-700">🏢 Host Partner: <strong className="text-slate-900">{visit.companyName || "N/A"}</strong></p>
                                <p className="text-slate-700">📅 Scheduled Date: <strong className="text-slate-900">{visit.date}</strong></p>
                                <p className="text-slate-700">🎫 Pass ID: <span className="font-mono font-bold text-indigo-700">{visit.passId || "N/A"}</span></p>
                                <p className="text-slate-700">🔑 Verification OTP: <span className="font-mono font-bold text-emerald-700">{visit.otp || "N/A"}</span></p>
                                {visit.remarks && <p className="text-slate-500 italic mt-1">"Remarks: {visit.remarks}"</p>}
                              </div>
                            </div>

                            <div className="mt-4 flex gap-2 border-t border-indigo-100/50 pt-3">
                              <button
                                type="button"
                                onClick={() => setPrintingPass(visit)}
                                className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 py-1.5 px-3 rounded-xl text-xxs font-extrabold flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                              >
                                <QrCode className="w-3.5 h-3.5 text-indigo-600" /> PRINT PASS
                              </button>
                              {isApproved && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await updateDoc(doc(db, "bookings", visit.id), {
                                        status: "checked_in",
                                        checkInTime: new Date().toLocaleTimeString()
                                      });
                                      triggerToast("Visitor checked in successfully!", "success");
                                    } catch (err: any) {
                                      console.error(err);
                                      triggerToast("Error updating status: " + err.message, "error");
                                    }
                                  }}
                                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-xl text-xxs font-extrabold transition-all"
                                >
                                  ✅ GRANT ACCESS & CHECK-IN
                                </button>
                              )}
                              {isInside && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await updateDoc(doc(db, "bookings", visit.id), {
                                        status: "checked_out",
                                        checkOutTime: new Date().toLocaleTimeString()
                                      });
                                      triggerToast("Visitor checked out successfully!", "success");
                                    } catch (err: any) {
                                      console.error(err);
                                      triggerToast("Error updating status: " + err.message, "error");
                                    }
                                  }}
                                  className="flex-1 bg-slate-700 hover:bg-slate-800 text-white py-1.5 rounded-xl text-xxs font-extrabold transition-all font-mono"
                                >
                                  🚪 CHECK-OUT (EXIT)
                                </button>
                              )}
                              {!isApproved && !isInside && (
                                <span className="text-xxs text-slate-400 italic">No further receptionist actions available.</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Active / Logged Visitors Directory Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">📅 Daily Visitor Gate Log</h4>
                  <p className="text-xxs text-slate-500 mt-0.5">Real-time gate pass management & security record tracking.</p>
                </div>
                <span className="text-xxs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-150">
                  Total Entries: {bookingsList.filter(b => b.type === "visit").length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-600 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-150">
                      <th className="p-4">Visitor Info</th>
                      <th className="p-4">Host Company</th>
                      <th className="p-4">Pass credentials</th>
                      <th className="p-4">Date & Logs</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-center">Gate Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookingsList.filter(b => b.type === "visit").length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                          No corporate visitors registered on the portal.
                        </td>
                      </tr>
                    ) : (
                      bookingsList
                        .filter(b => b.type === "visit")
                        .sort((a, b) => b.createdAt?.localeCompare(a.createdAt) || 0)
                        .map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0 border border-slate-200">
                                  {b.userName?.slice(0, 2).toUpperCase() || "VI"}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{b.userName}</p>
                                  <p className="text-[10px] text-slate-500">{b.userEmail} | {b.userPhone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-semibold text-slate-700">{b.companyName || "N/A"}</td>
                            <td className="p-4">
                              <div className="space-y-0.5">
                                <p className="font-mono text-[10px] text-indigo-700 font-bold">Pass ID: {b.passId || "N/A"}</p>
                                <p className="font-mono text-[10px] text-emerald-700 font-bold">OTP: {b.otp || "N/A"}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-0.5 font-mono text-[10px] text-slate-600">
                                <p>Sched: {b.date}</p>
                                {b.checkInTime && <p className="text-indigo-600 font-semibold">Entry: {b.checkInTime}</p>}
                                {b.checkOutTime && <p className="text-slate-500 font-semibold">Exit: {b.checkOutTime}</p>}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider ${
                                b.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                b.status === "checked_in" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                                b.status === "checked_out" ? "bg-slate-100 text-slate-700 border-slate-200" :
                                b.status === "cancelled" ? "bg-slate-50 text-slate-400 border-slate-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {b.status?.replace("_", " ")}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex gap-2 justify-center items-center">
                                <button
                                  onClick={() => setPrintingPass(b)}
                                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 p-1.5 rounded-xl text-[10px] font-bold transition-all border border-indigo-200/50 flex items-center gap-1 shrink-0"
                                  title="Print Pass / QR Code"
                                >
                                  <QrCode className="w-3.5 h-3.5 text-indigo-600" /> Print
                                </button>
                                {b.status === "approved" && (
                                  <>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await updateDoc(doc(db, "bookings", b.id), {
                                            status: "checked_in",
                                            checkInTime: new Date().toLocaleTimeString()
                                          });
                                          triggerToast("Visitor checked in successfully!", "success");
                                        } catch (err: any) {
                                          console.error(err);
                                        }
                                      }}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all shadow-sm"
                                    >
                                      Check-In
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await updateDoc(doc(db, "bookings", b.id), {
                                            status: "cancelled"
                                          });
                                          triggerToast("Visit request cancelled.", "success");
                                        } catch (err: any) {
                                          console.error(err);
                                        }
                                      }}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all border border-slate-250"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                                {b.status === "checked_in" && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, "bookings", b.id), {
                                          status: "checked_out",
                                          checkOutTime: new Date().toLocaleTimeString()
                                        });
                                        triggerToast("Visitor checked out successfully!", "success");
                                      } catch (err: any) {
                                        console.error(err);
                                      }
                                    }}
                                    className="bg-slate-700 hover:bg-slate-800 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all font-mono"
                                  >
                                    Check-Out (Exit)
                                  </button>
                                )}
                                {b.status !== "approved" && b.status !== "checked_in" && (
                                  <span className="text-[10px] text-slate-400 italic">No actions</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Custom Toast Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`w-2.5 h-2.5 rounded-full ${toast.type === "success" ? "bg-emerald-500" : toast.type === "error" ? "bg-rose-500" : "bg-blue-500"}`} />
          <span className="text-xs font-semibold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white transition-colors ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 text-left">
            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase mb-2">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-600 font-medium mb-5 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/10"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form Review Modal */}
      {selectedRegForm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-250 shadow-2xl max-w-2xl w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-950 tracking-tight uppercase">
                  Review Registration Form
                </h3>
                <p className="text-xxs text-slate-500 font-medium">Submitted by: {selectedRegForm.userEmail}</p>
              </div>
              <button
                onClick={() => setSelectedRegForm(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 text-left text-xs">
              {selectedRegForm.submissionType === "digital" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Company Name</p>
                      <p className="font-extrabold text-slate-800 text-sm">{selectedRegForm.formData?.companyName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Constitution Type</p>
                      <p className="font-bold text-slate-700">{selectedRegForm.formData?.constitutionType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Business Status</p>
                      <p className="font-bold text-slate-700">{selectedRegForm.formData?.businessStatus}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Employees</p>
                      <p className="font-bold text-slate-700">{selectedRegForm.formData?.numEmployees} Members</p>
                    </div>
                  </div>

                  <div className="border border-slate-150 rounded-2xl p-4 space-y-3 bg-white">
                    <h5 className="font-extrabold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider text-[10px]">
                      Director Details
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-xxs">
                      <p><span className="text-slate-400">Name:</span> <strong className="text-slate-700">{selectedRegForm.formData?.directorName}</strong></p>
                      <p><span className="text-slate-400">Mobile:</span> <strong className="text-slate-700">{selectedRegForm.formData?.directorMobile}</strong></p>
                      <p><span className="text-slate-400">Email:</span> <strong className="text-slate-700">{selectedRegForm.formData?.directorEmail}</strong></p>
                      <p><span className="text-slate-400">Is Coworking?</span> <strong className="text-slate-700">{selectedRegForm.formData?.directorIsCoworker}</strong></p>
                    </div>
                  </div>

                  <div className="border border-slate-150 rounded-2xl p-4 space-y-3 bg-white">
                    <h5 className="font-extrabold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider text-[10px]">
                      Emergency Point of Contact
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-xxs">
                      <p><span className="text-slate-400">Name:</span> <strong className="text-slate-700">{selectedRegForm.formData?.employeeName}</strong></p>
                      <p><span className="text-slate-400">Mobile:</span> <strong className="text-slate-700">{selectedRegForm.formData?.employeeMobile}</strong></p>
                      <p><span className="text-slate-400">Email:</span> <strong className="text-slate-700">{selectedRegForm.formData?.employeeEmail}</strong></p>
                      <p><span className="text-slate-400">Is Coworking?</span> <strong className="text-slate-700">{selectedRegForm.formData?.employeeIsCoworker}</strong></p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Registered Office Address</p>
                      <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-150">{selectedRegForm.formData?.registeredOfficeAddress}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Permanent Address (Director)</p>
                      <p className="font-medium text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-150">{selectedRegForm.formData?.permanentAddress}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-150 p-3.5 rounded-2xl space-y-2">
                    <p className="text-[10px] font-black uppercase text-blue-800 tracking-wider">Compliance Declarations</p>
                    <div className="space-y-1.5 text-xxs text-blue-900">
                      <p className="flex items-center gap-1.5 font-semibold">
                        {selectedRegForm.formData?.agreedToRules === "Yes" ? "✓" : "✗"} Agreed to Coworking Rules & Guidelines
                      </p>
                      <p className="flex items-center gap-1.5 font-semibold">
                        {selectedRegForm.formData?.providedTrueInfo === "Yes" ? "✓" : "✗"} Confirmed info is true and authentic
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-250 flex flex-col items-center justify-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">Uploaded Scanned Physical Form</h5>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">The coworker filled out a physical copy of the Synergi Registration Form, signed it, and uploaded it to Google Drive.</p>
                    </div>
                    {selectedRegForm.uploadedFileUrl ? (
                      <a
                        href={selectedRegForm.uploadedFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-blue-600/10 animate-pulse"
                      >
                        <ExternalLink className="w-4 h-4" /> View Scanned Document
                      </a>
                    ) : (
                      <p className="text-xs text-red-500 font-bold mt-2">No scanned file link found in submission record.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Admin decision area */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1.5">
                    Admin Review Notes & Comments
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter review notes, feedback, or rejection reason..."
                    value={regFormReviewNotes}
                    onChange={(e) => setRegFormReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-6 flex justify-end gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedRegForm(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReviewRegistration(selectedRegForm, "rejected", regFormReviewNotes)}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200"
              >
                Reject Submission
              </button>
              <button
                type="button"
                onClick={() => handleReviewRegistration(selectedRegForm, "approved", regFormReviewNotes)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/10"
              >
                Approve & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Walk-In Guest Registration Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                  ➕ Register Walk-In Guest Pass
                </h3>
                <p className="text-xxs text-slate-500 mt-0.5 font-medium">Instantly registers the visitor and issues an immediate check-in badge.</p>
              </div>
              <button
                onClick={() => setShowWalkInModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-xxs font-bold text-slate-700 mb-1">Guest Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={walkInGuestName}
                  onChange={e => setWalkInGuestName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xxs font-bold text-slate-700 mb-1">Guest Mobile No *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9999999999"
                    value={walkInGuestPhone}
                    onChange={e => setWalkInGuestPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xxs font-bold text-slate-700 mb-1">Guest Email ID *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@example.com"
                    value={walkInGuestEmail}
                    onChange={e => setWalkInGuestEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-700 mb-1">Host Partner Company *</label>
                <select
                  required
                  value={walkInHostCompanyId}
                  onChange={e => setWalkInHostCompanyId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  <option value="">-- Select Host Company --</option>
                  <option value="synergi_default">Synergi Coworking Space Pvt Ltd (Default)</option>
                  {usersList
                    .filter(u => u.uid !== "synergi_default" && (u.role === "customer" || u.companyName))
                    .map(u => (
                      <option key={u.uid} value={u.uid}>
                        {u.companyName || `${u.displayName}'s Company`} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xxs font-bold text-slate-700 mb-1">Remarks / Purpose of Visit</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Vendor delivery, job interview, client meetup..."
                  value={walkInRemarks}
                  onChange={e => setWalkInRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
                >
                  Register & Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Visitor Gate Pass Modal */}
      {printingPass && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-205 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-205 text-center printable-pass-card relative my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setPrintingPass(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors no-print"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Pass Header */}
            <div className="border-b-2 border-dashed border-slate-200 pb-4 mb-4">
              <div className="flex justify-center mb-1">
                <span className="text-xl">🏢</span>
              </div>
              <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                SYNERGI CO-WORKING
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Noida Campus Visitor Gate Pass</p>
            </div>

            {/* Pass Content */}
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unique Pass ID</p>
                  <p className="text-xl font-black text-slate-950 font-mono mt-0.5 tracking-wide">{printingPass.passId || "N/A"}</p>
                </div>

                {/* QR Code */}
                <div className="flex justify-center py-1">
                  <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${window.location.origin}/?passId=${printingPass.passId}`)}`}
                      alt="Entry QR Code"
                      className="w-36 h-36 mx-auto"
                    />
                  </div>
                </div>

                {/* 6-Digit Entry OTP */}
                <div className="inline-block bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-1.5">
                  <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider block">Security Entry OTP</span>
                  <span className="text-xl font-extrabold text-indigo-800 font-mono tracking-widest">{printingPass.otp || "------"}</span>
                </div>
              </div>

              {/* Visit Details Grid */}
              <div className="text-left text-xs bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Guest Name:</span>
                  <span className="text-slate-950 font-bold">{printingPass.userName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Host Company:</span>
                  <span className="text-slate-900 font-extrabold text-indigo-700">{printingPass.companyName || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Schedule Date:</span>
                  <span className="text-slate-900 font-mono font-bold">{printingPass.date}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Mobile No:</span>
                  <span className="text-slate-900 font-mono font-bold">{printingPass.userPhone || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Entry Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                    {printingPass.status}
                  </span>
                </div>
              </div>

              {printingPass.remarks && (
                <div className="text-left p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xxs italic text-indigo-900">
                  "Remarks: {printingPass.remarks}"
                </div>
              )}

              {/* Instructions for door paste */}
              <div className="p-3 bg-slate-50 text-slate-700 rounded-xl text-xxs text-left border border-slate-150 space-y-1 no-print">
                <p className="font-bold text-slate-900 uppercase">📌 Instructions:</p>
                <p>1. Click <strong>Print Pass</strong> to print this single card.</p>
                <p>2. Paste/stick it on the cabin, office, or meeting room door.</p>
                <p>3. Visitors or venue admins can scan this QR code to instantly verify status.</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-1 no-print">
                <button
                  type="button"
                  onClick={() => setPrintingPass(null)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Print Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
