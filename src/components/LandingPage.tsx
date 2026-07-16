import React, { useState, useEffect, useMemo } from "react";
import { 
  Wifi, 
  Battery, 
  Shield, 
  Sparkles, 
  Coffee, 
  Wind, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare, 
  MessageCircle,
  Facebook,
  Check, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Award, 
  Search, 
  CheckCircle,
  HelpCircle,
  Star,
  Heart,
  Plus,
  CornerDownRight,
  SlidersHorizontal,
  ArrowRight,
  Menu,
  X,
  QrCode,
  Building,
  Ticket,
  Printer,
  Copy,
  CheckSquare
} from "lucide-react";
import { db, collection, addDoc, getDocs, query, where, orderBy, onSnapshot } from "../firebase";
import synergiLogo from "../assets/images/synergi_logo_1783312477576.jpg";

const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    viewBox="0 0 448 512" 
    fill="currentColor" 
    className={className}
  >
    <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
  </svg>
);

interface LandingPageProps {
  onNavigateToAuth: () => void;
  onNavigateToDashboard: () => void;
  userEmail: string | null;
}

export default function LandingPage({ onNavigateToAuth, onNavigateToDashboard, userEmail }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Booking / Visit Form states
  const [numSeats, setNumSeats] = useState<number>(1);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [bookingType, setBookingType] = useState<"seat" | "visit">("seat");
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // New Visitor Pass and Company States
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("synergi_default");
  const [generatedPass, setGeneratedPass] = useState<{
    id: string;
    passId: string;
    otp: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    companyName: string;
    date: string;
    status: string;
  } | null>(null);

  // Status Check states
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // FAQ Accordion index
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({
    0: true,
  });

  // Gallery active filter
  const [galleryFilter, setGalleryFilter] = useState<"all" | "seat_booking" | "conference_booking" | "meeting_rooms" | "corporate_office">("all");

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);

  // Google Map Reviews and Testimonials State
  const [initialReviews] = useState([
    {
      id: "1",
      author: "Pranav Jain",
      avatarLetter: "P",
      avatarBg: "bg-amber-600",
      isLocalGuide: true,
      reviewsCount: 21,
      photosCount: 5,
      timeAgo: "6 years ago",
      rating: 5,
      text: "Synergi has been my office since over 2 months now ( joined in December 2019). The place was referred to me by a friend of mine. Being a freelancer I was looking for a sanitized space with decent modern amenities and high speed internet, and Synergi exceeded all expectations.",
      categories: ["peaceful workspace", "amenities"],
      ownerResponse: {
        timeAgo: "5 years ago",
        text: "Many thanks Pranav. We really liked your presence in our coworking space. It helped us build Synergy."
      },
      timestamp: new Date("2020-01-15").getTime()
    },
    {
      id: "2",
      author: "Anand Bansal",
      avatarLetter: "A",
      avatarBg: "bg-blue-600",
      isLocalGuide: false,
      reviewsCount: 6,
      photosCount: 0,
      timeAgo: "2 years ago",
      rating: 5,
      text: "We are operational here and benefiting from the routine needs to run our activities. Thank you to the Synergi team for providing all amenities.",
      categories: ["amenities"],
      timestamp: new Date("2024-03-10").getTime()
    },
    {
      id: "3",
      author: "Neeraj Tuli",
      avatarLetter: "N",
      avatarBg: "bg-emerald-600",
      isLocalGuide: true,
      reviewsCount: 729,
      photosCount: 912,
      timeAgo: "2 years ago",
      rating: 5,
      text: "With a capacity of around 150 plus seating... and amenities required for co working... ideal for individuals and corporates...",
      categories: ["seating", "amenities"],
      timestamp: new Date("2024-05-18").getTime()
    },
    {
      id: "4",
      author: "Ritu singh",
      avatarLetter: "R",
      avatarBg: "bg-rose-600",
      isLocalGuide: true,
      reviewsCount: 16,
      photosCount: 1,
      timeAgo: "6 years ago",
      rating: 5,
      text: "This coworking space is an ideal co-working space for startups as it is very affordable and has a very functional working space.",
      categories: ["startups", "peaceful workspace"],
      ownerResponse: {
        timeAgo: "5 years ago",
        text: "Thanks Ritu ji. Your presence brought a lot of value to our community with your expertise in gaming, law and funding."
      },
      timestamp: new Date("2020-02-20").getTime()
    },
    {
      id: "5",
      author: "Kamal Sharma",
      avatarLetter: "K",
      avatarBg: "bg-indigo-600",
      isLocalGuide: false,
      reviewsCount: 3,
      photosCount: 0,
      timeAgo: "2 years ago",
      rating: 5,
      text: "Awesome Co-working office place. Nice facilities.",
      categories: ["amenities"],
      timestamp: new Date("2024-06-01").getTime()
    },
    {
      id: "6",
      author: "PANKAJ JAIN",
      avatarLetter: "P",
      avatarBg: "bg-orange-600",
      isLocalGuide: false,
      reviewsCount: 3,
      photosCount: 4,
      timeAgo: "a year ago",
      rating: 5,
      text: "Fantastic experience to meet with senior management. The environment is extremely positive and built for growth.",
      categories: ["startups"],
      ownerResponse: {
        timeAgo: "a year ago",
        text: "Many thanks Pankaj ji for sharing your positive experience. We look forward to associating with you."
      },
      timestamp: new Date("2025-01-10").getTime()
    },
    {
      id: "7",
      author: "Sudheer Pal",
      avatarLetter: "S",
      avatarBg: "bg-purple-600",
      isLocalGuide: false,
      reviewsCount: 5,
      photosCount: 0,
      timeAgo: "6 years ago",
      rating: 5,
      text: "Awsome place for working management is very helpful... positive space for work",
      categories: ["peaceful workspace"],
      ownerResponse: {
        timeAgo: "6 years ago",
        text: "Thankx sudheer"
      },
      timestamp: new Date("2020-04-05").getTime()
    },
    {
      id: "8",
      author: "pankaj kumar",
      avatarLetter: "P",
      avatarBg: "bg-teal-600",
      isLocalGuide: true,
      reviewsCount: 37,
      photosCount: 63,
      timeAgo: "5 years ago",
      rating: 4,
      text: "Good space newly designed but little costly",
      categories: ["seating"],
      ownerResponse: {
        timeAgo: "5 years ago",
        text: "Thanks for your review. Pl discuss your requirement of no of seats, we will certainly give you a good deal."
      },
      timestamp: new Date("2021-06-25").getTime()
    },
    {
      id: "9",
      author: "Ambrish Bajaj",
      avatarLetter: "A",
      avatarBg: "bg-violet-600",
      isLocalGuide: true,
      reviewsCount: 23,
      photosCount: 38,
      timeAgo: "6 years ago",
      rating: 5,
      text: "Great place to work for startups",
      categories: ["startups"],
      ownerResponse: {
        timeAgo: "5 years ago",
        text: "Thanks Ambrish. We look forward to having you again to guide our community in Digital Marketing."
      },
      timestamp: new Date("2020-05-12").getTime()
    },
    {
      id: "10",
      author: "Azam Jafri",
      avatarLetter: "A",
      avatarBg: "bg-sky-600",
      isLocalGuide: true,
      reviewsCount: 58,
      photosCount: 67,
      timeAgo: "11 months ago",
      rating: 5,
      text: "Absolutely phenomenal coworking space in Sector 7, Noida. The environment is exceptionally peaceful, allowing you to focus on your deep work. From the high-speed gigabit internet to comfortable ergonomic seating and prompt hospitality, everything is perfectly set up. A top-tier hub for growing startups!",
      categories: ["peaceful workspace", "startups", "seating", "amenities"],
      timestamp: new Date("2025-08-15").getTime()
    }
  ]);

  const [firestoreReviews, setFirestoreReviews] = useState<any[]>([]);

  useEffect(() => {
    // Read only published reviews from firestore to display on landing page
    const q = query(collection(db, "reviews"), where("published", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort newest first
      list.sort((a, b) => b.timestamp - a.timestamp);
      setFirestoreReviews(list);
    }, (error) => {
      console.error("Error loading reviews from Firestore:", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "customer"));
        const snapshot = await getDocs(q);
        const list: any[] = [
          {
            id: "synergi_default",
            companyName: "Synergi coworking space pvt ltd",
            displayName: "Synergi coworking space pvt ltd"
          }
        ];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.displayName || data.companyName) {
            if (doc.id !== "synergi_default") {
              list.push({ id: doc.id, ...data });
            }
          }
        });
        setCompaniesList(list);

        // Auto-select company from link query parameter (for self-registration desk QR Code)
        const params = new URLSearchParams(window.location.search);
        const urlCompanyId = params.get("visitCompanyId") || params.get("companyId");
        if (urlCompanyId) {
          setSelectedCompanyId(urlCompanyId);
          setBookingType("visit");
          
          // Smooth scroll to the registration widget
          setTimeout(() => {
            const el = document.getElementById("booking-widget");
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 400);
        }
      } catch (err) {
        console.error("Error loading companies list:", err);
      }
    };
    fetchCompanies();
  }, []);

  const reviews = useMemo(() => {
    return [...firestoreReviews, ...initialReviews];
  }, [firestoreReviews, initialReviews]);

  const [reviewFilter, setReviewFilter] = useState<string>("all");
  const [reviewSort, setReviewSort] = useState<string>("relevant");
  
  // New review form state
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newAuthor, setNewAuthor] = useState("");
  const [newRating, setNewRating] = useState<number>(5);
  const [newReviewText, setNewReviewText] = useState("");
  const [newSelectedTags, setNewSelectedTags] = useState<string[]>([]);
  const [newIsLocalGuide, setNewIsLocalGuide] = useState(false);

  const handleAddReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newReviewText.trim()) {
      alert("Please enter your name and review message!");
      return;
    }
    try {
      const newRevObj = {
        author: newAuthor.trim(),
        avatarLetter: newAuthor.trim().charAt(0).toUpperCase() || "S",
        avatarBg: "bg-slate-700",
        isLocalGuide: newIsLocalGuide,
        reviewsCount: newIsLocalGuide ? 12 : 1,
        photosCount: newIsLocalGuide ? 3 : 0,
        timeAgo: "Just now",
        rating: newRating,
        text: newReviewText.trim(),
        categories: newSelectedTags,
        timestamp: Date.now(),
        published: false // Require Admin verification
      };

      await addDoc(collection(db, "reviews"), newRevObj);

      alert("Thank you! Your review has been submitted for verification by the Admin and will be published once approved.");

      // reset form
      setNewAuthor("");
      setNewRating(5);
      setNewReviewText("");
      setNewSelectedTags([]);
      setNewIsLocalGuide(false);
      setIsWritingReview(false);
    } catch (err) {
      console.error("Error adding review: ", err);
      alert("Failed to submit review. Please try again.");
    }
  };

  const sortedAndFilteredReviews = useMemo(() => {
    let list = [...reviews];
    
    // Filter
    if (reviewFilter !== "all") {
      list = list.filter(r => r.categories.includes(reviewFilter));
    }
    
    // Sort
    if (reviewSort === "newest") {
      list.sort((a, b) => b.timestamp - a.timestamp);
    } else if (reviewSort === "highest") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (reviewSort === "lowest") {
      list.sort((a, b) => a.rating - b.rating);
    }
    
    return list;
  }, [reviews, reviewFilter, reviewSort]);

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Handle Booking/Visit Form Submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName || !visitorEmail || !visitorPhone || !visitDate) {
      alert("Please fill all fields.");
      return;
    }
    if (bookingType === "visit" && !selectedCompanyId) {
      alert("Please select the company you are visiting.");
      return;
    }

    setIsLoading(true);
    try {
      let docPayload: any = {
        userName: visitorName,
        userEmail: visitorEmail.toLowerCase().trim(),
        userPhone: visitorPhone,
        numSeats: Number(numSeats),
        status: "pending",
        type: bookingType,
        date: visitDate,
        source: "public",
        createdAt: new Date().toISOString()
      };

      let passId = "";
      let otp = "";
      let finalCompanyName = "";

      if (bookingType === "visit") {
        passId = "SYN-V-" + Math.floor(100000 + Math.random() * 900000);
        otp = String(Math.floor(100000 + Math.random() * 900000));
        
        // Find company details
        const selectedCompany = companiesList.find(c => c.id === selectedCompanyId) || { id: "seed_1", companyName: "Synergi Tech Ventures" };
        finalCompanyName = selectedCompany.companyName || selectedCompany.displayName || "Synergi Partner";

        docPayload = {
          ...docPayload,
          companyId: selectedCompanyId,
          companyName: finalCompanyName,
          passId,
          otp,
          logs: [
            { action: "registered", timestamp: new Date().toISOString(), user: "visitor" }
          ]
        };
      }

      const docRef = await addDoc(collection(db, "bookings"), docPayload);

      if (bookingType === "visit") {
        const passInfo = {
          id: docRef.id,
          passId,
          otp,
          userName: visitorName,
          userEmail: visitorEmail.toLowerCase().trim(),
          userPhone: visitorPhone,
          companyName: finalCompanyName,
          date: visitDate,
          status: "pending"
        };
        setGeneratedPass(passInfo);

        // Send Email via backend email service
        try {
          await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "visitor_pass",
              booking: passInfo
            })
          });
        } catch (mailErr) {
          console.error("Failed to trigger automated email API:", mailErr);
        }

        setSubmitStatus(`Successfully submitted your visit request! Your Pass ID is ${passId}. Your Entry Pass and 6-digit OTP has been sent to your email automatically.`);
      } else {
        setSubmitStatus(`Successfully submitted your ${bookingType} request! You can track status using your email below.`);
      }

      // Reset
      setVisitorName("");
      setVisitorEmail("");
      setVisitorPhone("");
      setVisitDate("");
      setSelectedCompanyId("");
    } catch (err) {
      console.error(err);
      setSubmitStatus("Failed to submit request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Status Lookup
  const handleStatusCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;
    setSearchLoading(true);
    try {
      const q = query(
        collection(db, "bookings"),
        where("userEmail", "==", searchEmail.toLowerCase().trim())
      );
      const querySnap = await getDocs(q);
      const bookings: any[] = [];
      querySnap.forEach(doc => {
        bookings.push({ id: doc.id, ...doc.data() });
      });
      // Sort manually by date if multiple
      bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSearchResult(bookings);
    } catch (err) {
      console.error(err);
      alert("Error checking status.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Contact Inquiry Form Submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) return;
    try {
      await addDoc(collection(db, "complaints"), {
        userName: contactName,
        userEmail: contactEmail.toLowerCase().trim(),
        category: "General Inquiry",
        description: `Website message: ${contactMsg}`,
        status: "open",
        createdAt: new Date().toISOString()
      });
      setContactSuccess(true);
      setContactName("");
      setContactEmail("");
      setContactMsg("");
    } catch (err) {
      console.error(err);
    }
  }; 

  // Helper to convert Google Drive sharing link to a direct raw image link
  const getDirectImageUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com")) {
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
      }
    }
    return url;
  };

  // Mock Gallery Photos with actual clean coworking space images
  // Feel free to replace these URLs directly with your OneDrive or image links
  const galleryPhotos = [
    { type: "seat_booking", url: "https://drive.google.com/file/d/12zCvbRFAZdwonJNekGY3NqJ185INQ-Hv/view?usp=sharing", title: "Dedicated Seats" },
    { type: "seat_booking", url: "https://drive.google.com/file/d/1qwT_IjNjWUAnE62WU-Ae24nn5XUV1SBp/view?usp=sharing", title: "Collaborative Open Space" },
    { type: "conference_booking", url: "https://drive.google.com/file/d/1iawHjM_msGO2mXPVpkYauMlzIvEy00SQ/view?usp=sharing", title: "Smart Conference Room" },
    { type: "meeting_rooms", url: "https://drive.google.com/file/d/1JrLzPfEojJ5exEe5VaHx7jBPOzsczJPL/view?usp=sharing", title: "Vibrant Meeting Rooms" },
    { type: "corporate_office", url: "https://drive.google.com/file/d/1yc-eLkPbkSwoe5Un-2k63S94jorMRD5A/view?usp=sharing", title: "Private Suite Cabins" },
    { type: "corporate_office", url: "https://drive.google.com/file/d/1MCVt49GIzbjQqNpgcw8_J7OSARHRHIg6/view?usp=sharing", title: "Team Executive Suites" },
    { type: "corporate_office", url: "https://drive.google.com/file/d/1Wa2rr2vjEtP3y6ESPERXmaxUOyEfeJ8-/view?usp=sharing", title: "Team Office Space" },
  ];

  const filteredPhotos = galleryFilter === "all" 
    ? galleryPhotos 
    : galleryPhotos.filter(p => p.type === galleryFilter);

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen font-sans">
      {/* Top logo-inspired vibrant accent strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-orange-500 to-rose-500"></div>
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={synergiLogo} 
              alt="Synergi Logo" 
              className="h-14 sm:h-18 w-auto object-contain transition-all hover:scale-105" 
              referrerPolicy="no-referrer"
            />
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#about" className="hover:text-orange-600 transition-colors">About</a>
            <a href="#amenities" className="hover:text-orange-600 transition-colors">Amenities</a>
            <a href="#workspaces" className="hover:text-orange-600 transition-colors">Workspace Types</a>
            <a href="#gallery" className="hover:text-orange-600 transition-colors">Gallery</a>
            <a href="#faq" className="hover:text-orange-600 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-orange-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Contact / Social Quick Links */}
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 border-r border-slate-100 pr-3 mr-1">
              <a 
                href="https://wa.me/919667388817" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                title="WhatsApp Chat"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
              <a 
                href="https://www.facebook.com/SynergiCowork" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                title="Facebook Page"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href="tel:+919999028722" 
                className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                title="Call Us"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>

            {userEmail ? (
              <button 
                onClick={onNavigateToDashboard}
                className="bg-gradient-to-r from-emerald-600 via-orange-500 to-rose-500 hover:opacity-90 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-100/50 transition-all hover:scale-[1.02]"
              >
                Dashboard
              </button>
            ) : (
              <button 
                onClick={onNavigateToAuth}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-[1.02]"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAV DRAWER / MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-150 shadow-lg py-4 px-6 space-y-4 sticky top-20 z-40 animate-fade-in">
          <nav className="flex flex-col gap-3.5 font-bold text-slate-700">
            <a 
              href="#about" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-orange-600 border-b border-slate-100 transition-colors"
            >
              About
            </a>
            <a 
              href="#amenities" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-orange-600 border-b border-slate-100 transition-colors"
            >
              Amenities
            </a>
            <a 
              href="#workspaces" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-orange-600 border-b border-slate-100 transition-colors"
            >
              Workspace Types
            </a>
            <a 
              href="#gallery" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-orange-600 border-b border-slate-100 transition-colors"
            >
              Gallery
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-orange-600 border-b border-slate-100 transition-colors"
            >
              FAQ
            </a>
            <a 
              href="#contact" 
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-orange-600 transition-colors"
            >
              Contact
            </a>
          </nav>
          
          {/* Quick social handles for mobile */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Connect:</span>
            <a 
              href="https://wa.me/919667388817" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm"
            >
              <WhatsAppIcon className="w-4 h-4" />
            </a>
            <a 
              href="https://www.facebook.com/SynergiCowork" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a 
              href="tel:+919999028722" 
              className="w-9 h-9 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-20 lg:py-28">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-300 border border-orange-500/20">
              <Sparkles className="w-3 h-3 text-orange-400" /> Premier & Affordable Workspaces in Sector 7, Noida
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Affordable Coworking <br />
              <span className="bg-gradient-to-r from-emerald-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">Spaces in Noida</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-xl">
              Flexible Workspaces, Private Cabins, and Conference Rooms designed specifically for Startups, freelancers and SMEs
            </p>
            
            {/* Action buttons removed as requested */}

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800">
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400">20+</p>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Premium Seats</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-orange-400">2</p>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Conference Rooms</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-rose-400">9am-6pm</p>
                <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Mon - Sat Access</p>
              </div>
            </div>
          </div>

          {/* VISITOR INSTANT BOOKING FORM */}
          <div id="booking-widget" className="lg:col-span-5">
            <div className="bg-white rounded-2xl p-6 sm:p-8 text-slate-900 shadow-2xl relative">
              <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-orange-500 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Affordable Plans
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Booking Request</h3>
              <p className="text-xs text-slate-500 mb-6">No member registration required to send a request.</p>

              {/* Desk QR code registration notice */}
              <div className="mb-5 p-3.5 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 text-xs text-slate-600 leading-relaxed">
                <QrCode className="w-8 h-8 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800">Visiting our Noida Space?</p>
                  <p>Scan the front-desk QR code with your phone camera to register instantly, or fill out the digital Visitor Form below.</p>
                </div>
              </div>
              
              {submitStatus ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl mb-6 text-sm flex gap-2 items-start">
                  <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">{submitStatus}</p>
                    <button 
                      onClick={() => setSubmitStatus(null)}
                      className="text-blue-600 text-xs font-medium hover:underline mt-2 block"
                    >
                      Send another request
                    </button>
                  </div>
                </div>
              ) : null}

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">I want to request a:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingType("seat")}
                      className={`py-2 px-3 text-sm font-semibold rounded-xl border transition-all ${
                        bookingType === "seat" 
                          ? "bg-blue-600 border-blue-600 text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Seat Booking
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingType("visit")}
                      className={`py-2 px-3 text-sm font-semibold rounded-xl border transition-all ${
                        bookingType === "visit" 
                          ? "bg-blue-600 border-blue-600 text-white" 
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Schedule Visit
                    </button>
                  </div>
                </div>

                {bookingType === "seat" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Number of Seats Required</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setNumSeats(prev => Math.max(1, prev - 1))}
                        className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-lg hover:bg-slate-50"
                      >
                        -
                      </button>
                      <span className="font-extrabold text-lg text-slate-850 w-8 text-center">{numSeats}</span>
                      <button
                        type="button"
                        onClick={() => setNumSeats(prev => prev + 1)}
                        className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-lg hover:bg-slate-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Rahul Kumar"
                      value={visitorName}
                      onChange={e => setVisitorName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. 9876543210"
                      value={visitorPhone}
                      onChange={e => setVisitorPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. rahul@example.com"
                    value={visitorEmail}
                    onChange={e => setVisitorEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {bookingType === "visit" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-blue-500" /> Visiting Company Name
                    </label>
                    <select
                      value={selectedCompanyId}
                      onChange={e => setSelectedCompanyId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-medium"
                      required
                    >
                      <option value="">-- Select Registered Company --</option>
                      {companiesList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.companyName || `${c.displayName}'s Company`}
                        </option>
                      ))}
                      {companiesList.length === 0 && (
                        <>
                          <option value="seed_1">Synergi Tech Ventures</option>
                          <option value="seed_2">Ipanelklean IT Services</option>
                          <option value="seed_3">Pixel Craft Media</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {bookingType === "seat" ? "Preferred Start Date" : "Preferred Visit Date"}
                  </label>
                  <input 
                    type="date" 
                    value={visitDate}
                    onChange={e => setVisitDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md shadow-blue-100 text-sm transition-all hover:scale-[1.01]"
                >
                  {isLoading ? "Submitting..." : bookingType === "seat" ? "Submit Seat Booking Request" : "Submit Visit Request"}
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>

      {/* VISITOR TRACKING STATUS PANEL */}
      <section className="bg-blue-50 py-10 border-y border-blue-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h4 className="text-xl font-bold text-slate-950 mb-2">Already requested? Check status here</h4>
          <p className="text-sm text-slate-600 mb-6">Enter the email you used for your seat booking or visit request.</p>
          
          <form onSubmit={handleStatusCheck} className="flex gap-2 max-w-md mx-auto mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="email" 
                placeholder="e.g. rahul@example.com" 
                required
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl text-sm border border-blue-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold rounded-xl"
            >
              {searchLoading ? "Checking..." : "Look Up"}
            </button>
          </form>

          {searchResult && searchResult.length === 0 && (
            <p className="text-sm text-amber-700 font-semibold">No requests found for that email.</p>
          )}

          {searchResult && searchResult.length > 0 && (
            <div className="bg-white rounded-xl p-4 text-left border border-blue-100 divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {searchResult.map((b) => (
                <div key={b.id} className="py-3 flex flex-wrap justify-between items-center gap-2">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-xxs font-bold uppercase tracking-wider ${
                      b.type === "seat" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"
                    }`}>
                      {b.type === "seat" ? `${b.numSeats} Seat Booking` : "Site Visit"}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">Date: <span className="font-semibold text-slate-700">{b.date}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                      b.status === "approved" || b.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      b.status === "rejected" || b.status === "inactive" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                      "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {b.status}
                    </span>
                    {b.seatNumber && (
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        Seat: {b.seatNumber}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AMENITIES */}
      <section id="amenities" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Amenities Offered</h2>
            <p className="text-slate-600">
              Enjoy enterprise-grade conveniences designed to make your daily work routine fluid, highly efficient, and distraction-free.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Wifi, title: "High Speed WiFi", desc: "Dual band gigabit connectivity with backup leased lines." },
              { icon: Battery, title: "Power Backup", desc: "Uninterrupted operation" },
              { icon: Shield, title: "24/7 CCTV & Security", desc: "Biometric and smart card access control at all zones." },
              { icon: Sparkles, title: "Daily Cleaning", desc: "Eco-friendly and professional housekeeping." },
              { icon: Users, title: "Conference Rooms", desc: "High definition display systems, premium audio, and marker walls." },
              { icon: Coffee, title: "Tea & Coffee", desc: "Premium blends, beverages, and pantry setups." },
              { icon: Wind, title: "Air Conditioning", desc: "Complete air filtration and customizable" },
              { icon: Award, title: "Meeting Rooms", desc: "Modern small-group collaborative breakout spaces and distraction Free." }
            ].map((amenity, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-100 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors mb-4">
                  <amenity.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{amenity.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{amenity.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT US */}
      <section id="about" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold tracking-widest text-blue-600 uppercase">Welcome to Synergi</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                Our Mission & Story
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Synergi Coworking Space is Noida's premier workspace hub built to foster community, synergy, and productivity. Located strategically in Sector 7, Noida, we provide flexible, affordable plans for single dedicated seats billed monthly up to complete multi-seat corporate cabins.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 pt-4">
                <div className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-1">Our Mission</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">To offer high-efficiency, fully-equipped workspace ecosystems that empower creators, SMEs, and hybrid workforces to scale smoothly.</p>
                </div>
                <div className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-1">Our Vision</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">To become the national standard for community-focused workspaces combining design excellence, convenience, and affordability.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src={getDirectImageUrl("https://drive.google.com/file/d/1j9HFukQo04JWMxeVR_IX8-XC6cYjD5U0/view?usp=sharing")} 
                alt="Our Space" 
                className="rounded-3xl shadow-xl object-cover h-[450px] w-full"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-6 -left-6 bg-blue-600 text-white p-6 rounded-2xl shadow-xl hidden sm:block max-w-[240px]">
                <p className="text-2xl font-extrabold">98%</p>
                <p className="text-xs text-blue-100 font-medium">Member Retention & Customer Satisfaction Rating.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKSPACE TYPES */}
      <section id="workspaces" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Explore Workspace Types</h2>
            <p className="text-slate-600">
              Flexible options crafted to fit any operational scale, from solo consultants to rapid-scale enterprise units. Available Mon-Sat, 9 AM - 6 PM.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Seat Booking",
                img: "https://drive.google.com/file/d/1Ydq9xxxpMfv_Zr4d6dnJbm7JFHotUmj1/view?usp=sharing",
                desc: "Choose a dedicated seat space or sit freely in our vibrant community area."
              },
              {
                title: "Conference Rooms",
                img: "https://drive.google.com/file/d/1JrLzPfEojJ5exEe5VaHx7jBPOzsczJPL/view?usp=sharing",
                desc: "High-tech presentation facilities, whiteboards, and smart screens."
              },
              {
                title: "Meeting Rooms",
                img: "https://drive.google.com/file/d/1d4gRACLBycmeh-4YLFefEUMMHdKox9Am/view?usp=sharing",
                desc: "Private spaces perfect for client interactions, 1-on-1 sessions and reviews."
              },
              {
                title: "Corporate Office",
                img: "https://drive.google.com/file/d/1Bhd1CJyPwjiMylTEIaqg0h7XS7A85ulu/view?usp=sharing",
                desc: "Secure private cabins for entire teams with customized configurations."
              }
            ].map((space, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                <div>
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={getDirectImageUrl(space.img)} 
                      alt={space.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-400" /> 9am - 6pm (Mon-Sat)
                    </div>
                  </div>
                  <div className="p-6 space-y-3 pb-4">
                    <h3 className="font-extrabold text-lg text-slate-900">{space.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed h-12">{space.desc}</p>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <a 
                    href="#booking-widget"
                    onClick={() => {
                      if (space.title === "Seat Booking") {
                        setBookingType("seat");
                      } else {
                        setBookingType("visit");
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow hover:scale-[1.03] active:scale-[0.98] duration-200 uppercase tracking-wider"
                  >
                    Book Now
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Our Workspace Gallery</h2>
              <p className="text-slate-600 max-w-xl">Take a visual tour of our beautifully designed physical facilities and work zones.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {[
                { id: "all", label: "All" },
                { id: "seat_booking", label: "Seat Booking" },
                { id: "conference_booking", label: "Conference Booking" },
                { id: "meeting_rooms", label: "Meeting Rooms" },
                { id: "corporate_office", label: "Corporate Office" }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setGalleryFilter(f.id as any)}
                  className={`px-4 py-1.5 rounded-full border transition-all uppercase tracking-wider ${
                    galleryFilter === f.id 
                      ? "bg-orange-500 border-orange-500 text-white" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.map((photo, index) => (
              <div key={index} className="group relative rounded-2xl overflow-hidden shadow-sm h-64 bg-slate-200">
                <img 
                  src={getDirectImageUrl(photo.url)} 
                  alt={photo.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <div>
                    <span className="text-orange-400 text-xxs font-bold uppercase tracking-widest">{photo.type.replace('_', ' ')}</span>
                    <h4 className="text-white font-bold text-base mt-1">{photo.title}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
              Member Testimonials
            </span>
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight sm:text-4xl">
              Real Reviews from our Community
            </h2>
            <p className="text-slate-600 text-base">
              Explore authentic reviews from real members of Synergi Coworking Space Noida, direct from Google Maps.
            </p>
          </div>

          {/* Google Business Overview Panel */}
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8 mb-12 shadow-sm grid md:grid-cols-3 gap-8 items-center">
            
            {/* Left Col: Star Rating */}
            <div className="text-center md:text-left space-y-3 md:border-r md:border-slate-200/60 md:pr-8">
              <h3 className="font-extrabold text-slate-900 text-lg leading-tight">Synergi Coworking Space</h3>
              <p className="text-xs text-slate-500 leading-normal flex items-start gap-1.5 justify-center md:justify-start">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>Sector 7, Noida, Uttar Pradesh 201301, India</span>
              </p>
              
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start">
                <span className="text-5xl font-black text-slate-900">4.8</span>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4].map((star) => (
                      <Heart key={star} className="w-5 h-5 fill-red-500 text-red-500" />
                    ))}
                    <div className="relative">
                      <Heart className="w-5 h-5 text-slate-300" />
                      <div className="absolute top-0 left-0 overflow-hidden w-[80%]">
                        <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-1">{reviews.length} reviews on Google Maps</p>
                </div>
              </div>
            </div>

            {/* Middle Col: Rating Distribution Bars */}
            <div className="space-y-2">
              {[
                { hearts: 5, pct: "90%", count: reviews.filter(r => r.rating === 5).length },
                { hearts: 4, pct: "10%", count: reviews.filter(r => r.rating === 4).length },
                { hearts: 3, pct: "0%", count: reviews.filter(r => r.rating === 3).length },
                { hearts: 2, pct: "0%", count: reviews.filter(r => r.rating === 2).length },
                { hearts: 1, pct: "0%", count: reviews.filter(r => r.rating === 1).length },
              ].map((row) => (
                <div key={row.hearts} className="flex items-center gap-3 text-xs font-medium text-slate-600">
                  <span className="w-3 text-right">{row.hearts}</span>
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 shrink-0" />
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: row.pct }}></div>
                  </div>
                  <span className="w-8 text-slate-400 text-right">{row.count}</span>
                </div>
              ))}
            </div>

            {/* Right Col: Write review CTA */}
            <div className="text-center space-y-4 md:pl-8 md:border-l md:border-slate-200/60">
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Been working at Synergi? Share your feedback with Noida's ultimate startup ecosystem!
              </p>
              <button
                onClick={() => setIsWritingReview(!isWritingReview)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-100 transition-all hover:scale-[1.01]"
              >
                <Plus className="w-4 h-4" />
                Write a Review
              </button>
            </div>

          </div>

          {/* Inline Write Review Card */}
          {isWritingReview && (
            <div className="bg-slate-50 border-2 border-red-100 rounded-3xl p-6 mb-12 shadow-inner max-w-2xl mx-auto transition-all animate-fade-in">
              <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600 fill-red-100" />
                Write your workspace review
              </h3>
              
              <form onSubmit={handleAddReviewSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Name</label>
                    <input 
                      type="text" 
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="e.g. Rahul Gupta" 
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Are you a Google Local Guide?</label>
                    <div className="flex items-center gap-2 h-9">
                      <input 
                        type="checkbox" 
                        id="guide"
                        checked={newIsLocalGuide}
                        onChange={(e) => setNewIsLocalGuide(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <label htmlFor="guide" className="text-sm text-slate-600 cursor-pointer select-none">Yes, check as Local Guide</label>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rating</label>
                    <div className="flex gap-1.5 h-9 items-center">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setNewRating(num)}
                          className="focus:outline-none"
                        >
                          <Heart className={`w-6 h-6 transition-colors ${num <= newRating ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select tags that apply</label>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {["peaceful workspace", "startups", "seating", "amenities"].map((tag) => {
                        const active = newSelectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (active) {
                                setNewSelectedTags(newSelectedTags.filter(t => t !== tag));
                              } else {
                                setNewSelectedTags([...newSelectedTags, tag]);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                              active 
                                ? "bg-blue-600 border-blue-600 text-white" 
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Your Review</label>
                  <textarea 
                    rows={3}
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    placeholder="Describe your work experience, amenities, staff support, ambiance..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsWritingReview(false)}
                    className="px-4 py-2 text-sm text-slate-500 font-medium hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2 rounded-xl transition-all"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filtering and Sorting Controls bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-6 border-b border-slate-100 mb-8">
            
            {/* Filter tags (Interactive counts updated automatically) */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Sort Review Tags:</span>
              <button
                onClick={() => setReviewFilter("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  reviewFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                All ({reviews.length})
              </button>
              {[
                { tag: "peaceful workspace", count: reviews.filter(r => r.categories.includes("peaceful workspace")).length },
                { tag: "startups", count: reviews.filter(r => r.categories.includes("startups")).length },
                { tag: "seating", count: reviews.filter(r => r.categories.includes("seating")).length },
                { tag: "amenities", count: reviews.filter(r => r.categories.includes("amenities")).length },
              ].map((c) => (
                <button
                  key={c.tag}
                  onClick={() => setReviewFilter(c.tag)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                    reviewFilter === c.tag
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  {c.tag} ({c.count})
                </button>
              ))}
            </div>

            {/* Sort Dropdown Selector */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort by:</span>
              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="relevant">Most relevant</option>
                <option value="newest">Newest</option>
                <option value="highest">Highest rating</option>
                <option value="lowest">Lowest rating</option>
              </select>
            </div>

          </div>

          {/* Testimonial Review Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAndFilteredReviews.map((t) => (
              <div 
                key={t.id} 
                className="p-6 rounded-3xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  
                  {/* Author Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm ${t.avatarBg || 'bg-slate-500'}`}>
                        {t.avatarLetter}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1">
                          {t.author}
                        </h4>
                        
                        {/* Guide or review badge */}
                        {t.isLocalGuide ? (
                          <p className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                            <span className="inline-block w-2.5 h-2.5 bg-amber-500 text-white text-[7px] leading-tight rounded-full text-center">★</span>
                            Local Guide • {t.reviewsCount} reviews
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-400 font-medium">
                            Google Reviewer • {t.reviewsCount || 1} review{t.reviewsCount && t.reviewsCount > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {t.timeAgo}
                    </span>
                  </div>

                  {/* Hearts Rating */}
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Heart 
                        key={i} 
                        className={`w-3.5 h-3.5 ${
                          i < t.rating ? 'fill-red-500 text-red-500' : 'text-slate-200'
                        }`} 
                      />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="text-slate-600 text-xs leading-relaxed italic mb-4">
                    "{t.text}"
                  </p>

                  {/* Associated Categories Tags */}
                  {t.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {t.categories.map((cat) => (
                        <span 
                          key={cat} 
                          className="px-2 py-0.5 rounded bg-blue-50/80 text-blue-700 text-[9px] font-bold uppercase tracking-wider border border-blue-100/50"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}

                </div>

                {/* Owner Reply if present */}
                {t.ownerResponse && (
                  <div className="mt-4 pt-4 border-t border-slate-200/50 pl-3 border-l-2 border-blue-500 bg-blue-50/20 rounded-r-xl p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-900 mb-1">
                      <CornerDownRight className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>Response from the owner</span>
                      <span className="text-slate-400 font-medium">({t.ownerResponse.timeAgo})</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      "{t.ownerResponse.text}"
                    </p>
                  </div>
                )}

              </div>
            ))}
          </div>

          {sortedAndFilteredReviews.length === 0 && (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl max-w-md mx-auto space-y-2">
              <p className="text-slate-500 font-medium text-sm">No reviews found matching the selected tag.</p>
              <button 
                onClick={() => setReviewFilter("all")}
                className="text-xs text-blue-600 font-semibold underline hover:text-blue-700"
              >
                Clear Filters
              </button>
            </div>
          )}

        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-600">Get clear answers to the most common queries regarding seat licenses, timings, and payments.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What are the exact operating timings of the space?",
                a: "Synergi Coworking Space Noida is open from Monday to Saturday, between 9:00 AM and 6:00 PM. We are closed on Sundays and national holidays."
              },
              {
                q: "Can visitors request a booking or site tour directly?",
                a: "Yes! Visitors can easily use our Hero section widget to send a Seat Booking or Site Visit request. Enter your email and lookup status directly on this page without registration."
              }
            
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left px-6 py-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" /> {faq.q}
                  </span>
                  {faqOpen[index] ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                {faqOpen[index] && (
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-500 border-t border-slate-50 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT US */}
      <section id="contact" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Get in Touch With Us</h2>
                <p className="text-slate-600">Have questions about our flexible pricing or private cabin spaces? Drop us a line and our venue executive will reach out to you within 2 hours.</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Venue Address</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Sector 7, Noida, Uttar Pradesh 201301
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Phone Contacts</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      <strong>Contact Us:</strong> +91 99990 28722 &nbsp;|&nbsp; <strong>Phone No:</strong> +91 92115 92110
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Email Coordinates</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      synergi.coworkingspace@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start pt-2 border-t border-slate-100">
                  
                  <div className="flex flex-row gap-2 w-full pt-1">
                    <a 
                      href="https://wa.me/919667388817"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] sm:text-xs font-bold py-2 px-2 rounded-xl transition-all shadow-sm text-center"
                      title="WhatsApp Chat"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">WhatsApp</span>
                    </a>
                    <a 
                      href="https://www.facebook.com/SynergiCowork"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-bold py-2 px-2 rounded-xl transition-all shadow-sm text-center"
                      title="Facebook Page"
                    >
                      <Facebook className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Facebook</span>
                    </a>
                    <a 
                      href="tel:+919999028722" 
                      className="flex-1 flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[11px] sm:text-xs font-bold py-2 px-2 rounded-xl transition-all shadow-sm text-center"
                      title="Call Us"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Call Us</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Noida sector 7 map embed */}
              <div className="space-y-3">
                <div className="h-64 rounded-2xl overflow-hidden border border-slate-150 shadow-sm">
                  <iframe 
                    title="Synergi Coworking Space Noida"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3504.145610815617!2d77.31513701508!3d28.595945193214532!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce505f11ecb0f%3A0x1e1a229019dbaec7!2sSynergi%20Coworking%20Space!5e0!3m2!1sen!2sin!4v1716392451999!5m2!1sen!2sin" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
                <a 
                  href="https://www.google.com/maps/place/Synergi+Coworking+Space/@28.5959405,77.3173257,552m/data=!3m2!1e3!4b1!4m6!3m5!1s0x390ce505f11ecb0f:0x1e1a229019dbaec7!8m2!3d28.5959405!4d77.3173257!16s%2Fg%2F11h_1wgqh_?entry=ttu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all border border-slate-200/60 hover:border-blue-200"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  View on Google Maps / Get Directions
                </a>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-950 mb-2">Drop us a Message</h3>
              <p className="text-xs text-slate-500 mb-6">Enter details and our coordinator will respond instantly via email.</p>
              
              {contactSuccess ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl mb-6 text-sm font-semibold">
                  ✓ Your message has been received! Our team will contact you shortly.
                </div>
              ) : null}

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your Full Name</label>
                  <input 
                    type="text" 
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    placeholder="e.g. Rahul Kumar" 
                    required 
                    className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="e.g. rahul@example.com" 
                    required 
                    className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your Message</label>
                  <textarea 
                    rows={4}
                    value={contactMsg}
                    onChange={e => setContactMsg(e.target.value)}
                    placeholder="Describe what you need (seat booking details, private cabins size, enterprise query, etc.)" 
                    required 
                    className="w-full px-4 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-100 text-white font-bold py-3 rounded-xl text-sm transition-all"
                >
                  Send Message
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-2">
            <img 
              src={synergiLogo} 
              alt="Synergi Logo" 
              className="h-16 sm:h-20 w-auto object-contain bg-white/95 p-2 rounded-2xl shadow-sm transition-all hover:scale-105" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-xs max-w-lg mx-auto leading-relaxed space-y-2">
            <p>Sector 7, Noida, Uttar Pradesh 201301. Providing premium coworking experiences designed to spark collaboration.</p>
            <p className="text-slate-500">
              <strong>Email:</strong> synergi.coworkingspace@gmail.com &nbsp;|&nbsp; 
              <strong> Phone:</strong> +91 99990 28722 / +91 92115 92110
            </p>
          </div>
          <div className="flex items-center justify-center gap-5 py-4">
            <a 
              href="https://wa.me/919667388817" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center shadow-lg hover:scale-110 duration-200"
              title="WhatsApp Support"
            >
              <WhatsAppIcon className="w-6 h-6" />
            </a>
            <a 
              href="https://www.facebook.com/SynergiCowork" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-blue-500 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-lg hover:scale-110 duration-200"
              title="Facebook Page"
            >
              <Facebook className="w-6 h-6" />
            </a>
            <a 
              href="tel:+919999028722" 
              className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-orange-500 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center shadow-lg hover:scale-110 duration-200"
              title="Call Us"
            >
              <Phone className="w-6 h-6" />
            </a>
          </div>
          <div className="text-xxs font-mono uppercase tracking-widest text-slate-600">
            © Since 2018 Synergi Coworking Noida. All Rights Reserved.
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://api.whatsapp.com/send/?phone=9667388817&text&type=phone_number&app_absent=0"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-4 shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 duration-200 group"
        title="Chat on WhatsApp"
      >
        <WhatsAppIcon className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out font-bold text-xs uppercase tracking-wider pl-0 group-hover:pl-2 whitespace-nowrap">
          Chat on WhatsApp
        </span>
      </a>

      {/* VISITOR PASS SUCCESS MODAL */}
      {generatedPass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden relative animate-in fade-in zoom-in duration-205 printable-pass-card">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-6 text-white text-center relative">
              <button 
                onClick={() => setGeneratedPass(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors no-print"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <Ticket className="w-12 h-12 mx-auto mb-2 opacity-90 text-yellow-300" />
              <h4 className="text-xl font-bold tracking-tight">Your Digital Visitor Pass</h4>
              <p className="text-xs text-blue-100 mt-1 uppercase tracking-wider font-semibold">Ready for Reception Entry</p>
            </div>

            {/* Pass Content */}
            <div className="p-6 space-y-4 text-slate-800">
              <div className="text-center bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unique Pass ID</p>
                <p className="text-2xl font-black text-slate-900 font-mono mt-1 tracking-wide">{generatedPass.passId}</p>
                
                {/* QR Code */}
                <div className="my-4 flex justify-center">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${window.location.origin}/?passId=${generatedPass.passId}`)}`}
                      alt="Entry QR"
                      className="w-40 h-40"
                    />
                  </div>
                </div>

                {/* 6-Digit OTP */}
                <div className="inline-block bg-blue-50 border border-blue-200 rounded-2xl px-5 py-2.5">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-widest block mb-0.5">Security Entry OTP</span>
                  <span className="text-3xl font-extrabold text-blue-600 font-mono tracking-widest">{generatedPass.otp}</span>
                </div>
              </div>

              {/* Visit Details Grid */}
              <div className="space-y-2 text-sm bg-slate-50/50 rounded-2xl p-3.5 border border-slate-100">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Visitor Name:</span>
                  <span className="text-slate-900 font-bold">{generatedPass.userName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Visiting Company:</span>
                  <span className="text-slate-900 font-extrabold text-blue-700">{generatedPass.companyName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Schedule Date:</span>
                  <span className="text-slate-900 font-mono font-bold">{generatedPass.date}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Entry Status:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 uppercase tracking-wider">
                    {generatedPass.status}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex gap-2 items-center no-print">
                <CheckSquare className="w-5 h-5 shrink-0 text-emerald-600" />
                <p>Pass sent successfully to <strong>{generatedPass.userEmail}</strong>! Show this screen or the email at Noida site reception.</p>
              </div>

              {/* Print Notice for Door Placement */}
              <div className="p-3 bg-slate-50 text-slate-700 rounded-xl text-xxs flex flex-col gap-1 border border-slate-200 no-print">
                <span className="font-bold text-slate-900 uppercase">📌 Gate Pass Printing Instructions:</span>
                <span>You can print this gate pass card to paste at the cabin/meeting room door. The security guard or visitors can scan the QR code to verify authorized entry.</span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-1 no-print">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print Door Pass
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`Pass ID: ${generatedPass.passId} | OTP: ${generatedPass.otp} | Company: ${generatedPass.companyName}`);
                    alert("Pass details copied to clipboard!");
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-blue-200"
                >
                  <Copy className="w-4 h-4" /> Copy Info
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
