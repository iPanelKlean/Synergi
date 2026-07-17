import { Firestore, doc, getDoc, setDoc, writeBatch, collection, getDocs } from "../firebase";
import { Seat } from "../types";
import { withTimeout } from "../firebase";

export async function ensureSeedData(db: Firestore) {
  try {
    // Ensure Super Admin user exists
    const superAdminRef = doc(db, "users", "super_admin_mis_ipanelklean");
    const superAdminSnap = await withTimeout(getDoc(superAdminRef), 2000, null);
    if (superAdminSnap && !superAdminSnap.exists()) {
      console.log("Seeding super admin user...");
      await withTimeout(
        setDoc(superAdminRef, {
          uid: "super_admin_mis_ipanelklean",
          email: "mis@ipanelklean.com",
          password: "Ipk@#1234",
          displayName: "Super Admin",
          role: "admin",
          status: "active",
          phone: "+91 99999 99999",
          createdAt: new Date().toISOString()
        }),
        2000,
        null
      );
    }

    // Check if settings already seeded
    const settingsRef = doc(db, "settings", "global");
    const settingsSnap = await withTimeout(getDoc(settingsRef), 2000, null);

    if (!settingsSnap) {
      console.warn("Seeding aborted: Connection to Firestore timed out. Your database may not be initialized yet.");
      return;
    }

    if (!settingsSnap.exists()) {
      console.log("Seeding initial data...");

      // 1. Seed Global Settings
      await withTimeout(
        setDoc(settingsRef, {
          id: "global",
          companyName: "Synergi Coworking Space",
          address: "D-35, D Block, Sector 7, Noida, Uttar Pradesh 201301",
          phone: "+91 98765 43210",
          email: "contact@synergicowork.com",
          whatsapp: "+919876543210",
          qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=synergi@ybl%26pn=Synergi%20Coworking%26am=15000%26cu=INR", // elegant dynamic UPI QR Code
          bankName: "HDFC Bank Ltd",
          bankAddress: "Sector 18, Noida, Uttar Pradesh 201301",
          accountNo: "50200045612398",
          ifscCode: "HDFC0000088",
          seatPrice: 6999
        }),
        2000,
        null
      );
    }

    // Ensure we always have exactly 22 seats (16 available, 5 occupied, 1 maintenance)
    const seatsCol = collection(db, "seats");
    const seatsSnap = await withTimeout(getDocs(seatsCol), 2500, null);
    if (!seatsSnap || seatsSnap.size < 22) {
      console.log("Seeding / repairing seats list to exactly 22 workstations...");
      const seatBatch = writeBatch(db);
      
      const seatsList: Seat[] = [
        ...Array.from({ length: 11 }, (_, i) => ({ id: `A${i+1}`, number: `A${i+1}`, occupied: false, status: "available" as const })),
        ...Array.from({ length: 11 }, (_, i) => ({ id: `B${i+1}`, number: `B${i+1}`, occupied: false, status: "available" as const }))
      ];

      // Mark exactly 5 occupied seats
      // 1. A3
      seatsList[2].occupied = true;
      seatsList[2].occupiedByEmail = "rohan.sharma@example.com";
      seatsList[2].assignedToName = "Rohan Sharma";
      seatsList[2].status = "occupied";

      // 2. A8
      seatsList[7].occupied = true;
      seatsList[7].occupiedByEmail = "priya.patel@example.com";
      seatsList[7].assignedToName = "Priya Patel";
      seatsList[7].status = "occupied";

      // 3. B2
      seatsList[12].occupied = true;
      seatsList[12].occupiedByEmail = "amit.verma@example.com";
      seatsList[12].assignedToName = "Amit Verma";
      seatsList[12].status = "occupied";

      // 4. B5
      seatsList[15].occupied = true;
      seatsList[15].occupiedByEmail = "sneha.rao@example.com";
      seatsList[15].assignedToName = "Sneha Rao";
      seatsList[15].status = "occupied";

      // 5. B8
      seatsList[18].occupied = true;
      seatsList[18].occupiedByEmail = "vikram.malhotra@example.com";
      seatsList[18].assignedToName = "Vikram Malhotra";
      seatsList[18].status = "occupied";

      // Mark 1 under maintenance: B3
      seatsList[13].status = "maintenance"; // B3

      for (const seat of seatsList) {
        const ref = doc(db, "seats", seat.id);
        seatBatch.set(ref, seat);
      }
      await withTimeout(seatBatch.commit(), 2500, null);
      console.log("Successfully seeded/repaired 22 seats!");
    }

    // Seed Conference Rooms if none exist
    const roomCol = collection(db, "conferenceRooms");
    const roomSnap = await withTimeout(getDocs(roomCol), 2500, null);
    if (!roomSnap || roomSnap.empty) {
      console.log("Seeding conference rooms...");
      const roomBatch = writeBatch(db);
      const rooms = [
        { id: "room1", name: "Executive Boardroom", capacity: 12, pricePerHour: 800, status: "available" as const },
        { id: "room2", name: "Collaborative Meeting Pod", capacity: 6, pricePerHour: 400, status: "available" as const },
        { id: "room3", name: "Skype/Video Booth", capacity: 2, pricePerHour: 200, status: "available" as const }
      ];

      for (const r of rooms) {
        const ref = doc(db, "conferenceRooms", r.id);
        roomBatch.set(ref, r);
      }
      await withTimeout(roomBatch.commit(), 2500, null);
    }

    console.log("Database seeding verification complete!");
  } catch (error) {
    console.error("Error during initial data seeding:", error);
  }
}
