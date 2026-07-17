export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "staff" | "customer" | "staff_member";
  status: "active" | "inactive" | "suspended";
  phone?: string;
  createdAt: string;
  password?: string;
  companyName?: string;
  gstNo?: string;
  panNo?: string;
  address?: string;
  allowedModules?: string[];
  memberId?: string;
  seatRate?: number;
  billingCycle?: string;
  seatValidity?: string;
}

export interface Booking {
  id: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  numSeats: number;
  status: "pending" | "approved" | "rejected" | "active" | "inactive" | "checked_in" | "checked_out";
  seatNumber?: string;
  seatAssignments?: { seatNumber: string; employeeName: string }[]; // Specific unique seats allocated with employee names
  type: "seat" | "visit";
  date: string;
  source?: "public" | "registered";
  createdAt: string;
  companyId?: string;
  companyName?: string;
  passId?: string;
  otp?: string;
  remarks?: string;
  checkInTime?: string;
  checkOutTime?: string;
  logs?: { action: string; timestamp: string; user: string }[];
}

export interface Seat {
  id: string;
  number: string;
  occupied: boolean;
  occupiedByEmail?: string;
  assignedToName?: string;
  bookedByName?: string;
  status: "available" | "occupied" | "maintenance";
}

export interface ConferenceRoom {
  id: string;
  name: string;
  capacity: number;
  pricePerHour: number;
  status: "available" | "maintenance";
  type?: "Conference Room" | "Meeting Room";
}

export interface ConferenceBooking {
  id: string;
  userEmail: string;
  roomId: string;
  roomName: string;
  date: string;
  slot: string;
  durationType: "hour" | "half_day" | "full_day" | "1_hr" | "2_hrs" | "3_hrs" | "4_hrs";
  totalPrice: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  companyName?: string;
  userName?: string;
  userPhone?: string;
  startTime?: string;
  endTime?: string;
  purpose?: string;
  attendees?: number;
  meetingType?: string;
  remarks?: string;
}

export interface Agreement {
  id: string;
  userEmail: string;
  userName: string;
  seatNumber: string;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "pending_signature";
  rentAmount: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  userEmail: string;
  month: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "verified" | "rejected";
  bankName?: string;
  paymentDate?: string;
  utr?: string;
  screenshotUrl?: string;
  createdAt: string;
  paymentMethod?: "UPI" | "Bank Transfer";
  billingCycle?: "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly";
  billingPeriodFrom?: string;
  billingPeriodTo?: string;
  remarks?: string;
  adminRemarks?: string;
}

export interface Complaint {
  id: string;
  userEmail: string;
  userName: string;
  category: "Internet" | "Cleaning" | "Electricity" | "Furniture" | "AC" | "Tea/Coffee" | "Plumbing" | "Water" | "Access control";
  description: string;
  status: "open" | "in_progress" | "resolved";
  assignedStaff?: string;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  userEmail: string;
  title: string;
  body: string;
  read: boolean;
  type: string;
  createdAt: string;
}

export interface AppSettings {
  id: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  qrCodeUrl: string; // payment QR
  bankName: string;
  bankAddress: string;
  accountNo: string;
  ifscCode: string;
  seatPrice?: number; // Dynamic monthly seat rental rate configured by admin
  companyLogo?: string;
  gstNumber?: string;
  supportEmail?: string;
  supportMobile?: string;
  accountHolderName?: string;
  branchName?: string;
  upiId?: string;
  merchantName?: string;
  billingCycle?: "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly";
  defaultRentAmount?: number;
  securityDeposit?: number;
  maintenanceCharges?: number;
}

export interface Review {
  id: string;
  author: string;
  avatarLetter: string;
  avatarBg: string;
  isLocalGuide: boolean;
  reviewsCount?: number;
  photosCount?: number;
  timeAgo: string;
  rating: number;
  text: string;
  categories: string[];
  timestamp: number;
  published: boolean;
  ownerResponse?: {
    timeAgo: string;
    text: string;
  };
}

