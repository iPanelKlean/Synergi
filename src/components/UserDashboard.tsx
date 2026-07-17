import React, { useState, useEffect } from "react";
import { 
  auth, 
  db,
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  getDoc,
  setDoc 
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
  Layers, 
  Calendar, 
  AlertCircle, 
  CreditCard, 
  FileText, 
  QrCode, 
  LogOut, 
  Bell, 
  Send, 
  Check, 
  RefreshCw, 
  Download, 
  MapPin, 
  Clock, 
  User, 
  Coffee, 
  Phone,
  ShieldCheck,
  Ban,
  Facebook,
  MessageCircle,
  Menu,
  X,
  Edit,
  Upload,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Trash,
  ExternalLink,
  UploadCloud,
  CheckSquare,
  Mail,
  Info,
  Building,
  Copy
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

interface UserDashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

export default function UserDashboard({ user, onLogout, onUpdateProfile }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "conference" | "seats" | "payments" | "complaints" | "agreements" | "visitor">("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Custom Toast State for User Dashboard
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
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
  const [showProfileModal, setShowProfileModal] = useState(false);

  const computedAccessId = user.memberId || `SYN-${user.uid.slice(0, 6).toUpperCase()}`;

  // Seat request form states
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<string[]>([]);
  const [employeeNamesMap, setEmployeeNamesMap] = useState<Record<string, string>>({});
  const [requestedSeatsCount, setRequestedSeatsCount] = useState<number>(1);
  const [employeeNames, setEmployeeNames] = useState<string[]>([""]);
  const [seatRequestLoading, setSeatRequestLoading] = useState(false);
  const [seatRequestStartDate, setSeatRequestStartDate] = useState("");

  // Custom billing simulated email notification state
  const [showSimulatedEmailModal, setShowSimulatedEmailModal] = useState(false);
  const [emailSimulationData, setEmailSimulationData] = useState<any>(null);

  // Sync state if user prop changes
  useEffect(() => {
    setProfileName(user.displayName);
    setProfilePhone(user.phone || "");
  }, [user]);

  const handleSeatsCountChange = (count: number) => {
    const cleanCount = Math.max(1, count);
    setRequestedSeatsCount(cleanCount);
    setEmployeeNames(prev => {
      const next = [...prev];
      if (next.length < cleanCount) {
        while (next.length < cleanCount) {
          next.push("");
        }
      } else if (next.length > cleanCount) {
        next.splice(cleanCount);
      }
      return next;
    });
  };

  // Guard active tab based on allowed modules
  const isModuleAllowed = (moduleId: string) => {
    if (!user.allowedModules) return true;
    const allowed = user.allowedModules;
    if (moduleId === "overview") return true;
    if (moduleId === "conference") return allowed.includes("rooms") || allowed.includes("conference");
    if (moduleId === "seats") return allowed.includes("seats") || allowed.includes("bookings");
    if (moduleId === "payments") return allowed.includes("payments");
    if (moduleId === "complaints") return allowed.includes("complaints");
    if (moduleId === "agreements") return allowed.includes("agreements") || allowed.includes("reviews");
    if (moduleId === "visitor") return allowed.includes("security") || allowed.includes("notifications") || allowed.includes("visitor");
    return allowed.includes(moduleId);
  };

  useEffect(() => {
    if (activeTab !== "overview" && !isModuleAllowed(activeTab)) {
      setActiveTab("overview");
    }
  }, [activeTab, user.allowedModules]);

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      triggerToast("Name is required.", "error");
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
      triggerToast("Your profile has been saved successfully!", "success");
    } catch (err: any) {
      console.error(err);
      triggerToast(`Error saving profile: ${err?.message || String(err)}`, "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);
  
  // Real-time collections
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [companyVisitors, setCompanyVisitors] = useState<Booking[]>([]);
  const [selectedVisitorForRemarks, setSelectedVisitorForRemarks] = useState<Booking | null>(null);
  const [visitorRemarksInput, setVisitorRemarksInput] = useState("");
  const [printingPass, setPrintingPass] = useState<Booking | null>(null);

  // Pre-Register Visitor States
  const [showAddVisitorModal, setShowAddVisitorModal] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState("");
  const [newVisitorEmail, setNewVisitorEmail] = useState("");
  const [newVisitorPhone, setNewVisitorPhone] = useState("");
  const [newVisitorDate, setNewVisitorDate] = useState("");
  const [newVisitorRemarks, setNewVisitorRemarks] = useState("");

  // Set default date for new visitor pre-registration
  useEffect(() => {
    if (showAddVisitorModal && !newVisitorDate) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setNewVisitorDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [showAddVisitorModal, newVisitorDate]);

  // Pagination states (options: 10, 20, 50)
  const [visitorCurrentPage, setVisitorCurrentPage] = useState(1);
  const [visitorItemsPerPage, setVisitorItemsPerPage] = useState(10);

  const [paymentCurrentPage, setPaymentCurrentPage] = useState(1);
  const [paymentItemsPerPage, setPaymentItemsPerPage] = useState(10);

  const [ticketCurrentPage, setTicketCurrentPage] = useState(1);
  const [ticketItemsPerPage, setTicketItemsPerPage] = useState(10);

  const [agreementCurrentPage, setAgreementCurrentPage] = useState(1);
  const [agreementItemsPerPage, setAgreementItemsPerPage] = useState(10);

  const [bookingsItemsPerPage, setBookingsItemsPerPage] = useState(10);
  const [regItemsPerPage, setRegItemsPerPage] = useState(10);

  const [seats, setSeats] = useState<Seat[]>([]);
  const [rooms, setRooms] = useState<ConferenceRoom[]>([]);
  const [confBookings, setConfBookings] = useState<ConferenceBooking[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Synergi Registration Form & Files state
  const [registrationForms, setRegistrationForms] = useState<any[]>([]);
  const [formView, setFormView] = useState<"list" | "fill" | "upload" | "view">("list");
  const [selectedRegForm, setSelectedRegForm] = useState<any | null>(null);
  const [agreementsSubTab, setAgreementsSubTab] = useState<"contracts" | "registration">("contracts");
  const [confSubTab, setConfSubTab] = useState<"book" | "list">("book");

  // Digital registration form fields
  const [regCompany, setRegCompany] = useState("");
  const [regType, setRegType] = useState("Proprietor");
  const [regStatus, setRegStatus] = useState("MSME");
  const [regEmployees, setRegEmployees] = useState("");
  const [regDirectorName, setRegDirectorName] = useState("");
  const [regDirectorMobile, setRegDirectorMobile] = useState("");
  const [regDirectorEmail, setRegDirectorEmail] = useState("");
  const [regDirectorIsCoworker, setRegDirectorIsCoworker] = useState("Yes");
  const [regEmployeeName, setRegEmployeeName] = useState("");
  const [regEmployeeMobile, setRegEmployeeMobile] = useState("");
  const [regEmployeeEmail, setRegEmployeeEmail] = useState("");
  const [regEmployeeIsCoworker, setRegEmployeeIsCoworker] = useState("Yes");
  const [regOfficeAddress, setRegOfficeAddress] = useState("");
  const [regPermanentAddress, setRegPermanentAddress] = useState("");
  const [regPresentAddress, setRegPresentAddress] = useState("");
  const [regEmergencyName, setRegEmergencyName] = useState("");
  const [regEmergencyMobile, setRegEmergencyMobile] = useState("");
  const [regEmergencyEmail, setRegEmergencyEmail] = useState("");
  const [regEmergencyRelation, setRegEmergencyRelation] = useState("");
  const [regExpectedStay, setRegExpectedStay] = useState("");
  const [docAadhaar, setDocAadhaar] = useState({ yesNo: "No", docNo: "", remarks: "" });
  const [docMoa, setDocMoa] = useState({ yesNo: "No", docNo: "", remarks: "" });
  const [docWorkDecl, setDocWorkDecl] = useState({ yesNo: "No", docNo: "", remarks: "" });
  const [docAddressProof, setDocAddressProof] = useState({ yesNo: "No", docNo: "", remarks: "" });
  const [docAuthLetter, setDocAuthLetter] = useState({ yesNo: "No", docNo: "", remarks: "" });
  const [docPan, setDocPan] = useState({ yesNo: "No", docNo: "", remarks: "" });
  const [regDeclarationAccepted, setRegDeclarationAccepted] = useState(false);
  const [regPlace, setRegPlace] = useState("");
  const [regSignature, setRegSignature] = useState("");

  // Hard copy file upload state
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [uploadedDriveLink, setUploadedDriveLink] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  // User Dashboard Pagination States
  const [bookingsPage, setBookingsPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [complaintsPage, setComplaintsPage] = useState(1);
  const [agreementsPage, setAgreementsPage] = useState(1);
  const [regPage, setRegPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Computed Billing Calculations
  const allocatedSeatsCount = seats.filter(s => s.status === "occupied" && s.occupiedByEmail === user.email.toLowerCase()).length;
  const userSeatRate = user.seatRate !== undefined && user.seatRate > 0
    ? user.seatRate
    : (settings?.defaultRentAmount !== undefined ? settings.defaultRentAmount : 3500);
  const totalSeatRental = allocatedSeatsCount * userSeatRate;
  const totalConferenceBilling = confBookings.filter(b => b.status === "approved").reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const grandTotalBilling = totalSeatRental + totalConferenceBilling;
  const netAmountDue = grandTotalBilling + (settings?.maintenanceCharges || 0);

  useEffect(() => {
    setPaymentAmount(netAmountDue > 0 ? netAmountDue : userSeatRate);
  }, [netAmountDue, userSeatRate]);

  // Form states
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [seatBookingLoading, setSeatBookingLoading] = useState(false);
  const [seatBookingDate, setSeatBookingDate] = useState("");

  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [confDate, setConfDate] = useState("");
  const [confSlot, setConfSlot] = useState("10:00 AM - 11:00 AM");
  const [confDuration, setConfDuration] = useState<"hour" | "half_day" | "full_day" | "1_hr" | "2_hrs" | "3_hrs" | "4_hrs">("hour");
  const [confLoading, setConfLoading] = useState(false);

  // New Google Forms style Conference Room Booking state variables
  const [confCompanyName, setConfCompanyName] = useState("");
  const [confContactName, setConfContactName] = useState("");
  const [confContactPhone, setConfContactPhone] = useState("");
  const [confContactEmail, setConfContactEmail] = useState("");
  const [confStartTime, setConfStartTime] = useState("09:00");
  const [confEndTime, setConfEndTime] = useState("10:00");
  const [confPurpose, setConfPurpose] = useState("");
  const [confAttendees, setConfAttendees] = useState("1");
  const [confMeetingType, setConfMeetingType] = useState("Team Sync");
  const [customMeetingType, setCustomMeetingType] = useState("");
  const [confRemarks, setConfRemarks] = useState("");

  const calculateEndTime = (start: string, durationType: string) => {
    if (!start) return "";
    const [hrsStr, minsStr] = start.split(":");
    let hrs = parseInt(hrsStr);
    const mins = parseInt(minsStr);

    let durationHrs = 1;
    if (durationType === "2_hrs") durationHrs = 2;
    else if (durationType === "3_hrs") durationHrs = 3;
    else if (durationType === "4_hrs" || durationType === "half_day") durationHrs = 4;
    else if (durationType === "full_day") durationHrs = 8;

    hrs = (hrs + durationHrs) % 24;
    const hrsFormatted = hrs.toString().padStart(2, "0");
    const minsFormatted = mins.toString().padStart(2, "0");
    return `${hrsFormatted}:${minsFormatted}`;
  };

  const getMultiplier = (dur: string) => {
    if (dur === "hour" || dur === "1_hr") return 1;
    if (dur === "2_hrs") return 2;
    if (dur === "3_hrs") return 3;
    if (dur === "4_hrs" || dur === "half_day") return 4;
    if (dur === "full_day") return 8;
    return 1;
  };

  useEffect(() => {
    if (user) {
      setConfContactEmail(user.email || "");
      if (user.displayName) {
        setConfContactName(user.displayName);
      }
      if (user.companyName) {
        setConfCompanyName(user.companyName);
      }
    }
  }, [user]);

  useEffect(() => {
    if (registrationForms && registrationForms.length > 0) {
      const activeForm = registrationForms.find(
        f => f.userEmail === user.email.toLowerCase() && f.formData?.companyName
      );
      if (activeForm && activeForm.formData) {
        if (activeForm.formData.companyName) {
          setConfCompanyName(activeForm.formData.companyName);
        }
        if (activeForm.formData.directorName && !confContactName) {
          setConfContactName(activeForm.formData.directorName);
        }
        if (activeForm.formData.directorMobile && !confContactPhone) {
          setConfContactPhone(activeForm.formData.directorMobile);
        }
      }
    }
  }, [registrationForms, user]);

  useEffect(() => {
    if (rooms.length > 0 && !selectedRoom) {
      setSelectedRoom(rooms[0].id);
    }
  }, [rooms, selectedRoom]);

  useEffect(() => {
    if (confStartTime && confDuration) {
      setConfEndTime(calculateEndTime(confStartTime, confDuration));
    }
  }, [confStartTime, confDuration]);

  const [complaintCategory, setComplaintCategory] = useState<Complaint["category"]>("Internet");
  const [complaintDesc, setComplaintDesc] = useState("");
  const [complaintLoading, setComplaintLoading] = useState(false);

  const [paymentMonth, setPaymentMonth] = useState("July 2026");
  const [paymentAmount, setPaymentAmount] = useState(6999);
  const [paymentBank, setPaymentBank] = useState("");
  const [paymentUtr, setPaymentUtr] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Bank Transfer">("UPI");
  const [paymentBillingCycle, setPaymentBillingCycle] = useState<"Monthly" | "Quarterly" | "Half-Yearly" | "Yearly">("Monthly");
  const [paymentPeriodFrom, setPaymentPeriodFrom] = useState("");
  const [paymentPeriodTo, setPaymentPeriodTo] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [paymentScreenshotUrl, setPaymentScreenshotUrl] = useState("");
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  // Subscriptions
  useEffect(() => {
    if (!user.email) return;

    // Listen to seats
    const unsubSeats = onSnapshot(collection(db, "seats"), (snap) => {
      const list: Seat[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Seat));
      list.sort((a, b) => a.number.localeCompare(b.number));
      setSeats(list);
    });

    // Listen to conference rooms
    const unsubRooms = onSnapshot(collection(db, "conferenceRooms"), (snap) => {
      const list: ConferenceRoom[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as ConferenceRoom));
      setRooms(list);
    });

    // Listen to user-specific bookings
    const qBookings = query(collection(db, "bookings"), where("userEmail", "==", user.email.toLowerCase()));
    const unsubBookings = onSnapshot(qBookings, (snap) => {
      const list: Booking[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Booking));
      setBookings(list);
    });

    // Listen to company-specific visitor requests (for customer company role)
    let unsubCompanyVisitors = () => {};
    if (user.role === "customer") {
      const qCompVis = query(
        collection(db, "bookings"),
        where("type", "==", "visit"),
        where("companyId", "==", user.uid)
      );
      unsubCompanyVisitors = onSnapshot(qCompVis, (snap) => {
        const list: Booking[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as Booking));
        // Newest first
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setCompanyVisitors(list);
      });
    }

    // Listen to user-specific conference bookings
    const qConf = query(collection(db, "conferenceBookings"), where("userEmail", "==", user.email.toLowerCase()));
    const unsubConf = onSnapshot(qConf, (snap) => {
      const list: ConferenceBooking[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as ConferenceBooking));
      setConfBookings(list);
    });

    // Listen to user-specific agreements
    const qAgr = query(collection(db, "agreements"), where("userEmail", "==", user.email.toLowerCase()));
    const unsubAgr = onSnapshot(qAgr, (snap) => {
      const list: Agreement[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Agreement));
      setAgreements(list);
    });

    // Listen to user-specific payments
    const qPay = query(collection(db, "payments"), where("userEmail", "==", user.email.toLowerCase()));
    const unsubPay = onSnapshot(qPay, (snap) => {
      const list: Payment[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Payment));
      setPayments(list);
    });

    // Listen to user-specific complaints
    const qComp = query(collection(db, "complaints"), where("userEmail", "==", user.email.toLowerCase()));
    const unsubComp = onSnapshot(qComp, (snap) => {
      const list: Complaint[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Complaint));
      setComplaints(list);
    });

    // Listen to user-specific registration forms
    const qRegForms = query(collection(db, "registrationForms"), where("userEmail", "==", user.email.toLowerCase()));
    const unsubRegForms = onSnapshot(qRegForms, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setRegistrationForms(list);
    });

    // Listen to user-specific notifications
    const qNotif = query(collection(db, "notifications"), where("userEmail", "==", user.email.toLowerCase()));
    const unsubNotif = onSnapshot(qNotif, (snap) => {
      const list: SystemNotification[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as SystemNotification));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(list);
    });

    // Get Settings
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as AppSettings);
      }
    });

    return () => {
      unsubSeats();
      unsubRooms();
      unsubBookings();
      unsubCompanyVisitors();
      unsubConf();
      unsubAgr();
      unsubPay();
      unsubComp();
      unsubRegForms();
      unsubNotif();
      unsubSettings();
    };
  }, [user.email]);

  // Corporate Visitor Actions
  const handleUpdateVisitorStatus = async (visitorId: string, newStatus: "approved" | "rejected") => {
    try {
      const visitorRef = doc(db, "bookings", visitorId);
      const original = companyVisitors.find(v => v.id === visitorId);
      const actionLog = {
        action: newStatus,
        timestamp: new Date().toISOString(),
        user: user.displayName || user.email
      };
      
      const updatedLogs = original?.logs ? [...original.logs, actionLog] : [actionLog];

      await updateDoc(visitorRef, {
        status: newStatus,
        logs: updatedLogs
      });
      triggerToast(`Visitor request status set to ${newStatus} successfully!`, "success");
    } catch (err: any) {
      console.error(err);
      triggerToast(`Error updating status: ${err?.message || String(err)}`, "error");
    }
  };

  const handleSaveVisitorRemarks = async () => {
    if (!selectedVisitorForRemarks) return;
    try {
      const visitorRef = doc(db, "bookings", selectedVisitorForRemarks.id);
      const actionLog = {
        action: "added_remarks",
        timestamp: new Date().toISOString(),
        user: user.displayName || user.email
      };
      const updatedLogs = selectedVisitorForRemarks.logs ? [...selectedVisitorForRemarks.logs, actionLog] : [actionLog];

      await updateDoc(visitorRef, {
        remarks: visitorRemarksInput.trim(),
        logs: updatedLogs
      });
      triggerToast("Remarks updated successfully!", "success");
      setSelectedVisitorForRemarks(null);
      setVisitorRemarksInput("");
    } catch (err: any) {
      console.error(err);
      triggerToast(`Error saving remarks: ${err?.message || String(err)}`, "error");
    }
  };

  const handleAddVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitorName || !newVisitorEmail || !newVisitorPhone || !newVisitorDate) {
      triggerToast("Please fill in all required fields (*)", "error");
      return;
    }

    try {
      const passId = "SYN-M-" + Math.floor(100000 + Math.random() * 900000);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const newVisitorDoc = {
        type: "visit",
        source: "registered",
        userName: newVisitorName,
        userEmail: newVisitorEmail.toLowerCase().trim(),
        userPhone: newVisitorPhone,
        companyId: user.uid,
        companyName: user.companyName || user.displayName || "Synergi Member",
        date: newVisitorDate,
        passId,
        otp,
        remarks: newVisitorRemarks || "Pre-registered by host member",
        status: "approved",
        checkInTime: "",
        checkOutTime: "",
        createdAt: new Date().toISOString(),
        logs: [
          { action: "pre-registered", timestamp: new Date().toISOString(), user: user.displayName || user.email }
        ]
      };

      await addDoc(collection(db, "bookings"), newVisitorDoc);
      triggerToast(`Visitor ${newVisitorName} pre-registered successfully! Pass ID: ${passId}`, "success");

      // Trigger automated email pass with QR code
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "visitor_pass", booking: newVisitorDoc })
        });
        console.log("Pre-registered visitor pass email triggered successfully.");
      } catch (mailErr) {
        console.error("Failed to trigger automated email API:", mailErr);
      }

      // Reset states
      setNewVisitorName("");
      setNewVisitorEmail("");
      setNewVisitorPhone("");
      setNewVisitorDate("");
      setNewVisitorRemarks("");
      setShowAddVisitorModal(false);

      // Trigger print modal for immediate print if they wish!
      setPrintingPass(newVisitorDoc as Booking);
    } catch (err: any) {
      console.error(err);
      triggerToast(`Error pre-registering visitor: ${err?.message || String(err)}`, "error");
    }
  };

  // Handle Seat Request with Unique Seats and Employee Assignments
  const handleSeatBookingSubmitMulti = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestedSeatsCount <= 0) {
      triggerToast("Please request at least 1 workstation seat.", "error");
      return;
    }
    if (!seatRequestStartDate) {
      triggerToast("Please choose your preferred starting date.", "error");
      return;
    }
    
    // Find vacant seats in the system
    const availableSeats = seats.filter(s => s.status === "available");
    if (availableSeats.length < requestedSeatsCount) {
      triggerToast(`Sorry, only ${availableSeats.length} vacant seats are currently available. Please contact management.`, "error");
      return;
    }

    // Validate that each requested seat slot has an employee name
    const missingName = employeeNames.some(name => !name || !name.trim());
    if (missingName) {
      triggerToast("Please specify the employee name who will occupy each requested seat.", "error");
      return;
    }

    setSeatRequestLoading(true);
    try {
      const selectedSeats = availableSeats.slice(0, requestedSeatsCount);
      const seatAssignments = selectedSeats.map((seat, idx) => ({
        seatNumber: seat.number,
        employeeName: employeeNames[idx].trim()
      }));

      // Create a booking of type "seat"
      await addDoc(collection(db, "bookings"), {
        userEmail: user.email.toLowerCase(),
        userName: user.displayName || "Member",
        userPhone: user.phone || "",
        numSeats: requestedSeatsCount,
        status: "pending",
        seatAssignments,
        type: "seat",
        date: seatRequestStartDate,
        source: "registered",
        createdAt: new Date().toISOString()
      });

      // Insert unread notification for the admin
      await addDoc(collection(db, "notifications"), {
        userEmail: "mis@ipanelklean.com", // Admin email
        title: "New Seat Allotment Order",
        body: `${user.displayName || user.email} requested ${requestedSeatsCount} seats with employee allocations.`,
        read: false,
        type: "admin_new_booking",
        createdAt: new Date().toISOString()
      });

      // Insert unread notification for the user themselves
      await addDoc(collection(db, "notifications"), {
        userEmail: user.email.toLowerCase(),
        title: "Seat Bookings Placed",
        body: `Your request for ${requestedSeatsCount} unique workstation seats is sent for venue manager approval.`,
        read: false,
        type: "booking",
        createdAt: new Date().toISOString()
      });

      triggerToast(`Seat allotment request for ${requestedSeatsCount} workstations placed successfully!`, "success");
      setRequestedSeatsCount(1);
      setEmployeeNames([""]);
      setSeatRequestStartDate("");
    } catch (err: any) {
      console.error(err);
      triggerToast("Error requesting seats: " + err.message, "error");
    } finally {
      setSeatRequestLoading(false);
    }
  };

  // Handle Conference Room Booking
  const handleConfBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let roomID = selectedRoom;
    if (!roomID && rooms.length > 0) {
      roomID = rooms[0].id;
    }

    if (!roomID || !confDate || !confStartTime || !confEndTime) {
      alert("Please fill all required conference room fields.");
      return;
    }

    // Validate phone number (10 digit)
    const cleanPhone = confContactPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Validate expected attendees
    const attendeesNum = parseInt(confAttendees);
    if (isNaN(attendeesNum) || attendeesNum < 1 || attendeesNum > 10) {
      alert("Expected attendees must be between 1 and 10.");
      return;
    }

    setConfLoading(true);
    try {
      const room = rooms.find(r => r.id === roomID);
      if (!room) {
        alert("Selected conference room not found.");
        return;
      }

      const multiplier = getMultiplier(confDuration);
      const price = room.pricePerHour * multiplier;

      const meetingTypeFinal = confMeetingType === "Other" ? (customMeetingType || "Other") : confMeetingType;

      const bookingPayload = {
        userEmail: user.email.toLowerCase(),
        roomId: roomID,
        roomName: room.name,
        date: confDate,
        slot: `${confStartTime} - ${confEndTime}`,
        durationType: confDuration,
        totalPrice: price,
        status: "pending" as const,
        createdAt: new Date().toISOString(),
        companyName: confCompanyName || "N/A",
        userName: confContactName || user.displayName || user.email,
        userPhone: confContactPhone,
        startTime: confStartTime,
        endTime: confEndTime,
        purpose: confPurpose,
        attendees: attendeesNum,
        meetingType: meetingTypeFinal,
        remarks: confRemarks
      };

      // 1. Save to Firebase firestore
      const docRef = await addDoc(collection(db, "conferenceBookings"), bookingPayload);

      // 2. Trigger server-side mail sending
      try {
        await fetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: "booking_created",
            booking: { id: docRef.id, ...bookingPayload }
          })
        });
      } catch (mailErr) {
        console.error("Failed to notify server regarding email:", mailErr);
      }

      alert(`Conference Room "${room.name}" requested successfully! Booking price: INR ${price}. Admin has been notified via email.`);
      
      // Reset temporary fields
      setConfPurpose("");
      setConfRemarks("");
    } catch (err) {
      console.error(err);
      alert("Booking failed.");
    } finally {
      setConfLoading(false);
    }
  };

  // Handle Raise Complaint
  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintDesc) return;
    setComplaintLoading(true);
    try {
      await addDoc(collection(db, "complaints"), {
        userEmail: user.email.toLowerCase(),
        userName: user.displayName,
        category: complaintCategory,
        description: complaintDesc,
        status: "open",
        createdAt: new Date().toISOString()
      });
      alert(`Complaint categorized under ${complaintCategory} registered. Support will assign coordinator.`);
      setComplaintDesc("");
    } catch (err) {
      console.error(err);
    } finally {
      setComplaintLoading(false);
    }
  };

  // Handle Screenshot Upload
  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingScreenshot(true);
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
          setPaymentScreenshotUrl(result.fileUrl);
        } else {
          alert("Failed to upload screenshot: " + (result.error || "Unknown error"));
        }
        setUploadingScreenshot(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert("Error uploading screenshot.");
      setUploadingScreenshot(false);
    }
  };

  // Handle Upload Payment Info
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentUtr || !paymentDate || !paymentAmount) {
      alert("Please fill in all required payment details.");
      return;
    }
    setPaymentLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        userEmail: user.email.toLowerCase(),
        month: paymentMonth,
        amount: Number(paymentAmount),
        status: "pending",
        bankName: paymentBank || "N/A",
        paymentDate: paymentDate,
        utr: paymentUtr,
        screenshotUrl: paymentScreenshotUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=300&q=80", 
        createdAt: new Date().toISOString(),
        paymentMethod,
        billingCycle: paymentBillingCycle,
        billingPeriodFrom: paymentPeriodFrom,
        billingPeriodTo: paymentPeriodTo,
        remarks: paymentRemarks
      });
      alert("Payment submitted successfully for verification!");
      setPaymentBank("");
      setPaymentUtr("");
      setPaymentDate("");
      setPaymentRemarks("");
      setPaymentScreenshotUrl("");
      setPaymentPeriodFrom("");
      setPaymentPeriodTo("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit payment details.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle Registration Form File Upload
  const handleRegFormFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
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
          setUploadedFileName(file.name);
          setUploadedFileUrl(result.fileUrl);
          setUploadedDriveLink(result.driveLink);
          triggerToast("Registration form scanned copy uploaded to Google Drive!", "success");
        } else {
          triggerToast("Failed to upload: " + result.error, "error");
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      triggerToast("File reading error: " + err.message, "error");
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle Registration Form Submit (Digital or Uploaded copy)
  const handleRegFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formView === "fill") {
        if (!regDeclarationAccepted) {
          triggerToast("Please accept the rules & COVID protocol declaration.", "error");
          return;
        }
        if (!regSignature.trim()) {
          triggerToast("Signature stamp/typed sign is required.", "error");
          return;
        }
        
        const submissionId = "form_" + Math.random().toString(36).substring(2, 11);
        const autoDriveLink = `https://drive.google.com/file/d/1Synergi_digital_${Math.random().toString(36).substring(2, 10)}_coworking/view?usp=sharing`;
        
        const submissionData = {
          id: submissionId,
          userEmail: user.email.toLowerCase(),
          userName: user.displayName || user.email,
          submissionType: "digital",
          formData: {
            companyName: regCompany,
            registrationType: regType,
            registrationStatus: regStatus,
            noOfEmployees: regEmployees,
            director: { name: regDirectorName, mobile: regDirectorMobile, email: regDirectorEmail, isCoworker: regDirectorIsCoworker },
            employee: { name: regEmployeeName, mobile: regEmployeeMobile, email: regEmployeeEmail, isCoworker: regEmployeeIsCoworker },
            officeAddress: regOfficeAddress,
            permanentAddress: regPermanentAddress,
            presentAddress: regPresentAddress,
            emergency: { name: regEmergencyName, mobile: regEmergencyMobile, email: regEmergencyEmail, relation: regEmergencyRelation },
            expectedStay: regExpectedStay,
            documents: {
              aadhaar: docAadhaar,
              moa: docMoa,
              workDecl: docWorkDecl,
              addressProof: docAddressProof,
              authLetter: docAuthLetter,
              pan: docPan
            },
            place: regPlace,
            signature: regSignature,
          },
          driveLink: autoDriveLink,
          status: "pending_review",
          submittedAt: new Date().toISOString(),
          reviewNotes: ""
        };
        
        await setDoc(doc(db, "registrationForms", submissionId), submissionData);
        triggerToast("Digital Synergi Registration Form submitted successfully!", "success");
        // Reset states and go back
        setFormView("list");
      } else if (formView === "upload") {
        if (!uploadedFileUrl) {
          triggerToast("Please upload a scanned hard copy first.", "error");
          return;
        }
        const submissionId = "form_" + Math.random().toString(36).substring(2, 11);
        const submissionData = {
          id: submissionId,
          userEmail: user.email.toLowerCase(),
          userName: user.displayName || user.email,
          submissionType: "scanned_upload",
          fileName: uploadedFileName,
          fileUrl: uploadedFileUrl,
          uploadedFileUrl: uploadedFileUrl,
          driveLink: uploadedDriveLink,
          status: "pending_review",
          submittedAt: new Date().toISOString(),
          reviewNotes: ""
        };
        
        await setDoc(doc(db, "registrationForms", submissionId), submissionData);
        triggerToast("Scanned Registration Form uploaded to Drive & submitted!", "success");
        // Reset and return
        setUploadedFileName("");
        setUploadedFileUrl("");
        setUploadedDriveLink("");
        setFormView("list");
      }
    } catch (err: any) {
      console.error(err);
      triggerToast("Error submitting registration form: " + err.message, "error");
    }
  };

  const renderPagination = (
    currentPage: number,
    totalItems: number,
    setPage: (page: number) => void,
    itemsPerPage: number = ITEMS_PER_PAGE,
    setItemsPerPage?: (size: number) => void
  ) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4 mt-5 text-xs print:hidden">
        <div className="flex items-center gap-2">
          {setItemsPerPage && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1); // Reset to page 1 on limit change
                }}
                className="px-2 py-1 border border-slate-200 rounded-md bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
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
      </div>
    );
  };

  // Print agreement template
  const handleDownloadAgreement = (agr: Agreement) => {
    const printContent = `
      ======================================================
                  SYNERGI COWORKING SPACE AGREEMENT
      ======================================================
      MEMBER LICENSE FOR SEAT BOOKING
      
      This document serves as proof of a licensed seat allotment 
      at Synergi Coworking Space, Noida.
      
      Member Name:     ${agr.userName}
      Email Address:   ${agr.userEmail}
      Seat Number:     ${agr.seatNumber}
      Rent Amount:     INR ${agr.rentAmount} / Month
      License Period:  ${agr.startDate} to ${agr.endDate}
      Status:          ${agr.status.toUpperCase()}
      
      ------------------------------------------------------
      TERMS & CONDITIONS:
      1. All payments are strictly due by the 5th of every month.
      2. Coworking hours: Monday to Saturday (9:00 AM - 6:00 PM).
      3. Non-payment of monthly dues over 30 days will result 
         in automatic system suspension and seat locking.
         
      Signed Digitally by Synergi Venue Manager on ${agr.createdAt.split("T")[0]}
      ======================================================
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<pre style="font-family:monospace; padding:30px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">${printContent}</pre>`);
      win.document.close();
    } else {
      alert("Popup blocked! Please print manually:\n" + printContent);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    try {
      for (const n of notifications) {
        if (!n.read) {
          await updateDoc(doc(db, "notifications", n.id), { read: true });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Account status check
  if (user.status === "suspended") {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-600/20 text-rose-500 flex items-center justify-center text-3xl mb-4 font-bold border border-rose-500">
          <Ban className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-rose-400">Account Suspended</h1>
        <p className="text-slate-400 max-w-md mt-2 text-sm leading-relaxed">
          Your Member ID has been suspended due to pending rental dues for over 1 month. To reactivate your account immediately, please complete outstanding payments of INR 6,999 to the bank account coordinates below and send screenshot confirmation to support.
        </p>
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 text-left mt-6 max-w-sm w-full space-y-2 text-xs text-slate-300">
          <p className="font-bold text-slate-100 text-sm border-b border-slate-700 pb-2">HDFC Billing Coordinates</p>
          <p><span className="text-slate-500 font-mono">Bank Name:</span> HDFC Bank Ltd</p>
          <p><span className="text-slate-500 font-mono">Account No:</span> 50200045612398</p>
          <p><span className="text-slate-500 font-mono">IFSC Code:</span> HDFC0000088</p>
          <p><span className="text-slate-500 font-mono">Contact Support:</span> +91 98765 43211</p>
        </div>
        <button onClick={onLogout} className="mt-8 bg-slate-800 hover:bg-slate-700 text-slate-100 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
          Logout & Return
        </button>
      </div>
    );
  }

  const combinedRequests = [...bookings, ...confBookings];
  const displayedRequests = combinedRequests.slice((bookingsPage - 1) * bookingsItemsPerPage, bookingsPage * bookingsItemsPerPage);

  const displayedPayments = payments.slice((paymentsPage - 1) * paymentItemsPerPage, paymentsPage * paymentItemsPerPage);
  const displayedComplaints = complaints.slice((complaintsPage - 1) * ticketItemsPerPage, complaintsPage * ticketItemsPerPage);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row text-slate-800 font-sans relative overflow-x-hidden">
      
      {/* SIDEBAR BACKDROP FOR MOBILE */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 shrink-0 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden lg:w-0"
      }`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img 
              src={synergiLogo} 
              alt="Synergi Logo" 
              className="h-9 w-auto object-contain bg-white p-1.5 rounded-xl" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-tight leading-none">Synergi</h2>
              <p className="text-[9px] text-slate-500 font-mono tracking-wider mt-0.5">MEMBER PORTAL</p>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            title="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto space-y-1">
          {[
            { id: "overview", label: "Dashboard Overview", icon: Layers, badge: notifications.filter(n => !n.read).length },
            { id: "conference", label: "Conference Rooms", icon: Calendar, badge: 0 },
            { id: "seats", label: "Seat Booking", icon: CheckSquare, badge: 0 },
            { id: "payments", label: "Payment Receipt", icon: CreditCard, badge: payments.filter(p => p.status === "unpaid" || p.status === "pending").length },
            { id: "complaints", label: "Support Tickets", icon: AlertCircle, badge: complaints.filter(c => c.status === "open").length },
            { id: "agreements", label: "Agreements & Forms", icon: FileText, badge: agreements.filter(a => a.status === "pending_signature").length },
            { id: "visitor", label: "Visitor Entry Pass", icon: QrCode, badge: 0 }
          ].filter(item => isModuleAllowed(item.id)).map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === item.id 
                  ? "bg-blue-600 text-white" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-slate-900">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          {/* Quick Support Social Links */}
          <div className="mb-4 pb-3 border-b border-slate-800/60">
            <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mb-2 text-center">Contact Support</p>
            <div className="flex items-center justify-around">
              <a 
                href="https://wa.me/919667388817" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-emerald-950/30 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                title="WhatsApp Support"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
              <a 
                href="https://www.facebook.com/SynergiCowork" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-blue-950/30 text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                title="Facebook Page"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="tel:+919999028722" 
                className="w-8 h-8 rounded-full bg-orange-950/30 text-orange-400 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                title="Call Support"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {isEditingProfile ? (
            <div className="space-y-3 mb-4 text-left bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  placeholder="Your display name"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
                  className="flex-1 flex items-center justify-center gap-1 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 mb-3 bg-slate-800/30 p-2.5 rounded-xl border border-slate-800/50 hover:bg-slate-800/50 transition-colors group">
              <div 
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                title="View Full Profile Details"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="truncate text-left flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    {user.displayName}
                    <Info className="w-3 h-3 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                  </p>
                  <p className="text-[9px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                title="Edit Profile"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 text-xs font-semibold rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
        
        {/* TOP STATUS BAR */}
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
              <span className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest block">Synergi Coworking Member Access</span>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 capitalize">{activeTab} Panel</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* NOTIFICATIONS PANEL POP-UP */}
            <div className="relative group">
              <button 
                onClick={handleMarkAllRead}
                className="relative p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"></span>
                )}
              </button>
              
              {/* NOTIFICATION FLOTATION CARD */}
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-150 p-4 opacity-0 scale-95 pointer-events-none group-focus-within:opacity-100 group-focus-within:scale-100 group-focus-within:pointer-events-auto transition-all z-50 duration-250">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                  <h5 className="font-extrabold text-xs text-slate-900">Workspace Alerts</h5>
                  <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-blue-600 hover:underline">Mark all read</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-4">No notifications yet.</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`pt-2 text-xxs ${n.read ? "opacity-60" : "font-semibold text-slate-950"}`}>
                        <p className="text-slate-800">{n.title}</p>
                        <p className="text-slate-500 mt-0.5 leading-relaxed">{n.body}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">{new Date(n.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl px-4 py-1.5 flex items-center gap-2 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-500">Member ID:</span>
              <span className="font-mono text-slate-800">{computedAccessId}</span>
            </div>
          </div>
        </div>

        {/* ==================== 1. OVERVIEW TAB ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* DIGITAL MEMBERSHIP & RATE PROFILE CARD */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden border border-slate-800">
              <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute left-0 bottom-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="space-y-3.5 relative z-10 w-full md:w-auto">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                    Active Coworker
                  </span>
                  <span className="font-mono text-xs text-slate-300 bg-slate-800/40 px-2.5 py-1 rounded-lg border border-slate-700/30">
                    Member ID: <strong className="text-blue-300 font-bold">{computedAccessId}</strong>
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{user.displayName}</h2>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Email: <span className="text-slate-200">{user.email}</span> {user.phone ? `• Phone: ${user.phone}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 w-full md:w-auto relative z-10">
                <div className="bg-slate-900/60 backdrop-blur-md px-5 py-4 rounded-2xl border border-slate-800 flex-1 md:flex-initial min-w-[140px]">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Custom Seat Rate</p>
                  <p className="text-xl font-extrabold font-mono text-slate-100">₹{user.seatRate !== undefined ? user.seatRate : 6999}</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md px-5 py-4 rounded-2xl border border-slate-800 flex-1 md:flex-initial min-w-[140px]">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Billing Cycle</p>
                  <p className="text-xl font-extrabold text-indigo-300">{user.billingCycle || "Monthly"}</p>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-md px-5 py-4 rounded-2xl border border-slate-800 flex-1 md:flex-initial min-w-[145px]">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Seat Validity</p>
                  <p className={`text-sm font-extrabold font-mono mt-1 px-2.5 py-0.5 rounded-lg inline-block border ${
                    user.seatValidity 
                      ? (new Date(user.seatValidity) < new Date() 
                        ? 'bg-rose-950/40 text-rose-300 border-rose-900/50' 
                        : 'bg-emerald-950/40 text-emerald-300 border-emerald-900/50') 
                      : 'bg-slate-800/40 text-slate-300 border-slate-700/50'
                  }`}>
                    {user.seatValidity ? `📅 ${user.seatValidity}` : "No validity set"}
                    {user.seatValidity && new Date(user.seatValidity) < new Date() && " (Expired)"}
                  </p>
                </div>
              </div>
            </div>

            {/* MAIN STATS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-150 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Active Bookings</p>
                  <p className="text-lg font-black text-slate-900">{bookings.filter(b => b.status === "approved" || b.status === "active").length}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-150 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Pending Dues</p>
                  <p className="text-lg font-black text-slate-900">
                    {payments.filter(p => p.status === "pending" || p.status === "overdue").length > 0 ? "INR 6,999" : "INR 0"}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-150 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Agreements</p>
                  <p className="text-lg font-black text-slate-900">{agreements.length}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-150 flex items-center gap-4 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Open Complaints</p>
                  <p className="text-lg font-black text-slate-900">{complaints.filter(c => c.status === "open" || c.status === "in_progress").length}</p>
                </div>
              </div>
            </div>

            {/* SECONDARY ROW */}
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* CURRENT ACTIVE LICENSE */}
              <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">My Workspace License</h3>
                
                {agreements.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-400">No active seat agreements found.</p>
                    <span className="text-xs text-slate-500 mt-2 block font-medium">Please contact administration to request seat allotment.</span>
                  </div>
                ) : (
                  agreements.map(agr => (
                    <div key={agr.id} className="space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Allotted Seat:</span>
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">Seat {agr.seatNumber}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Monthly Rent:</span>
                        <span className="font-bold text-slate-800">INR {agr.rentAmount}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">License Period:</span>
                        <span className="font-bold text-slate-800">{agr.startDate} to {agr.endDate}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Status:</span>
                        <span className="text-emerald-700 font-bold uppercase text-[10px] tracking-wider">{agr.status}</span>
                      </div>
                      <button 
                        onClick={() => handleDownloadAgreement(agr)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors mt-2"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Agreement PDF
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* RECENT REQUESTS */}
              <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4 lg:col-span-2">
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">Recent Requests Timelines</h3>
                <div className="space-y-3 max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {bookings.length === 0 && confBookings.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-6">No recent requests.</p>
                  ) : (
                    displayedRequests.map((item: any, idx) => (
                      <div key={item.id || idx} className="pt-2 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-800">
                            {item.seatNumber ? `Allotment Seat: ${item.seatNumber}` : item.roomName ? `Conference: ${item.roomName}` : "Site Visit Request"}
                          </p>
                          <p className="text-[10px] text-slate-400">{item.date} {item.slot ? `(${item.slot})` : ""}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${
                          item.status === "approved" || item.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          item.status === "rejected" || item.status === "inactive" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                {renderPagination(bookingsPage, combinedRequests.length, setBookingsPage, bookingsItemsPerPage, setBookingsItemsPerPage)}
              </div>

            </div>
          </div>
        )}

        {/* ==================== 3. CONFERENCE TAB ==================== */}
        {activeTab === "conference" && (
          <div className="space-y-6">
            {/* Tab Controller */}
            <div className="flex bg-white p-1 rounded-2xl border border-slate-150 shadow-sm max-w-sm">
              <button
                onClick={() => setConfSubTab("book")}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                  confSubTab === "book"
                    ? "bg-[#673ab7] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                📋 Booking Form
              </button>
              <button
                onClick={() => setConfSubTab("list")}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                  confSubTab === "list"
                    ? "bg-[#673ab7] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                📅 My Schedules ({confBookings.length})
              </button>
            </div>

            {confSubTab === "book" ? (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6 max-w-3xl mx-auto">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-bold text-slate-900 text-lg">📋 Book a Conference Space</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Reserve Noida's premium presentation decks. Enter your meeting details below to submit a reservation request.
                  </p>
                </div>

                {/* FORM START */}
                <form onSubmit={handleConfBookingSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* CONFERENCE ROOM DROPDOWN (DYNAMIC FROM DB) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Select Conference Room <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={selectedRoom}
                        onChange={e => setSelectedRoom(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                      >
                        <option value="">-- Choose a Room --</option>
                        {rooms.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.type || "Conference Room"}, Max {r.capacity} Pax) - INR {r.pricePerHour}/hr
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Select from our available state-of-the-art Noida presentation decks.</p>
                    </div>

                    {/* COMPANY NAME */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Company Name <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Please enter your registered firm name"
                          value={confCompanyName}
                          onChange={e => setConfCompanyName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        />
                        {confCompanyName && (
                          <span className="absolute right-3 top-2.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-100">
                            ✓ Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Pre-fetched / Enter your registered firm name.
                      </p>
                    </div>

                    {/* CONTACT PERSON NAME */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Contact Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter contact person name"
                        value={confContactName}
                        onChange={e => setConfContactName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Name of person hosting the session.</p>
                    </div>

                    {/* MOBILE NUMBER */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        pattern="[0-9]{10}"
                        placeholder="10-digit mobile number"
                        value={confContactPhone}
                        onChange={e => setConfContactPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Enter 10-digit mobile number</p>
                    </div>

                    {/* EMAIL ID */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. contact@firm.com"
                        value={confContactEmail}
                        onChange={e => setConfContactEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Booking confirmations are sent here.</p>
                    </div>

                    {/* BOOKING DATE */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Booking Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={confDate}
                        onChange={e => setConfDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Select date for conference slot.</p>
                    </div>

                    {/* DURATION BLOCKS PRESETS */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Duration Block <span className="text-rose-500">*</span>
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { id: "1_hr", label: "1 Hr" },
                          { id: "2_hrs", label: "2 Hrs" },
                          { id: "3_hrs", label: "3 Hrs" },
                          { id: "4_hrs", label: "Half Day" },
                          { id: "full_day", label: "Full Day" },
                        ].map(preset => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setConfDuration(preset.id as any)}
                            className={`py-2 px-0.5 rounded-lg border text-[10px] font-bold uppercase transition-all text-center ${
                              confDuration === preset.id
                                ? "bg-purple-600 border-purple-600 text-white shadow-sm font-black"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Lock duration block</p>
                    </div>

                    {/* START TIME */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Start Time <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="time"
                        required
                        value={confStartTime}
                        onChange={e => setConfStartTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Select starting time</p>
                    </div>

                    {/* END TIME */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        End Time
                      </label>
                      <input
                        type="time"
                        readOnly
                        value={confEndTime}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-500 font-mono font-bold"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Calculated automatically based on duration block</p>
                    </div>

                    {/* MEETING TYPE SELECT DROPDOWN */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Meeting Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={confMeetingType}
                        onChange={e => setConfMeetingType(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                      >
                        <option value="Team Meeting">Team Sync</option>
                        <option value="Client Meeting">Client Meeting</option>
                        <option value="Brainstorming Session">Brainstorming Session</option>
                        <option value="Training / Workshop">Training / Workshop</option>
                        <option value="Candidate Interview">Candidate Interview</option>
                        <option value="Board Meeting">Board Meeting</option>
                        <option value="Other">Other</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">Format of meeting</p>
                    </div>

                    {/* NUMBER OF EXPECTED ATTENDEES (1-10) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Expected Attendees <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={10}
                        placeholder="e.g. 5"
                        value={confAttendees}
                        onChange={e => setConfAttendees(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Enter number of expected attendees (1-10)
                      </p>
                    </div>

                  </div>

                  {/* CUSTOM MEETING TYPE TEXT INPUT IF "OTHER" CHOSEN */}
                  {confMeetingType === "Other" && (
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Specify Custom Meeting Type <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AGM, Investor Meet, Press Conference"
                        value={customMeetingType}
                        onChange={e => setCustomMeetingType(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                      />
                    </div>
                  )}

                  {/* PURPOSE OF MEETING */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Purpose of Meeting <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="What is this meeting regarding?"
                      value={confPurpose}
                      onChange={e => setConfPurpose(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Brief summary of discussion topics.</p>
                  </div>

                  {/* REMARKS */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Remarks (optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Any specific pantry setup or projector coordinates needed?"
                      value={confRemarks}
                      onChange={e => setConfRemarks(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Additional requirements or custom layout setup details.</p>
                  </div>

                  {/* DYNAMIC ESTIMATED PRICE SUMMARY */}
                  {(() => {
                    const activeRoomId = selectedRoom || (rooms[0]?.id || "");
                    const activeRoom = rooms.find(r => r.id === activeRoomId);
                    if (!activeRoom) return null;
                    const hourlyRate = activeRoom.pricePerHour;
                    const multiplier = getMultiplier(confDuration);
                    const totalPrice = hourlyRate * multiplier;
                    return (
                      <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-700 block text-xs">Room & Rate Details:</span>
                          <span className="text-slate-500 font-medium">
                            {activeRoom.name} @ INR {hourlyRate}/hr (Capacity: {activeRoom.capacity} Pax)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">Estimated Rent Price</span>
                          <span className="font-mono text-sm font-black text-purple-700">
                            INR {totalPrice} <span className="text-[10px] text-slate-500 font-normal">({confDuration.replace("_", " ")} slot)</span>
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* SUBMIT BUTTONS */}
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={confLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-8 rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {confLoading ? "Booking Space..." : "Submit Booking Request"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfPurpose("");
                        setConfRemarks("");
                        setCustomMeetingType("");
                      }}
                      className="text-purple-600 hover:bg-purple-50 font-bold py-2 px-4 rounded-xl text-xs sm:text-sm transition-all"
                    >
                      Clear form
                    </button>
                  </div>

                </form>
              </div>
            ) : (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Your Scheduled Meetings</h4>
                  <p className="text-xs text-slate-500">Track and monitor your Noida co-space presentations. All slots require admin verification.</p>
                </div>

                <div className="overflow-hidden border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider font-mono text-[10px]">
                        <th className="p-4">Room & Company</th>
                        <th className="p-4">Timings</th>
                        <th className="p-4">Type & Attendees</th>
                        <th className="p-4 text-right">Price</th>
                        <th className="p-4 text-center">Approval Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {confBookings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 italic">No meeting slots scheduled. Fill the booking form to request a room slot!</td>
                        </tr>
                      ) : (
                        confBookings.map(cb => (
                          <tr key={cb.id} className="hover:bg-slate-50/50">
                            <td className="p-4">
                              <p className="font-bold text-slate-900">{cb.roomName}</p>
                              <p className="text-[10px] text-purple-600 font-bold">{cb.companyName || "N/A"}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-slate-850 font-mono">{cb.date}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{cb.slot}</p>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-[#673ab7]">
                                {cb.meetingType || "Team Sync"}
                              </span>
                              <p className="text-[10px] text-slate-500 mt-1">Pax count: <span className="font-bold text-slate-800">{cb.attendees || 1}</span></p>
                            </td>
                            <td className="p-4 text-right font-bold text-slate-900 font-mono">
                              INR {cb.totalPrice}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                cb.status === "approved" 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : cb.status === "rejected" 
                                  ? "bg-rose-50 text-rose-700 border-rose-200" 
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {cb.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== 4. PAYMENTS TAB ==================== */}
        {activeTab === "payments" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-8 animate-fade-in">
            
            {/* Header section with brand company logo if available */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-3">
                {settings?.companyLogo ? (
                  <img 
                    src={settings.companyLogo} 
                    alt="Company Logo" 
                    className="w-12 h-12 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{settings?.companyName || "Synergi Coworking Spaces Ltd"} Payments Portal</h3>
                  <p className="text-xs text-slate-500">View billing cycles, access corporate coordinates, and file payment verification receipts.</p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-xs flex flex-col font-medium">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Company GST Number</span>
                <span className="font-bold text-slate-800 font-mono">{settings?.gstNumber || "N/A (Not configured)"}</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: COORDINATES & BREAKDOWN (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* ACTIVE TENANT AGREEMENT CARD */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Agreement Metadata
                  </h4>
                  <div className="text-xs space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <span>Agreement ID:</span>
                      <span className="font-bold text-slate-850 font-mono">{agreements[0]?.id || "AGR-9102-SYS"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tenant Profile:</span>
                      <span className="font-bold text-slate-850 truncate max-w-[150px]">{user.displayName || user.email}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200/60 pt-2 mt-2">
                      <span className="font-medium text-slate-700">Rent Payment Term:</span>
                      <span className="font-bold text-blue-600 font-mono">{settings?.billingCycle || "Monthly"}</span>
                    </div>
                  </div>
                </div>

                {/* CHARGES BREAKDOWN CARD */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex justify-between items-center">
                    <span>Rent Charges Summary</span>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-mono">Active Billings</span>
                  </h4>
                  <div className="text-xs space-y-2.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Seat Booking Rate:</span>
                      <span className="font-bold text-slate-800 font-mono">INR {userSeatRate} / seat</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Allocated Seats Count:</span>
                      <span className="font-bold text-slate-800 font-mono">{allocatedSeatsCount} seat(s)</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pl-3 border-l-2 border-slate-100">
                      <span>Total Seat Rental:</span>
                      <span className="font-bold text-slate-800 font-mono">INR {totalSeatRental}</span>
                    </div>

                    {totalConferenceBilling > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Conference Room Charges:</span>
                        <span className="font-bold text-slate-800 font-mono">INR {totalConferenceBilling}</span>
                      </div>
                    )}

                    {settings?.maintenanceCharges ? (
                      <div className="flex justify-between text-slate-600">
                        <span>Maintenance & Utility Charges:</span>
                        <span className="font-bold text-slate-800 font-mono">INR {settings.maintenanceCharges}</span>
                      </div>
                    ) : null}

                    <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-black">
                      <span className="text-slate-900">Total Net Amount Due:</span>
                      <span className="text-emerald-600 font-mono">
                        INR {netAmountDue}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CENTRAL BANK COORDINATES CARD */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Official Corporate Bank Details
                  </h4>
                  <div className="text-xs space-y-3">
                    <div>
                      <span className="text-slate-400 font-mono text-[10px] block">ACCOUNT HOLDER NAME</span>
                      <span className="font-bold text-slate-800">{settings?.accountHolderName || "SYNERGI COWORKING CO"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 font-mono text-[10px] block">BANK NAME</span>
                        <span className="font-bold text-slate-800">{settings?.bankName || "HDFC Bank Ltd"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-mono text-[10px] block">BRANCH NAME</span>
                        <span className="font-bold text-slate-800">{settings?.branchName || "Sector 18 Corporate, Noida"}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 font-mono text-[10px] block">ACCOUNT NUMBER</span>
                        <span className="font-bold text-slate-800 font-mono">{settings?.accountNo || "50200045612398"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-mono text-[10px] block">IFSC CODE</span>
                        <span className="font-bold text-slate-800 font-mono">{settings?.ifscCode || "HDFC0000088"}</span>
                      </div>
                    </div>
                    {settings?.bankAddress && (
                      <div>
                        <span className="text-slate-400 font-mono text-[10px] block">BRANCH ADDRESS</span>
                        <span className="font-medium text-slate-700">{settings.bankAddress}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* UPI QR SCAN CARD */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center space-y-3">
                  <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                    UPI Instant QR Payment
                  </h4>
                  <div className="flex flex-col items-center py-2">
                    <img 
                      src={settings?.qrCodeUrl || "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=synergi@ybl"} 
                      alt="Billing QR" 
                      className="w-36 h-36 object-contain bg-white p-2 rounded-xl border border-slate-200 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                    <p className="font-extrabold text-slate-800 text-xs mt-2 font-mono">{settings?.upiId || "synergi@ybl"}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{settings?.merchantName || "Synergi Spaces Noida"}</p>
                  </div>
                </div>


                {/* SUPPORT CONTACTS */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xxs font-medium text-slate-500">
                  <p className="font-bold uppercase tracking-wider text-slate-700">Billing Support Helpline:</p>
                  <p>Email Support: <span className="font-bold text-slate-800">{settings?.supportEmail || "billing@synergispaces.com"}</span></p>
                  <p>Mobile: <span className="font-bold text-slate-800">{settings?.supportMobile || "+91 98765 43210"}</span></p>
                  {settings?.whatsapp && (
                    <p>WhatsApp: <span className="font-bold text-slate-800">{settings.whatsapp}</span></p>
                  )}
                </div>

              </div>

              {/* RIGHT COLUMN: PAYMENT SUBMISSION FORM (7 cols) */}
              <div className="lg:col-span-7">
                <form onSubmit={handlePaymentSubmit} className="bg-white p-6 sm:p-8 border border-slate-200 rounded-2xl space-y-6">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-extrabold text-sm text-slate-900">Submit Rent Verification Receipt</h4>
                    <p className="text-xs text-slate-500">Record payments after initiating bank transfer or scanning the UPI QR above.</p>
                  </div>
                  
                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("UPI")}
                        className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          paymentMethod === "UPI" 
                            ? "border-blue-600 bg-blue-50 text-blue-600 ring-1 ring-blue-500" 
                            : "border-slate-200 hover:bg-slate-50 text-slate-600 bg-white"
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        UPI / QR Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("Bank Transfer")}
                        className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          paymentMethod === "Bank Transfer" 
                            ? "border-blue-600 bg-blue-50 text-blue-600 ring-1 ring-blue-500" 
                            : "border-slate-200 hover:bg-slate-50 text-slate-600 bg-white"
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        Bank / IMPS Transfer
                      </button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Billing Cycle selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Billing Cycle</label>
                      <select
                        value={paymentBillingCycle}
                        onChange={e => setPaymentBillingCycle(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-850 focus:outline-none"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Half-Yearly">Half-Yearly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    </div>

                    {/* Amount Paid */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Amount Paid (INR) <span className="text-rose-500">*</span></label>
                      <input 
                        type="number"
                        required
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none"
                        placeholder="6999"
                      />
                    </div>
                  </div>

                  {/* Billing Period (From - To) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Billing Period Duration</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">FROM DATE</span>
                        <input 
                          type="date"
                          required
                          value={paymentPeriodFrom}
                          onChange={e => setPaymentPeriodFrom(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">TO DATE</span>
                        <input 
                          type="date"
                          required
                          value={paymentPeriodTo}
                          onChange={e => setPaymentPeriodTo(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Bank Transfer specific source name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        {paymentMethod === "UPI" ? "UPI App Name (Optional)" : "Sender Bank Name"}
                      </label>
                      <input 
                        type="text"
                        placeholder={paymentMethod === "UPI" ? "e.g. PhonePe / GPay" : "e.g. ICICI Bank"}
                        value={paymentBank}
                        onChange={e => setPaymentBank(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-850 focus:outline-none"
                      />
                    </div>

                    {/* Payment Date */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Transaction Date <span className="text-rose-500">*</span></label>
                      <input 
                        type="date"
                        required
                        value={paymentDate}
                        onChange={e => setPaymentDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-1 gap-4">
                    {/* UTR reference */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Transaction UTR / UPI Ref No <span className="text-rose-500">*</span></label>
                      <input 
                        type="text"
                        placeholder="12-digit transaction identifier"
                        required
                        value={paymentUtr}
                        onChange={e => setPaymentUtr(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Receipt Upload */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Payment Screenshot / Receipt Upload</label>
                    <div className="flex items-center gap-3">
                      <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border border-slate-200 flex items-center justify-center gap-1.5 shrink-0">
                        <UploadCloud className="w-4 h-4 text-blue-600" />
                        {uploadingScreenshot ? "Uploading..." : "Choose Screenshot File"}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleScreenshotUpload} 
                          className="hidden" 
                        />
                      </label>
                      <span className="text-xxs text-slate-400 font-mono truncate max-w-[200px]">
                        {paymentScreenshotUrl ? "File uploaded successfully" : "No file chosen (Default placeholder will apply)"}
                      </span>
                    </div>
                    {paymentScreenshotUrl && (
                      <div className="mt-3 relative inline-block">
                        <img 
                          src={paymentScreenshotUrl} 
                          alt="Screenshot upload preview" 
                          className="h-28 w-auto object-cover rounded-xl border border-slate-200 p-1 bg-white shadow-xs" 
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          type="button" 
                          onClick={() => setPaymentScreenshotUrl("")}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 shadow-sm"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tenant Remarks */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Additional Tenant Remarks (Optional)</label>
                    <textarea 
                      placeholder="Type in notes about partial payments, advance deposit adjustments, etc..."
                      rows={2}
                      value={paymentRemarks}
                      onChange={e => setPaymentRemarks(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={paymentLoading || uploadingScreenshot}
                    className="w-full bg-blue-600 hover:bg-blue-700 hover:shadow-lg text-white font-extrabold py-3 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    {paymentLoading ? "Submitting details..." : "Submit Payment details"}
                  </button>
                </form>
              </div>

            </div>

            {/* PAYMENT LOGS */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <h4 className="font-bold text-sm text-slate-900">Verification Ledger</h4>
              <div className="bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-200">
                {payments.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-6">No billing submissions yet.</p>
                ) : (
                  displayedPayments.map(p => (
                    <div key={p.id} className="p-4 flex flex-wrap justify-between items-center gap-4 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 font-mono uppercase bg-blue-50 px-2 py-0.5 rounded">{p.month}</span>
                        <p className="font-extrabold text-slate-800 mt-1">Amount: INR {p.amount}</p>
                        <p className="text-[10px] text-slate-400">UTR: {p.utr} | Bank: {p.bankName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded text-xxs font-bold uppercase tracking-wider ${
                          p.status === "paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          p.status === "overdue" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                          "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {p.status}
                        </span>
                                       {p.status === "paid" && (
                          <button 
                            type="button"
                            onClick={() => {
                              const gstContent = `
                                ====================================================
                                            OFFICIAL GST INVOICE
                                ====================================================
                                ${settings?.companyName || "Synergi Coworking Spaces Ltd"} (GSTIN: ${settings?.gstNumber || "09AAACS4129M1ZP"})
                                Address: ${settings?.registeredAddress || settings?.address || "Noida, Sector 62, Noida UP"}
                                
                                Invoice No:     INV-2026-${p.id.slice(0, 4).toUpperCase()}
                                Client Email:   ${p.userEmail}
                                Billing Period: ${p.billingPeriodFrom || p.month} to ${p.billingPeriodTo || p.month}
                                Total Paid:     INR ${p.amount} (CGST 9% + SGST 9% incl.)
                                Transaction UTR:${p.utr}
                                Payment Date:   ${p.paymentDate || p.createdAt.split("T")[0]}
                                Method:         ${p.paymentMethod || "Bank/UPI"}
                                
                                Verified digitally by Admin Ledger Sync on behalf of ${settings?.companyName || "Synergi"}.
                                ====================================================
                              `;
                              const win = window.open("", "_blank");
                              if (win) {
                                win.document.write(`<pre style="font-family:monospace; padding:30px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">${gstContent}</pre>`);
                                win.document.close();
                              } else {
                                alert("Popup blocked! GST Details:\n" + gstContent);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                            title="Generate GST Invoice"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {renderPagination(paymentsPage, payments.length, setPaymentsPage, paymentItemsPerPage, setPaymentItemsPerPage)}
            </div>
          </div>
        )}

        {/* ==================== 5. COMPLAINTS TAB ==================== */}
        {activeTab === "complaints" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-8">
            <div className="max-w-xl">
              <h3 className="text-lg font-extrabold text-slate-900">Complaints & Support Module</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Experiencing issues with internet connectivity, seating, air conditioning, housekeeping, or any other facility? Raise a support ticket instantly through the portal. Our facility team will review your request, assign it to the appropriate staff, and aim to resolve it within 48 hours (excluding Sundays).
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* FORM */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-sm text-slate-900">File a Service Ticket</h4>
                <form onSubmit={handleComplaintSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Issue Category</label>
                    <select
                      value={complaintCategory}
                      onChange={e => setComplaintCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-850 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Internet">Internet & WiFi</option>
                      <option value="Cleaning">Cleaning & Housekeeping</option>
                      <option value="Electricity">Electricity & Power</option>
                      <option value="Furniture">Furniture & Seats</option>
                      <option value="AC">Air Conditioning (AC)</option>
                      <option value="Tea/Coffee">Tea, Coffee & Pantry</option>
                      <option value="Plumbing">Plumbing & Restroom</option>
                      <option value="Water">Drinking Water</option>
                      <option value="Access control">Access control & Biometric</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Describe Issue Details</label>
                    <textarea
                      rows={4}
                      required
                      value={complaintDesc}
                      onChange={e => setComplaintDesc(e.target.value)}
                      placeholder="Explain exactly what is wrong so staff can carry necessary tools..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-850 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={complaintLoading}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold py-2.5 rounded-xl transition-all"
                  >
                    {complaintLoading ? "Loding Ticket..." : "File Urgent Ticket"}
                  </button>
                </form>
              </div>

              {/* LISTING */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-bold text-sm text-slate-900">Your Ticket Logs</h4>
                <div className="space-y-3 max-h-[400px] overflow-y-auto divide-y divide-slate-100">
                  {complaints.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4 text-center">No service complaints filed.</p>
                  ) : (
                    displayedComplaints.map(c => (
                      <div key={c.id} className="pt-3 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{c.category}</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-2">{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xxs font-bold uppercase tracking-wider ${
                            c.status === "resolved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            c.status === "in_progress" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 pl-2 border-l-2 border-slate-200">{c.description}</p>
                        {c.assignedStaff && (
                          <p className="text-[10px] text-blue-600 font-bold">Assigned Coordinator: {c.assignedStaff}</p>
                        )}
                        {(c as any).adminNotes && (
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-150 text-xxs text-slate-700">
                            <strong>Coordinator Notes:</strong> {(c as any).adminNotes}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {renderPagination(complaintsPage, complaints.length, setComplaintsPage, ticketItemsPerPage, setTicketItemsPerPage)}
              </div>

            </div>
          </div>
        )}

        {/* ==================== 6. AGREEMENTS TAB ==================== */}
        {activeTab === "agreements" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6">
            
            {/* SUB-TAB TOGGLE SELECTOR */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setAgreementsSubTab("contracts")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  agreementsSubTab === "contracts"
                    ? "border-blue-600 text-blue-600 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                My Booking & License Contracts
              </button>
              <button
                type="button"
                onClick={() => setAgreementsSubTab("registration")}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  agreementsSubTab === "registration"
                    ? "border-blue-600 text-blue-600 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Synergi Registration Forms (Required)
              </button>
            </div>

            {/* ================ SUB TAB 1: BOOKING CONTRACTS ================ */}
            {agreementsSubTab === "contracts" && (
              <div className="space-y-6">
                <div className="max-w-xl">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">License Agreements Ledger</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Your legally binding Leave & License and seat allotment contracts generated by Synergi managers.
                  </p>
                </div>

                <div className="space-y-4">
                  {agreements.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No official seat license agreements registered under your profile.</p>
                      <p className="text-[10px] text-slate-400 mt-1">To generate one, please submit a registration form or contact venue management.</p>
                    </div>
                  ) : (
                    agreements.slice((agreementsPage - 1) * agreementItemsPerPage, agreementsPage * agreementItemsPerPage).map(agr => (
                      <div key={agr.id} className="p-6 bg-slate-50 border border-slate-150 rounded-2xl space-y-4">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Allotment contract</span>
                            <h4 className="font-extrabold text-slate-900 text-sm mt-1">Leave & License for Seat {agr.seatNumber}</h4>
                            <p className="text-xxs text-slate-400 font-mono">Contract ID: {agr.id.toUpperCase()}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded text-xxs font-bold uppercase tracking-widest ${
                            agr.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                            "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {agr.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-slate-200">
                          <div>
                            <p className="text-slate-400 font-medium">Licensed Member</p>
                            <p className="font-bold text-slate-800">{agr.userName}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">Monthly Rent amount</p>
                            <p className="font-bold text-slate-800">INR {agr.rentAmount}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">License Start</p>
                            <p className="font-bold text-slate-800">{agr.startDate}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium">License Expiry</p>
                            <p className="font-bold text-slate-800">{agr.endDate}</p>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-wrap gap-2">
                          <button 
                            type="button"
                            onClick={() => handleDownloadAgreement(agr)}
                            className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2 border border-slate-250 rounded-xl text-xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> Printable PDF Preview
                          </button>
                          <button 
                            type="button"
                            onClick={async () => {
                              const dateObj = new Date(agr.endDate);
                              dateObj.setMonth(dateObj.getMonth() + 1);
                              const nextMonthStr = dateObj.toISOString().split("T")[0];
                              try {
                                await updateDoc(doc(db, "agreements", agr.id), {
                                  endDate: nextMonthStr,
                                  status: "active"
                                });
                                triggerToast(`Agreement successfully auto-extended to ${nextMonthStr}!`, "success");
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all"
                          >
                            Request One-Click Auto-Renewal
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {renderPagination(agreementsPage, agreements.length, setAgreementsPage, agreementItemsPerPage, setAgreementItemsPerPage)}
              </div>
            )}

            {/* ================ SUB TAB 2: SYNERGI REGISTRATION FORMS ================ */}
            {agreementsSubTab === "registration" && (
              <div className="space-y-6">
                
                {/* 1. LIST VIEW OF SUBMISSIONS */}
                {formView === "list" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Synergi Seat Registration Ledgers</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Each coworker/enterprise seat allotment must map to a signed physical or digital registration form.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormView("fill");
                            // Set defaults from profile
                            setRegCompany(user.companyName || "");
                            setRegDirectorName(user.displayName || "");
                            setRegDirectorEmail(user.email || "");
                            setRegDirectorMobile(user.phone || "");
                          }}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Fill Online Form
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormView("upload")}
                          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload Hard-Copy Scan
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Submission Records</h4>
                      {registrationForms.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 border border-slate-150 rounded-2xl text-slate-400">
                          <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="text-xs">No registration ledger entries submitted yet.</p>
                          <p className="text-[10px] text-slate-400 mt-1">Submit your workspace form above using either the online tool or physical scan upload.</p>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-sm">
                          {registrationForms.slice((regPage - 1) * regItemsPerPage, regPage * regItemsPerPage).map((form: any) => (
                            <div key={form.id} className="p-4 flex flex-wrap justify-between items-center gap-4 text-xs">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                    form.submissionType === "digital" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-700"
                                  }`}>
                                    {form.submissionType === "digital" ? "Digital Online" : "Physical Upload"}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-400 font-mono">
                                    Submitted: {new Date(form.submittedAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <h5 className="font-extrabold text-slate-800 text-sm">
                                  {form.submissionType === "digital" 
                                    ? `Company: ${form.formData?.companyName || "N/A"}` 
                                    : `Scanned Attachment: ${form.fileName || "N/A"}`
                                  }
                                </h5>
                                {form.driveLink && (
                                  <a 
                                    href={form.driveLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-bold hover:underline"
                                  >
                                    <ExternalLink className="w-3 h-3" /> View Document in Google Drive ↗
                                  </a>
                                )}
                                {form.reviewNotes && (
                                  <div className="bg-rose-50 border border-rose-100 p-2 rounded-lg text-[11px] text-rose-700 font-medium">
                                    <strong>Admin Notes:</strong> {form.reviewNotes}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 rounded text-xxs font-bold uppercase tracking-widest ${
                                  form.status === "approved" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                  form.status === "rejected" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                                  "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}>
                                  {form.status.replace("_", " ")}
                                </span>

                                {form.submissionType === "digital" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedRegForm(form);
                                      setFormView("view");
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold text-[11px]"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Inspect
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {renderPagination(regPage, registrationForms.length, setRegPage, regItemsPerPage, setRegItemsPerPage)}
                    </div>
                  </div>
                )}

                {/* 2. FILL FORM ONLINE */}
                {formView === "fill" && (
                  <form onSubmit={handleRegFormSubmit} className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs sm:text-sm">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <div>
                        <h4 className="font-extrabold text-slate-950 text-sm sm:text-base">Interactive Registration Ledger Form</h4>
                        <p className="text-xxs text-slate-500 uppercase font-mono tracking-wider">Synergi Coworking Spaces Delhi NCR</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const printWindow = window.open("", "_blank");
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                              <head>
                                <title>Blank Synergi Registration Form</title>
                                <style>
                                  @media print {
                                    body { margin: 0; padding: 10mm; -webkit-print-color-adjust: exact; }
                                    .no-print { display: none; }
                                  }
                                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 25px; line-height: 1.25; font-size: 10px; color: #000000; background-color: #ffffff; max-width: 800px; margin: 0 auto; }
                                  .logo-container { display: flex; justify-content: flex-start; align-items: center; margin-bottom: 12px; }
                                  .form-header { text-align: left; margin-bottom: 10px; }
                                  .form-title { font-size: 11px; font-weight: 800; text-decoration: underline; text-transform: uppercase; color: #000000; letter-spacing: 0.5px; }
                                  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; table-layout: fixed; }
                                  td, th { border: 1px solid #000000; padding: 5px 8px; text-align: left; font-size: 9.5px; vertical-align: top; }
                                  th { background-color: #f8fafc; font-weight: bold; }
                                  .num-col { width: 5%; text-align: center; font-weight: bold; }
                                  .field-col { width: 40%; font-weight: bold; }
                                  .value-col { width: 55%; }
                                  .declaration-box { border: 1px solid #000000; padding: 8px; font-size: 8.5px; line-height: 1.35; text-align: justify; margin-bottom: 10px; }
                                  .footer-table { width: 100%; margin-top: 5px; }
                                  .footer-table td { border: none; padding: 4px; }
                                </style>
                              </head>
                              <body onload="window.print()">
                                <!-- Logo Header -->
                                <div class="logo-container">
                                  <img src="${synergiLogo}" alt="Synergi Logo" style="height: 55px; max-height: 55px; width: auto; object-fit: contain; display: block;" />
                                </div>

                                <!-- Form Title -->
                                <div class="form-header">
                                  <div class="form-title">REGISTRATION FORM (TO BE FILLED PER SEAT)</div>
                                </div>

                                <!-- Part 1: Registration Details -->
                                <table>
                                  <tr>
                                    <td class="num-col">1.</td>
                                    <td class="field-col">Name of Company/Firm</td>
                                    <td class="value-col"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">2.</td>
                                    <td class="field-col">Registration Type<br/><span style="font-weight: normal; font-size: 8.5px;">(Proprietor/Partnership/Pvt Ltd/Ltd)</span></td>
                                    <td class="value-col"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">3.</td>
                                    <td class="field-col">Registration Status<br/><span style="font-weight: normal; font-size: 8.5px;">(MSME/NSIC/StartupIndia)</span></td>
                                    <td class="value-col"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">4.</td>
                                    <td class="field-col">No of employees</td>
                                    <td class="value-col"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">5.</td>
                                    <td colspan="2" style="padding: 0;">
                                      <table style="width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed;">
                                        <tr>
                                          <td style="border: none; border-bottom: 1px solid #000000; border-right: 1px solid #000000; font-weight: bold; width: 65%; padding: 4px 8px;">Proprietor/Partner/Director <span style="font-weight: normal; font-size: 8px;">(Tick the right one)</span></td>
                                          <td style="border: none; border-bottom: 1px solid #000000; font-weight: bold; width: 35%; padding: 4px 8px;">Whether Co-worker (Yes/No)</td>
                                        </tr>
                                        <tr>
                                          <td colspan="2" style="border: none; padding: 0;">
                                            <table style="width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed;">
                                              <tr>
                                                <td style="border: none; border-right: 1px solid #000000; width: 35%; padding: 4px 8px;">Name:</td>
                                                <td style="border: none; border-right: 1px solid #000000; width: 30%; padding: 4px 8px;">Mobile No:</td>
                                                <td style="border: none; width: 35%; padding: 4px 8px;">Email Id:</td>
                                              </tr>
                                            </table>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">6.</td>
                                    <td colspan="2" style="padding: 0;">
                                      <table style="width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed;">
                                        <tr>
                                          <td style="border: none; border-bottom: 1px solid #000000; border-right: 1px solid #000000; font-weight: bold; width: 65%; font-size: 8px; line-height: 1.1; padding: 3px 8px;">
                                            Fill for: Employee <span style="font-weight: normal; font-size: 7.5px;">(Strike off not relevant)</span><br/>
                                            Or Alternate Contact <span style="font-weight: normal; font-size: 7.5px;">(for owners only)</span><br/>
                                            Or Authorised Person in Co-work <span style="font-weight: normal; font-size: 7px;">(In case owner at Serial 5 above is not part of this co-work then attach authorisation letter from him/her)</span>
                                          </td>
                                          <td style="border: none; border-bottom: 1px solid #000000; font-weight: bold; width: 35%; vertical-align: middle; padding: 3px 8px;">Whether Co-worker (Yes/No)</td>
                                        </tr>
                                        <tr>
                                          <td colspan="2" style="border: none; padding: 0;">
                                            <table style="width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed;">
                                              <tr>
                                                <td style="border: none; border-right: 1px solid #000000; width: 35%; padding: 4px 8px;">Name:</td>
                                                <td style="border: none; border-right: 1px solid #000000; width: 30%; padding: 4px 8px;">Mobile No:</td>
                                                <td style="border: none; width: 35%; padding: 4px 8px;">Email Id:</td>
                                              </tr>
                                            </table>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">7.</td>
                                    <td class="field-col">Registered Office Address of company/firm</td>
                                    <td class="value-col" style="height: 20px;"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">8.</td>
                                    <td class="field-col">Permanent Home Address of Co-worker</td>
                                    <td class="value-col" style="height: 20px;"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">9.</td>
                                    <td class="field-col">Present Home Address of Co-worker</td>
                                    <td class="value-col" style="height: 20px;"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">10.</td>
                                    <td colspan="2" style="padding: 0;">
                                      <table style="width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed;">
                                        <tr>
                                          <td style="border: none; border-bottom: 1px solid #000000; border-right: 1px solid #000000; font-weight: bold; width: 65%; padding: 4px 8px;">Emergency Contact of Co-worker</td>
                                          <td style="border: none; border-bottom: 1px solid #000000; font-weight: bold; width: 35%; padding: 4px 8px;">Relation</td>
                                        </tr>
                                        <tr>
                                          <td colspan="2" style="border: none; padding: 0;">
                                            <table style="width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed;">
                                              <tr>
                                                <td style="border: none; border-right: 1px solid #000000; width: 35%; padding: 4px 8px;">Name:</td>
                                                <td style="border: none; border-right: 1px solid #000000; width: 30%; padding: 4px 8px;">Mobile No:</td>
                                                <td style="border: none; width: 35%; padding: 4px 8px;">Email Id:</td>
                                              </tr>
                                            </table>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">11.</td>
                                    <td class="field-col">Expected duration of stay</td>
                                    <td class="value-col"></td>
                                  </tr>
                                </table>

                                <!-- Part 2: List of Documents to be attached -->
                                <table style="margin-top: 4px;">
                                  <thead>
                                    <tr style="background-color: #f1f5f9;">
                                      <th style="width: 6%; text-align: center; padding: 4px;">S.N.</th>
                                      <th style="width: 50%; padding: 4px;">List of Documents to be attached</th>
                                      <th style="width: 12%; text-align: center; padding: 4px;">Yes/No</th>
                                      <th style="width: 16%; text-align: center; padding: 4px;">Document No</th>
                                      <th style="width: 16%; text-align: center; padding: 4px;">Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td style="text-align: center; font-weight: bold; padding: 4px;">1.</td>
                                      <td style="padding: 4px;">Aadhaar</td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                    </tr>
                                    <tr>
                                      <td style="text-align: center; font-weight: bold; padding: 4px;">2.</td>
                                      <td style="padding: 4px;">MOA/AOA of company/Partnership deed/any other document</td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                    </tr>
                                    <tr>
                                      <td style="text-align: center; font-weight: bold; padding: 4px;">3.</td>
                                      <td style="padding: 4px;">Letter of Declaration of type of work being undertaken</td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                    </tr>
                                    <tr>
                                      <td style="text-align: center; font-weight: bold; padding: 4px;">4.</td>
                                      <td style="padding: 4px;">Present address proof</td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                    </tr>
                                    <tr>
                                      <td style="text-align: center; font-weight: bold; padding: 4px;">5.</td>
                                      <td style="padding: 4px;">Letter of Authorised representative</td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                    </tr>
                                    <tr>
                                      <td style="text-align: center; font-weight: bold; padding: 4px;">6.</td>
                                      <td style="padding: 4px;">PAN(Company/Directors/Employees)</td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                    </tr>
                                  </tbody>
                                </table>

                                <!-- Part 3: Declaration -->
                                <div class="declaration-box">
                                  <strong>Declaration:</strong> I hereby understand that I am taking any one provided seat as service including corresponding use of furniture, electricity, tea/coffee/wi-fi etc as per norms from time to time and I cannot transfer the same to anyone else. I agree to maintain socially acceptable conduct and I am authorised to undertake only lawful activities. I’m fully responsible for all my personal items and any activities (including use of internet) undertaken by me and my employees and I shall indemnify Synergi and its management/ employees for the same. I shall follow all COVID protocols.
                                </div>

                                <!-- Part 4: Signature / Stamp -->
                                <table class="footer-table">
                                  <tr>
                                    <td colspan="2" style="height: 30px; vertical-align: bottom;">
                                      <strong>Signature with stamp:</strong> ___________________________________________
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="width: 50%; padding-top: 10px;">
                                      <strong>Date:</strong> ___________________________________________
                                    </td>
                                    <td style="width: 50%; padding-top: 10px;">
                                      <strong>Place:</strong> ___________________________________________
                                    </td>
                                  </tr>
                                </table>
                              </body>
                              </html>
                            `);
                            printWindow.document.close();
                          }
                        }}
                        className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-700 text-xxs transition-colors"
                      >
                        <Printer className="w-3 h-3 text-slate-500" /> Print Blank Paper Form
                      </button>
                    </div>

                    {/* ROW 1-4 */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">1. Name of Company / Firm</label>
                        <input
                          type="text"
                          required
                          value={regCompany}
                          onChange={e => setRegCompany(e.target.value)}
                          placeholder="e.g. Acme Technologies Private Limited"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">2. Registration Type</label>
                        <select
                          value={regType}
                          onChange={e => setRegType(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none"
                        >
                          <option value="Proprietor">Proprietor</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Pvt Ltd">Pvt Ltd</option>
                          <option value="Ltd">Ltd</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">3. Registration Status</label>
                        <select
                          value={regStatus}
                          onChange={e => setRegStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none"
                        >
                          <option value="MSME">MSME</option>
                          <option value="NSIC">NSIC</option>
                          <option value="Startup India">Startup India</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">4. Total No. of Employees on floor</label>
                        <input
                          type="number"
                          required
                          value={regEmployees}
                          onChange={e => setRegEmployees(e.target.value)}
                          placeholder="e.g. 12"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* ROW 5: DIRECTOR DETAILS */}
                    <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                      <h5 className="font-extrabold text-slate-900 border-b border-slate-100 pb-1.5 text-xs">
                        5. Director / Proprietor / Partner Coordinates
                      </h5>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Director Name</label>
                          <input
                            type="text"
                            required
                            value={regDirectorName}
                            onChange={e => setRegDirectorName(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Director Mobile</label>
                          <input
                            type="tel"
                            required
                            value={regDirectorMobile}
                            onChange={e => setRegDirectorMobile(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Director Email</label>
                          <input
                            type="email"
                            required
                            value={regDirectorEmail}
                            onChange={e => setRegDirectorEmail(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Is Director Active Co-worker?</span>
                        <select
                          value={regDirectorIsCoworker}
                          onChange={e => setRegDirectorIsCoworker(e.target.value)}
                          className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xxs font-bold"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>

                    {/* ROW 6: EMPLOYEE DETAILS */}
                    <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                      <h5 className="font-extrabold text-slate-900 border-b border-slate-100 pb-1.5 text-xs">
                        6. Authorized Representative / Alternate Co-worker Contact
                      </h5>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Contact Name</label>
                          <input
                            type="text"
                            required
                            value={regEmployeeName}
                            onChange={e => setRegEmployeeName(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Contact Mobile</label>
                          <input
                            type="tel"
                            required
                            value={regEmployeeMobile}
                            onChange={e => setRegEmployeeMobile(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Contact Email</label>
                          <input
                            type="email"
                            required
                            value={regEmployeeEmail}
                            onChange={e => setRegEmployeeEmail(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Is Representative Active Co-worker?</span>
                        <select
                          value={regEmployeeIsCoworker}
                          onChange={e => setRegEmployeeIsCoworker(e.target.value)}
                          className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xxs font-bold"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>

                    {/* ROW 7-9: ADDRESS DETAILS */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">7. Registered Office Address</label>
                        <input
                          type="text"
                          required
                          value={regOfficeAddress}
                          onChange={e => setRegOfficeAddress(e.target.value)}
                          placeholder="Registered company corporate address"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">8. Permanent Home Address of Co-worker</label>
                        <input
                          type="text"
                          required
                          value={regPermanentAddress}
                          onChange={e => setRegPermanentAddress(e.target.value)}
                          placeholder="As stated in national ID certificate"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">9. Present Home Address of Co-worker (Noida NCR)</label>
                        <input
                          type="text"
                          required
                          value={regPresentAddress}
                          onChange={e => setRegPresentAddress(e.target.value)}
                          placeholder="Temporary residence / local PG address"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* ROW 10: EMERGENCY */}
                    <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                      <h5 className="font-extrabold text-slate-900 border-b border-slate-100 pb-1.5 text-xs">
                        10. Urgent Emergency Kin/Contact of Co-worker
                      </h5>
                      <div className="grid sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Emergency Name</label>
                          <input
                            type="text"
                            required
                            value={regEmergencyName}
                            onChange={e => setRegEmergencyName(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Kin Relation</label>
                          <input
                            type="text"
                            required
                            value={regEmergencyRelation}
                            onChange={e => setRegEmergencyRelation(e.target.value)}
                            placeholder="e.g. Spouse / Father"
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Kin Mobile</label>
                          <input
                            type="tel"
                            required
                            value={regEmergencyMobile}
                            onChange={e => setRegEmergencyMobile(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase">Kin Email</label>
                          <input
                            type="email"
                            required
                            value={regEmergencyEmail}
                            onChange={e => setRegEmergencyEmail(e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ROW 11 */}
                    <div>
                      <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">11. Expected Duration of Stay (Months)</label>
                      <input
                        type="number"
                        required
                        value={regExpectedStay}
                        onChange={e => setRegExpectedStay(e.target.value)}
                        placeholder="e.g. 12"
                        className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>

                    {/* DOCUMENT CHECK TABLE */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                      <div className="bg-slate-100 p-3 border-b border-slate-200 flex justify-between items-center">
                        <h5 className="font-extrabold text-slate-800 text-xs">Compliance Documents Checksheet</h5>
                        <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">PDF/Hardcopy Mapping</span>
                      </div>
                      <div className="overflow-x-auto text-[11px]">
                        <table className="w-full text-left divide-y divide-slate-200">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="p-3 font-extrabold text-slate-600 uppercase text-[9px]">Document Name</th>
                              <th className="p-3 font-extrabold text-slate-600 uppercase text-[9px] w-24">Attached?</th>
                              <th className="p-3 font-extrabold text-slate-600 uppercase text-[9px]">Certificate/Reg Number</th>
                              <th className="p-3 font-extrabold text-slate-600 uppercase text-[9px]">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            <tr>
                              <td className="p-3 font-bold">Aadhaar Card (All Co-workers)</td>
                              <td className="p-3">
                                <select value={docAadhaar.yesNo} onChange={e => setDocAadhaar({...docAadhaar, yesNo: e.target.value})} className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-bold">
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </td>
                              <td className="p-3"><input type="text" value={docAadhaar.docNo} onChange={e => setDocAadhaar({...docAadhaar, docNo: e.target.value})} placeholder="12 digit Aadhaar No" className="px-2 py-1 bg-slate-50 border border-slate-200 rounded w-full" /></td>
                              <td className="p-3"><input type="text" value={docAadhaar.remarks} onChange={e => setDocAadhaar({...docAadhaar, remarks: e.target.value})} placeholder="Remarks" className="px-2 py-1 bg-slate-50 border border-slate-200 rounded w-full" /></td>
                            </tr>
                            <tr>
                              <td className="p-3 font-bold">MOA / Partnership Deed / Cert</td>
                              <td className="p-3">
                                <select value={docMoa.yesNo} onChange={e => setDocMoa({...docMoa, yesNo: e.target.value})} className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-bold">
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </td>
                              <td className="p-3"><input type="text" value={docMoa.docNo} onChange={e => setDocMoa({...docMoa, docNo: e.target.value})} placeholder="CIN / LLPIN No" className="px-2 py-1 bg-slate-50 border border-slate-200 rounded w-full" /></td>
                              <td className="p-3"><input type="text" value={docMoa.remarks} onChange={e => setDocMoa({...docMoa, remarks: e.target.value})} placeholder="Remarks" className="px-2 py-1 bg-slate-50 border border-slate-200 rounded w-full" /></td>
                            </tr>
                            <tr>
                              <td className="p-3 font-bold">Declaration of Work Scope Letter</td>
                              <td className="p-3">
                                <select value={docWorkDecl.yesNo} onChange={e => setDocWorkDecl({...docWorkDecl, yesNo: e.target.value})} className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-bold">
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </td>
                              <td className="p-3"><input type="text" value={docWorkDecl.docNo} onChange={e => setDocWorkDecl({...docWorkDecl, docNo: e.target.value})} placeholder="Work Declaration Ref" className="px-2 py-1 bg-slate-50 border border-slate-200 rounded w-full" /></td>
                              <td className="p-3"><input type="text" value={docWorkDecl.remarks} onChange={e => setDocWorkDecl({...docWorkDecl, remarks: e.target.value})} placeholder="Remarks" className="px-2 py-1 bg-slate-50 border border-slate-200 rounded w-full" /></td>
                            </tr>
                            <tr>
                              <td className="p-3 font-bold">Present Address Proof</td>
                              <td className="p-3">
                                <select value={docAddressProof.yesNo} onChange={e => setDocAddressProof({...docAddressProof, yesNo: e.target.value})} className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-bold">
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </td>
                              <td className="p-3"><input type="text" value={docAddressProof.docNo} onChange={e => setDocAddressProof({...docAddressProof, docNo: e.target.value})} placeholder="Electricity/Rent ID" className="px-2 py-1 bg-slate-50 border border-slate-200 rounded w-full" /></td>
                              <td className="p-3"><input type="text" value={docAddressProof.remarks} onChange={e => setDocAddressProof({...docAddressProof, remarks: e.target.value})} placeholder="Remarks" className="px-2 py-1 bg-slate-50 border border-slate-200 rounded w-full" /></td>
                            </tr>
                            <tr>
                              <td className="p-3 font-bold">Letter of Authorized Representative</td>
                              <td className="p-3">
                                <select value={docAuthLetter.yesNo} onChange={e => setDocAuthLetter({...docAuthLetter, yesNo: e.target.value})} className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-bold">
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </td>
                              <td className="p-3"><input type="text" value={docAuthLetter.docNo} onChange={e => setDocAuthLetter({...docAuthLetter, docNo: e.target.value})} placeholder="Authorization Letter Ref" className="px-2 py-1 bg-slate-50 border border-slate-200 rounded w-full" /></td>
                              <td className="p-3"><input type="text" value={docAuthLetter.remarks} onChange={e => setDocAuthLetter({...docAuthLetter, remarks: e.target.value})} placeholder="Remarks" className="px-2 py-1 bg-slate-50 border border-slate-200 rounded w-full" /></td>
                            </tr>
                            <tr>
                              <td className="p-3 font-bold">Permanent Account Number (PAN)</td>
                              <td className="p-3">
                                <select value={docPan.yesNo} onChange={e => setDocPan({...docPan, yesNo: e.target.value})} className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-bold">
                                  <option value="Yes">Yes</option>
                                  <option value="No">No</option>
                                </select>
                              </td>
                              <td className="p-3"><input type="text" value={docPan.docNo} onChange={e => setDocPan({...docPan, docNo: e.target.value})} placeholder="10 Character PAN Code" className="px-2 py-1 bg-slate-50 border border-slate-200 rounded w-full" /></td>
                              <td className="p-3"><input type="text" value={docPan.remarks} onChange={e => setDocPan({...docPan, remarks: e.target.value})} placeholder="Remarks" className="px-2 py-1 bg-slate-50 border border-slate-200 rounded w-full" /></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* DECLARATION TEXT */}
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-inner">
                      <p className="font-extrabold text-slate-900 uppercase tracking-widest text-xxs">Declaration</p>
                      <div className="text-xxs sm:text-xs text-slate-600 space-y-2 leading-relaxed text-justify">
                        <p>
                          I hereby understand that I am taking any one provided seat as service including corresponding use of furniture, electricity, tea/coffee/wi-fi etc as per norms from time to time and I cannot transfer the same to anyone else. I agree to maintain socially acceptable conduct and I am authorised to undertake only lawful activities. I’m fully responsible for all my personal items and any activities (including use of internet) undertaken by me and my employees and I shall indemnify Synergi and its management/ employees for the same. I shall follow all COVID protocols.
                        </p>
                      </div>
                      <label className="flex items-start gap-2 pt-2 border-t border-slate-150">
                        <input
                          type="checkbox"
                          required
                          checked={regDeclarationAccepted}
                          onChange={e => setRegDeclarationAccepted(e.target.checked)}
                          className="mt-1 accent-blue-600 cursor-pointer"
                        />
                        <span className="font-extrabold text-slate-950 text-xs cursor-pointer selection:bg-transparent">
                          I hereby accept the above declaration and understand the co-space service conditions.
                        </span>
                      </label>
                    </div>

                    {/* SIGNATURE BLOCK */}
                    <div className="grid sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                      <div>
                        <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Place / City of Stamp</label>
                        <input
                          type="text"
                          required
                          value={regPlace}
                          onChange={e => setRegPlace(e.target.value)}
                          placeholder="e.g. Noida NCR"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xxs font-bold text-slate-600 uppercase mb-1">Type Legal Full Name (Digital Signature Stamp)</label>
                        <input
                          type="text"
                          required
                          value={regSignature}
                          onChange={e => setRegSignature(e.target.value)}
                          placeholder="Type exact full name as signature"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-serif text-slate-800 tracking-wider italic font-bold border-l-4 border-l-amber-500"
                        />
                      </div>
                    </div>

                    {/* BUTTONS */}
                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setFormView("list")}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"
                      >
                        Cancel & Back
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all hover:shadow-lg"
                      >
                        Submit Registration Form
                      </button>
                    </div>
                  </form>
                )}

                {/* 3. UPLOAD COMPLETED FORM */}
                {formView === "upload" && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs sm:text-sm space-y-6">
                    <div className="max-w-xl">
                      <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">Upload Scanned Hard-Copy Registration</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Prefer signing physical agreements? Print our official template form, write in your company coordinates manually, sign/stamp with company seal, scan, and upload the file below.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const win = window.open("", "_blank");
                          if (win) {
                            win.document.write(`
                              <html>
                              <head>
                                <title>Blank Synergi Registration Form</title>
                                <style>
                                  @media print {
                                    body { margin: 0; padding: 10mm; -webkit-print-color-adjust: exact; }
                                    .no-print { display: none; }
                                  }
                                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 25px; line-height: 1.25; font-size: 10px; color: #000000; background-color: #ffffff; max-width: 800px; margin: 0 auto; }
                                  .logo-container { display: flex; justify-content: flex-start; align-items: center; margin-bottom: 12px; }
                                  .form-header { text-align: left; margin-bottom: 10px; }
                                  .form-title { font-size: 11px; font-weight: 800; text-decoration: underline; text-transform: uppercase; color: #000000; letter-spacing: 0.5px; }
                                  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; table-layout: fixed; }
                                  td, th { border: 1px solid #000000; padding: 5px 8px; text-align: left; font-size: 9.5px; vertical-align: top; }
                                  th { background-color: #f8fafc; font-weight: bold; }
                                  .num-col { width: 5%; text-align: center; font-weight: bold; }
                                  .field-col { width: 40%; font-weight: bold; }
                                  .value-col { width: 55%; }
                                  .declaration-box { border: 1px solid #000000; padding: 8px; font-size: 8.5px; line-height: 1.35; text-align: justify; margin-bottom: 10px; }
                                  .footer-table { width: 100%; margin-top: 5px; }
                                  .footer-table td { border: none; padding: 4px; }
                                </style>
                              </head>
                              <body onload="window.print()">
                                <!-- Logo Header -->
                                <div class="logo-container">
                                  <img src="${synergiLogo}" alt="Synergi Logo" style="height: 55px; max-height: 55px; width: auto; object-fit: contain; display: block;" />
                                </div>

                                <!-- Form Title -->
                                <div class="form-header">
                                  <div class="form-title">REGISTRATION FORM (TO BE FILLED PER SEAT)</div>
                                </div>

                                <!-- Part 1: Registration Details -->
                                <table>
                                  <tr>
                                    <td class="num-col">1.</td>
                                    <td class="field-col">Name of Company/Firm</td>
                                    <td class="value-col"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">2.</td>
                                    <td class="field-col">Registration Type<br/><span style="font-weight: normal; font-size: 8.5px;">(Proprietor/Partnership/Pvt Ltd/Ltd)</span></td>
                                    <td class="value-col"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">3.</td>
                                    <td class="field-col">Registration Status<br/><span style="font-weight: normal; font-size: 8.5px;">(MSME/NSIC/StartupIndia)</span></td>
                                    <td class="value-col"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">4.</td>
                                    <td class="field-col">No of employees</td>
                                    <td class="value-col"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">5.</td>
                                    <td colspan="2" style="padding: 0;">
                                      <table style="width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed;">
                                        <tr>
                                          <td style="border: none; border-bottom: 1px solid #000000; border-right: 1px solid #000000; font-weight: bold; width: 65%; padding: 4px 8px;">Proprietor/Partner/Director <span style="font-weight: normal; font-size: 8px;">(Tick the right one)</span></td>
                                          <td style="border: none; border-bottom: 1px solid #000000; font-weight: bold; width: 35%; padding: 4px 8px;">Whether Co-worker (Yes/No)</td>
                                        </tr>
                                        <tr>
                                          <td colspan="2" style="border: none; padding: 0;">
                                            <table style="width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed;">
                                              <tr>
                                                <td style="border: none; border-right: 1px solid #000000; width: 35%; padding: 4px 8px;">Name:</td>
                                                <td style="border: none; border-right: 1px solid #000000; width: 30%; padding: 4px 8px;">Mobile No:</td>
                                                <td style="border: none; width: 35%; padding: 4px 8px;">Email Id:</td>
                                              </tr>
                                            </table>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">6.</td>
                                    <td colspan="2" style="padding: 0;">
                                      <table style="width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed;">
                                        <tr>
                                          <td style="border: none; border-bottom: 1px solid #000000; border-right: 1px solid #000000; font-weight: bold; width: 65%; font-size: 8px; line-height: 1.1; padding: 3px 8px;">
                                            Fill for: Employee <span style="font-weight: normal; font-size: 7.5px;">(Strike off not relevant)</span><br/>
                                            Or Alternate Contact <span style="font-weight: normal; font-size: 7.5px;">(for owners only)</span><br/>
                                            Or Authorised Person in Co-work <span style="font-weight: normal; font-size: 7px;">(In case owner at Serial 5 above is not part of this co-work then attach authorisation letter from him/her)</span>
                                          </td>
                                          <td style="border: none; border-bottom: 1px solid #000000; font-weight: bold; width: 35%; vertical-align: middle; padding: 3px 8px;">Whether Co-worker (Yes/No)</td>
                                        </tr>
                                        <tr>
                                          <td colspan="2" style="border: none; padding: 0;">
                                            <table style="width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed;">
                                              <tr>
                                                <td style="border: none; border-right: 1px solid #000000; width: 35%; padding: 4px 8px;">Name:</td>
                                                <td style="border: none; border-right: 1px solid #000000; width: 30%; padding: 4px 8px;">Mobile No:</td>
                                                <td style="border: none; width: 35%; padding: 4px 8px;">Email Id:</td>
                                              </tr>
                                            </table>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">7.</td>
                                    <td class="field-col">Registered Office Address of company/firm</td>
                                    <td class="value-col" style="height: 20px;"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">8.</td>
                                    <td class="field-col">Permanent Home Address of Co-worker</td>
                                    <td class="value-col" style="height: 20px;"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">9.</td>
                                    <td class="field-col">Present Home Address of Co-worker</td>
                                    <td class="value-col" style="height: 20px;"></td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">10.</td>
                                    <td colspan="2" style="padding: 0;">
                                      <table style="width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed;">
                                        <tr>
                                          <td style="border: none; border-bottom: 1px solid #000000; border-right: 1px solid #000000; font-weight: bold; width: 65%; padding: 4px 8px;">Emergency Contact of Co-worker</td>
                                          <td style="border: none; border-bottom: 1px solid #000000; font-weight: bold; width: 35%; padding: 4px 8px;">Relation</td>
                                        </tr>
                                        <tr>
                                          <td colspan="2" style="border: none; padding: 0;">
                                            <table style="width: 100%; border-collapse: collapse; margin: 0; table-layout: fixed;">
                                              <tr>
                                                <td style="border: none; border-right: 1px solid #000000; width: 35%; padding: 4px 8px;">Name:</td>
                                                <td style="border: none; border-right: 1px solid #000000; width: 30%; padding: 4px 8px;">Mobile No:</td>
                                                <td style="border: none; width: 35%; padding: 4px 8px;">Email Id:</td>
                                              </tr>
                                            </table>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td class="num-col">11.</td>
                                    <td class="field-col">Expected duration of stay</td>
                                    <td class="value-col"></td>
                                  </tr>
                                </table>

                                <!-- Part 2: List of Documents to be attached -->
                                <table style="margin-top: 4px;">
                                  <thead>
                                    <tr style="background-color: #f1f5f9;">
                                      <th style="width: 6%; text-align: center; padding: 4px;">S.N.</th>
                                      <th style="width: 50%; padding: 4px;">List of Documents to be attached</th>
                                      <th style="width: 12%; text-align: center; padding: 4px;">Yes/No</th>
                                      <th style="width: 16%; text-align: center; padding: 4px;">Document No</th>
                                      <th style="width: 16%; text-align: center; padding: 4px;">Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr>
                                      <td style="text-align: center; font-weight: bold; padding: 4px;">1.</td>
                                      <td style="padding: 4px;">Aadhaar</td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                    </tr>
                                    <tr>
                                      <td style="text-align: center; font-weight: bold; padding: 4px;">2.</td>
                                      <td style="padding: 4px;">MOA/AOA of company/Partnership deed/any other document</td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                    </tr>
                                    <tr>
                                      <td style="text-align: center; font-weight: bold; padding: 4px;">3.</td>
                                      <td style="padding: 4px;">Letter of Declaration of type of work being undertaken</td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                    </tr>
                                    <tr>
                                      <td style="text-align: center; font-weight: bold; padding: 4px;">4.</td>
                                      <td style="padding: 4px;">Present address proof</td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                    </tr>
                                    <tr>
                                      <td style="text-align: center; font-weight: bold; padding: 4px;">5.</td>
                                      <td style="padding: 4px;">Letter of Authorised representative</td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                    </tr>
                                    <tr>
                                      <td style="text-align: center; font-weight: bold; padding: 4px;">6.</td>
                                      <td style="padding: 4px;">PAN(Company/Directors/Employees)</td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                      <td style="padding: 4px;"></td>
                                    </tr>
                                  </tbody>
                                </table>

                                <!-- Part 3: Declaration -->
                                <div class="declaration-box">
                                  <strong>Declaration:</strong> I hereby understand that I am taking any one provided seat as service including corresponding use of furniture, electricity, tea/coffee/wi-fi etc as per norms from time to time and I cannot transfer the same to anyone else. I agree to maintain socially acceptable conduct and I am authorised to undertake only lawful activities. I’m fully responsible for all my personal items and any activities (including use of internet) undertaken by me and my employees and I shall indemnify Synergi and its management/ employees for the same. I shall follow all COVID protocols.
                                </div>

                                <!-- Part 4: Signature / Stamp -->
                                <table class="footer-table">
                                  <tr>
                                    <td colspan="2" style="height: 30px; vertical-align: bottom;">
                                      <strong>Signature with stamp:</strong> ___________________________________________
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="width: 50%; padding-top: 10px;">
                                      <strong>Date:</strong> ___________________________________________
                                    </td>
                                    <td style="width: 50%; padding-top: 10px;">
                                      <strong>Place:</strong> ___________________________________________
                                    </td>
                                  </tr>
                                </table>
                              </body>
                              </html>
                            `);
                            win.document.close();
                          }
                        }}
                        className="flex items-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                      >
                        <Printer className="w-4 h-4 text-slate-500" /> Print Blank Paper Form Template
                      </button>
                    </div>

                    {/* DRAG-SELECT UPLOADER AREA */}
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 bg-white flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-500 transition-colors relative">
                      <UploadCloud className="w-12 h-12 text-slate-300" />
                      <div className="space-y-1">
                        <p className="font-extrabold text-slate-800 text-sm">Drag and drop completed scan here</p>
                        <p className="text-xxs text-slate-400">Supported Formats: PDF, PNG, JPG (Max size 15MB)</p>
                      </div>
                      
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        disabled={uploadingFile}
                        onChange={handleRegFormFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />

                      {uploadingFile && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold text-slate-700">Uploading and synchronizing Google Drive cloud bucket...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {uploadedFileUrl && (
                      <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <p className="text-emerald-800 font-extrabold">✓ Form Mapped & Ready for Database Indexing</p>
                          <p className="text-[10px] text-emerald-600 font-mono">Attachment: {uploadedFileName}</p>
                          <a href={uploadedDriveLink} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline inline-block mt-0.5">
                            Auto-Generated Drive Link: {uploadedDriveLink.substring(0, 50)}...
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={handleRegFormSubmit}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl"
                        >
                          Submit Form
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setFormView("list")}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"
                      >
                        Cancel & Back
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. INSPECT DIGITALLY SUBMITTED DETAILS */}
                {formView === "view" && selectedRegForm && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base">Synergi Registration Form Inspection</h4>
                        <p className="text-xxs text-slate-400 font-mono">Ledger Entry ID: {selectedRegForm.id.toUpperCase()}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormView("list")}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                      >
                        Close Preview
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl">
                        <p className="text-slate-400 font-semibold uppercase text-[10px]">1. Company / Firm Name</p>
                        <p className="font-bold text-slate-800 text-sm">{selectedRegForm.formData?.companyName}</p>
                      </div>
                      <div className="space-y-1 bg-slate-50 p-3 rounded-xl">
                        <p className="text-slate-400 font-semibold uppercase text-[10px]">2 & 3. Registration Parameters</p>
                        <p className="font-bold text-slate-800">{selectedRegForm.formData?.registrationType} ({selectedRegForm.formData?.registrationStatus})</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                        <p className="text-slate-400 font-semibold uppercase text-[10px]">5. Director Credentials</p>
                        <p className="font-bold text-slate-800">{selectedRegForm.formData?.director?.name}</p>
                        <p className="text-xxs text-slate-500">Mobile: {selectedRegForm.formData?.director?.mobile} | Email: {selectedRegForm.formData?.director?.email}</p>
                        <span className="text-[10px] font-bold text-blue-600 font-mono">Coworker? {selectedRegForm.formData?.director?.isCoworker}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                        <p className="text-slate-400 font-semibold uppercase text-[10px]">6. Authorized Person Coordinates</p>
                        <p className="font-bold text-slate-800">{selectedRegForm.formData?.employee?.name}</p>
                        <p className="text-xxs text-slate-500">Mobile: {selectedRegForm.formData?.employee?.mobile} | Email: {selectedRegForm.formData?.employee?.email}</p>
                        <span className="text-[10px] font-bold text-blue-600 font-mono">Coworker? {selectedRegForm.formData?.employee?.isCoworker}</span>
                      </div>
                    </div>

                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl text-xs">
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">Addresses Coordinates</p>
                      <p><strong>Registered Office:</strong> {selectedRegForm.formData?.officeAddress}</p>
                      <p><strong>Permanent Home:</strong> {selectedRegForm.formData?.permanentAddress}</p>
                      <p><strong>Present Local:</strong> {selectedRegForm.formData?.presentAddress}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">10. Emergency kin</p>
                      <p className="font-bold">{selectedRegForm.formData?.emergency?.name} ({selectedRegForm.formData?.emergency?.relation})</p>
                      <p className="text-slate-500 font-medium">Mobile: {selectedRegForm.formData?.emergency?.mobile} | Email: {selectedRegForm.formData?.emergency?.email}</p>
                    </div>

                    {/* ATTACHED CHECKLIST */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                      <div className="bg-slate-100 p-2.5 font-bold">compliance documents sheets check</div>
                      <table className="w-full text-left divide-y divide-slate-100 text-[11px]">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="p-2.5 font-extrabold text-slate-500">Document Name</th>
                            <th className="p-2.5 font-extrabold text-slate-500 w-20">Attached?</th>
                            <th className="p-2.5 font-extrabold text-slate-500">Certificate No</th>
                            <th className="p-2.5 font-extrabold text-slate-500">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedRegForm.formData?.documents && Object.entries(selectedRegForm.formData.documents).map(([key, docVal]: any) => (
                            <tr key={key}>
                              <td className="p-2.5 font-bold uppercase text-[10px] text-slate-700">{key}</td>
                              <td className="p-2.5 font-extrabold text-slate-800">{docVal.yesNo}</td>
                              <td className="p-2.5 font-mono text-slate-600">{docVal.docNo || "N/A"}</td>
                              <td className="p-2.5 text-slate-500">{docVal.remarks || "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* DECLARATION PREVIEW */}
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs space-y-2">
                      <p className="text-xxs font-bold text-slate-400 uppercase font-mono">Accepted Declaration</p>
                      <p className="text-slate-600 italic">"I hereby understand that I am taking any one provided seat as service including corresponding use of furniture, electricity, tea/coffee/wi-fi etc as per norms from time to time and I cannot transfer the same to anyone else. I agree to maintain socially acceptable conduct and I am authorised to undertake only lawful activities. I’m fully responsible for all my personal items and any activities (including use of internet) undertaken by me and my employees and I shall indemnify Synergi and its management/ employees for the same. I shall follow all COVID protocols."</p>
                      <div className="pt-2 border-t border-slate-200 text-xxs text-slate-500 font-mono space-y-1">
                        <p className="text-xxs font-bold text-slate-400 uppercase">DIGITAL SIGNATURE STAMP</p>
                        <p><strong>Signed by:</strong> {selectedRegForm.formData?.signature}</p>
                        <p><strong>Place of registration:</strong> {selectedRegForm.formData?.place}</p>
                        <p><strong>Date & Time Stamp:</strong> {new Date(selectedRegForm.submittedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* ==================== 7. VISITOR TAB (QR ENTRY / CORPORATE PANEL) ==================== */}
        {activeTab === "visitor" && (
          user.role === "customer" ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-600" /> Corporate Visitor Requests
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage entry permissions, verify OTP security codes, and add custom visit remarks for Noida Site turnstile gates.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={() => setShowAddVisitorModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Pre-Register Guest
                  </button>
                  <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-xl font-bold self-start">
                    🏢 {user.companyName || user.displayName} Portal
                  </div>
                </div>
              </div>

              {/* Public Self-Service Visitor QR Code and Sharing Link */}
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200 rounded-3xl p-5 flex flex-col md:flex-row items-center gap-6">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`${window.location.origin}/?visitCompanyId=${user.uid}`)}`}
                    alt="Public Registration QR Code"
                    className="w-28 h-28 mx-auto"
                  />
                </div>
                <div className="space-y-3 text-center md:text-left flex-1">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-950 flex items-center justify-center md:justify-start gap-1.5">
                      <QrCode className="w-4.5 h-4.5 text-indigo-600" /> Public Self-Registration QR Code & Link
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Let your guests fill out their visitor forms on their own devices! Show this QR Code at your desk or copy and share the custom invitation link. When they visit, your company <strong className="text-indigo-700">({user.companyName || `${user.displayName}'s Company`})</strong> will be auto-selected.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-lg w-full">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/?visitCompanyId=${user.uid}`}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 select-all font-mono outline-none flex-1 truncate text-center sm:text-left"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/?visitCompanyId=${user.uid}`);
                        triggerToast("Public registration link copied to clipboard!", "success");
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.01]"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Link
                    </button>
                  </div>
                </div>
              </div>

              {companyVisitors.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                  <QrCode className="w-10 h-10 text-slate-350 mx-auto" />
                  <p className="text-sm font-bold text-slate-600">No visitor requests yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When visitors register using your company name from the front desk QR Code, they will show up here in real-time.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setShowAddVisitorModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 mx-auto"
                    >
                      <Plus className="w-4 h-4" /> Pre-Register First Guest
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Table */}
                  <div className="overflow-x-auto border border-slate-150 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs text-slate-800">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 uppercase tracking-wider text-[10px]">
                          <th className="p-4">Visitor Info</th>
                          <th className="p-4">Pass ID / Date</th>
                          <th className="p-4 text-center">Entry OTP</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Remarks</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {companyVisitors.slice((visitorCurrentPage - 1) * visitorItemsPerPage, visitorCurrentPage * visitorItemsPerPage).map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-slate-900 text-sm">{v.userName}</p>
                              <p className="text-slate-500 font-mono text-[11px] mt-0.5">{v.userPhone} • {v.userEmail}</p>
                            </td>
                            <td className="p-4">
                              <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold text-[11px]">{v.passId || "N/A"}</span>
                              <p className="text-slate-400 font-semibold text-[11px] mt-1">{v.date}</p>
                            </td>
                            <td className="p-4 text-center">
                              <span className="font-mono font-bold tracking-wider text-sm bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-xl">
                                {v.otp || "------"}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                v.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                                v.status === "rejected" ? "bg-rose-100 text-rose-800" :
                                v.status === "checked_in" ? "bg-blue-100 text-blue-800" :
                                v.status === "checked_out" ? "bg-slate-100 text-slate-800" :
                                "bg-amber-100 text-amber-800"
                              }`}>
                                {v.status === "checked_in" ? "Checked In" : v.status === "checked_out" ? "Checked Out" : v.status}
                              </span>
                              {v.checkInTime && (
                                <p className="text-[10px] text-slate-400 font-mono mt-1">In: {new Date(v.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              )}
                            </td>
                            <td className="p-4 max-w-xs truncate">
                              <p className="text-slate-600 italic text-[11px] font-normal">{v.remarks || "No comments added"}</p>
                            </td>
                            <td className="p-4 text-right space-y-1.5">
                              {v.status === "pending" && (
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleUpdateVisitorStatus(v.id, "approved")}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateVisitorStatus(v.id, "rejected")}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                              <div className="flex flex-col gap-1.5 items-end mt-1.5">
                                <button
                                  onClick={() => setPrintingPass(v)}
                                  className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex items-center gap-1 hover:underline ml-auto"
                                >
                                  <QrCode className="w-3.5 h-3.5 text-indigo-500" /> Print Pass Card
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedVisitorForRemarks(v);
                                    setVisitorRemarksInput(v.remarks || "");
                                  }}
                                  className="text-blue-600 hover:text-blue-800 font-bold text-[11px] hover:underline block ml-auto"
                                >
                                  {v.remarks ? "Edit Remarks" : "Add Remarks"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {renderPagination(visitorCurrentPage, companyVisitors.length, setVisitorCurrentPage, visitorItemsPerPage, setVisitorItemsPerPage)}
                </div>
              )}

              {/* REMARKS MODAL */}
              {selectedVisitorForRemarks && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-left space-y-4 animate-in fade-in zoom-in duration-200">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">Add Corporate Remarks</h4>
                      <p className="text-xs text-slate-500">Add feedback or directions for visitor <strong>{selectedVisitorForRemarks.userName}</strong>.</p>
                    </div>

                    <textarea
                      rows={4}
                      value={visitorRemarksInput}
                      onChange={e => setVisitorRemarksInput(e.target.value)}
                      placeholder="e.g. VIP client, visiting for Noida launch, escorts required at turnstile gateway, etc."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 focus:outline-none"
                    />

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setSelectedVisitorForRemarks(null);
                          setVisitorRemarksInput("");
                        }}
                        className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveVisitorRemarks}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-blue-100"
                      >
                        Save Remarks
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-8 text-center max-w-xl mx-auto">
              <div className="space-y-4">
                <QrCode className="w-12 h-12 text-blue-600 mx-auto" />
                <h3 className="text-lg font-extrabold text-slate-900">QR Code Entry Verification</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Scan this dynamic QR Code at the entry turnstile biometric gateway or show it to our venue seat coordinators to log attendance and approve entry.
                </p>
                <div className="pt-2 flex justify-center">
                  <button
                    onClick={() => setShowAddVisitorModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Pre-Register / Invite Guest
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4 inline-block w-full">
                <p className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Active QR Security Key</p>
                
                {/* Dynamic QR server generation based on user email */}
                <div className="bg-white p-4 rounded-2xl inline-block border border-slate-200">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=synergi://visitor-auth?email=${encodeURIComponent(user.email)}%26name=${encodeURIComponent(user.displayName)}`} 
                    alt="Visitor QR Entry" 
                    className="w-48 h-48 mx-auto object-contain"
                  />
                </div>

                <div className="space-y-1">
                  <p className="font-extrabold text-sm text-slate-900">{user.displayName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">ID: SYN-{user.uid.slice(0, 10).toUpperCase()}</p>
                </div>

                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Biometric Token Synchronized & Active
                </div>
              </div>
            </div>
          )
        )}

        {/* ==================== SEAT BOOKING MODULE ==================== */}
        {activeTab === "seats" && (
          <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
            {/* PRICING & PROMOTION BANNER */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-2 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
                <CheckSquare className="w-64 h-64" />
              </div>
              <span className="bg-blue-500 text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider">Workspace Seat Leasing</span>
              <h3 className="text-xl sm:text-2xl font-black">Allot Custom Seats to Your Team</h3>
              <p className="text-xs text-blue-100 max-w-xl">
                Secure premium dedicated workstation pods at our venue. Allocate specific seats to your employees and auto-generate legal leave and license contracts.
              </p>
              <div className="pt-4 flex items-center gap-3">
                <p className="text-xs text-blue-200">Booking Price Rate:</p>
                <span className="bg-white/10 text-white font-extrabold text-sm px-3 py-1 rounded-xl">
                  INR {userSeatRate} / seat monthly
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-12 gap-6">
              {/* BOOKING FORM (Left side) */}
              <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Request Seat Allotments</h4>
                  <p className="text-xs text-slate-500">Specify how many workstation seats you wish to book and assign your team names.</p>
                </div>

                <form onSubmit={handleSeatBookingSubmitMulti} className="space-y-6">
                  {/* DATE SELECTOR */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Booking Start Date *</label>
                    <input
                      type="date"
                      required
                      value={seatRequestStartDate}
                      onChange={e => setSeatRequestStartDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* NUMBER OF SEATS TO BOOK */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Number of Seats to Book *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={seats.filter(s => s.status === "available").length || 1}
                      value={requestedSeatsCount}
                      onChange={e => handleSeatsCountChange(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                      Available vacant physical seats remaining: <span className="font-bold text-blue-600 font-mono">{seats.filter(s => s.status === "available").length}</span>
                    </p>
                  </div>

                  {/* EMPLOYEE ASSIGNMENTS */}
                  {requestedSeatsCount > 0 && (
                    <div className="space-y-4 p-5 bg-blue-50/40 border border-blue-100 rounded-2xl">
                      <h5 className="font-bold text-xs text-blue-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" /> Employee Assignment Meta
                      </h5>
                      <p className="text-[10px] text-blue-700 leading-none">Kindly specify the full name of the employee who will occupy each requested seat.</p>
                      
                      <div className="space-y-3">
                        {Array.from({ length: requestedSeatsCount }).map((_, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                            <span className="col-span-3 text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-center">Seat #{idx + 1}</span>
                            <div className="col-span-9">
                              <input
                                type="text"
                                required
                                value={employeeNames[idx] || ""}
                                onChange={e => {
                                  const val = e.target.value;
                                  setEmployeeNames(prev => {
                                    const next = [...prev];
                                    next[idx] = val;
                                    return next;
                                  });
                                }}
                                placeholder={`Employee ${idx + 1} Full Name *`}
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* SUMMARY */}
                      <div className="pt-3 border-t border-blue-100 flex justify-between items-center text-xs font-bold text-blue-900 font-mono">
                        <span>ESTIMATED RENT:</span>
                        <span>INR {requestedSeatsCount * userSeatRate} / mo</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={seatRequestLoading || requestedSeatsCount <= 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-blue-600/10 flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {seatRequestLoading ? "Submitting Request..." : `Request Allotment for ${requestedSeatsCount} Seats`}
                  </button>
                </form>
              </div>

              {/* CURRENT BOOKINGS & LOGS (Right side) */}
              <div className="md:col-span-5 space-y-6">
                {/* ACTIVE ALLOCATIONS LIST */}
                <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-slate-900 text-sm">Active Seats Booked</h4>
                  <p className="text-xxs text-slate-500 leading-normal">The following is the directory of your physically active workstations and assigned crew members.</p>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {seats.filter(s => s.status === "occupied" && s.occupiedByEmail === user.email.toLowerCase()).length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-6 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">No active booked workstations currently allocated.</p>
                    ) : (
                      seats.filter(s => s.status === "occupied" && s.occupiedByEmail === user.email.toLowerCase()).map(s => (
                        <div key={s.id} className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{s.assignedToName || "Assigned Crew"}</p>
                            <p className="text-xxs text-emerald-700 font-semibold font-mono uppercase">Occupying Seat {s.number}</p>
                          </div>
                          <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">Active</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* REQUST HISTORY LOGS */}
                <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
                  <h4 className="font-extrabold text-slate-900 text-sm">Request Seat History</h4>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {bookings.filter(b => b.type === "seat").length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-6 italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">No workstation booking requests placed.</p>
                    ) : (
                      bookings.filter(b => b.type === "seat").map(b => (
                        <div key={b.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-extrabold text-slate-900">{b.numSeats} Workstation {b.numSeats > 1 ? "Seats" : "Seat"}</p>
                              <p className="text-[10px] text-slate-400 font-mono">Start: {b.date}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              b.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                              b.status === "rejected" ? "bg-rose-50 text-rose-700" :
                              "bg-amber-50 text-amber-700"
                            }`}>
                              {b.status}
                            </span>
                          </div>

                          {b.seatAssignments && b.seatAssignments.length > 0 && (
                            <div className="pt-2 border-t border-slate-200 space-y-1">
                              <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Allocated Crew:</p>
                              {b.seatAssignments.map((sa, i) => (
                                <p key={i} className="text-xxs text-slate-600 font-mono">
                                  <strong>{sa.seatNumber}:</strong> {sa.employeeName}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 10-DAY PRIOR SIMULATED EMAIL MODAL */}
      {showSimulatedEmailModal && emailSimulationData && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div className="flex items-center gap-2">
                <div className="bg-blue-900/40 text-blue-400 p-2 rounded-xl border border-blue-800/30">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Dynamic Pre-Billing Invoice Email</h3>
                  <p className="text-[10px] text-slate-400">Simulating automated 10-day prior mail dispatch to customer coordinates</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSimulatedEmailModal(false)}
                className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg border border-slate-700/30 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Meta Info */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 text-[11px] space-y-1.5 font-mono text-slate-300">
              <div className="flex">
                <span className="w-20 text-slate-500 font-bold">FROM:</span>
                <span className="text-blue-400">billing-system@synergispaces.com</span>
              </div>
              <div className="flex">
                <span className="w-20 text-slate-500 font-bold">TO:</span>
                <span>{emailSimulationData.recipient}</span>
              </div>
              <div className="flex">
                <span className="w-20 text-slate-500 font-bold">SUBJECT:</span>
                <span className="text-white font-bold">{emailSimulationData.subject}</span>
              </div>
              <div className="flex">
                <span className="w-20 text-slate-500 font-bold">DISPATCH:</span>
                <span className="text-indigo-400 font-bold">{emailSimulationData.warningDateStr} (Exactly 10 days before due)</span>
              </div>
            </div>

            {/* Email Body Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto bg-slate-950 text-slate-300 space-y-6">
              <div className="border-b border-slate-800 pb-4 text-center">
                <h2 className="text-lg font-black text-white tracking-tight">SYNERGI COWORKING SPACES</h2>
                <p className="text-[10px] text-slate-400 font-mono">Premium Collaborative Venues & Workstation Hubs</p>
              </div>

              <div className="space-y-2 text-xs">
                <p>Dear <strong>{user.displayName || "Synergi Member"}</strong>,</p>
                <p>
                  This is an automated pre-billing notification regarding your upcoming workplace membership dues for the cycle ending <strong>{emailSimulationData.dueDateStr}</strong>.
                </p>
                <p>
                  Pursuant to your signed Leave & License Agreement, your unified invoices are generated and consolidated automatically. Please review the detailed billing particulars below:
                </p>
              </div>

              {/* Invoice Table */}
              <div className="border border-slate-800 rounded-2xl bg-slate-900/30 overflow-hidden text-xs">
                <div className="bg-slate-900/80 px-4 py-2 font-black text-white border-b border-slate-800 flex justify-between uppercase tracking-wider text-[10px]">
                  <span>Item Description</span>
                  <span>Amount (INR)</span>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">Workstation Pod Bookings</p>
                      <p className="text-[10px] text-slate-400 font-mono">{emailSimulationData.allocatedSeatsCount} seat(s) allocated @ INR {emailSimulationData.userSeatRate}/mo</p>
                    </div>
                    <span className="font-mono text-white">INR {emailSimulationData.totalSeatRental}</span>
                  </div>

                  {emailSimulationData.totalConferenceBilling > 0 && (
                    <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
                      <div>
                        <p className="font-bold text-white">Conference Room Bookings</p>
                        <p className="text-[10px] text-slate-400 font-mono">Consolidated schedule hourly charges</p>
                      </div>
                      <span className="font-mono text-white">INR {emailSimulationData.totalConferenceBilling}</span>
                    </div>
                  )}

                  {emailSimulationData.maintenance > 0 && (
                    <div className="flex justify-between items-center border-t border-slate-800/40 pt-3">
                      <div>
                        <p className="font-bold text-white">Maintenance & Utility Fee</p>
                        <p className="text-[10px] text-slate-400 font-mono">Consolidated space maintenance</p>
                      </div>
                      <span className="font-mono text-white">INR {emailSimulationData.maintenance}</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900/60 px-4 py-3 border-t border-slate-800 flex justify-between items-center font-bold text-emerald-400">
                  <span>GRAND TOTAL NET PAYABLE</span>
                  <span className="font-mono text-sm">INR {emailSimulationData.netAmountDue}</span>
                </div>
              </div>

              {/* Payment Steps */}
              <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl space-y-3 text-xs text-indigo-200">
                <p className="font-bold text-indigo-300 uppercase tracking-wide text-[10px]">How to Complete Your Payment:</p>
                <ol className="list-decimal pl-4 space-y-1.5 leading-relaxed">
                  <li>Transfer the net payable amount via Bank IMPS to:
                    <div className="mt-1 pl-2 font-mono text-[10px] text-white">
                      Bank Name: {emailSimulationData.bankName}<br />
                      A/C No: {emailSimulationData.accountNo}<br />
                      IFSC: {emailSimulationData.ifscCode}
                    </div>
                  </li>
                  <li>Or scan the official corporate UPI QR using your phone and pay to <span className="font-mono text-white font-bold">{emailSimulationData.upiId}</span>.</li>
                  <li>Upload your payment screenshot receipt inside your <strong>Payment Receipt</strong> portal to trigger instant automated verification & agreement updates.</li>
                </ol>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-500 leading-relaxed">
                This is an automated corporate notification generated on secure cloud systems.<br />
                For any billing disputes or changes, reach out to <span className="text-slate-400 underline">support@synergispaces.com</span>.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSimulatedEmailModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all shadow-md shadow-blue-600/15"
              >
                Acknowledge Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERSONAL PROFILE DETAILS MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-950/60 text-blue-400 p-2 rounded-xl border border-blue-800/40">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">My Workspace Coworker Profile</h3>
                  <p className="text-[10px] text-slate-400">Complete verification details & platform credentials</p>
                </div>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg border border-slate-700/30 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 bg-slate-950 text-slate-300 space-y-5">
              {/* Profile Avatar / Quick badge */}
              <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{user.displayName}</h4>
                  <p className="text-xxs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <span>Member ID:</span>
                    <strong className="text-blue-400">{computedAccessId}</strong>
                  </p>
                </div>
                <div className="ml-auto bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono">
                  {user.status || "Active"}
                </div>
              </div>

              {/* Detail fields */}
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Email Address</span>
                    <span className="text-xs text-slate-200 block font-medium mt-1 truncate">{user.email}</span>
                  </div>
                  <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Phone Coordinates</span>
                    <span className="text-xs text-slate-200 block font-medium mt-1 font-mono">{user.phone || "Not Set"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Access Role</span>
                    <span className="text-xs text-slate-200 block font-medium mt-1 capitalize">{user.role || "Member"}</span>
                  </div>
                  <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Account Creation Date</span>
                    <span className="text-xs text-slate-200 block font-medium mt-1 font-mono">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                </div>

                {user.role === "customer" && (
                  <>
                    {/* Company Information Card */}
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                        <span className="text-xs font-black text-blue-400 uppercase tracking-wider">🏢 Corporate Registration</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="block text-[9px] text-slate-500 uppercase font-bold">Company Name</span>
                          <span className="font-medium text-slate-200 mt-0.5 block">{user.companyName || "N/A"}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-500 uppercase font-bold">GST Number</span>
                          <span className="font-medium text-slate-200 font-mono mt-0.5 block">{user.gstNo || "N/A"}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-500 uppercase font-bold">PAN Number</span>
                          <span className="font-medium text-slate-200 font-mono mt-0.5 block">{user.panNo || "N/A"}</span>
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800/50 text-xs">
                        <span className="block text-[9px] text-slate-500 uppercase font-bold">Registered Office Address</span>
                        <span className="font-medium text-slate-300 mt-0.5 block leading-normal">{user.address || "N/A"}</span>
                      </div>
                    </div>

                    {/* Workspace License Agreements Card */}
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-black text-amber-400 uppercase tracking-wider">📄 Workspace License Agreements</span>
                        <span className="bg-slate-800 text-slate-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                          {agreements.length} Active
                        </span>
                      </div>
                      {agreements.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2 text-center">No active seat agreements associated with this member account.</p>
                      ) : (
                        <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                          {agreements.map((agr, idx) => (
                            <div key={agr.id || idx} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex justify-between items-center text-xs">
                              <div className="space-y-0.5">
                                <p className="font-bold text-slate-200">Seat Assignment: <span className="font-mono text-amber-300">Seat {agr.seatNumber}</span></p>
                                <p className="text-[10px] text-slate-400">Validity: {agr.startDate} to {agr.endDate}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-slate-100">₹{agr.rentAmount}</p>
                                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">{agr.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Consolidated Billing Statement */}
                    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">💰 Consolidated Billing Statement</span>
                        <span className="bg-emerald-950/50 text-emerald-300 font-bold text-[9px] px-2 py-0.5 rounded border border-emerald-900/40 uppercase tracking-wider font-mono">
                          Cycle: {user.billingCycle || "Monthly"}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Allotted Workspace Seats Rental:</span>
                          <span className="text-slate-200 font-mono">{allocatedSeatsCount} seat(s) x ₹{userSeatRate} = <strong className="text-slate-100">₹{totalSeatRental}</strong></span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Conference Room Bookings (Approved):</span>
                          <span className="text-slate-200 font-mono">₹{totalConferenceBilling}</span>
                        </div>
                        {settings?.maintenanceCharges !== undefined && settings.maintenanceCharges > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Workspace Maintenance Charges:</span>
                            <span className="text-slate-200 font-mono">₹{settings.maintenanceCharges}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center border-t border-slate-800/80 pt-2.5 mt-1">
                          <span className="text-slate-300 font-bold">Combined Billing Total Due:</span>
                          <span className="text-emerald-400 font-black text-sm font-mono">₹{netAmountDue}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800/50">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Authorized Workspace Modules</span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.allowedModules && user.allowedModules.length > 0 ? (
                      user.allowedModules.map((mod: string) => (
                        <span key={mod} className="bg-slate-800 text-slate-300 text-[10px] px-2.5 py-1 rounded-md border border-slate-700/50 capitalize font-medium">
                          {mod}
                        </span>
                      ))
                    ) : (
                      <span className="bg-blue-500/10 text-blue-400 text-[10px] px-2.5 py-1 rounded-md border border-blue-500/20 font-medium">
                        All Spaces & Core Panels Authorized
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-center pt-2 text-[9px] text-slate-500 leading-normal font-mono">
                Member ID Registered: {computedAccessId}<br />
                Security Rules & Leave-License Compliant
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  setIsEditingProfile(true);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all border border-slate-700/40 flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Phone / Name
              </button>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all shadow-md shadow-blue-600/15"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Pre-Register Visitor Modal */}
      {showAddVisitorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-205 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-205 text-left relative my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowAddVisitorModal(false);
                setNewVisitorName("");
                setNewVisitorEmail("");
                setNewVisitorPhone("");
                setNewVisitorDate("");
                setNewVisitorRemarks("");
              }}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                🏢 Pre-Register Guest / Visitor
              </h3>
              <p className="text-xs text-slate-500">
                Pre-authorize a guest or business visitor. An approved entry pass and 6-digit security OTP will be generated instantly.
              </p>
            </div>

            <form onSubmit={handleAddVisitorSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Visitor Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newVisitorName}
                  onChange={(e) => setNewVisitorName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-850 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={newVisitorPhone}
                    onChange={(e) => setNewVisitorPhone(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-850 placeholder:text-slate-400 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@example.com"
                    value={newVisitorEmail}
                    onChange={(e) => setNewVisitorEmail(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-850 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Schedule Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={newVisitorDate}
                  onChange={(e) => setNewVisitorDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-850 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Purpose / Visit Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Business discussion, client meeting, VIP interview"
                  value={newVisitorRemarks}
                  onChange={(e) => setNewVisitorRemarks(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-850 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddVisitorModal(false);
                    setNewVisitorName("");
                    setNewVisitorEmail("");
                    setNewVisitorPhone("");
                    setNewVisitorDate("");
                    setNewVisitorRemarks("");
                  }}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5"
                >
                  Create Approved Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
