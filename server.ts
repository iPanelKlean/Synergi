import express from "express";
import path from "path";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Local File DB Fallback Engine
const LOCAL_DB_PATH = path.join(process.cwd(), "local_db.json");
let localDb: Record<string, Record<string, any>> = {};

try {
  if (fs.existsSync(LOCAL_DB_PATH)) {
    localDb = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf8"));
  }
} catch (err) {
  console.error("Failed to load local DB:", err);
}

function saveLocalDb() {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(localDb, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save local DB:", err);
  }
}

function getLocalCollection(colName: string) {
  if (!localDb[colName]) {
    localDb[colName] = {};
  }
  return localDb[colName];
}

// MongoDB URI Sanitizer to handle unencoded special characters (like @ or #) in passwords
function sanitizeMongoUri(rawUri: string): string {
  try {
    const prefix = rawUri.startsWith("mongodb+srv://") ? "mongodb+srv://" : rawUri.startsWith("mongodb://") ? "mongodb://" : "";
    if (!prefix) return rawUri;

    const rest = rawUri.substring(prefix.length);
    // Find where path/options start
    const slashIdx = rest.indexOf("/");
    const questionIdx = rest.indexOf("?");
    let pathStartIdx = -1;
    if (slashIdx !== -1 && questionIdx !== -1) {
      pathStartIdx = Math.min(slashIdx, questionIdx);
    } else if (slashIdx !== -1) {
      pathStartIdx = slashIdx;
    } else if (questionIdx !== -1) {
      pathStartIdx = questionIdx;
    }

    const authority = pathStartIdx === -1 ? rest : rest.substring(0, pathStartIdx);
    const pathAndOptions = pathStartIdx === -1 ? "" : rest.substring(pathStartIdx);

    const lastAtIdx = authority.lastIndexOf("@");
    if (lastAtIdx === -1) {
      return rawUri; // No credentials in URI
    }

    const credentials = authority.substring(0, lastAtIdx);
    const host = authority.substring(lastAtIdx + 1);

    const colonIdx = credentials.indexOf(":");
    if (colonIdx === -1) {
      const decodedUser = decodeURIComponent(credentials);
      const encodedUser = encodeURIComponent(decodedUser);
      return `${prefix}${encodedUser}@${host}${pathAndOptions}`;
    }

    const username = credentials.substring(0, colonIdx);
    const password = credentials.substring(colonIdx + 1);

    const decodedUser = decodeURIComponent(username);
    const encodedUser = encodeURIComponent(decodedUser);

    const decodedPassword = decodeURIComponent(password);
    const encodedPassword = encodeURIComponent(decodedPassword);

    return `${prefix}${encodedUser}:${encodedPassword}@${host}${pathAndOptions}`;
  } catch (err) {
    console.error("Error sanitizing MongoDB URI:", err);
    return rawUri;
  }
}

// MongoDB Connection
const rawUri = process.env.MONGODB_URI || "mongodb+srv://synergi:Ipk%40%231234@cluster0.n0dwcsx.mongodb.net/synergi?retryWrites=true&w=majority&appName=Cluster0";
const uri = sanitizeMongoUri(rawUri);
console.log("Connecting to MongoDB Atlas...");
const mongoClient = new MongoClient(uri, {
  connectTimeoutMS: 5000,
  serverSelectionTimeoutMS: 5000
});

let db: any = null;

async function connectToMongo() {
  try {
    await mongoClient.connect();
    db = mongoClient.db("synergi");
    console.log("Successfully connected to MongoDB Atlas!");
  } catch (err) {
    console.error("Failed to connect to MongoDB Atlas (using local DB fallback):", err);
  }
}

connectToMongo();

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use("/uploads", express.static(UPLOADS_DIR));

// REST API routes for mock-Firestore database proxy
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", connected: !!db });
});

async function sendMailHelper(to: string, subject: string, html: string) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || "mis@ipanelklean.com";

  if (!host || !user || !pass) {
    console.log("SMTP not configured. Email logged to console and saved to local state.");
    console.log(`To: ${to}`);
    console.log(`From: ${smtpFrom}`);
    console.log(`Subject: ${subject}`);
    return { sent: false, reason: "SMTP credentials not configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: `"Synergi Coworking Noida" <${smtpFrom}>`,
      to,
      subject,
      html
    });

    console.log(`Email successfully sent to ${to} from ${smtpFrom}`);
    return { sent: true };
  } catch (err: any) {
    console.error("Failed to send email via SMTP:", err);
    return { sent: false, error: err.message };
  }
}

// AUTOMATED BILLING CHECK LOGIC
async function runBillingDuesAlertCheck(force = false) {
  console.log(`[Billing Engine] Initiating monthly ledger dues pre-due check (force: ${force})...`);
  
  // Calculate days remaining to due date (5th of the next month)
  const today = new Date();
  let nextMonthYear = today.getFullYear();
  let nextMonth = today.getMonth() + 1; // 1-indexed for next month
  if (nextMonth > 11) {
    nextMonth = 0;
    nextMonthYear += 1;
  }
  const dueDate = new Date(nextMonthYear, nextMonth, 5);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (!force && diffDays !== 10) {
    console.log(`[Billing Engine] Today is not the 10-day pre-due alert mark (days left: ${diffDays}). Skipping auto email dispatch.`);
    return { success: true, message: `Skipped. Days left to next due: ${diffDays}`, daysRemaining: diffDays, sentCount: 0 };
  }

  // Retrieve global settings
  let settingsDoc: any = null;
  if (db) {
    try {
      settingsDoc = await db.collection("settings").findOne({ _id: "global" });
    } catch (e) {
      console.warn("Could not load settings from MongoDB:", e);
    }
  }
  if (!settingsDoc) {
    try {
      const localCol = getLocalCollection("settings");
      settingsDoc = localCol["global"];
    } catch (e) {
      console.warn("Could not load settings from local db:", e);
    }
  }

  const settings = settingsDoc || {
    companyName: "Synergi Coworking Noida",
    defaultRentAmount: 3500,
    maintenanceCharges: 0,
    bankName: "HDFC Bank Ltd",
    accountNo: "50200045612398",
    ifscCode: "HDFC0000088",
    accountHolderName: "SYNERGI COWORKING CO",
    upiId: "synergi@ybl",
    supportEmail: "mis@ipanelklean.com"
  };

  // Get active users
  let activeUsers: any[] = [];
  if (db) {
    try {
      activeUsers = await db.collection("users").find({ status: { $ne: "suspended" } }).toArray();
    } catch (e) {
      console.warn("Error reading users from MongoDB:", e);
    }
  }
  if (activeUsers.length === 0) {
    try {
      const localUsers = getLocalCollection("users");
      activeUsers = Object.keys(localUsers)
        .map(id => ({ uid: id, ...localUsers[id] }))
        .filter(u => u.status !== "suspended");
    } catch (e) {
      console.warn("Error reading users from local db:", e);
    }
  }

  // Get all seats
  let allSeats: any[] = [];
  if (db) {
    try {
      allSeats = await db.collection("seats").find().toArray();
    } catch (e) {
      console.warn("Error reading seats from MongoDB:", e);
    }
  }
  if (allSeats.length === 0) {
    try {
      const localSeats = getLocalCollection("seats");
      allSeats = Object.keys(localSeats).map(id => ({ id, ...localSeats[id] }));
    } catch (e) {
      console.warn("Error reading seats from local db:", e);
    }
  }

  // Get conference bookings
  let allConfBookings: any[] = [];
  if (db) {
    try {
      allConfBookings = await db.collection("conferenceBookings").find({ status: "approved" }).toArray();
    } catch (e) {
      console.warn("Error reading conferenceBookings from MongoDB:", e);
    }
  }
  if (allConfBookings.length === 0) {
    try {
      const localConf = getLocalCollection("conferenceBookings");
      allConfBookings = Object.keys(localConf)
        .map(id => ({ id, ...localConf[id] }))
        .filter(b => b.status === "approved");
    } catch (e) {
      console.warn("Error reading conferenceBookings from local db:", e);
    }
  }

  const billingMonthStr = dueDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const warningDateStr = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const dueDateStr = dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const sentEmails = [];

  for (const user of activeUsers) {
    const userEmail = (user.email || "").toLowerCase().trim();
    if (!userEmail) continue;

    // Calculate seats rent
    const userSeats = allSeats.filter(s => s.status === "occupied" && (s.occupiedByEmail || "").toLowerCase().trim() === userEmail);
    const allocatedSeatsCount = userSeats.length;
    const userSeatsList = userSeats.map(s => `${s.number || s.id}`).join(", ");
    const userSeatRate = user.seatRate !== undefined && user.seatRate > 0
      ? user.seatRate
      : (settings.defaultRentAmount !== undefined ? settings.defaultRentAmount : 3500);
    const totalSeatRental = allocatedSeatsCount * userSeatRate;

    // Calculate approved conference bookings
    const totalConferenceBilling = allConfBookings
      .filter(b => (b.userEmail || "").toLowerCase().trim() === userEmail)
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const maintenance = settings.maintenanceCharges || 0;
    const netAmountDue = totalSeatRental + totalConferenceBilling + maintenance;

    if (netAmountDue > 0) {
      console.log(`[Billing Engine] Dispatching auto-invoice to active user ${userEmail} (Amount: INR ${netAmountDue})...`);
      
      const subject = `[Synergi Noida] Auto-Billing Invoice Due: ${billingMonthStr}`;
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #cbd5e1; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px;">
            <h2 style="color: #1e3a8a; margin: 0; font-size: 22px;">Synergi Coworking Spaces Noida</h2>
            <p style="color: #64748b; font-size: 13px; font-weight: bold; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Monthly Ledger & Automated Invoice Notice</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Dear <strong>${user.displayName || "Synergi Member"}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            This is an integrated pre-due billing notice for your upcoming coworking workspace rentals and conference room schedules. Please review the itemized breakdown below and initiate payment by the due date to ensure uninterrupted system access.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #0f172a; margin-top: 0; margin-bottom: 15px; font-size: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">Dues & Rental Breakdown (${billingMonthStr})</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #475569;">Allocated Seats Count:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #0f172a;">${allocatedSeatsCount}</td>
              </tr>
              ${allocatedSeatsCount > 0 ? `
              <tr>
                <td style="padding: 8px 0; color: #475569;">Assigned Workspace Seats:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #1e40af; font-family: monospace;">${userSeatsList}</td>
              </tr>
              ` : ""}
              <tr>
                <td style="padding: 8px 0; color: #475569;">Seat Rental Rate (per seat):</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #0f172a;">INR ${userSeatRate}</td>
              </tr>
              <tr style="border-bottom: 1px dashed #cbd5e1;">
                <td style="padding: 8px 0; color: #475569; padding-left: 10px;">Subtotal Seat Rental:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #0f172a;">INR ${totalSeatRental}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #475569;">Conference Room Bookings:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #0f172a;">INR ${totalConferenceBilling}</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 8px 0; color: #475569;">Maintenance & Utilities:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #0f172a;">INR ${maintenance}</td>
              </tr>
              <tr style="font-size: 16px; font-weight: bold;">
                <td style="padding: 15px 0 5px 0; color: #1e3a8a;">Total Net Amount Due:</td>
                <td style="padding: 15px 0 5px 0; text-align: right; color: #16a34a; font-family: monospace;">INR ${netAmountDue}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 15px; margin-bottom: 25px; font-size: 13px; color: #854d0e;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: bold; width: 40%;">Notice Dispatched:</td>
                <td>${warningDateStr} (10 Days Prior)</td>
              </tr>
              <tr>
                <td style="font-weight: bold; color: #b45309;">Payment Due Date:</td>
                <td style="font-weight: bold; color: #b45309;">${dueDateStr}</td>
              </tr>
            </table>
          </div>

          <div style="border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin-bottom: 25px; font-size: 13px;">
            <h4 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; font-size: 14px;">Official Bank Coordinates for IMPS/NEFT Transfer</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #334155;">
              <tr>
                <td style="font-weight: bold; padding: 4px 0;">Account Holder:</td>
                <td>${settings.accountHolderName || "SYNERGI COWORKING CO"}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 4px 0;">Bank Name:</td>
                <td>${settings.bankName || "HDFC Bank Ltd"}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 4px 0;">Account Number:</td>
                <td style="font-family: monospace; font-weight: bold; color: #0f172a;">${settings.accountNo || "50200045612398"}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 4px 0;">IFSC Code:</td>
                <td style="font-family: monospace; font-weight: bold; color: #0f172a;">${settings.ifscCode || "HDFC0000088"}</td>
              </tr>
              <tr>
                <td style="font-weight: bold; padding: 4px 0;">UPI ID:</td>
                <td style="font-family: monospace; font-weight: bold; color: #0f172a;">${settings.upiId || "synergi@ybl"}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            After executing the payment, kindly log in to your Synergi Member Portal, select the <strong>Payment Receipt</strong> tab, and upload your Transaction UTR reference or screenshot to enable manager verification.
          </p>

          <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px;">
            For billing support, reach out to Noida site coordinators at <span style="font-weight: bold; color: #475569;">${settings.supportEmail || "mis@ipanelklean.com"}</span>.
          </div>
        </div>
      `;

      await sendMailHelper(userEmail, subject, htmlContent);
      sentEmails.push(userEmail);

      // Log notification in DB as well
      const notifId = "notif_" + Math.random().toString(36).substring(2, 11);
      const notifPayload = {
        userEmail,
        title: `Pre-Due Rent Billing Invoice Dispatched`,
        body: `Your workspace invoice for ${billingMonthStr} totaling INR ${netAmountDue} has been dispatched. Please pay by ${dueDateStr}.`,
        read: false,
        type: "billing",
        createdAt: new Date().toISOString()
      };

      if (db) {
        try {
          await db.collection("notifications").insertOne({ _id: notifId, ...notifPayload });
        } catch (dbErr) {
          console.error("Failed to save billing notification to DB:", dbErr);
        }
      } else {
        const localNotif = getLocalCollection("notifications");
        localNotif[notifId] = notifPayload;
        saveLocalDb();
      }
    }
  }

  return { success: true, message: `Completed dues pre-due check. Sent ${sentEmails.length} notifications.`, daysRemaining: diffDays, sentCount: sentEmails.length, sentEmails };
}

// BILLING CRON TRIGGER ENDPOINT
app.get("/api/cron/billing-alerts", async (req, res) => {
  try {
    const force = req.query.force === "true";
    const result = await runBillingDuesAlertCheck(force);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cron/billing-alerts", async (req, res) => {
  try {
    const force = req.body && req.body.force === true;
    const result = await runBillingDuesAlertCheck(force);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Run scheduled daily checks on a 24h interval
setInterval(() => {
  console.log("[Billing Scheduler] Running scheduled daily billing check...");
  runBillingDuesAlertCheck(false).catch(err => {
    console.error("[Billing Scheduler] Error running daily billing check:", err);
  });
}, 24 * 60 * 60 * 1000);

// Also run once on startup after DB initialization (with 10s safety delay)
setTimeout(() => {
  console.log("[Billing Scheduler] Running initial startup billing check...");
  runBillingDuesAlertCheck(false).catch(err => {
    console.error("[Billing Scheduler] Error running initial startup billing check:", err);
  });
}, 10000);

app.post("/api/send-email", async (req, res) => {
  try {
    const { type, booking } = req.body;
    if (!type || !booking) {
      return res.status(400).json({ error: "Missing type or booking data" });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "mis@ipanelklean.com";
    const backupAdminEmail = "it.ipanelklean@gmail.com";
    const userEmail = booking.userEmail;

    let recipient = "";
    let subject = "";
    let htmlContent = "";

    const durationText = booking.durationType === "1_hr" ? "1 Hour" :
                         booking.durationType === "2_hrs" ? "2 Hours" :
                         booking.durationType === "3_hrs" ? "3 Hours" :
                         booking.durationType === "4_hrs" ? "4 Hours (Half Day)" :
                         booking.durationType === "half_day" ? "4 Hours (Half Day)" :
                         booking.durationType === "full_day" ? "Full Day (8 Hours)" :
                         booking.durationType;

    if (type === "booking_created") {
      recipient = `${adminEmail}, ${backupAdminEmail}`;
      subject = `📋 New Conference Room Booking Slot Requested - ${booking.roomName}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0;">Synergi Coworking Noida</h2>
            <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Conference Room Booking Application</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
            <h3 style="color: #3b82f6; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">New Meeting Slot Request</h3>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569; width: 40%;">Company Name:</td>
                <td style="padding: 6px 0; color: #0f172a;">${booking.companyName || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Contact Name:</td>
                <td style="padding: 6px 0; color: #0f172a;">${booking.userName || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Mobile Number:</td>
                <td style="padding: 6px 0; color: #0f172a;">${booking.userPhone || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Email ID:</td>
                <td style="padding: 6px 0; color: #0f172a;">${booking.userEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Selected Room:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${booking.roomName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Booking Date:</td>
                <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">${booking.date}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Timings:</td>
                <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">${booking.startTime || ""} to ${booking.endTime || ""} (${booking.slot})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Duration Blocks:</td>
                <td style="padding: 6px 0; color: #0f172a;">${durationText}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Meeting Type:</td>
                <td style="padding: 6px 0; color: #0f172a;"><span style="background-color: #eff6ff; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${booking.meetingType || "N/A"}</span></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Attendees Count:</td>
                <td style="padding: 6px 0; color: #0f172a;">${booking.attendees || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Purpose:</td>
                <td style="padding: 6px 0; color: #0f172a;">${booking.purpose || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Remarks:</td>
                <td style="padding: 6px 0; color: #0f172a;">${booking.remarks || "None"}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0 6px 0; font-weight: bold; color: #475569; border-top: 1px dashed #e2e8f0;">Total Price:</td>
                <td style="padding: 12px 0 6px 0; color: #0f172a; font-weight: bold; border-top: 1px dashed #e2e8f0;">INR ${booking.totalPrice}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px; font-size: 13px; color: #78350f; text-align: center; margin-bottom: 20px;">
            <strong>Action Required:</strong> Please log in to the Synergi Admin Panel to Approve or Reject this conference booking.
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Sent by Synergi Coworking Space Ledger Sync Engine.
          </div>
        </div>
      `;
    } else if (type === "booking_approved" || type === "booking_rejected") {
      recipient = userEmail;
      const isApprove = type === "booking_approved";
      subject = isApprove 
        ? `✅ Conference Room Booking Confirmed - ${booking.roomName}` 
        : `❌ Conference Room Booking Rejected - ${booking.roomName}`;
      
      const statusColor = isApprove ? "#10b981" : "#ef4444";
      const statusBg = isApprove ? "#f0fdf4" : "#fef2f2";
      const statusText = isApprove ? "APPROVED & CONFIRMED" : "REJECTED";

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f8fafc;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0;">Synergi Coworking Noida</h2>
            <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Conference Room Booking Application</p>
          </div>
          
          <div style="background-color: ${statusBg}; border: 1px solid ${statusColor}; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 20px;">
            <h3 style="color: ${statusColor}; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Booking Status: ${statusText}</h3>
            ${isApprove 
              ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #166534;">Your booking request has been approved by the Admin. The room is locked for your meeting.</p>`
              : `<p style="margin: 8px 0 0 0; font-size: 14px; color: #991b1b;">We regret to inform you that your booking request could not be approved due to slot unavailability or compliance checks. Please try booking a different slot or room.</p>`
            }
          </div>

          <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
            <h4 style="color: #334155; margin-top: 0; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; font-size: 15px;">Booking Parameters Summary</h4>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569; width: 40%;">Company Name:</td>
                <td style="padding: 6px 0; color: #0f172a;">${booking.companyName || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Contact Person:</td>
                <td style="padding: 6px 0; color: #0f172a;">${booking.userName || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Selected Room:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${booking.roomName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Booking Date:</td>
                <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">${booking.date}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Meeting Timings:</td>
                <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">${booking.startTime || ""} to ${booking.endTime || ""} (${booking.slot})</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Duration Blocks:</td>
                <td style="padding: 6px 0; color: #0f172a;">${durationText}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Meeting Type:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${booking.meetingType || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Total Cost:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">INR ${booking.totalPrice}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px; font-size: 12px; color: #475569; text-align: center; margin-bottom: 20px;">
            If you have any questions or require changes, please contact the main pantry support team or reach out to Noida Site administration.
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            This is an automated confirmation email sent by Synergi Noida ledger.
          </div>
        </div>
      `;
    } else if (type === "seat_allotment_changed") {
      recipient = userEmail;
      const status = booking.status || "approved";
      
      if (status === "approved") {
        subject = `✅ Seat Assignment Confirmed - Synergi Coworking Noida`;
      } else if (status === "rejected") {
        subject = `❌ Seat Booking Request Status Update - Synergi Coworking Noida`;
      } else {
        subject = `⏳ Seat Booking Status Update - Synergi Coworking Noida`;
      }

      const statusColor = status === "approved" ? "#10b981" : status === "rejected" ? "#ef4444" : "#f59e0b";
      const statusBg = status === "approved" ? "#f0fdf4" : status === "rejected" ? "#fef2f2" : "#fffbeb";
      const statusText = status.toUpperCase();

      let assignedSeatsHtml = "";
      if (status === "approved") {
        if (booking.seatAssignments && booking.seatAssignments.length > 0) {
          assignedSeatsHtml = `
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #475569; vertical-align: top;">Assigned Team Seats:</td>
              <td style="padding: 6px 0; color: #0f172a;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  ${booking.seatAssignments.map((sa: any) => `
                    <tr style="border-bottom: 1px dashed #f1f5f9;">
                      <td style="padding: 4px 0; color: #1e40af; font-weight: bold; font-family: monospace;">Seat ${sa.seatNumber}</td>
                      <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #334155;">${sa.employeeName || "Employee"}</td>
                    </tr>
                  `).join("")}
                </table>
              </td>
            </tr>
          `;
        } else if (booking.seatNumber) {
          assignedSeatsHtml = `
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #475569;">Assigned Seat Number:</td>
              <td style="padding: 6px 0; color: #1e40af; font-weight: bold; font-family: monospace;">Seat ${booking.seatNumber}</td>
            </tr>
          `;
        } else {
          assignedSeatsHtml = `
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #475569;">Assigned Seat:</td>
              <td style="padding: 6px 0; color: #ef4444; font-style: italic;">Pending assignment allocation by admin</td>
            </tr>
          `;
        }
      }

      const ratePrice = booking.seatPrice || booking.rentAmount || 3500;

      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
          <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 25px;">
            <h2 style="color: #1e3a8a; margin: 0; font-size: 22px;">Synergi Coworking Spaces Noida</h2>
            <p style="color: #64748b; font-size: 13px; font-weight: bold; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Seat Booking & Allotment Update</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Dear <strong>${booking.userName || "Synergi Member"}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            This email is to notify you that the status of your workspace booking request at Noida Zone-C coworking workspaces has been updated by the administration.
          </p>

          <div style="background-color: ${statusBg}; border: 1px solid ${statusColor}; border-radius: 12px; padding: 15px; text-align: center; margin: 25px 0;">
            <h3 style="color: ${statusColor}; margin: 0; text-transform: uppercase; font-size: 16px; letter-spacing: 1px; font-weight: bold;">
              Request Status: ${statusText}
            </h3>
            ${status === "approved"
              ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #166534; font-weight: 500;">Congratulations! Your seat booking has been successfully approved and allocated. Your Leave & License Agreement has been generated under your profile.</p>`
              : status === "rejected"
              ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #991b1b; font-weight: 500;">Your request could not be approved at this time. For details, please reach out to Noida Site administration.</p>`
              : `<p style="margin: 8px 0 0 0; font-size: 13px; color: #92400e; font-weight: 500;">Your request is currently marked as pending review by site managers.</p>`
            }
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <h4 style="color: #0f172a; margin-top: 0; margin-bottom: 15px; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Workspace Booking Parameters</h4>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; line-height: 1.8;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569; width: 40%;">Customer Name:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${booking.userName || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Company Name:</td>
                <td style="padding: 6px 0; color: #0f172a;">${booking.companyName || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Registered Email:</td>
                <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">${booking.userEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Seats Requested:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${booking.numSeats || 1} Seat(s)</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569;">Preferred Date:</td>
                <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">${booking.date || "N/A"}</td>
              </tr>
              
              ${assignedSeatsHtml}
              
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #475569; border-top: 1px dashed #cbd5e1; margin-top: 10px;">Monthly Rate Structure:</td>
                <td style="padding: 6px 0; color: #16a34a; font-weight: bold; border-top: 1px dashed #cbd5e1; font-family: monospace;">INR ${ratePrice} / Seat</td>
              </tr>
            </table>
          </div>

          ${status === "approved" ? `
            <div style="border: 1px solid #fef3c7; background-color: #fffbeb; border-radius: 12px; padding: 15px; margin-bottom: 25px; font-size: 13px; color: #854d0e; line-height: 1.5;">
              <strong>Important Next Steps:</strong><br/>
              1. Log in to your <strong>Synergi Noida Portal</strong>.<br/>
              2. Go to the <strong>Agreements / Profile</strong> tab.<br/>
              3. Review and execute your <strong>Leave & License Agreement</strong>.<br/>
              4. Complete the monthly rent payment to activate workspace keycard access.
            </div>
          ` : ""}

          <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px;">
            For urgent allocation requests or changes, contact Noida site managers at <span style="font-weight: bold; color: #475569;">${process.env.SMTP_FROM || "mis@ipanelklean.com"}</span>.
          </div>
        </div>
      `;
    } else if (type === "visitor_pass") {
      recipient = userEmail;
      subject = `🎫 Your Visitor Pass & Entry OTP - ${booking.passId}`;
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const host = req.headers.host || "synergi.com";
      const webOrigin = `${protocol}://${host}`;
      const verificationUrl = `${webOrigin}/?passId=${booking.passId}`;
      const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #cbd5e1; border-radius: 20px; background-color: #ffffff; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px;">
            <h2 style="color: #1e3a8a; margin: 0; font-size: 20px;">Synergi Visitor Management</h2>
            <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Digital Visitor Entry Pass</p>
          </div>

          <p style="font-size: 14px; line-height: 1.5; color: #334155;">
            Hello <strong>${booking.userName}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.5; color: #334155;">
            Your visit request has been registered. Below is your official Visitor Pass and verification details. Please present this at the reception desk to complete your check-in.
          </p>

          <div style="background-color: #f8fafc; border: 1px dashed #3b82f6; border-radius: 12px; padding: 15px; margin: 20px 0; text-align: center;">
            <div style="font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Unique Pass ID</div>
            <div style="font-size: 18px; color: #1e3a8a; font-weight: bold; margin: 4px 0 12px 0; font-family: monospace;">${booking.passId}</div>

            <div style="margin: 15px 0;">
              <img src="${qrCodeImgSrc}" alt="Visitor Pass QR" style="width: 150px; height: 150px; border: 1px solid #e2e8f0; padding: 5px; border-radius: 8px; background: white;" />
            </div>

            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; border-radius: 8px; display: inline-block; margin: 10px 0;">
              <span style="font-size: 11px; color: #1e40af; font-weight: bold; text-transform: uppercase; display: block;">Verification OTP</span>
              <strong style="font-size: 24px; color: #2563eb; letter-spacing: 4px; font-family: monospace;">${booking.otp}</strong>
            </div>

            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; color: #475569; margin-top: 15px;">
              <tr>
                <td style="padding: 4px 0; font-weight: bold;">Visiting Company:</td>
                <td style="padding: 4px 0; color: #0f172a; font-weight: bold;">${booking.companyName}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold;">Visitor Phone:</td>
                <td style="padding: 4px 0; color: #0f172a; font-family: monospace;">${booking.userPhone}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold;">Scheduled Date:</td>
                <td style="padding: 4px 0; color: #0f172a;">${booking.date}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold;">Status:</td>
                <td style="padding: 4px 0; color: #d97706; font-weight: bold; text-transform: uppercase;">${booking.status}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 20px;">
            If you need assistance, please contact the Synergi Noida site desk at mis@ipanelklean.com.
          </div>
        </div>
      `;
    }

    const mailResult = await sendMailHelper(recipient, subject, htmlContent);

    const emailLogId = "mail_" + Math.random().toString(36).substring(2, 11);
    const emailLogData = {
      id: emailLogId,
      recipient,
      subject,
      htmlContent,
      type,
      sentAt: new Date().toISOString(),
      smtpStatus: mailResult.sent ? "delivered" : "logged_to_console",
      smtpError: mailResult.error || mailResult.reason || null
    };

    if (db) {
      await db.collection("sent_emails").insertOne({ _id: emailLogId, ...emailLogData });
    } else {
      const localCol = getLocalCollection("sent_emails");
      localCol[emailLogId] = emailLogData;
      saveLocalDb();
    }

    res.json({
      success: true,
      smtpStatus: mailResult.sent ? "delivered" : "logged_to_console",
      savedLogId: emailLogId,
      details: mailResult
    });

  } catch (err: any) {
    console.error("API error inside send-email handler:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST API route to handle Registration Form file uploads
app.post("/api/agreements/upload-file", async (req, res) => {
  try {
    const { fileName, fileType, fileBase64 } = req.body;
    if (!fileName || !fileBase64) {
      return res.status(400).json({ error: "Missing file data" });
    }

    // Clean base64 header
    const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    
    // Generate unique name
    const ext = path.extname(fileName) || (fileType === "application/pdf" ? ".pdf" : ".png");
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFileName);
    
    // Always write to local storage as fallback/redundancy
    fs.writeFileSync(filePath, buffer);
    let fileUrl = `/uploads/${uniqueFileName}`;
    let driveLink = `https://drive.google.com/file/d/1Synergi_${Math.random().toString(36).substring(2, 10)}_coworking/view?usp=sharing`;
    let isUploadedToDrive = false;

    // Check if Google Drive storage is connected
    let driveToken: string | null = null;
    let connectedEmail = "";

    if (db) {
      try {
        const driveDoc = await db.collection("settings").findOne({ _id: "google_drive" });
        if (driveDoc && driveDoc.accessToken) {
          driveToken = driveDoc.accessToken;
          connectedEmail = driveDoc.connectedEmail || "";
        }
      } catch (dbErr) {
        console.warn("Could not fetch google_drive setting from database:", dbErr);
      }
    }

    if (!driveToken) {
      try {
        const localCol = getLocalCollection("settings");
        if (localCol && localCol["google_drive"] && localCol["google_drive"].accessToken) {
          driveToken = localCol["google_drive"].accessToken;
          connectedEmail = localCol["google_drive"].connectedEmail || "";
        }
      } catch (localErr) {
        console.warn("Could not fetch google_drive setting from local database:", localErr);
      }
    }

    if (driveToken) {
      try {
        console.log(`Attempting to upload file "${fileName}" to Google Drive connected to ${connectedEmail}...`);
        
        // Prepare multipart/related body
        const boundary = "synergi_drive_upload_boundary";
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelim = `\r\n--${boundary}--`;
        
        const metadata = {
          name: fileName,
          mimeType: fileType || "application/octet-stream"
        };
        
        const multipartBody = Buffer.concat([
          Buffer.from(delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata)),
          Buffer.from(delimiter + `Content-Type: ${metadata.mimeType}\r\n\r\n`),
          buffer,
          Buffer.from(closeDelim)
        ]);

        const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${driveToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
            "Content-Length": String(multipartBody.length)
          },
          body: multipartBody
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          throw new Error(`Google Drive API upload failed: ${uploadRes.statusText} (${uploadRes.status}) - ${errText}`);
        }

        const uploadData = (await uploadRes.json()) as any;
        const fileId = uploadData.id;

        if (fileId) {
          console.log(`File uploaded to Google Drive successfully. File ID: ${fileId}`);
          
          // Make file readable by anyone with the link
          try {
            const permRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${driveToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                role: "reader",
                type: "anyone"
              })
            });
            if (!permRes.ok) {
              console.warn("Failed to set public view permission on Google Drive file:", await permRes.text());
            } else {
              console.log("File permissions updated to 'anyone as reader' successfully.");
            }
          } catch (permErr) {
            console.warn("Error setting file permissions on Google Drive:", permErr);
          }

          driveLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
          // Map fileUrl to driveLink so that previews and links automatically load from Drive
          fileUrl = driveLink;
          isUploadedToDrive = true;
        }
      } catch (driveErr: any) {
        console.error("Failed to upload file to Google Drive (falling back to local):", driveErr);
      }
    }

    res.json({ success: true, fileUrl, driveLink, fileName: uniqueFileName, isUploadedToDrive });
  } catch (err: any) {
    console.error("File upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET document: getDoc
app.get("/api/db/collections/:collection/:id", async (req, res) => {
  try {
    const col = req.params.collection;
    const id = req.params.id;

    if (db) {
      try {
        const doc = await db.collection(col).findOne({ _id: id });
        if (doc) {
          const data = { ...doc };
          delete data._id;
          return res.json({ exists: true, data });
        }
      } catch (mongoErr) {
        console.warn(`MongoDB GET error (falling back to local):`, mongoErr);
      }
    }

    // Local Fallback
    const localCol = getLocalCollection(col);
    if (localCol[id]) {
      res.json({ exists: true, data: localCol[id] });
    } else {
      res.json({ exists: false });
    }
  } catch (err: any) {
    console.error("GET document error:", err);
    res.status(500).json({ error: err.message });
  }
});

// SET document: setDoc (upsert)
app.post("/api/db/collections/:collection/:id", async (req, res) => {
  try {
    const col = req.params.collection;
    const id = req.params.id;
    const { data, merge } = req.body;

    if (db) {
      try {
        if (merge) {
          await db.collection(col).updateOne(
            { _id: id },
            { $set: data },
            { upsert: true }
          );
        } else {
          await db.collection(col).replaceOne(
            { _id: id },
            data,
            { upsert: true }
          );
        }
      } catch (mongoErr) {
        console.warn(`MongoDB SET error (falling back to local):`, mongoErr);
      }
    }

    // Local Fallback
    const localCol = getLocalCollection(col);
    if (merge) {
      localCol[id] = { ...(localCol[id] || {}), ...data };
    } else {
      localCol[id] = data;
    }
    saveLocalDb();
    res.json({ success: true });
  } catch (err: any) {
    console.error("SET document error:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE document: updateDoc (partial update)
app.patch("/api/db/collections/:collection/:id", async (req, res) => {
  try {
    const col = req.params.collection;
    const id = req.params.id;
    const { data } = req.body;

    if (db) {
      try {
        await db.collection(col).updateOne(
          { _id: id },
          { $set: data }
        );
      } catch (mongoErr) {
        console.warn(`MongoDB UPDATE error (falling back to local):`, mongoErr);
      }
    }

    // Local Fallback
    const localCol = getLocalCollection(col);
    localCol[id] = { ...(localCol[id] || {}), ...data };
    saveLocalDb();
    res.json({ success: true });
  } catch (err: any) {
    console.error("UPDATE document error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE document: deleteDoc
app.delete("/api/db/collections/:collection/:id", async (req, res) => {
  try {
    const col = req.params.collection;
    const id = req.params.id;

    if (db) {
      try {
        await db.collection(col).deleteOne({ _id: id });
      } catch (mongoErr) {
        console.warn(`MongoDB DELETE error (falling back to local):`, mongoErr);
      }
    }

    // Local Fallback
    const localCol = getLocalCollection(col);
    delete localCol[id];
    saveLocalDb();
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE document error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ADD document: addDoc (auto-generate ID)
app.post("/api/db/collections/:collection", async (req, res) => {
  try {
    const col = req.params.collection;
    const { data } = req.body;
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    if (db) {
      try {
        await db.collection(col).insertOne({ _id: id, ...data });
      } catch (mongoErr) {
        console.warn(`MongoDB ADD error (falling back to local):`, mongoErr);
      }
    }

    // Local Fallback
    const localCol = getLocalCollection(col);
    localCol[id] = data;
    saveLocalDb();
    res.json({ success: true, id });
  } catch (err: any) {
    console.error("ADD document error:", err);
    res.status(500).json({ error: err.message });
  }
});

// QUERY documents: getDocs
app.post("/api/db/query", async (req, res) => {
  try {
    const { collection: col, filters, limit: limitVal, orderByField, orderDirection } = req.body;

    if (db) {
      try {
        const queryObj: any = {};

        if (filters && Array.isArray(filters)) {
          for (const filter of filters) {
            const { field, operator, value } = filter;
            if (operator === "==") {
              queryObj[field] = value;
            } else if (operator === ">") {
              queryObj[field] = { $gt: value };
            } else if (operator === "<") {
              queryObj[field] = { $lt: value };
            } else if (operator === ">=") {
              queryObj[field] = { $gte: value };
            } else if (operator === "<=") {
              queryObj[field] = { $lte: value };
            } else if (operator === "array-contains") {
              queryObj[field] = value;
            }
          }
        }

        let queryCursor = db.collection(col).find(queryObj);

        if (orderByField) {
          const sortDir = orderDirection === "desc" ? -1 : 1;
          queryCursor = queryCursor.sort({ [orderByField]: sortDir });
        }

        if (limitVal) {
          queryCursor = queryCursor.limit(limitVal);
        }

        const docs = await queryCursor.toArray();
        const results = docs.map((doc: any) => {
          const data = { ...doc };
          const id = data._id;
          delete data._id;
          return { id, ...data };
        });

        return res.json({ docs: results });
      } catch (mongoErr) {
        console.warn(`MongoDB QUERY error (falling back to local):`, mongoErr);
      }
    }

    // Local Fallback Query Engine
    const localCol = getLocalCollection(col);
    let results = Object.keys(localCol).map(id => ({
      id,
      ...localCol[id]
    }));

    // Apply filters
    if (filters && Array.isArray(filters)) {
      for (const filter of filters) {
        const { field, operator, value } = filter;
        results = results.filter(doc => {
          const docValue = doc[field];
          if (operator === "==") {
            return docValue === value;
          } else if (operator === ">") {
            return docValue > value;
          } else if (operator === "<") {
            return docValue < value;
          } else if (operator === ">=") {
            return docValue >= value;
          } else if (operator === "<=") {
            return docValue <= value;
          } else if (operator === "array-contains") {
            return Array.isArray(docValue) && docValue.includes(value);
          }
          return true;
        });
      }
    }

    // Apply sorting
    if (orderByField) {
      results.sort((a, b) => {
        const valA = a[orderByField];
        const valB = b[orderByField];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (valA < valB) return orderDirection === "desc" ? 1 : -1;
        if (valA > valB) return orderDirection === "desc" ? -1 : 1;
        return 0;
      });
    }

    // Apply limit
    if (limitVal) {
      results = results.slice(0, limitVal);
    }

    res.json({ docs: results });
  } catch (err: any) {
    console.error("QUERY documents error:", err);
    res.status(500).json({ error: err.message });
  }
});

// BATCH writes: writeBatch
app.post("/api/db/batch", async (req, res) => {
  try {
    const { operations } = req.body;

    if (db) {
      try {
        for (const op of operations) {
          if (op.type === "set") {
            if (op.merge) {
              await db.collection(op.collection).updateOne(
                { _id: op.id },
                { $set: op.data },
                { upsert: true }
              );
            } else {
              await db.collection(op.collection).replaceOne(
                { _id: op.id },
                op.data,
                { upsert: true }
              );
            }
          } else if (op.type === "update") {
            await db.collection(op.collection).updateOne(
              { _id: op.id },
              { $set: op.data }
            );
          } else if (op.type === "delete") {
            await db.collection(op.collection).deleteOne({ _id: op.id });
          }
        }
      } catch (mongoErr) {
        console.warn(`MongoDB BATCH error (falling back to local):`, mongoErr);
      }
    }

    // Local Fallback
    for (const op of operations) {
      if (op.type === "set") {
        const localCol = getLocalCollection(op.collection);
        if (op.merge) {
          localCol[op.id] = { ...(localCol[op.id] || {}), ...op.data };
        } else {
          localCol[op.id] = op.data;
        }
      } else if (op.type === "update") {
        const localCol = getLocalCollection(op.collection);
        localCol[op.id] = { ...(localCol[op.id] || {}), ...op.data };
      } else if (op.type === "delete") {
        const localCol = getLocalCollection(op.collection);
        delete localCol[op.id];
      }
    }
    saveLocalDb();
    res.json({ success: true });
  } catch (err: any) {
    console.error("BATCH writes error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start server and handle Vite / Production build
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

start();

export default app;
