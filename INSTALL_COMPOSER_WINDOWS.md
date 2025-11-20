# 📦 Install Composer on Windows

## Quick Installation

### Option 1: Composer Installer (Recommended - Easiest)

1. **Download Composer Installer:**
   - Go to: https://getcomposer.org/Composer-Setup.exe
   - Download and run the installer

2. **Run Installer:**
   - The installer will:
     - Detect PHP automatically
     - Add Composer to your PATH
     - Set up everything for you

3. **Verify Installation:**
   ```powershell
   composer --version
   ```

### Option 2: Manual Installation

1. **Download Composer:**
   - Go to: https://getcomposer.org/download/
   - Download `composer.phar`

2. **Move to PHP folder:**
   - If using XAMPP: Move to `C:\xampp\php\`
   - If standalone PHP: Move to your PHP installation folder

3. **Create `composer.bat`:**
   - In the same folder, create `composer.bat` with:
     ```batch
     @echo off
     php "%~dp0composer.phar" %*
     ```

4. **Add to PATH:**
   - Add PHP folder to System PATH
   - Restart terminal

### Option 3: Use Composer Without Installation

You can use Composer directly without installing:

```powershell
# Download composer.phar
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php
php -r "unlink('composer-setup.php');"

# Use it
php composer.phar install
```

## After Installation

### Verify Composer Works

```powershell
composer --version
```

Should show: `Composer version X.X.X`

### Install Backend Dependencies

```powershell
cd backend-php
composer install
```

## Troubleshooting

### "composer is not recognized"

1. **Check if installed:**
   ```powershell
   where composer
   ```

2. **If not found:**
   - Reinstall using Option 1 (Composer Installer)
   - Or add Composer to PATH manually

3. **Check PATH:**
   ```powershell
   $env:PATH -split ';' | Select-String composer
   ```

### "PHP is not recognized"

Composer needs PHP. Install PHP first:
- See `INSTALL_PHP_WINDOWS.md`
- Or use XAMPP which includes PHP

### Alternative: Skip Composer (For Now)

If you can't install Composer right now:

1. **The backend will still work** - PDO is built into PHP
2. **Only dotenv package needed** - Can be added manually later
3. **For production:** Install Composer on your server

---

**Once Composer is installed, run:**
```powershell
cd backend-php
composer install
```

