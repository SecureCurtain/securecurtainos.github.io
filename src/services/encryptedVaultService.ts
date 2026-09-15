// jb7572_2026-09-02: Encrypted IndexedDB Persistent Vault Service
// Implements client-side AES-GCM-256 encryption via Web Crypto API with PBKDF2 key derivation (100,000 rounds)
// Provides persistent storage for quarantine artifacts, memory dumps, YARA rulesets, and STIX threat intel.

import { 
  EncryptedVaultRecord, 
  DecryptedVaultRecord, 
  VaultMetadataHeader, 
  VaultEngineStatus, 
  VaultRecordType,
  QuarantinedObject
} from '../types';
import { hipsAntiMalwareService } from './hipsAntiMalwareService';

const DB_NAME = 'SecureCurtainVaultDB_v1';
const DB_VERSION = 1;
const STORE_META = 'vault_meta';
const STORE_RECORDS = 'vault_records';
const LOCAL_STORAGE_BACKUP_KEY = 'securecurtain_encrypted_vault_fallback_v1';
const LOCAL_STORAGE_META_KEY = 'securecurtain_vault_meta_fallback_v1';

const VERIFICATION_TOKEN_PLAINTEXT = 'SECURECURTAIN_VAULT_KEY_VALIDATION_TOKEN_V1_2026';
export const DEFAULT_VAULT_PASSPHRASE = 'SecureCurtain#2026!Vault';

// Cryptographic helpers using Web Crypto API
function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

class EncryptedVaultService {
  private db: IDBDatabase | null = null;
  private activeKey: CryptoKey | null = null;
  private vaultMeta: VaultMetadataHeader | null = null;
  private cachedRecords: EncryptedVaultRecord[] = [];
  private isUnlocked: boolean = false;
  private lastUnlockedAt: string | null = null;
  private lastSyncedAt: string | null = null;
  private isInitializedPromise: Promise<void>;
  private integrityAudit: {
    status: 'VERIFIED' | 'TAMPER_DETECTED' | 'NOT_CHECKED';
    verifiedCount: number;
    corruptedIds: string[];
    lastAuditedAt: string | null;
  } = {
    status: 'NOT_CHECKED',
    verifiedCount: 0,
    corruptedIds: [],
    lastAuditedAt: null
  };

  constructor() {
    this.isInitializedPromise = this.bootstrapDatabase();
  }

  /**
   * Initializes IndexedDB or localStorage fallback
   */
  private async bootstrapDatabase(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        this.db = await new Promise<IDBDatabase>((resolve, reject) => {
          const req = indexedDB.open(DB_NAME, DB_VERSION);
          req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_META)) {
              db.createObjectStore(STORE_META, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORE_RECORDS)) {
              db.createObjectStore(STORE_RECORDS, { keyPath: 'id' });
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        });
      }
    } catch (err) {
      console.warn('[EncryptedVault] IndexedDB open failed, utilizing localStorage fallback', err);
    }

    // Load meta
    this.vaultMeta = await this.readMeta();
    this.cachedRecords = await this.readAllRecordsFromStorage();

    // Auto-initialize with default credential if brand new vault
    if (!this.vaultMeta) {
      await this.initVault(DEFAULT_VAULT_PASSPHRASE);
    } else {
      // Auto-unlock with default passphrase for immediate cockpit convenience
      try {
        await this.unlockVault(DEFAULT_VAULT_PASSPHRASE);
      } catch {
        // Master passphrase was customized by user, remains in LOCKED state
      }
    }
  }

  public async waitUntilReady(): Promise<void> {
    await this.isInitializedPromise;
  }

  // ==========================================
  // Storage Read / Write Wrappers
  // ==========================================

  private async readMeta(): Promise<VaultMetadataHeader | null> {
    if (this.db) {
      try {
        return await new Promise<VaultMetadataHeader | null>((resolve) => {
          const tx = this.db!.transaction(STORE_META, 'readonly');
          const store = tx.objectStore(STORE_META);
          const req = store.get('vault_config');
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });
      } catch {
        // Fallback
      }
    }
    const raw = localStorage.getItem(LOCAL_STORAGE_META_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  private async saveMeta(meta: VaultMetadataHeader): Promise<void> {
    this.vaultMeta = meta;
    if (this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = this.db!.transaction(STORE_META, 'readwrite');
          const store = tx.objectStore(STORE_META);
          const req = store.put(meta);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
        return;
      } catch {
        // Fallback
      }
    }
    localStorage.setItem(LOCAL_STORAGE_META_KEY, JSON.stringify(meta));
  }

  private async readAllRecordsFromStorage(): Promise<EncryptedVaultRecord[]> {
    if (this.db) {
      try {
        const records = await new Promise<EncryptedVaultRecord[]>((resolve) => {
          const tx = this.db!.transaction(STORE_RECORDS, 'readonly');
          const store = tx.objectStore(STORE_RECORDS);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });
        return records;
      } catch {
        // Fallback
      }
    }
    const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private async saveRecordToStorage(record: EncryptedVaultRecord): Promise<void> {
    const idx = this.cachedRecords.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      this.cachedRecords[idx] = record;
    } else {
      this.cachedRecords.unshift(record);
    }

    if (this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = this.db!.transaction(STORE_RECORDS, 'readwrite');
          const store = tx.objectStore(STORE_RECORDS);
          const req = store.put(record);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
        return;
      } catch {
        // Fallback
      }
    }
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(this.cachedRecords));
  }

  private async deleteRecordFromStorage(id: string): Promise<void> {
    this.cachedRecords = this.cachedRecords.filter(r => r.id !== id);
    if (this.db) {
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = this.db!.transaction(STORE_RECORDS, 'readwrite');
          const store = tx.objectStore(STORE_RECORDS);
          const req = store.delete(id);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
        return;
      } catch {
        // Fallback
      }
    }
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(this.cachedRecords));
  }

  // ==========================================
  // Cryptographic Key Management (PBKDF2 + AES-GCM)
  // ==========================================

  private async deriveKey(passphrase: string, salt: Uint8Array, iterations = 100000): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  private async computeSha256(data: string): Promise<string> {
    const enc = new TextEncoder();
    const hashBuf = await window.crypto.subtle.digest('SHA-256', enc.encode(data));
    const hashArray = Array.from(new Uint8Array(hashBuf));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Initializes a brand-new encrypted vault with a master passphrase
   */
  public async initVault(passphrase: string): Promise<boolean> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iterations = 100000;
    const derivedKey = await this.deriveKey(passphrase, salt, iterations);

    // Encrypt verification token
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encryptedToken = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      enc.encode(VERIFICATION_TOKEN_PLAINTEXT)
    );

    const meta: VaultMetadataHeader = {
      id: 'vault_config',
      specVersion: '1.0',
      cipher: 'AES-GCM-256',
      kdf: 'PBKDF2-SHA256',
      iterations,
      salt: bufferToBase64(salt),
      keyVerificationCiphertext: bufferToBase64(encryptedToken),
      keyVerificationIv: bufferToBase64(iv),
      createdAt: new Date().toISOString(),
      lastUnlockedAt: new Date().toISOString()
    };

    await this.saveMeta(meta);
    this.activeKey = derivedKey;
    this.isUnlocked = true;
    this.lastUnlockedAt = meta.lastUnlockedAt!;

    // Auto-sync initial quarantine objects into encrypted vault
    await this.syncQuarantineVault();
    return true;
  }

  /**
   * Unlocks vault using provided passphrase
   */
  public async unlockVault(passphrase: string): Promise<boolean> {
    if (!this.vaultMeta) {
      await this.initVault(passphrase);
      return true;
    }

    const salt = base64ToBuffer(this.vaultMeta.salt);
    const derivedKey = await this.deriveKey(passphrase, salt, this.vaultMeta.iterations);

    // Verify key against verification token
    const iv = base64ToBuffer(this.vaultMeta.keyVerificationIv);
    const ciphertext = base64ToBuffer(this.vaultMeta.keyVerificationCiphertext);

    try {
      const decryptedBuf = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        derivedKey,
        ciphertext as BufferSource
      );
      const dec = new TextDecoder();
      const checkText = dec.decode(decryptedBuf);
      if (checkText !== VERIFICATION_TOKEN_PLAINTEXT) {
        throw new Error('Key validation mismatch');
      }

      this.activeKey = derivedKey;
      this.isUnlocked = true;
      this.lastUnlockedAt = new Date().toISOString();

      // Refresh records
      this.cachedRecords = await this.readAllRecordsFromStorage();
      return true;
    } catch {
      throw new Error('Incorrect vault master passphrase or corrupted key verification block.');
    }
  }

  /**
   * Locks the vault and wipes active key from memory
   */
  public lockVault(): void {
    this.activeKey = null;
    this.isUnlocked = false;
  }

  /**
   * Encrypts and persists a new artifact record into IndexedDB
   */
  public async storeRecord(param: {
    type: VaultRecordType;
    title: string;
    payload: any;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<EncryptedVaultRecord> {
    if (!this.isUnlocked || !this.activeKey) {
      throw new Error('Vault is locked. Unlock vault to store encrypted records.');
    }

    const payloadJson = JSON.stringify(param.payload);
    const sha256Hash = await this.computeSha256(payloadJson);
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.activeKey,
      enc.encode(payloadJson)
    );

    const nowIso = new Date().toISOString();
    const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newRecord: EncryptedVaultRecord = {
      id,
      type: param.type,
      title: param.title,
      tags: param.tags || [param.type.toLowerCase()],
      createdAt: nowIso,
      updatedAt: nowIso,
      sizeBytes: encryptedBuffer.byteLength,
      sha256Hash,
      iv: bufferToBase64(iv),
      encryptedData: bufferToBase64(encryptedBuffer),
      metadata: param.metadata || {}
    };

    await this.saveRecordToStorage(newRecord);
    return newRecord;
  }

  /**
   * Decrypts a specific record from the vault
   */
  public async decryptRecord<T = any>(id: string): Promise<DecryptedVaultRecord<T> | null> {
    if (!this.isUnlocked || !this.activeKey) {
      throw new Error('Vault is locked. Decryption requires an unlocked master session.');
    }

    const rec = this.cachedRecords.find(r => r.id === id);
    if (!rec) return null;

    const iv = base64ToBuffer(rec.iv);
    const ciphertext = base64ToBuffer(rec.encryptedData);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      this.activeKey,
      ciphertext as BufferSource
    );

    const dec = new TextDecoder();
    const jsonStr = dec.decode(decryptedBuffer);

    // Verify SHA-256 integrity
    const computedSha = await this.computeSha256(jsonStr);
    if (computedSha !== rec.sha256Hash) {
      console.error(`[EncryptedVault] Integrity check failed for record ${id}! Expected: ${rec.sha256Hash}, computed: ${computedSha}`);
      throw new Error(`Record integrity check failed. Possible cipher tampering.`);
    }

    const payload = JSON.parse(jsonStr) as T;

    return {
      id: rec.id,
      type: rec.type,
      title: rec.title,
      tags: rec.tags,
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
      sizeBytes: rec.sizeBytes,
      sha256Hash: rec.sha256Hash,
      metadata: rec.metadata,
      payload
    };
  }

  /**
   * Deletes a record from the vault
   */
  public async deleteRecord(id: string): Promise<boolean> {
    await this.deleteRecordFromStorage(id);
    return true;
  }

  /**
   * Synchronizes HIPS Quarantine items into persistent encrypted vault
   */
  public async syncQuarantineVault(): Promise<{ synced: number; skipped: number }> {
    if (!this.isUnlocked || !this.activeKey) {
      return { synced: 0, skipped: 0 };
    }

    const quarantinedList: QuarantinedObject[] = hipsAntiMalwareService.getQuarantineVault();
    let synced = 0;
    let skipped = 0;

    for (const q of quarantinedList) {
      const exists = this.cachedRecords.some(r => r.metadata?.vaultId === q.id || r.metadata?.sha256 === q.sha256);
      if (!exists) {
        await this.storeRecord({
          type: 'QUARANTINE_ARTIFACT',
          title: `Quarantine: ${q.originalFileName}`,
          payload: q,
          tags: ['quarantine', q.detectionVector.toLowerCase(), q.threatSeverity.toLowerCase()],
          metadata: {
            vaultId: q.id,
            threatId: q.threatId,
            sha256: q.sha256,
            originalFileName: q.originalFileName,
            threatSeverity: q.threatSeverity,
            threatVector: q.detectionVector,
            entropy: q.entropy
          }
        });
        synced++;
      } else {
        skipped++;
      }
    }

    this.lastSyncedAt = new Date().toISOString();
    return { synced, skipped };
  }

  /**
   * Audits integrity of all encrypted records using AES-GCM verification tags & SHA-256
   */
  public async auditIntegrity(): Promise<{ verified: number; corrupted: string[]; status: 'VERIFIED' | 'TAMPER_DETECTED' }> {
    if (!this.isUnlocked || !this.activeKey) {
      throw new Error('Integrity audit requires unlocked vault.');
    }

    let verified = 0;
    const corrupted: string[] = [];

    for (const rec of this.cachedRecords) {
      try {
        const iv = base64ToBuffer(rec.iv);
        const ciphertext = base64ToBuffer(rec.encryptedData);
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv as BufferSource },
          this.activeKey,
          ciphertext as BufferSource
        );
        const dec = new TextDecoder();
        const jsonStr = dec.decode(decryptedBuffer);
        const hash = await this.computeSha256(jsonStr);

        if (hash === rec.sha256Hash) {
          verified++;
        } else {
          corrupted.push(rec.id);
        }
      } catch {
        corrupted.push(rec.id);
      }
    }

    const status = corrupted.length === 0 ? 'VERIFIED' : 'TAMPER_DETECTED';
    this.integrityAudit = {
      status,
      verifiedCount: verified,
      corruptedIds: corrupted,
      lastAuditedAt: new Date().toISOString()
    };

    return { verified, corrupted, status };
  }

  /**
   * Changes master passphrase and re-encrypts the vault verification token
   */
  public async changePassphrase(oldPass: string, newPass: string): Promise<boolean> {
    await this.unlockVault(oldPass);

    const newSalt = window.crypto.getRandomValues(new Uint8Array(16));
    const newKey = await this.deriveKey(newPass, newSalt, 100000);

    // Re-encrypt all records with new key
    const decryptedPayloads: { rec: EncryptedVaultRecord; payload: any }[] = [];
    for (const r of this.cachedRecords) {
      const dec = await this.decryptRecord(r.id);
      if (dec) {
        decryptedPayloads.push({ rec: r, payload: dec.payload });
      }
    }

    // Encrypt verification token with new key
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encryptedToken = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      newKey,
      enc.encode(VERIFICATION_TOKEN_PLAINTEXT)
    );

    const newMeta: VaultMetadataHeader = {
      id: 'vault_config',
      specVersion: '1.0',
      cipher: 'AES-GCM-256',
      kdf: 'PBKDF2-SHA256',
      iterations: 100000,
      salt: bufferToBase64(newSalt),
      keyVerificationCiphertext: bufferToBase64(encryptedToken),
      keyVerificationIv: bufferToBase64(iv),
      createdAt: this.vaultMeta?.createdAt || new Date().toISOString(),
      lastUnlockedAt: new Date().toISOString()
    };

    this.activeKey = newKey;
    await this.saveMeta(newMeta);

    // Re-store all records with new key
    for (const item of decryptedPayloads) {
      const payloadJson = JSON.stringify(item.payload);
      const sha256Hash = await this.computeSha256(payloadJson);
      const itemIv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: itemIv },
        this.activeKey,
        enc.encode(payloadJson)
      );
      item.rec.iv = bufferToBase64(itemIv);
      item.rec.encryptedData = bufferToBase64(encryptedBuffer);
      item.rec.sha256Hash = sha256Hash;
      item.rec.updatedAt = new Date().toISOString();
      await this.saveRecordToStorage(item.rec);
    }

    return true;
  }

  /**
   * Exports full encrypted backup archive (.scvault)
   */
  public async exportVaultBackup(): Promise<string> {
    if (!this.vaultMeta) {
      throw new Error('Vault is not initialized.');
    }

    const backupPackage = {
      format: 'SECURECURTAIN_ENCRYPTED_VAULT_BACKUP',
      specVersion: '1.0',
      exportedAt: new Date().toISOString(),
      meta: this.vaultMeta,
      recordCount: this.cachedRecords.length,
      records: this.cachedRecords
    };

    return JSON.stringify(backupPackage, null, 2);
  }

  /**
   * Restores vault archive from backup
   */
  public async importVaultBackup(jsonStr: string): Promise<{ importedCount: number }> {
    const pkg = JSON.parse(jsonStr);
    if (pkg.format !== 'SECURECURTAIN_ENCRYPTED_VAULT_BACKUP' || !pkg.meta || !Array.isArray(pkg.records)) {
      throw new Error('Invalid vault backup package format.');
    }

    await this.saveMeta(pkg.meta);
    let count = 0;
    for (const rec of pkg.records) {
      await this.saveRecordToStorage(rec);
      count++;
    }

    this.cachedRecords = await this.readAllRecordsFromStorage();
    return { importedCount: count };
  }

  /**
   * Returns current engine status
   */
  public getStatus(): VaultEngineStatus {
    const totalStorageBytes = this.cachedRecords.reduce((acc, r) => acc + r.sizeBytes, 0);

    return {
      state: !this.vaultMeta ? 'UNINITIALIZED' : this.isUnlocked ? 'UNLOCKED' : 'LOCKED',
      totalRecords: this.cachedRecords.length,
      totalStorageBytes,
      indexedDbSupported: typeof window !== 'undefined' && 'indexedDB' in window,
      webCryptoSupported: typeof window !== 'undefined' && 'crypto' in window && 'subtle' in window.crypto,
      cipher: 'AES-GCM-256',
      kdfIterations: this.vaultMeta?.iterations || 100000,
      lastUnlockedAt: this.lastUnlockedAt,
      lastSyncedAt: this.lastSyncedAt,
      integrityReport: this.integrityAudit
    };
  }

  public getAllRecords(): EncryptedVaultRecord[] {
    return [...this.cachedRecords];
  }

  public getRecord(id: string): EncryptedVaultRecord | undefined {
    return this.cachedRecords.find(r => r.id === id);
  }
}

export const encryptedVaultService = new EncryptedVaultService();
