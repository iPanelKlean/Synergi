import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyAo6-bndHwYPgNbhT4o9PVvG6MWqmL6gd4",
  authDomain: "synergi-46c15.firebaseapp.com",
  projectId: "synergi-46c15",
  storageBucket: "synergi-46c15.firebasestorage.app",
  messagingSenderId: "417241368827",
  appId: "1:417241368827:web:6e28dea0603c81fa56085e",
  measurementId: "G-B58DDT60D9"
};

// Initialize Firebase App (for Auth only)
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Custom Types for MongoDB Proxy
export type Firestore = { type: string };

// MongoDB Proxy Database Reference
export const db: any = { 
  type: "db_proxy",
  app: {
    options: {
      projectId: "synergi-46c15"
    }
  }
};

// Proxy Functions matching Firestore signature
export function collection(database: any, path: string) {
  return { type: "collection", path };
}

export function doc(database: any, path: string, ...segments: string[]) {
  let fullPath = path;
  if (segments && segments.length > 0) {
    fullPath += "/" + segments.join("/");
  }
  
  const parts = fullPath.split("/").filter(Boolean);
  const collectionName = parts[0] || "";
  const id = parts[1] || "";
  
  return { type: "doc", path: fullPath, collectionName, id };
}

export function query(colRef: any, ...constraints: any[]) {
  return {
    type: "query",
    path: colRef.path,
    collectionName: colRef.path,
    filters: constraints.filter(c => c && c.type === "where"),
    orderByField: constraints.find(c => c && c.type === "orderBy")?.field,
    orderDirection: constraints.find(c => c && c.type === "orderBy")?.direction,
    limitVal: constraints.find(c => c && c.type === "limit")?.value
  };
}

export function where(field: string, operator: string, value: any) {
  return { type: "where", field, operator, value };
}

export function orderBy(field: string, direction: "asc" | "desc" = "asc") {
  return { type: "orderBy", field, direction };
}

export function limit(value: number) {
  return { type: "limit", value };
}

// REST helper to fetch from the server API
async function fetchApi(url: string, options: RequestInit = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Expected JSON response, but received content-type: ${contentType}`);
    }
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (parseErr) {
      throw new Error("Failed to parse response as JSON");
    }
  } catch (err: any) {
    if (err.message && (err.message.includes("content-type") || err.message.includes("parse response") || err.message.includes("Failed to fetch"))) {
      console.warn(`[fetchApi Warn] Non-JSON or connectivity warning from ${url}:`, err.message);
    } else {
      console.error(`API Fetch Error [${url}]:`, err);
    }
    throw err;
  }
}

export async function getDoc(docRef: any) {
  if (!docRef || docRef.type !== "doc") return { exists: () => false, data: () => null };
  try {
    const result = await fetchApi(`/api/db/collections/${docRef.collectionName}/${docRef.id}`);
    return {
      id: docRef.id,
      exists: () => !!result.exists,
      data: () => result.data || null
    };
  } catch (err) {
    return {
      id: docRef.id,
      exists: () => false,
      data: () => null
    };
  }
}

export async function getDocFromServer(docRef: any) {
  return getDoc(docRef);
}

export async function setDoc(docRef: any, data: any, options?: { merge?: boolean }) {
  if (!docRef || docRef.type !== "doc") throw new Error("Invalid doc reference");
  return fetchApi(`/api/db/collections/${docRef.collectionName}/${docRef.id}`, {
    method: "POST",
    body: JSON.stringify({ data, merge: options?.merge })
  });
}

export async function updateDoc(docRef: any, data: any) {
  if (!docRef || docRef.type !== "doc") throw new Error("Invalid doc reference");
  return fetchApi(`/api/db/collections/${docRef.collectionName}/${docRef.id}`, {
    method: "PATCH",
    body: JSON.stringify({ data })
  });
}

export async function deleteDoc(docRef: any) {
  if (!docRef || docRef.type !== "doc") throw new Error("Invalid doc reference");
  return fetchApi(`/api/db/collections/${docRef.collectionName}/${docRef.id}`, {
    method: "DELETE"
  });
}

export async function addDoc(colRef: any, data: any) {
  if (!colRef || colRef.type !== "collection") throw new Error("Invalid collection reference");
  const result = await fetchApi(`/api/db/collections/${colRef.path}`, {
    method: "POST",
    body: JSON.stringify({ data })
  });
  return {
    id: result.id
  };
}

export async function getDocs(queryRef: any) {
  if (!queryRef) return { docs: [], empty: true, size: 0, forEach: () => {} };
  const colName = queryRef.type === "query" ? queryRef.collectionName : queryRef.path;
  const filters = queryRef.type === "query" ? queryRef.filters : [];
  const limitVal = queryRef.type === "query" ? queryRef.limitVal : undefined;
  const orderByField = queryRef.type === "query" ? queryRef.orderByField : undefined;
  const orderDirection = queryRef.type === "query" ? queryRef.orderDirection : undefined;

  try {
    const result = await fetchApi(`/api/db/query`, {
      method: "POST",
      body: JSON.stringify({ collection: colName, filters, limit: limitVal, orderByField, orderDirection })
    });
    const docs = (result.docs || []).map((docData: any) => {
      const id = docData.id;
      const data = { ...docData };
      delete data.id;
      return {
        id,
        exists: () => true,
        data: () => data
      };
    });
    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
      forEach: (callback: (doc: any) => void) => docs.forEach(callback)
    };
  } catch (err) {
    return {
      docs: [],
      empty: true,
      size: 0,
      forEach: () => {}
    };
  }
}

export function writeBatch(database: any) {
  const operations: any[] = [];
  return {
    set: (docRef: any, data: any, options?: { merge?: boolean }) => {
      operations.push({
        type: "set",
        collection: docRef.collectionName,
        id: docRef.id,
        data,
        merge: options?.merge
      });
    },
    update: (docRef: any, data: any) => {
      operations.push({
        type: "update",
        collection: docRef.collectionName,
        id: docRef.id,
        data
      });
    },
    delete: (docRef: any) => {
      operations.push({
        type: "delete",
        collection: docRef.collectionName,
        id: docRef.id
      });
    },
    commit: async () => {
      if (operations.length === 0) return { success: true };
      return fetchApi("/api/db/batch", {
        method: "POST",
        body: JSON.stringify({ operations })
      });
    }
  };
}

export function onSnapshot(queryOrDocRef: any, ...args: any[]) {
  const callback = typeof args[0] === "function" ? args[0] : args[1];
  
  let active = true;
  const poll = async () => {
    if (!active) return;
    try {
      if (queryOrDocRef.type === "doc") {
        const snap = await getDoc(queryOrDocRef);
        if (active) callback(snap);
      } else {
        const snap = await getDocs(queryOrDocRef);
        if (active) callback(snap);
      }
    } catch (err: any) {
      console.warn("onSnapshot poll warning (expected during dev server restart):", err.message || err);
    }
    // Poll every 3 seconds to update UI reactively
    setTimeout(poll, 3000);
  };
  
  poll();
  
  return () => {
    active = false;
  };
}

// Timeout helper
export function withTimeout<T>(promise: Promise<T>, ms: number, defaultValue: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve(defaultValue);
    }, ms);
    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      () => {
        clearTimeout(timeoutId);
        resolve(defaultValue);
      }
    );
  });
}

export async function getUserProfile(uid: string) {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await withTimeout(getDoc(userRef), 2000, null);
    if (snap && snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    console.error("Error in getUserProfile:", error);
  }
  return null;
}
