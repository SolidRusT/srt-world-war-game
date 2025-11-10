# CLAUDE.md - World War Game Agent Context

**Project**: Risk-inspired strategic board game deployed on SRT-HQ Kubernetes platform
**Status**: Production deployed at `https://worldwar.lab.hq.solidrust.net`
**Last Updated**: 2025-11-09
**Shaun's Golden Rule**: **No workarounds, no temporary fixes, no disabled functionality. Full solutions only.**

---

## ⚡ AGENT QUICK START

**Your job**: Help with World War Game - a React + Vite strategic board game on Kubernetes.

**Shaun's top rule**: No workarounds, no temporary fixes, complete solutions only.

**Where to start**:
1. Read "Project Overview" below
2. Check REPO-STRUCTURE.md for game architecture
3. Reference deployment patterns as needed
4. Use ChromaDB for platform integration questions

---

## 📚 PLATFORM INTEGRATION (ChromaDB Knowledge Base)

**When working in this submodule**, you cannot access the parent srt-hq-k8s repository files. Use ChromaDB to query platform capabilities and integration patterns.

**Collection**: `srt-hq-k8s-platform-guide` (27 docs, updated 2025-11-09)

**Why This Matters for World War Game**:
The game is deployed on the SRT-HQ Kubernetes platform and needs to understand:
- Platform ingress and SSL certificate automation
- Storage options for save game data (if needed in future)
- Monitoring and observability integration
- Platform deployment conventions

**Query When You Need**:
- Platform architecture and three-tier taxonomy
- Ingress and SSL certificate patterns
- Storage classes for persistent data
- Monitoring and logging integration
- Platform service discovery

**Example Queries**:
```
"What is the srt-hq-k8s platform architecture?"
"How does ingress and SSL work on the platform?"
"What storage classes are available for game saves?"
"How do I integrate with platform monitoring?"
```

**When NOT to Query**:
- ❌ React/Vite development (use package.json scripts)
- ❌ Game logic and mechanics (see game README.md and docs/)
- ❌ Docker build process (use build-and-push.ps1)

---

## 📍 PROJECT OVERVIEW

**Game Type**: Turn-based strategy game inspired by RISK®
**Tech Stack**: React 18 + Vite + Modern Web Technologies
**Build System**: Vite (not webpack)
**Package Manager**: npm
**Production**: Static SPA served via nginx

**Key Features**:
- Global map with territories and continents
- Turn-based gameplay (reinforcement, attack, fortification phases)
- Multiple unit types with different strengths
- Resource management system
- Technology research tree
- Dynamic events system
- AI opponents with different strategies
- Alliance system for diplomacy
- Multiple victory paths

---

## 🗂️ LOCATIONS

**Repository**:
- GitHub: `git@github.com:SolidRusT/srt-world-war-game.git`
- Submodule: `/mnt/c/Users/shaun/repos/srt-hq-k8s/manifests/apps/world-war-game/`
- Standalone: `/mnt/c/Users/shaun/repos/srt-world-war-game/`

**Deployment**:
- Dev: `npm run dev` → `http://localhost:5173` (Vite dev server)
- Docker Test: `docker run -p 8080:80 suparious/world-war-game:latest` → `http://localhost:8080`
- Production: `https://worldwar.lab.hq.solidrust.net` (K8s namespace: `world-war-game`)

**Images**:
- Docker Hub: `suparious/world-war-game:latest`
- Public URL: `https://hub.docker.com/r/suparious/world-war-game`

---

## 🛠️ TECH STACK

### Frontend (React + Vite)
- **React**: 18.2.0 (UI framework)
- **Vite**: 7.1.11 (build tool, dev server)
- **Build Output**: `dist/` directory (static files)
- **Dev Port**: 5173 (Vite default)

### Production (Docker + Kubernetes)
- **Base Image**: node:24-alpine (build stage)
- **Runtime**: nginx:alpine (production stage)
- **Build**: Multi-stage Dockerfile
- **Orchestration**: Kubernetes 1.34+
- **Ingress**: nginx-ingress with Let's Encrypt DNS-01

---

## 📁 PROJECT STRUCTURE

```
world-war-game/
├── docs/                      # Game documentation
│   ├── game_rules.md          # Rules and mechanics
│   └── design_notes.md        # Design decisions
├── src/                       # Source code
│   ├── core/                  # Game logic
│   │   ├── models.js          # Data models
│   │   ├── game-engine.js     # Game initialization
│   │   ├── game-state.js      # State management
│   │   ├── combat-system.js   # Combat resolution
│   │   ├── resource-manager.js # Resource management
│   │   ├── tech-manager.js    # Technology system
│   │   ├── events/            # Dynamic events
│   │   └── ai-player.js       # AI opponents
│   ├── ui/                    # React components
│   │   ├── GameBoard.jsx      # Game board
│   │   ├── GameDashboard.jsx  # Controls and status
│   │   ├── TechTree.jsx       # Tech tree UI
│   │   └── EventsDisplay.jsx  # Events display
│   ├── assets/                # Game assets
│   │   ├── maps/              # Map definitions
│   │   └── tech-tree.js       # Tech tree data
│   └── App.jsx                # Main app component
├── public/                    # Static assets
├── k8s/                       # Kubernetes manifests (K8s deployment only)
│   ├── 01-namespace.yaml
│   ├── 02-deployment.yaml
│   ├── 03-service.yaml
│   └── 04-ingress.yaml
├── tests/                     # Test cases
├── index.html                 # HTML entry point
├── vite.config.js             # Vite configuration
├── package.json               # Dependencies
├── Dockerfile                 # Multi-stage build (K8s deployment only)
├── nginx.conf                 # Production web server config (K8s deployment only)
├── build-and-push.ps1         # Docker build script (K8s deployment only)
├── deploy.ps1                 # Kubernetes deployment (K8s deployment only)
├── CLAUDE.md                  # This file (K8s deployment only)
└── README.md                  # Project documentation
```

**Note**: Files marked "K8s deployment only" are in the submodule but NOT in the standalone game repository.

---

## 🚀 DEVELOPMENT WORKFLOW

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (HMR enabled)
npm run dev
# Access: http://localhost:5173

# Build for production
npm run build
# Output: dist/

# Preview production build
npm run preview
# Access: http://localhost:4173
```

### Docker Testing

```bash
# Build image locally
.\build-and-push.ps1

# Test image
docker run --rm -p 8080:80 suparious/world-war-game:latest
# Access: http://localhost:8080
```

### Production Deployment

```bash
# Build and push to Docker Hub
.\build-and-push.ps1 -Login -Push

# Deploy to Kubernetes
.\deploy.ps1

# Or build + push + deploy in one command
.\deploy.ps1 -Build -Push
```

---

## 📋 DEPLOYMENT

### Quick Deploy (Recommended)

```powershell
# Full deployment (build, push, deploy)
.\deploy.ps1 -Build -Push

# Deploy only (uses existing Docker Hub image)
.\deploy.ps1

# Uninstall
.\deploy.ps1 -Uninstall
```

### Manual Deployment

```bash
# Build and push Docker image
docker build -t suparious/world-war-game:latest .
docker push suparious/world-war-game:latest

# Deploy to cluster
kubectl apply -f k8s/

# Verify deployment
kubectl get all -n world-war-game
kubectl get certificate -n world-war-game
kubectl get ingress -n world-war-game
```

---

## 🔧 COMMON TASKS

### View Logs

```bash
# All pods
kubectl logs -n world-war-game -l app=world-war-game -f

# Specific pod
kubectl logs -n world-war-game <pod-name> -f
```

### Update Deployment

```bash
# Restart pods (pull latest image)
kubectl rollout restart deployment/world-war-game -n world-war-game

# Watch rollout status
kubectl rollout status deployment/world-war-game -n world-war-game
```

### Troubleshooting

```bash
# Check pod status
kubectl get pods -n world-war-game

# Describe pod (events and errors)
kubectl describe pod -n world-war-game <pod-name>

# Check certificate status
kubectl describe certificate -n world-war-game world-war-game-tls

# Check ingress
kubectl describe ingress -n world-war-game world-war-game
```

---

## 🎯 USER PREFERENCES (CRITICAL)

### Solutions
- ✅ **Complete, working solutions** - Every change must be immediately deployable
- ✅ **Direct execution** - Use available tools, verify in real-time
- ✅ **No back-and-forth** - Show results, iterate to solution
- ❌ **NO workarounds** - If symptoms remain, keep digging for root cause
- ❌ **NO temporary files** - All code is production code
- ❌ **NO disabled functionality** - Don't hack around errors, fix them
- ✅ **Git as source of truth** - All changes in code, nothing manual

### Code Quality
- Full files, never patch fragments (unless part of strategy)
- Scripts work on first run (no retry logic needed)
- Documentation before infrastructure
- Reproducibility via automation

---

## 🏗️ BUILD PROCESS

### Multi-Stage Docker Build

**Stage 1: Builder** (node:24-alpine)
1. Install npm dependencies
2. Build React app with Vite (`npm run build`)
3. Output: `dist/` directory with static files

**Stage 2: Production** (nginx:alpine)
1. Copy `dist/` from builder stage
2. Copy nginx configuration
3. Expose port 80
4. Health check endpoint

**Build Time**: ~2-5 minutes
**Image Size**: ~25-30 MB (nginx + static files)

---

## 🌐 NETWORKING

**Ingress Configuration**:
- Host: `worldwar.lab.hq.solidrust.net`
- TLS: Let's Encrypt DNS-01 (automatic via cert-manager)
- Certificate Secret: `world-war-game-tls`
- Ingress Class: `nginx`
- SSL Redirect: Enabled

**Service**:
- Type: ClusterIP
- Port: 80 (HTTP)
- Target Port: 80 (nginx container)

**Access**:
- Production: `https://worldwar.lab.hq.solidrust.net`
- Redirects HTTP → HTTPS automatically

---

## 📊 RESOURCE ALLOCATION

**Deployment**:
- Replicas: 2 (high availability)
- Strategy: RollingUpdate

**Container Resources**:
- **Requests**: 100m CPU, 128Mi memory
- **Limits**: 500m CPU, 256Mi memory

**Probes**:
- **Liveness**: HTTP GET / every 30s (after 10s initial delay)
- **Readiness**: HTTP GET / every 10s (after 5s initial delay)

**Rationale**: Static SPA, low resource requirements, nginx is very efficient

---

## 🔍 VALIDATION

### After Deployment

```bash
# 1. Check pods are running
kubectl get pods -n world-war-game
# Expected: 2/2 pods Running

# 2. Check service
kubectl get svc -n world-war-game
# Expected: ClusterIP service on port 80

# 3. Check ingress
kubectl get ingress -n world-war-game
# Expected: worldwar.lab.hq.solidrust.net with ADDRESS

# 4. Check certificate
kubectl get certificate -n world-war-game
# Expected: READY=True

# 5. Test application
curl -k https://worldwar.lab.hq.solidrust.net
# Expected: HTML response with game content

# 6. Browser test
# Open https://worldwar.lab.hq.solidrust.net
# Expected: Green padlock, game loads
```

---

## 💡 KEY DECISIONS

### Why Vite (not webpack)?
- Faster dev server (HMR)
- Modern build tool
- Better DX (developer experience)
- Smaller bundle sizes

### Why nginx (not Node.js server)?
- Static SPA doesn't need Node.js runtime
- nginx is lightweight and fast
- Lower resource usage
- Better performance for serving static files

### Why 2 replicas?
- High availability
- Zero-downtime deployments
- Load distribution
- Better than 1 (no HA) or 3+ (overkill for static site)

### Why ClusterIP service?
- No external LoadBalancer needed
- Traffic comes through Ingress only
- Standard pattern for web apps on this platform

---

## 🎓 AGENT SUCCESS CRITERIA

You're doing well if:

✅ You understand this is a React + Vite SPA
✅ You know dev server is `npm run dev` (port 5173)
✅ You know production is static files served by nginx
✅ You reference ChromaDB for platform integration questions
✅ You provide complete solutions (never workarounds)
✅ You use PowerShell scripts for deployment
✅ You validate changes work end-to-end
✅ You remember this is a strategic board game (not action game)
✅ You check package.json for available npm scripts
✅ You respect Shaun's "no workarounds" philosophy

---

## 📅 CHANGE HISTORY

| Date | Change | Impact |
|------|--------|--------|
| 2025-11-09 | Initial onboarding | Project added to SRT-HQ K8s platform |
| 2025-11-09 | Created Dockerfile | Multi-stage build for production |
| 2025-11-09 | Created K8s manifests | Deployment, Service, Ingress configured |
| 2025-11-09 | Created PowerShell scripts | build-and-push.ps1, deploy.ps1 |
| 2025-11-09 | Added as git submodule | Integrated into srt-hq-k8s repo |

---

**Last Updated**: 2025-11-09
**Status**: Production Ready
**Platform**: SRT-HQ Kubernetes
**Access**: https://worldwar.lab.hq.solidrust.net

---

*Attach this file to World War Game conversations for complete context.*
