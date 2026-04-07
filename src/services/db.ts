const DB_NAME = "PerplexityCloneDB";
const DB_VERSION = 7; // Incremented version for schema update

export const STORES = {
  THREADS: "threads",
  SPACES: "spaces",
  NOTES: "notes",
  SETTINGS: "settings",
  MEMORIES: "memories",
  CACHE: "cache",
  BUFFER: "memory_buffer", // New Short-Term RAM
  PROJECTS: "projects", // New Project State
  CALENDAR: "calendar", // New Calendar Store
  PORTFOLIO: "portfolio", // Portfolio Assets & Positions
  PRIVATELIFE: "privatelife", // Private Life Tracker Data
};

export class DB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("IndexedDB error:", request.error);
        reject(request.error);
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log(
          "IndexedDB opened successfully. Stores:",
          Array.from(this.db.objectStoreNames),
        );
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log("IndexedDB upgrade needed, version:", DB_VERSION);
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        Object.values(STORES).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            console.log("Creating object store:", storeName);
            db.createObjectStore(storeName);
          }
        });
      };
    });
    return this.initPromise;
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async set(storeName: string, key: string, value: any): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new DB();
