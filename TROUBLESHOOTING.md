# SBR CAD System - Windows Troubleshooting Guide

## 🚨 Common Issues and Solutions

### **Issue: Setup.bat opens and closes immediately**

**Symptoms:**
- Double-clicking `setup.bat` opens a command prompt window
- Window closes immediately without showing any output
- No error messages visible

**Solutions:**

#### **Solution 1: Use the Launcher Script**
```bash
# Instead of double-clicking setup.bat, use:
run-setup.bat
```
This will open a proper command prompt window that stays open.

#### **Solution 2: Run from Command Prompt**
1. Open Command Prompt (cmd)
2. Navigate to your project directory
3. Run: `setup.bat`

#### **Solution 3: Use PowerShell**
```powershell
# Open PowerShell and run:
powershell -ExecutionPolicy Bypass -File setup.ps1
```

#### **Solution 4: Check for Errors**
1. Open Command Prompt
2. Navigate to project directory
3. Run: `setup.bat > setup_log.txt 2>&1`
4. Check `setup_log.txt` for error messages

### **Issue: "Node.js is not recognized"**

**Symptoms:**
- Error: `'node' is not recognized as an internal or external command`
- Error: `'npm' is not recognized as an internal or external command`

**Solutions:**

#### **Solution 1: Install Node.js**
1. Download Node.js from https://nodejs.org/
2. Install with default settings
3. **Restart your computer** (important!)
4. Open new Command Prompt and try again

#### **Solution 2: Check PATH Environment Variable**
1. Open System Properties (Win + Pause/Break)
2. Click "Environment Variables"
3. Under "System Variables", find "Path"
4. Click "Edit" and check if Node.js paths are included:
   - `C:\Program Files\nodejs\`
   - `%AppData%\npm`
5. If not, add them manually

#### **Solution 3: Reinstall Node.js**
1. Uninstall Node.js from Control Panel
2. Delete any remaining Node.js folders
3. Download and install latest LTS version
4. Restart computer

### **Issue: "Docker is not recognized"**

**Symptoms:**
- Error: `'docker' is not recognized as an internal or external command`
- Docker Desktop not running

**Solutions:**

#### **Solution 1: Install Docker Desktop**
1. Download Docker Desktop from https://www.docker.com/
2. Install with default settings
3. Start Docker Desktop
4. Wait for Docker to fully start (whale icon in system tray)
5. Restart Command Prompt

#### **Solution 2: Start Docker Desktop**
1. Find Docker Desktop in Start Menu
2. Start the application
3. Wait for "Docker Desktop is running" message
4. Try setup again

#### **Solution 3: Continue Without Docker**
- Choose "y" when prompted to continue without Docker
- You'll need to install PostgreSQL and Redis manually later

### **Issue: "npm install failed"**

**Symptoms:**
- Error during npm install
- Network timeouts
- Permission errors

**Solutions:**

#### **Solution 1: Clear npm Cache**
```bash
npm cache clean --force
npm install
```

#### **Solution 2: Use Different npm Registry**
```bash
npm config set registry https://registry.npmjs.org/
npm install
```

#### **Solution 3: Check Internet Connection**
- Ensure stable internet connection
- Try using a different network
- Disable VPN if using one

#### **Solution 4: Run as Administrator**
1. Right-click Command Prompt
2. Select "Run as administrator"
3. Navigate to project directory
4. Run setup again

### **Issue: "Port already in use"**

**Symptoms:**
- Error: `EADDRINUSE: address already in use :::3000`
- Error: `EADDRINUSE: address already in use :::3001`

**Solutions:**

#### **Solution 1: Stop Existing Processes**
```bash
# Stop all Node.js processes
taskkill /f /im node.exe

# Or use the stop script
stop-dev.bat
```

#### **Solution 2: Check What's Using the Port**
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Check what's using port 3001
netstat -ano | findstr :3001
```

#### **Solution 3: Change Ports**
Edit `.env` file:
```env
PORT=3002
CLIENT_PORT=3003
```

### **Issue: "Database connection failed"**

**Symptoms:**
- Error: `ECONNREFUSED`
- Error: `password authentication failed`
- Database services not starting

**Solutions:**

#### **Solution 1: Start Database Services**
```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be ready
timeout /t 15
```

#### **Solution 2: Check Docker Status**
```bash
# Check if Docker is running
docker ps

# Check Docker Compose
docker-compose ps
```

#### **Solution 3: Manual Database Setup**
1. Install PostgreSQL locally
2. Create database: `createdb sbr_cad`
3. Update `.env` file with correct credentials
4. Run: `setup-db.bat`

### **Issue: "Permission denied"**

**Symptoms:**
- Access denied errors
- Cannot create directories
- Cannot write to files

**Solutions:**

#### **Solution 1: Run as Administrator**
1. Right-click Command Prompt
2. Select "Run as administrator"
3. Navigate to project directory
4. Run setup again

#### **Solution 2: Check Antivirus**
- Temporarily disable antivirus
- Add project folder to antivirus exclusions
- Try setup again

#### **Solution 3: Check Folder Permissions**
1. Right-click project folder
2. Properties → Security
3. Ensure your user has Full Control

## 🔧 **Alternative Setup Methods**

### **Method 1: Manual Setup**
```bash
# 1. Install dependencies manually
npm install
cd client && npm install && cd ..

# 2. Create .env file
copy env.example .env

# 3. Start database
docker-compose up -d postgres redis

# 4. Setup database
npm run db:migrate
npm run db:seed

# 5. Start servers
npm run dev:server
# In another terminal:
cd client && npm start
```

### **Method 2: PowerShell Setup**
```powershell
# Run PowerShell as Administrator
powershell -ExecutionPolicy Bypass -File setup.ps1
```

### **Method 3: Git Bash (if available)**
```bash
# Use Git Bash instead of Command Prompt
./setup.bat
```

## 📋 **System Requirements Checklist**

Before running setup, ensure you have:

- [ ] **Node.js 18+** installed and in PATH
- [ ] **npm** working (comes with Node.js)
- [ ] **Git** installed (for version control)
- [ ] **Docker Desktop** installed and running (optional but recommended)
- [ ] **Windows 10/11** (or Windows Server 2016+)
- [ ] **Administrator privileges** (for some operations)
- [ ] **Stable internet connection**
- [ ] **Antivirus exclusions** for project folder

## 🆘 **Getting Help**

### **Check Logs**
- Look in `logs/` directory for error logs
- Check console output for error messages
- Review `setup_log.txt` if created

### **Use Help Script**
```bash
help.bat
```

### **Common Commands for Debugging**
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Docker version
docker --version

# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Check running processes
tasklist | findstr node
tasklist | findstr docker
```

### **Reset Everything**
```bash
# Clean everything and start fresh
clean.bat
setup.bat
setup-db.bat
start-dev.bat
```

## 🎯 **Quick Fixes**

| Issue | Quick Fix |
|-------|-----------|
| Setup closes immediately | Use `run-setup.bat` instead |
| Node.js not found | Restart computer after installing Node.js |
| Docker not found | Start Docker Desktop |
| Port in use | Run `stop-dev.bat` first |
| Permission denied | Run as Administrator |
| npm install fails | Run `npm cache clean --force` |

---

**Still having issues?** Check the main README.md file or create an issue in the project repository with detailed error messages and system information. 