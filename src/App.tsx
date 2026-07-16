import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db, getUserProfile, doc, getDoc, collection, query, where, getDocs } from "./firebase";
import { ensureSeedData } from "./utils/seed";
import { UserProfile } from "./types";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { 
  ShieldCheck, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Building, 
  Phone, 
  ArrowLeft, 
  CheckCircle2 
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<"landing" | "auth" | "dashboard">("landing");
  const [loading, setLoading] = useState(true);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  // QR Code Pass Web-Verification States
  const [verificationPassId, setVerificationPassId] = useState<string | null>(null);
  const [verifiedPassData, setVerifiedPassData] = useState<any | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Check URL query params for pass validation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const passId = params.get("passId");
    if (passId) {
      setVerificationPassId(passId);
      fetchVerifiedPass(passId);
    }
  }, []);

  const fetchVerifiedPass = async (id: string) => {
    setVerificationLoading(true);
    setVerificationError(null);
    try {
      const colRef = collection(db, "bookings");
      const q = query(colRef, where("passId", "==", id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        setVerifiedPassData({ id: docSnap.id, ...docSnap.data() });
      } else {
        setVerificationError("Visitor pass not found or is invalid. Please double check the QR code or register again.");
      }
    } catch (err: any) {
      console.error("Error verifying pass:", err);
      setVerificationError("System error while verifying pass: " + err.message);
    } finally {
      setVerificationLoading(false);
    }
  };

  // 1. Initial Seeding and Auth State Listening
  useEffect(() => {
    // Run background seeding if needed
    ensureSeedData(db);

    const diagnosticTimer = setTimeout(() => {
      setShowDiagnostic(true);
    }, 4500);

    const safetyTimer = setTimeout(() => {
      setLoading((prevLoading) => {
        if (prevLoading) {
          console.warn("Auth initialization taking too long, forcing load state completion.");
          return false;
        }
        return prevLoading;
      });
    }, 2500);

    const initAuth = async () => {
      setLoading(true);
      const customToken = localStorage.getItem("synergi_custom_auth_token");
      const customUserId = localStorage.getItem("synergi_custom_user_id");

      if (customToken && customUserId) {
        try {
          const profile = await getUserProfile(customUserId);
          if (profile) {
            setCurrentUser({ email: profile.email, uid: profile.uid });
            setUserProfile(profile as UserProfile);
            setCurrentView("dashboard");
            setLoading(false);
            return null;
          }
        } catch (err) {
          console.error("Error restoring custom user session:", err);
        }
      }

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setLoading(true);
        if (user) {
          const hasCustom = localStorage.getItem("synergi_custom_auth_token");
          if (hasCustom) {
            setLoading(false);
            return;
          }
          
          setCurrentUser(user);
          // Fetch or create profile
          try {
            const profile = await getUserProfile(user.uid);
            if (profile) {
              setUserProfile(profile as UserProfile);
              setCurrentView("dashboard");
            } else {
              // Profile pending creation in signup flow
              setUserProfile(null);
              setCurrentView("auth");
            }
          } catch (err) {
            console.error("Error fetching user profile:", err);
            setUserProfile(null);
            setCurrentView("landing");
          }
        } else {
          const hasCustom = localStorage.getItem("synergi_custom_auth_token");
          if (!hasCustom) {
            setCurrentUser(null);
            setUserProfile(null);
            setCurrentView("landing");
          }
        }
        setLoading(false);
      });

      setLoading(false);
      return unsubscribe;
    };

    let firebaseUnsub: (() => void) | null = null;
    initAuth().then((unsub) => {
      if (unsub) firebaseUnsub = unsub;
    });

    return () => {
      clearTimeout(diagnosticTimer);
      clearTimeout(safetyTimer);
      if (firebaseUnsub) firebaseUnsub();
    };
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("synergi_custom_auth_token");
      localStorage.removeItem("synergi_custom_user_id");
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setCurrentView("landing");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = async (role: string, mockProfile?: UserProfile) => {
    if (mockProfile) {
      const customToken = `custom-token-${mockProfile.uid}-${Date.now()}`;
      localStorage.setItem("synergi_custom_auth_token", customToken);
      localStorage.setItem("synergi_custom_user_id", mockProfile.uid);
      
      setCurrentUser({ email: mockProfile.email, uid: mockProfile.uid });
      setUserProfile(mockProfile);
      setCurrentView("dashboard");
      return;
    }
    // Reload profile
    if (auth.currentUser) {
      const p = await getUserProfile(auth.currentUser.uid);
      if (p) {
        setUserProfile(p as UserProfile);
        setCurrentView("dashboard");
      }
    }
  };

  if (verificationPassId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-x-hidden">
        {/* Decorative Background Accents */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-50 to-slate-50 -z-10" />

        <div className="w-full max-w-md bg-white border border-slate-150 rounded-3xl shadow-xl overflow-hidden relative">
          
          {/* Top Banner with dynamic color */}
          {verificationLoading ? (
            <div className="h-3 bg-indigo-500 animate-pulse" />
          ) : verificationError ? (
            <div className="h-3 bg-rose-500" />
          ) : verifiedPassData?.status === "approved" || verifiedPassData?.status === "checked_in" ? (
            <div className="h-3 bg-emerald-500" />
          ) : (
            <div className="h-3 bg-slate-400" />
          )}

          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Header branding */}
            <div className="text-center space-y-1">
              <h1 className="text-sm font-black text-slate-900 tracking-wider uppercase">🏢 Synergi Noida</h1>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Digital Entry Verification</p>
            </div>

            {verificationLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">Securing pass validation record...</p>
              </div>
            ) : verificationError ? (
              <div className="py-6 flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-sm">
                  <XCircle className="w-9 h-9" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900">Verification Failed</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xs">{verificationError}</p>
                </div>
                <button
                  onClick={() => {
                    setVerificationPassId(null);
                    window.history.pushState({}, "", window.location.pathname);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
                </button>
              </div>
            ) : verifiedPassData ? (
              <div className="space-y-6">
                
                {/* Verified Badge Header */}
                <div className="flex flex-col items-center text-center space-y-3 pb-2 border-b border-slate-100">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md ${
                    verifiedPassData.status === "approved" || verifiedPassData.status === "checked_in"
                      ? "bg-emerald-50 text-emerald-500 shadow-emerald-500/10" 
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    <ShieldCheck className="w-9 h-9" />
                  </div>
                  
                  <div className="space-y-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      verifiedPassData.status === "approved" || verifiedPassData.status === "checked_in"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      PASS VERIFIED: {verifiedPassData.status === "approved" ? "APPROVED / VALID" : verifiedPassData.status?.replace("_", " ").toUpperCase()}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">Official Entry Pass</h3>
                    <p className="text-xs text-indigo-600 font-mono font-bold tracking-wider">{verifiedPassData.passId}</p>
                  </div>
                </div>

                {/* Visit Details Grid */}
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100 text-left">
                    <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Visitor Name</span>
                      <strong className="text-xs text-slate-800 font-extrabold block">{verifiedPassData.userName}</strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100 text-left">
                    <Building className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Visiting Company / Host</span>
                      <strong className="text-xs text-slate-800 font-extrabold block">{verifiedPassData.companyName}</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="flex items-start gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                      <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Visit Date</span>
                        <strong className="text-xs text-slate-800 font-bold block font-mono">{verifiedPassData.date}</strong>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                      <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Contact No</span>
                        <strong className="text-xs text-slate-800 font-bold block font-mono">{verifiedPassData.userPhone}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Remarks / Purpose */}
                  {verifiedPassData.remarks && (
                    <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-2xl text-left">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Purpose / Host Remarks</span>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium italic">"{verifiedPassData.remarks}"</p>
                    </div>
                  )}

                  {/* Logs & Check-in Details */}
                  {(verifiedPassData.checkInTime || verifiedPassData.checkOutTime) && (
                    <div className="bg-indigo-50/40 border border-indigo-100/50 p-3 rounded-2xl text-xs space-y-1 text-left">
                      {verifiedPassData.checkInTime && (
                        <p className="text-slate-600 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" /> Check-In time: <strong className="text-slate-900 font-mono">{verifiedPassData.checkInTime}</strong>
                        </p>
                      )}
                      {verifiedPassData.checkOutTime && (
                        <p className="text-slate-600 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" /> Check-Out time: <strong className="text-slate-900 font-mono">{verifiedPassData.checkOutTime}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer validation stamp */}
                <div className="text-center pt-2 space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" /> SECURE BLOCKCHAIN LEDGER RECORD
                  </div>
                  
                  <div>
                    <button
                      onClick={() => {
                        setVerificationPassId(null);
                        window.history.pushState({}, "", window.location.pathname);
                      }}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Close and Return to Home
                    </button>
                  </div>
                </div>

              </div>
            ) : null}

          </div>
        </div>

        {/* Security Stamp footer */}
        <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-6">
          © 2026 Synergi Coworking Noida | Authorized Access Only
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center gap-6 p-6 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="space-y-2 max-w-md">
          <p className="text-xs sm:text-sm font-bold text-slate-400 font-mono tracking-widest uppercase">Connecting to Synergi Platform...</p>
          {showDiagnostic && (
            <div className="mt-8 p-5 bg-slate-800/80 border border-slate-700 rounded-2xl text-left space-y-3 animate-fade-in text-xs leading-relaxed text-slate-300">
              <p className="font-bold text-amber-400 flex items-center gap-1.5 font-mono uppercase tracking-wider text-[11px]">
                ⚠️ Custom Firebase Configuration Setup
              </p>
              <p>
                You are connecting using your custom Firebase project <strong className="text-white">{db.app.options.projectId || "synergi"}</strong>. If the app remains stuck loading:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400 font-medium">
                <li>
                  <strong className="text-slate-200">Enable Firestore:</strong> In your Firebase Console, click <strong className="text-slate-200">Firestore Database</strong> and click <strong className="text-slate-200">Create Database</strong>.
                </li>
                <li>
                  <strong className="text-slate-200">Enable Auth Provider:</strong> Go to <strong className="text-slate-200">Authentication</strong> &rarr; <strong className="text-slate-200">Sign-in method</strong> and turn on the <strong className="text-slate-200">Email/Password</strong> provider.
                </li>
                <li>
                  <strong className="text-slate-200">Update Security Rules:</strong> Go to the <strong className="text-slate-200">Rules</strong> tab in your Firestore Console and publish permissive rules for development:
                  <pre className="mt-1 p-2 bg-slate-900 rounded font-mono text-[10px] text-emerald-400 overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
                  </pre>
                </li>
              </ul>
              <div className="pt-2 flex justify-center">
                <button 
                  onClick={() => setLoading(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold rounded-lg transition-all"
                >
                  Force Load Main Page (Offline Mode)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {currentView === "landing" && (
        <LandingPage 
          onNavigateToAuth={() => setCurrentView("auth")}
          onNavigateToDashboard={() => setCurrentView("dashboard")}
          userEmail={currentUser ? currentUser.email : null}
        />
      )}

      {currentView === "auth" && (
        <AuthPage 
          onBack={() => setCurrentView("landing")}
          onSuccess={handleAuthSuccess}
        />
      )}

      {currentView === "dashboard" && userProfile && (
        <>
          {userProfile.role === "customer" ? (
            <UserDashboard 
              user={userProfile} 
              onLogout={handleLogout} 
              onUpdateProfile={setUserProfile}
            />
          ) : (
            <AdminDashboard 
              user={userProfile} 
              onLogout={handleLogout} 
              onUpdateProfile={setUserProfile}
            />
          )}
        </>
      )}

      {currentView === "dashboard" && !userProfile && (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto text-xl">
              🔑
            </div>
            <h2 className="text-lg font-bold text-slate-100">Session Profile Loading</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              We detected an active session, but we are currently unable to retrieve your profile details. This can happen if the network is disconnected or the backend database is loading.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={() => {
                  setCurrentView("landing");
                }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all"
              >
                Go back to Landing Page
              </button>
              <button 
                onClick={handleLogout}
                className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-all"
              >
                Sign Out & Clear Custom Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
