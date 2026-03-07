# 🧪 Test Data Persistence - Verify Your Changes Save

## Quick Test (2 minutes)

### Test 1: Hero Image Persistence ✅

**Step 1: Add Hero Image**
```
1. Open website
2. Click "Admin" button (Login)
3. Go to "Content" tab
4. In "Hero Background Image" → Enter image URL:
   https://via.placeholder.com/1920x1080?text=My+Hero+Store
5. Click "Save Content"
6. You should see: "✅ Content saved successfully!"
```

**Step 2: Verify It Saved**
```
1. Refresh page (Ctrl+R or Cmd+R)
2. Click "Admin" button again
3. Go to "Content" tab
4. ✅ Hero image URL should still be there!
```

**Step 3: Check Console**
```
1. Press F12
2. Go to "Console" tab
3. Refresh page
4. Look for these messages:
   📡 Loading website content from backend...
   ✅ Loaded website content from backend
   OR
   ⚠️ Could not load from backend (that's ok)
   ✅ Loaded website content from localStorage
```

### Test 2: Hero Title & Description

**Step 1: Edit Title**
```
1. Admin → Content tab
2. Change "Hero Title" to something custom:
   "Welcome to My Store!"
3. Change "Hero Description" to:
   "Find amazing fashion here"
4. Click "Save Content"
5. See success notification
```

**Step 2: Verify After Refresh**
```
1. Close admin panel
2. Refresh page (Ctrl+R)
3. Look at the hero section at the top
4. ✅ Your custom title should be visible!
5. Click admin again
6. Go to Content tab
7. ✅ Fields should show your custom text
```

### Test 3: Contact Settings

**Step 1: Change Contact Info**
```
1. Admin → Settings tab
2. Change phone to: 0789123456
3. Change email to: shop@example.com
4. Change address to: My Store, Main Street
5. Click "Save Settings"
6. See success notification
```

**Step 2: Verify After Refresh**
```
1. Refresh page (Ctrl+R)
2. Scroll to footer (bottom of page)
3. ✅ Contact info should show your new values
4. Click admin again
5. Go to Settings tab
6. ✅ Fields should show your custom values
```

---

## Advanced Testing (Browser Storage)

### Check if Data is Saved in Browser

**Firefox:**
```
1. Press F12
2. Click "Storage" tab
3. Expand "Local Storage" on left
4. Click the website URL
5. Look for "websiteContent" entry
6. Click it
7. ✅ Should show your saved data (JSON format)
```

**Chrome:**
```
1. Press F12
2. Click "Application" tab
3. Click "Local Storage" on left
4. Click the website URL
5. Look for "websiteContent" entry
6. ✅ Should show your saved data (JSON format)
```

**Safari:**
```
1. Click Develop menu → Show Web Inspector
2. Click "Storage" tab
3. Click "Local Storage" on left
4. Click the website URL
5. ✅ Should see "websiteContent" with your data
```

### Clear Browser Storage (Test Fallback)

**To test fallback to defaults:**
```
1. F12 → Application (or Storage tab)
2. Local Storage
3. Right-click "websiteContent"
4. Delete
5. Refresh page
6. Admin content should revert to defaults
7. Then add your content again
8. ✅ Should save properly again
```

---

## Success Indicators

### ✅ If Everything Works:

**Console shows:**
- ✅ Content saved to backend
- ✅ Content saved to localStorage (local backup)
- ✅ Content saved successfully! (Backend + Local Storage)

**After Refresh:**
- ✅ Content is still there
- ✅ No need to re-enter it

**Browser Storage:**
- ✅ `websiteContent` exists in Local Storage
- ✅ Contains your hero image URL and text
- ✅ Contains your contact info

---

## Troubleshooting

### Problem 1: Save Shows Error

**Error Message:** "Could not save to localStorage"
```
Solution:
- Browser storage is full (10MB limit)
- Clear cache: F12 → Application → Clear Site Data
- Or use backend (being deployed)
```

**Error Message:** "Failed to unload"
```
Solution:
- This is normal in some browsers
- Data still saves to localStorage
- Check by refreshing page
```

### Problem 2: Content Disappears After Refresh

**Step 1: Check Console**
```
1. F12 → Console
2. Refresh page
3. Look for errors
4. Check the save messages above
```

**Step 2: Check Browser Storage**
```
1. F12 → Application → Local Storage
2. Look for "websiteContent"
3. If it exists → Data is saved
4. If empty → Save button didn't work
```

**Step 3: Check Save Success**
```
1. When you click "Save Content"
2. Look for success notification
3. If missing → Click save again
4. Check console for errors
```

### Problem 3: Browser Storage Disabled

**Chrome/Firefox:**
```
1. Check if incognito/private mode
2. Disable browser extensions (ad blocker, etc.)
3. Check privacy settings
4. Allow "Cookies and site data"
```

**Safari:**
```
1. Preferences → Privacy
2. Enable "Manage website data"
3. Make sure tracking prevention isn't blocking
```

---

## Video Test (If Having Issues)

### Screen Recording Steps:

```
1. Open DevTools (F12)
2. Go to Console tab
3. Start screen recording (Windows 11: Win+G)
4. Click Admin button
5. Go to Content tab
6. Change hero image to: https://via.placeholder.com/1920x1080
7. Click "Save Content"
8. Wait for notification
9. Refresh page (Ctrl+R)
10. Note the console messages
11. Check if image URL is still there
12. Stop recording
13. Send to support if issues
```

---

## Quick Checklist

- [ ] Hero image saves when clicked
- [ ] Hero image is still there after refresh
- [ ] Hero title/description saves
- [ ] Title/description visible on homepage after refresh
- [ ] Contact settings save
- [ ] Contact info visible in footer after refresh
- [ ] Console shows save messages (F12)
- [ ] No errors in console when saving
- [ ] `websiteContent` exists in browser Local Storage
- [ ] All data remains after hard refresh (Ctrl+Shift+R)

---

## Expected Results

### After Implementation:
```
Save Hero Image
     ↓
Notification: "✅ Content saved successfully!"
     ↓
Refresh Page
     ↓
Hero Image Still There ✅
     ↓
Console Shows:
  📡 Loading website content from backend...
  ✅ Loaded website content from backend
  (or from localStorage fallback)
     ↓
Success! ✅
```

---

## Performance Test

### How Long Should Save Take?

**With Backend:**
- Save: 100-500ms ← Server response time
- Load on refresh: 200-800ms ← Server response time

**With Browser Storage (Fallback):**
- Save: 50-100ms ← Instant
- Load on refresh: 0-50ms ← Instant

Both should feel immediate to the user!

---

## Next Steps

✅ **Test 1: Run the 2-minute test above** ← START HERE
✅ **Test 2: Check browser storage (F12)**
✅ **Test 3: Hard refresh (Ctrl+Shift+R) to verify persistence**
✅ **Test 4: Check console messages**

If all tests pass → ✅ Data persistence is working!
If tests fail → Check troubleshooting section above

---

**Testing Status**: Ready to verify
**Last Updated**: March 7, 2026
**Expected Result**: ✅ All admin changes persist after page refresh
