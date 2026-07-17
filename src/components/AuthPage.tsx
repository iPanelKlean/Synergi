import React, { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { auth, db, googleProvider, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from "../firebase";
import { Mail, Lock, User, Phone, ArrowLeft, ShieldAlert, Eye, EyeOff } from "lucide-react";
import synergiLogo from "../assets/images/synergi_logo_1783312477576.jpg";

interface AuthPageProps {
  onBack: () => void;
  onSuccess: (role: string, mockProfile?: any) => void;
}

export default function AuthPage({ onBack, onSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"admin" | "staff" | "customer" | "staff_member">("customer");
  
  const [isForgot, setIsForgot] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    code: string;
    title: string;
    steps: string[];
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);
  }, []);

  // Quick offline bypass for admins and developers
  const handleDemoBypass = async (selectedRole: "admin" | "staff" | "customer" | "staff_member") => {
    setError(null);
    setInfo(`Bypassing auth for rapid testing as ${selectedRole}...`);
    const uid = `demo-bypass-${selectedRole}-${Date.now()}`;
    const email = selectedRole === "admin" ? "admin@synergicowork.com" : `${selectedRole}@synergicowork.com`;
    const profile = {
      uid,
      email,
      displayName: selectedRole === "admin" ? "Super Admin (Bypass)" : `${selectedRole.replace('_', ' ')} (Bypass)`,
      role: selectedRole,
      status: "active" as const,
      phone: "+91 99999 88888",
      createdAt: new Date().toISOString()
    };

    try {
      // Save profile to database to ensure session is successfully restored on page refresh!
      await setDoc(doc(db, "users", uid), profile);
    } catch (err) {
      console.warn("Failed to persist bypass user profile, falling back to client-only session:", err);
    }

    setTimeout(() => {
      onSuccess(selectedRole, profile);
    }, 800);
  };

  // Email and Password Login / Signup
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);
    setInfo(null);
    setLoading(true);

    try {
      if (isSignUp) {
        setError("Public registration is disabled. Only the Administrator can register new user profiles.");
        setLoading(false);
        return;
      } else {
        // Sign In
        // 1. Check if there's a custom admin-created credential in Firestore matching email & password
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
        const querySnapshot = await getDocs(q);
        
        let customUserFound = false;
        let customUserData: any = null;

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.password && data.password === password) {
            customUserFound = true;
            customUserData = data;
          }
        });

        // Add explicit hardcoded check for the super admin
        if (email.toLowerCase().trim() === "mis@ipanelklean.com" && password === "Ipk@#1234") {
          customUserFound = true;
          customUserData = {
            uid: "super_admin_mis_ipanelklean",
            email: "mis@ipanelklean.com",
            password: "Ipk@#1234",
            displayName: "Super Admin",
            role: "admin",
            status: "active",
            phone: "+91 99999 99999",
            createdAt: new Date().toISOString()
          };
          
          // Silently set this into the database if not present
          try {
            await setDoc(doc(db, "users", "super_admin_mis_ipanelklean"), customUserData, { merge: true });
          } catch (dbErr) {
            console.warn("Failed to update database with super admin profile:", dbErr);
          }
        }

        if (customUserFound && customUserData) {
          if (customUserData.status !== "active") {
            setError(`Your account status is currently ${customUserData.status || "inactive"}. Please contact the administrator.`);
            setLoading(false);
            return;
          }
          
          // Set custom tokens so we stay logged in even on refresh
          const customToken = `custom-token-${customUserData.uid}-${Date.now()}`;
          localStorage.setItem("synergi_custom_auth_token", customToken);
          localStorage.setItem("synergi_custom_user_id", customUserData.uid);
          
          setInfo("Logged in successfully! Redirecting...");
          setTimeout(() => onSuccess(customUserData.role, customUserData), 1000);
          return;
        }

        // 2. Fallback to standard Firebase Auth if no custom user matched
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const user = credential.user;

        // Fetch user profile to get role
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const uData = snap.data();
          if (uData.status !== "active") {
            setError(`Your account status is currently ${uData.status || "inactive"}. Please contact the administrator.`);
            await auth.signOut();
            setLoading(false);
            return;
          }
          // If developer email logs in but isn't admin, auto-promote them!
          const isDev = user.email?.toLowerCase().trim() === "mis@ipanelklean.com" || user.email?.toLowerCase().trim().endsWith("ipanelklean.com") || user.email?.toLowerCase().trim().includes("ipanelklean");
          if (isDev && uData.role !== "admin") {
            const updatedProfile = { ...uData, role: "admin" as const };
            await setDoc(doc(db, "users", user.uid), updatedProfile, { merge: true });
            onSuccess("admin", updatedProfile);
          } else {
            onSuccess(uData.role, uData);
          }
        } else {
          // If no profile exists by UID, check if a profile is pre-registered under their email coordinate
          const userEmail = user.email?.toLowerCase().trim() || "";
          const isDev = userEmail === "mis@ipanelklean.com" || userEmail.endsWith("ipanelklean.com") || userEmail.includes("ipanelklean");
          
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("email", "==", userEmail));
          const querySnapshot = await getDocs(q);
          
          let preRegisteredDoc: any = null;
          let preRegisteredId: string = "";

          querySnapshot.forEach((docSnap) => {
            preRegisteredDoc = docSnap.data();
            preRegisteredId = docSnap.id;
          });

          if (preRegisteredDoc) {
            if (preRegisteredDoc.status !== "active") {
              setError(`Your account status is currently ${preRegisteredDoc.status || "inactive"}. Please contact the administrator.`);
              await auth.signOut();
              setLoading(false);
              return;
            }

            // Relink the pre-registered profile to the actual Firebase UID
            const updatedProfile = {
              ...preRegisteredDoc,
              uid: user.uid, // set the authentic auth UID
              displayName: preRegisteredDoc.displayName || user.displayName || email.split("@")[0],
              phone: preRegisteredDoc.phone || ""
            };

            // Save under the new authentic Firebase UID
            await setDoc(doc(db, "users", user.uid), updatedProfile);

            // Delete the temporary pre-registered custom ID document if they were different
            if (preRegisteredId !== user.uid) {
              try {
                await deleteDoc(doc(db, "users", preRegisteredId));
              } catch (delErr) {
                console.warn("Failed to clean up pre-registered temporary ID document:", delErr);
              }
            }

            onSuccess(updatedProfile.role, updatedProfile);
          } else if (isDev) {
            // Auto-create for sandbox developers to prevent lockout
            const newProfile = {
              uid: user.uid,
              email: userEmail,
              displayName: user.displayName || email.split("@")[0],
              role: "admin" as const,
              status: "active" as const,
              phone: "",
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, "users", user.uid), newProfile);
            onSuccess("admin", newProfile);
          } else {
            // Not pre-registered and not a developer: Block login!
            setError("Access Denied: Your email address is not registered in the system. Only users pre-registered by the Admin or Super Admin can log in.");
            await auth.signOut();
            setLoading(false);
          }
        }
      }
    } catch (err: any) {
      console.warn("Auth error details:", err);
      const errCode = err?.code || "";
      const errMsg = err?.message || "";

      if (errCode === "auth/operation-not-allowed" || errMsg.includes("operation-not-allowed")) {
        setError("Firebase: Error (auth/operation-not-allowed).");
        setErrorDetails({
          code: "auth/operation-not-allowed",
          title: "Email/Password Authentication is Disabled",
          steps: [
            "Open your Google Firebase Console.",
            "Navigate to 'Authentication' > 'Sign-in method' tab.",
            "Click 'Add new provider' and choose 'Email/Password'.",
            "Enable 'Email/Password' and click 'Save'.",
            "Once enabled, you can register and log in instantly!"
          ],
          actionLabel: "Click Here to Bypass Instantly as Super Admin",
          onAction: () => handleDemoBypass("admin")
        });
      } else if (errCode === "auth/email-already-in-use" || errMsg.includes("email-already-in-use")) {
        setError("Firebase: Error (auth/email-already-in-use).");
        setErrorDetails({
          code: "auth/email-already-in-use",
          title: "Email Already In Use",
          steps: [
            "This email address has already been registered on this Firebase project.",
            "If you already created this account, switch back to 'Log In' mode below.",
            "If you forgot your password, click 'Forgot password?' to receive a reset link.",
            "Alternatively, use a different email or click the Instant Bypass below for testing."
          ],
          actionLabel: "Switch to Log In Mode",
          onAction: () => setIsSignUp(false)
        });
      } else if (
        errCode === "auth/invalid-credential" || 
        errCode === "auth/wrong-password" || 
        errCode === "auth/user-not-found" || 
        errMsg.includes("invalid-credential") || 
        errMsg.includes("wrong-password") || 
        errMsg.includes("user-not-found")
      ) {
        setError("Invalid email or password. Please verify your credentials and try again.");
        setErrorDetails({
          code: "auth/invalid-credential",
          title: "Invalid Credentials",
          steps: [
            "Double-check that your email is typed correctly.",
            "Make sure your password is correct.",
            "If you signed up with Google, use the 'Sign in with Google' button.",
            "If you are a developer or testing, you can use the instant bypass buttons at the bottom of the page or the action button below."
          ],
          actionLabel: "Bypass Instantly as Super Admin",
          onAction: () => handleDemoBypass("admin")
        });
      } else {
        setError(err.message || "Authentication failed. Check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to handle successful google authentication (shared by popup and redirect flows)
  const handleSuccessfulAuth = async (user: any) => {
    const userEmail = user.email?.toLowerCase().trim() || "";
    const isDev = userEmail === "mis@ipanelklean.com" || userEmail.endsWith("ipanelklean.com") || userEmail.includes("ipanelklean");

    // 1. First, check if a profile already exists for this exact Firebase Auth UID
    const snapByUid = await getDoc(doc(db, "users", user.uid));
    if (snapByUid.exists()) {
      const uData = snapByUid.data();
      if (uData.status !== "active") {
        setError(`Your account status is currently ${uData.status || "inactive"}. Please contact the administrator.`);
        await auth.signOut();
        setLoading(false);
        return;
      }

      // Auto-promote developer/owner to admin to avoid permission blocks
      if (isDev && uData.role !== "admin") {
        const updated = { ...uData, role: "admin" as const };
        await setDoc(doc(db, "users", user.uid), updated, { merge: true });
        onSuccess("admin", updated);
      } else {
        onSuccess(uData.role, uData);
      }
      return;
    }

    // 2. If no profile exists by UID, check if a profile is pre-registered under their email coordinate
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", userEmail));
    const querySnapshot = await getDocs(q);
    
    let preRegisteredDoc: any = null;
    let preRegisteredId: string = "";

    querySnapshot.forEach((docSnap) => {
      preRegisteredDoc = docSnap.data();
      preRegisteredId = docSnap.id;
    });

    if (preRegisteredDoc) {
      if (preRegisteredDoc.status !== "active") {
        setError(`Your account status is currently ${preRegisteredDoc.status || "inactive"}. Please contact the administrator.`);
        await auth.signOut();
        setLoading(false);
        return;
      }

      // Relink the pre-registered profile to the actual Google UID
      const updatedProfile = {
        ...preRegisteredDoc,
        uid: user.uid, // set the authentic auth UID
        displayName: preRegisteredDoc.displayName || user.displayName || "Google User",
        phone: preRegisteredDoc.phone || user.phoneNumber || ""
      };

      // Save under the new authentic Google UID
      await setDoc(doc(db, "users", user.uid), updatedProfile);

      // Delete the temporary pre-registered custom ID document if they were different to keep the DB clean
      if (preRegisteredId !== user.uid) {
        try {
          await deleteDoc(doc(db, "users", preRegisteredId));
        } catch (delErr) {
          console.warn("Failed to clean up pre-registered temporary ID document:", delErr);
        }
      }

      onSuccess(updatedProfile.role, updatedProfile);
    } else if (isDev) {
      // Auto-create for sandbox developers to prevent lockout
      const newProfile = {
        uid: user.uid,
        email: userEmail,
        displayName: user.displayName || "Developer Sandbox",
        role: "admin" as const,
        status: "active" as const,
        phone: user.phoneNumber || "",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "users", user.uid), newProfile);
      onSuccess("admin", newProfile);
    } else {
      // Not pre-registered and not a developer: Block login!
      setError("Your email has not been registered yet. Please contact the Admin/Super Admin to register your workspace seat first.");
      await auth.signOut();
    }
  };

  // Google Login (tries popup, falls back to redirect)
  const handleGoogleLogin = async () => {
    setError(null);
    setErrorDetails(null);
    setInfo(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleSuccessfulAuth(result.user);
    } catch (err: any) {
      console.warn("Google popup login error/warning:", err);
      const isPopupError = 
        err?.code === "auth/popup-blocked" || 
        err?.message?.includes("popup-blocked") || 
        err?.code === "auth/popup-closed-by-user" ||
        err?.message?.includes("popup") ||
        err?.message?.includes("closed");
        
      if (isPopupError) {
        setInfo("Popup was blocked or closed. Switch to a new tab for seamless Google login, or use the instructions below.");
        setErrorDetails({
          code: "auth/popup-blocked",
          title: "Google Login Popup Blocked",
          steps: [
            "Your browser or the preview window blocked the Google Sign-In popup.",
            "Running the application inside an iframe limits popups and redirects.",
            "Click the button below to launch the app in a new browser tab.",
            "Once loaded in the new tab, Google Sign-In will connect instantly!",
            "Alternatively, use the quick sandbox bypass options at the bottom of this page."
          ],
          actionLabel: "Launch App in New Tab to Sign In ↗",
          onAction: () => window.open(window.location.href, "_blank")
        });
        setLoading(false);
      } else {
        const errCode = err?.code || "";
        const errMsg = err?.message || "";
        if (errCode === "auth/unauthorized-domain" || errMsg.includes("unauthorized-domain") || errMsg.includes("unauthorized domain")) {
          setError("Google Login: Unauthorized Domain Error.");
          setErrorDetails({
            code: "auth/unauthorized-domain",
            title: "Vercel Domain Not Authorized in Firebase",
            steps: [
              "Your hosted domain (Vercel URL) has not been authorized in your Firebase Project configuration.",
              "1. Open the Firebase Console (https://console.firebase.google.com).",
              "2. Select your Firebase project and go to the 'Authentication' section.",
              "3. Click the 'Settings' tab at the top, then select 'Authorized domains' on the left menu.",
              "4. Click 'Add domain' and enter your hosted website domain (e.g., your-app-name.vercel.app).",
              "5. Save the changes and try logging in again!"
            ],
            actionLabel: "Go to Firebase Console ↗",
            onAction: () => window.open("https://console.firebase.google.com", "_blank")
          });
        } else {
          setError(err.message || "Google Login failed.");
        }
        setLoading(false);
      }
    }
  };

  // Check for redirect result on mount
  useEffect(() => {
    let active = true;
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user && active) {
          setInfo("Successfully signed in via Google redirect! Loading profile...");
          setLoading(true);
          await handleSuccessfulAuth(result.user);
        }
      } catch (err: any) {
        if (active) {
          console.error("Google redirect result error:", err);
          const errCode = err?.code || "";
          const errMsg = err?.message || "";
          if (errCode === "auth/unauthorized-domain" || errMsg.includes("unauthorized-domain") || errMsg.includes("unauthorized domain")) {
            setError("Google Redirect Sign-In: Unauthorized Domain Error.");
            setErrorDetails({
              code: "auth/unauthorized-domain",
              title: "Vercel Domain Not Authorized in Firebase",
              steps: [
                "Your hosted domain (Vercel URL) has not been authorized in your Firebase Project configuration.",
                "1. Open the Firebase Console (https://console.firebase.google.com).",
                "2. Select your Firebase project and go to the 'Authentication' section.",
                "3. Click the 'Settings' tab at the top, then select 'Authorized domains' on the left menu.",
                "4. Click 'Add domain' and enter your hosted website domain (e.g., your-app-name.vercel.app).",
                "5. Save the changes and try logging in again!"
              ],
              actionLabel: "Go to Firebase Console ↗",
              onAction: () => window.open("https://console.firebase.google.com", "_blank")
            });
          } else {
            setError(err.message || "Google Redirect Sign-In failed.");
          }
        }
      }
    };
    checkRedirect();
    return () => {
      active = false;
    };
  }, []);

  // Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Password reset link sent! Check your inbox.");
      setIsForgot(false);
    } catch (err: any) {
      console.warn("Forgot password warning:", err);
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Back to Home Button - Relative on Mobile, Absolute on larger screens to look tidy and never overlap */}
      <div className="w-full max-w-lg mx-auto mb-6 md:absolute md:top-6 md:left-6 md:m-0">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm font-bold bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" /> Back to Landing Site
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div className="flex justify-center mb-6">
          <img 
            src={synergiLogo} 
            alt="Synergi Logo" 
            className="h-16 w-auto object-contain bg-white p-2.5 rounded-2xl shadow-md border border-slate-150 transition-transform hover:scale-105" 
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {isForgot ? "Reset Password" : "Sign in to Synergi"}
        </h2>
        <p className="mt-2.5 text-sm sm:text-base text-slate-500">
          {isForgot 
            ? "We'll send you instructions to reset your password" 
            : "Access your seat, meetings, bills, and profile"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-10 px-6 shadow-xl rounded-3xl sm:px-12 border border-slate-100">
          
          {error && (
            <div className="p-3 mb-4 bg-rose-50 text-rose-800 text-xs sm:text-sm font-semibold rounded-xl flex gap-2 items-center">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {errorDetails && (
            <div className="mb-5 p-4 bg-amber-50/85 border border-amber-200/60 rounded-2xl text-xs sm:text-sm text-amber-900 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <span className="w-5 h-5 flex items-center justify-center bg-amber-500 text-white rounded-full text-xs font-bold font-mono">!</span>
                <span>{errorDetails.title}</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 leading-relaxed">
                {errorDetails.steps.map((step, idx) => (
                  <li key={idx} className="pl-1">{step}</li>
                ))}
              </ol>
              {errorDetails.actionLabel && errorDetails.onAction && (
                <button
                  type="button"
                  onClick={errorDetails.onAction}
                  className="w-full mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center block"
                >
                  {errorDetails.actionLabel}
                </button>
              )}
            </div>
          )}

          {info && (
            <div className="p-3 mb-4 bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-semibold rounded-xl">
              ✓ {info}
            </div>
          )}

          {isForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsForgot(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-blue-600"
                >
                  Back to Sign In
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setIsForgot(true)}
                      className="text-xxs font-semibold text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none flex items-center justify-center"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-md hover:scale-[1.01]"
              >
                {loading ? "Please wait..." : "Sign In"}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs font-semibold">
                <span className="bg-white px-2 text-slate-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex justify-center items-center gap-2.5 bg-white border border-slate-200 rounded-xl py-2.5 px-4 hover:bg-slate-50 text-sm font-bold text-slate-700 transition-all shadow-sm hover:scale-[1.01]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" referrerPolicy="no-referrer">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.66-1.12-1.03-2.39-1.03-3.72z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Sign in with Google
              </button>
            </div>

            {isInIframe && (
              <div className="mt-4 p-3 bg-blue-50/80 border border-blue-200/60 rounded-2xl text-xs text-slate-600">
                <p className="font-bold text-blue-800 mb-1 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600"></span>
                  Iframe Sandbox Detected
                </p>
                <p className="mb-2.5 leading-relaxed">
                  Browsers strictly block Google Authentication popups and redirects inside preview iframes. Open the app in a new tab for fully functional Google login, or use the instant sandbox bypass below.
                </p>
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, "_blank")}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xxs rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-1.5"
                >
                  Launch App in New Tab ↗
                </button>
              </div>
            )}
          </div>

          {/* Sandbox Admin / Manager Demo Access */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="text-center mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xxs font-bold bg-amber-50 text-amber-800 border border-amber-150">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Developer Sandbox Quick Access
              </span>
              <p className="text-xxs text-slate-400 mt-1">
                Skip Firebase configuration & auth blocks for local testing
              </p>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoBypass("admin")}
                className="py-2 px-1 text-center bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xxs font-bold transition-all shadow-sm hover:scale-[1.02] border border-slate-950"
              >
                🛠️ Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoBypass("staff")}
                className="py-2 px-1 text-center bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xxs font-bold transition-all border border-slate-200 shadow-sm hover:scale-[1.02]"
              >
                📋 Admin
              </button>
              <button
                type="button"
                onClick={() => handleDemoBypass("staff_member")}
                className="py-2 px-1 text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xxs font-bold transition-all border border-emerald-100 shadow-sm hover:scale-[1.02]"
              >
                💼 Staff
              </button>
              <button
                type="button"
                onClick={() => handleDemoBypass("customer")}
                className="py-2 px-1 text-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xxs font-bold transition-all border border-blue-100 shadow-sm hover:scale-[1.02]"
              >
                👥 Member
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
