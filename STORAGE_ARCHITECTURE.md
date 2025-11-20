# Storage Architecture

## Overview

The application uses a hierarchical storage system with MongoDB as the permanent, centralized storage and IndexedDB for complex local storage needs.

## Storage Hierarchy

### 1. MongoDB (PERMANENT, CENTRALIZED) ⭐ PRIMARY

**Purpose:** Permanent, centralized data storage

**Characteristics:**
- ✅ Cloud-based storage (MongoDB Atlas)
- ✅ Unlimited capacity
- ✅ Accessible from anywhere
- ✅ Source of truth for all data
- ✅ Centralized - all devices/sessions use same data
- ✅ Permanent - data persists independently of browser

**When Used:**
- Primary storage for all products, orders, and data
- Always used when backend is available and MongoDB is connected
- Authoritative source - all other storage syncs with MongoDB

**Data Flow:**
- All write operations go to MongoDB first
- All read operations prioritize MongoDB when available
- Local storage caches MongoDB data for offline access

---

### 2. IndexedDB (CACHE/FALLBACK) 🔄 COMPLEX LOCAL STORAGE

**Purpose:** Complex local storage needs - caching and offline access

**Characteristics:**
- ✅ Large capacity (typically 50% of disk space)
- ✅ Fast local queries
- ✅ Can store large datasets (images, complex objects)
- ✅ Good for complex queries offline
- ⚠️ Browser-specific (data per browser/device)
- ⚠️ Can be cleared by user
- ⚠️ Not shared across devices

**When Used:**
- Caches MongoDB data for offline access
- Fallback when MongoDB is unavailable
- Stores large/complex data locally for better performance
- Enables offline functionality

**Data Flow:**
- Syncs FROM MongoDB when available (cache mode)
- Used as source when MongoDB is unavailable (fallback mode)
- Data in IndexedDB is synced TO MongoDB when backend becomes available

---

### 3. localStorage (MINIMAL BACKUP) 💾 LIGHTWEIGHT

**Purpose:** Lightweight backup only

**Characteristics:**
- ✅ Fast access
- ✅ Simple API
- ⚠️ Limited capacity (~5-10MB)
- ⚠️ Browser-specific
- ⚠️ Can be cleared by user
- ⚠️ Not shared across devices

**When Used:**
- Minimal backup of critical data
- Stores lightweight version (without images) when data is large
- Fallback if IndexedDB is unavailable

**Data Flow:**
- Stores lightweight backup when IndexedDB saves products
- Used as last resort fallback

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    WRITE OPERATIONS                          │
└─────────────────────────────────────────────────────────────┘

User Action (Add/Edit/Delete Product)
         │
         ▼
    MongoDB (PRIMARY) ←───────────────────── Permanent, Centralized Storage
         │                                        ⭐ Source of Truth
         │ ✅ Success
         ▼
    IndexedDB (CACHE) ←────────────────────── Syncs from MongoDB
         │                                        🔄 Cache for offline
         │ ✅ Success
         ▼
    localStorage (BACKUP) ←────────────────── Lightweight backup
                                              💾 Minimal backup only


┌─────────────────────────────────────────────────────────────┐
│                    READ OPERATIONS                           │
└─────────────────────────────────────────────────────────────┘

Page Load / Product Request
         │
         ├─→ MongoDB Available? ──YES──→ Load from MongoDB (PRIMARY)
         │                                      │
         │                                      ├─→ Cache to IndexedDB
         │                                      │
         │                                      └─→ Display Products
         │
         └─→ MongoDB Unavailable? ──YES──→ Load from IndexedDB (CACHE)
                                                    │
                                                    ├─→ Sync to MongoDB when available
                                                    │
                                                    └─→ Display Products
                                                          │
                                                          └─→ If IndexedDB empty:
                                                                Load from localStorage (BACKUP)
```

---

## Priority Rules

### Write Priority:
1. **MongoDB** (if available) - Write first, this is permanent storage
2. **IndexedDB** - Cache the write locally
3. **localStorage** - Save lightweight backup

### Read Priority:
1. **MongoDB** (if available) - Read from permanent storage
2. **IndexedDB** (if MongoDB unavailable) - Read from cache
3. **localStorage** (if IndexedDB unavailable) - Read from backup

### Sync Direction:
- **MongoDB → IndexedDB**: When MongoDB data is loaded, cache it to IndexedDB
- **IndexedDB → MongoDB**: When local data exists and MongoDB becomes available, sync local data to MongoDB
- **localStorage → IndexedDB**: Initial migration from localStorage to IndexedDB (one-time)

---

## Use Cases

### Scenario 1: Normal Operation (Backend Available)
```
1. User loads page
2. Frontend connects to MongoDB (permanent storage)
3. Products loaded from MongoDB
4. Products cached to IndexedDB for offline access
5. User adds product
6. Product saved to MongoDB (permanent)
7. Product cached to IndexedDB
8. Lightweight backup saved to localStorage
```

### Scenario 2: Offline Mode (Backend Unavailable)
```
1. User loads page
2. Frontend cannot connect to MongoDB
3. Products loaded from IndexedDB cache
4. User can browse/edit products locally
5. Changes saved to IndexedDB/localStorage
6. When MongoDB becomes available:
   - All local changes synced to MongoDB
   - MongoDB data reloaded (authoritative)
   - IndexedDB cache updated
```

### Scenario 3: First Load (No Data Anywhere)
```
1. User loads page
2. MongoDB: Empty
3. IndexedDB: Empty
4. localStorage: Empty
5. Default products initialized
6. Saved to MongoDB (if available) or IndexedDB/localStorage (if not)
```

---

## Benefits of This Architecture

### MongoDB (Permanent, Centralized):
- ✅ Single source of truth
- ✅ Accessible from any device/browser
- ✅ No data loss risk
- ✅ Scalable to unlimited data
- ✅ Shared across all users/devices

### IndexedDB (Cache/Fallback):
- ✅ Fast local access
- ✅ Offline functionality
- ✅ Large capacity for complex data
- ✅ Good performance for local queries
- ✅ Complex data structures support

### localStorage (Minimal Backup):
- ✅ Simple fallback
- ✅ Fast access
- ✅ Works in all browsers
- ✅ Lightweight storage

---

## Configuration

### MongoDB:
- Configured in `backend/.env`
- Connection string: `MONGODB_URI`
- Auto-detected by frontend via API health check

### IndexedDB:
- Auto-initialized when available
- Browser-specific database
- Automatically syncs with MongoDB

### localStorage:
- Auto-used as fallback
- Stores lightweight version when data is large (>4.5MB)

---

## Migration Notes

When migrating from old storage:
1. Existing localStorage data → Syncs to MongoDB when backend available
2. MongoDB data → Automatically cached to IndexedDB
3. All future operations → MongoDB first, IndexedDB cache, localStorage backup

---

## Summary

- **MongoDB** = Permanent, centralized storage (primary, authoritative)
- **IndexedDB** = Complex local storage, cache, offline access
- **localStorage** = Minimal backup, lightweight fallback

This architecture ensures data permanence, offline capability, and optimal performance! 🚀

