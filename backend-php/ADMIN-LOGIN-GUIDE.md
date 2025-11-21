# Admin Login Troubleshooting Guide

## Quick Fix - Reset Admin Credentials

If your login credentials keep failing, follow these steps:

### Step 1: Reset Admin Account
Visit this URL in your browser:
```
https://trendydresses.co.ke/backend-php/reset-admin.php
```

This will:
- Delete all existing admin accounts
- Create a fresh admin account with verified credentials
- Show you a success message with the credentials

### Step 2: Check Admin Status (Optional)
To verify the admin account was created correctly:
```
https://trendydresses.co.ke/backend-php/check-admin.php
```

This will show you:
- Database connection status
- Whether the admins table exists
- How many admin accounts exist
- Password verification test results

### Step 3: Login
1. Go to your website: `https://trendydresses.co.ke`
2. Click the **Login** button in the navigation
3. Enter:
   - **Username:** `admin`
   - **Password:** `admin123`
4. Click **Login**

## Default Credentials

After running the reset script:
- **Username:** `admin`
- **Password:** `admin123`

## Change Your Password

Once logged in successfully:
1. Click the **Admin** button in the navigation
2. Go to the **Settings** tab
3. Scroll to "Admin Credentials" section
4. Fill in:
   - **Current Password:** `admin123`
   - **New Username:** (optional - leave empty to keep 'admin')
   - **New Password:** (your new secure password)
   - **Confirm New Password:** (repeat your new password)
5. Click **Update Credentials**

## Common Issues

### Issue 1: "Invalid credentials" error
**Solution:** Run the reset script again (Step 1 above)

### Issue 2: Database not connected
**Solution:** 
1. Check your `.env` file in `backend-php/` folder
2. Verify database credentials are correct
3. Make sure your database server is running

### Issue 3: Admins table doesn't exist
**Solution:** Visit `https://trendydresses.co.ke/backend-php/create-tables.php`

### Issue 4: Still can't login after reset
**Solution:**
1. Clear your browser cache and cookies
2. Try in an incognito/private window
3. Check browser console for errors (F12 → Console tab)

## Security Notes

- The password is hashed using PHP's `password_hash()` function
- Passwords are never stored in plain text
- Sessions are secured with httponly cookies
- Always change the default password after first login
