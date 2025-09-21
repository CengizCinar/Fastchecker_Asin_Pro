# Git Workflow and Repository Structure

## 🏗️ **Repository Architecture**

FastChecker projesi **2 ayrı Git repository** kullanmaktadır:

### 1. Plasmo Extension Repository (Main Project)
- **Lokasyon**: `/Users/cengizcinar/Desktop/sidepanel_extension_4_cursor/fastchecker-plasmo-project/`
- **İçerik**: Modern React-based Chrome Extension (Plasmo framework)
- **Remote**: `https://github.com/CengizCinar/Professional_Fastchecker.git`
- **Tech Stack**: React, TypeScript, Plasmo, Vite
- **Branches**:
  - `main` - Plasmo extension production branch
  - `frontend` - UI specific changes
  - Feature branches for development

### 2. Backend Repository (Separate Git Repo)
- **Lokasyon**: `/Users/cengizcinar/Desktop/sidepanel_extension_4_cursor/fastchecker-backend/`
- **İçerik**: Node.js Express API server
- **Remote**: Aynı GitHub repo ama ayrı context
- **Branches**:
  - `backend` - Production backend (Railway'e deploy oluyor)
  - `main` - Backend development branch

## 🔄 **Deployment Flow**

### Backend Deployment (Automatic via Railway)
```bash
# Backend repository içinde
cd /Users/cengizcinar/Desktop/sidepanel_extension_4_cursor/fastchecker-backend/
git add .
git commit -m "Backend changes"
git push origin backend  # Railway otomatik deploy eder
```

**🚀 Railway Deployment Details:**
- **Platform**: Railway.app cloud hosting
- **Database**: PostgreSQL (Railway managed)
- **Environment**: Production
- **Domain**: `professionalfastchecker-production.up.railway.app`
- **Auto-Deploy**: Every push to `backend` branch triggers deployment
- **Build Time**: ~2-3 minutes
- **Logs**: Accessible via `railway logs`

### Plasmo Extension Deployment
```bash
# Plasmo repository içinde (root)
cd /Users/cengizcinar/Desktop/sidepanel_extension_4_cursor/fastchecker-plasmo-project/
npm run build           # Plasmo build
git add .
git commit -m "Frontend changes"
git push origin main     # Chrome Web Store için manuel yükleme
```

## 📁 **File Structure Overview**

```
sidepanel_extension_4_cursor/                    # Project root
├── fastchecker-plasmo-project/                 # Plasmo extension repo
│   ├── .git/                                   # Main repo git
│   ├── package.json                           # Plasmo dependencies
│   ├── vite.config.ts                         # Vite configuration
│   ├── manifest.json                          # Chrome Extension manifest
│   ├── src/                                   # Source code
│   │   ├── sidepanel.tsx                      # Main app entry
│   │   ├── components/                        # React components
│   │   ├── contexts/                          # React contexts
│   │   ├── pages/                             # Page components
│   │   │   ├── auth/                          # Authentication
│   │   │   └── main/                          # Main app pages
│   │   ├── services/                          # API services
│   │   │   └── apiClient.js
│   │   └── styles/                            # CSS files
│   ├── build/                                 # Build output
│   └── docs/                                  # Documentation
└── fastchecker-backend/                       # Separate git repo!
    ├── .git/                                  # Backend repo git
    ├── server.js
    ├── routes/
    ├── controllers/
    ├── middleware/
    └── package.json
```

## 🚀 **Development Workflow**

### 1. Backend Changes
```bash
# Navigate to backend directory
cd /Users/cengizcinar/Desktop/sidepanel_extension_4_cursor/fastchecker-backend/

# Make changes to backend files
# controllers/, routes/, middleware/, etc.

# Check status
git status

# Stage and commit
git add .
git commit -m "Backend feature: description"

# Push to Railway (auto-deploy)
git push origin backend
```

### 2. Plasmo Frontend Changes
```bash
# Navigate to Plasmo directory
cd /Users/cengizcinar/Desktop/sidepanel_extension_4_cursor/fastchecker-plasmo-project/

# Start development server
npm run dev

# Make changes to React components
# src/pages/, src/components/, src/contexts/, etc.

# Test changes
npm run build

# Check status
git status

# Stage and commit
git add .
git commit -m "Frontend feature: description"

# Push to main
git push origin main
```

### 3. Full Feature Implementation
```bash
# 1. Backend first
cd /Users/cengizcinar/Desktop/sidepanel_extension_4_cursor/fastchecker-backend/
# ... make backend changes ...
git add . && git commit -m "Backend: feature XYZ"
git push origin backend

# 2. Then Plasmo frontend
cd /Users/cengizcinar/Desktop/sidepanel_extension_4_cursor/fastchecker-plasmo-project/
npm run build  # Test build
# ... make frontend changes ...
git add . && git commit -m "Frontend: feature XYZ"
git push origin main
```

## 🔍 **Key Differences**

### Backend Repository
- **Purpose**: API server, database, business logic
- **Tech Stack**: Node.js, Express, PostgreSQL
- **Deployment**: Railway (automatic on push to `backend` branch)
- **Environment**: Production database, Railway hosting

### Plasmo Extension Repository
- **Purpose**: Modern Chrome Extension with React UI
- **Tech Stack**: React, TypeScript, Plasmo, Vite, Chrome APIs
- **Deployment**: Chrome Web Store (manual upload)
- **Environment**: Chrome browser extension

## 📊 **Branch Strategy**

### Backend Repo Branches
- `backend` → Railway Production (auto-deploy)
- `main` → Development/testing

### Plasmo Extension Repo Branches
- `main` → Plasmo extension production
- `frontend` → React UI specific changes
- Feature branches for specific developments

## 🛠️ **Common Commands**

### Check Which Repo You're In
```bash
pwd  # Shows current directory
git remote -v  # Shows remote URL
```

### Backend Work
```bash
cd /Users/cengizcinar/Desktop/sidepanel_extension_4_cursor/fastchecker-backend/
git status
git branch  # Should show 'backend' as main branch
```

### Plasmo Frontend Work
```bash
cd /Users/cengizcinar/Desktop/sidepanel_extension_4_cursor/fastchecker-plasmo-project/
git status
git branch  # Shows Plasmo repo branches
npm run dev  # Start development server
```

## 🚨 **CRITICAL PUSH POLICIES**

### Frontend Push Policy (STRICT)
```bash
# ❌ NEVER DO THIS - Force push is FORBIDDEN
git push --force origin main

# ✅ ALWAYS DO THIS - Normal push only
git push origin main
```

**📋 Frontend Push Rules:**
1. **NO FORCE PUSH**: Never use `--force` or `--force-with-lease` on main branch
2. **MERGE VIA GITHUB**: All frontend changes must be merged via GitHub UI
3. **LOCAL DEVELOPMENT**: Push to main for sync, merge conflicts handled via GitHub
4. **PROTECTION**: Main branch has protection rules on GitHub

### Backend Push Policy (FLEXIBLE)
```bash
# ✅ Direct push allowed for backend
cd /Users/cengizcinar/Desktop/sidepanel_extension_4_cursor/fastchecker-backend/
git push origin backend  # Railway auto-deploys immediately
```

**📋 Backend Push Rules:**
1. **DIRECT PUSH OK**: Backend branch allows direct push
2. **AUTO-DEPLOY**: Every push triggers Railway deployment
3. **GIT FLOW AWARE**: Follow conventional commit messages
4. **IMMEDIATE LIVE**: Changes go live in ~2-3 minutes

## ⚠️ **Important Notes**

1. **Two Separate .git Directories**:
   - `/Users/cengizcinar/Desktop/sidepanel_extension_4_cursor/fastchecker-plasmo-project/.git/` (Plasmo extension)
   - `/Users/cengizcinar/Desktop/sidepanel_extension_4_cursor/fastchecker-backend/.git/` (backend)

2. **Railway Auto-Deploy**:
   - Only `fastchecker-backend/` changes pushed to `backend` branch trigger deploy
   - Plasmo repo changes don't affect Railway

3. **Extension Updates**:
   - Plasmo repo changes need manual Chrome Web Store upload
   - Backend changes are immediately live via Railway

4. **Cross-Dependency**:
   - Plasmo extension calls backend API
   - Backend URL configured in `src/services/apiClient.js`
   - Both must be updated together for new features

5. **Merge Strategy**:
   - **Frontend**: GitHub UI merges only (no local merges)
   - **Backend**: Direct push to backend branch allowed
   - **Feature branches**: Create via GitHub for complex changes

## 🔄 **Typical Feature Development**

1. **Design Phase**: Plan database/API changes
2. **Backend Implementation**: 
   - Database migrations
   - API endpoints
   - Business logic
   - Test and push to `backend` branch
3. **Plasmo Frontend Implementation**:
   - React component updates
   - TypeScript interfaces
   - Context/state management
   - API integration
   - Error handling
   - Build testing (`npm run build`)
   - Push to `main` branch
4. **Testing**: Both systems together
5. **Deployment**: Backend auto-deploys, Plasmo extension manual upload

This structure allows independent deployment of backend services while maintaining version control for the extension codebase.