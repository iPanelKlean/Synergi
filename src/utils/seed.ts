import { Firestore, doc, getDoc, setDoc, writeBatch } from "../firebase";
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

      // 2. Seed Seats (A1 to A10, B1 to B10)
      const seatBatch = writeBatch(db);
      const seatsList: Seat[] = [
        ...Array.from({ length: 10 }, (_, i) => ({ id: `A${i+1}`, number: `A${i+1}`, occupied: false, status: "available" as const })),
        ...Array.from({ length: 10 }, (_, i) => ({ id: `B${i+1}`, number: `B${i+1}`, occupied: false, status: "available" as const }))
      ];

      // Mark a couple as pre-occupied for visual richness
      seatsList[2].occupied = true;
      seatsList[2].occupiedByEmail = "user1@example.com";
      seatsList[2].assignedToName = "Rohan Sharma";
      seatsList[2].status = "occupied";

      seatsList[7].occupied = true;
      seatsList[7].occupiedByEmail = "user2@example.com";
      seatsList[7].assignedToName = "Priya Patel";
      seatsList[7].status = "occupied";

      seatsList[12].status = "maintenance"; // B3 under maintenance

      for (const seat of seatsList) {
        const ref = doc(db, "seats", seat.id);
        seatBatch.set(ref, seat);
      }
      await withTimeout(seatBatch.commit(), 2500, null);

      // 3. Seed Conference Rooms
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

      console.log("Seeding completed successfully!");
    }
  } catch (error) {
    console.error("Error during initial data seeding:", error);
  }
}
