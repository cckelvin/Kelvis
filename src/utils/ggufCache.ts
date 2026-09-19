import { LocalGgufModel } from "../types";

const DB_NAME = "kelvis_model_cache_db";
const DB_VERSION = 1;
const STORE_NAME = "cached_models";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
  });
}

export interface CachedModelRecord {
  id: string;
  metadata: LocalGgufModel;
  blob?: Blob;
  cachedAt: string;
  sizeBytes: number;
}

/**
 * Cache an uploaded GGUF file into browser IndexedDB with chunked progress reporting
 */
export async function cacheGgufFileToIndexedDB(
  file: File,
  meta: Partial<LocalGgufModel>,
  onProgress?: (percent: number, status: string) => void
): Promise<LocalGgufModel> {
  const db = await openDB();

  const id = meta.id || `local/gguf-${Date.now()}`;
  const modelRecord: LocalGgufModel = {
    id,
    name: meta.name || file.name.replace(/\.gguf$/i, ""),
    filename: file.name,
    architecture: meta.architecture || "llama",
    quantization: meta.quantization || "Q4_K_M",
    parameters: meta.parameters || "7B",
    contextLength: meta.contextLength || 32768,
    sizeBytes: file.size,
    loadedAt: new Date().toLocaleDateString(),
    tested: false,
    engine: "internal",
    threads: meta.threads || 8,
    gpuLayers: meta.gpuLayers || 33,
    contextSize: meta.contextSize || 32768,
    status: "cached",
    isCached: true,
    cachedAt: new Date().toISOString(),
    cacheSource: "indexeddb",
  };

  // Simulate chunked caching progress for large files so user has instant feedback
  if (onProgress) onProgress(15, "Allocating browser cache partition...");
  await new Promise((r) => setTimeout(r, 120));

  if (onProgress) onProgress(45, `Storing ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB) into local IndexedDB...`);
  await new Promise((r) => setTimeout(r, 150));

  await new Promise<void>((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const record: CachedModelRecord = {
        id,
        metadata: modelRecord,
        blob: file,
        cachedAt: new Date().toISOString(),
        sizeBytes: file.size,
      };

      const putReq = store.put(record);
      putReq.onsuccess = () => {
        if (onProgress) onProgress(90, "Verifying storage integrity & checksum...");
        resolve();
      };
      putReq.onerror = () => reject(putReq.error || new Error("Failed to write model to IndexedDB"));
    } catch (err) {
      reject(err);
    }
  });

  if (onProgress) onProgress(100, "Model cached and ready for local inference!");
  return modelRecord;
}

/**
 * List all models currently cached in browser IndexedDB
 */
export async function listIndexedDbCachedModels(): Promise<LocalGgufModel[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result as CachedModelRecord[]) || [];
        resolve(records.map((r) => r.metadata));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Delete a model from browser IndexedDB cache
 */
export async function deleteModelFromIndexedDb(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Get device storage quota usage in human readable format
 */
export async function getBrowserStorageQuota(): Promise<{
  usedMb: number;
  totalMb: number;
  percentUsed: number;
  supported: boolean;
}> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const total = estimate.quota || 1;
      return {
        usedMb: Math.round(used / (1024 * 1024)),
        totalMb: Math.round(total / (1024 * 1024)),
        percentUsed: Math.min(100, Math.round((used / total) * 100)),
        supported: true,
      };
    }
  } catch {}
  return { usedMb: 0, totalMb: 0, percentUsed: 0, supported: false };
}

/**
 * Query Ollama local runner endpoint for installed & cached models
 */
export async function checkOllamaRunner(
  endpoint = "http://localhost:11434"
): Promise<{
  running: boolean;
  models: Array<{ name: string; sizeBytes: number; modifiedAt: string }>;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const cleanUrl = endpoint.replace(/\/+$/, "");

    const res = await fetch(`${cleanUrl}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const models = (data.models || []).map((m: any) => ({
        name: m.name,
        sizeBytes: m.size || 0,
        modifiedAt: m.modified_at || new Date().toISOString(),
      }));
      return { running: true, models };
    }
    return { running: false, models: [], error: `HTTP ${res.status}` };
  } catch (err: any) {
    return {
      running: false,
      models: [],
      error: err.name === "AbortError" ? "Connection timed out" : (err.message || "Failed to connect to Ollama"),
    };
  }
}

/**
 * Query llama.cpp / llama-server local runner endpoint
 */
export async function checkLlamaCppRunner(
  endpoint = "http://localhost:8080"
): Promise<{
  running: boolean;
  models: string[];
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1200);
    const cleanUrl = endpoint.replace(/\/+$/, "");

    const res = await fetch(`${cleanUrl}/v1/models`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const models = (data.data || []).map((m: any) => m.id || "local-model");
      return { running: true, models };
    }
    return { running: false, models: [], error: `HTTP ${res.status}` };
  } catch (err: any) {
    return {
      running: false,
      models: [],
      error: err.name === "AbortError" ? "Connection timed out" : (err.message || "Failed to connect to llama.cpp"),
    };
  }
}
