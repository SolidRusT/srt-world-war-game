# World War Game - Kubernetes Deployment

Risk-inspired strategic board game deployed on SRT-HQ Kubernetes platform.

**Production**: https://worldwar.lab.hq.solidrust.net

---

## Quick Start

### Development

```bash
# Install and run locally
npm install
npm run dev

# Access: http://localhost:5173 (Vite dev server with HMR)
```

### Docker (Local Testing)

```bash
# Build image
.\build-and-push.ps1

# Test image
docker run --rm -p 8080:80 suparious/world-war-game:latest
# Access: http://localhost:8080
```

### Kubernetes (Production)

**Automated** (Recommended):
```powershell
.\deploy.ps1 -Build -Push
```

**Manual**:
```bash
# Build and push image
docker build -t suparious/world-war-game:latest .
docker push suparious/world-war-game:latest

# Deploy to cluster
kubectl apply -f k8s/

# Verify
kubectl get all -n world-war-game
kubectl get certificate -n world-war-game
kubectl get ingress -n world-war-game
```

---

## Maintenance

### Update Deployment

```bash
# Rolling update
kubectl rollout restart deployment/world-war-game -n world-war-game

# Watch status
kubectl rollout status deployment/world-war-game -n world-war-game
```

### View Logs

```bash
# All pods
kubectl logs -n world-war-game -l app=world-war-game -f

# Specific pod
kubectl logs -n world-war-game <pod-name> -f
```

### Troubleshooting

```bash
# Check pod status
kubectl get pods -n world-war-game

# Describe pod
kubectl describe pod -n world-war-game <pod-name>

# Check certificate
kubectl describe certificate -n world-war-game world-war-game-tls

# Check ingress
kubectl describe ingress -n world-war-game world-war-game
```

---

## Architecture

**Tech Stack**:
- React 18 + Vite (frontend build tool)
- nginx (production web server)
- Kubernetes (orchestration)
- Let's Encrypt (SSL certificates via DNS-01)

**Resources**:
- **Replicas**: 2 (high availability)
- **CPU**: 100m request, 500m limit
- **Memory**: 128Mi request, 256Mi limit

**Networking**:
- **URL**: https://worldwar.lab.hq.solidrust.net
- **Ingress**: nginx-ingress with SSL redirect
- **Certificate**: Automatic via cert-manager (DNS-01)

---

## Game Features

- Global map with territories and continents
- Turn-based gameplay (reinforcement, attack, fortification)
- Multiple unit types with different strengths
- Resource management system
- Technology research tree
- Dynamic events system
- AI opponents with different strategies
- Alliance system for diplomacy
- Multiple victory paths

---

## Files Overview

**Kubernetes Deployment Files** (this submodule only):
- `Dockerfile` - Multi-stage build for production
- `nginx.conf` - Production web server configuration
- `build-and-push.ps1` - Docker build and publish script
- `deploy.ps1` - Kubernetes deployment script
- `k8s/` - Kubernetes manifest files
- `CLAUDE.md` - AI assistant context
- `README-K8S.md` - This file

**Game Files** (from upstream repository):
- `src/` - Game source code (React components, game logic)
- `docs/` - Game documentation (rules, design notes)
- `public/` - Static assets
- `index.html` - Entry point
- `vite.config.js` - Vite configuration
- `package.json` - Dependencies and scripts

---

## Useful Commands

```bash
# Get all resources
kubectl get all,certificate,ingress -n world-war-game

# Check deployment status
kubectl rollout status deployment/world-war-game -n world-war-game

# Restart deployment (pull latest image)
kubectl rollout restart deployment/world-war-game -n world-war-game

# Port forward (local testing)
kubectl port-forward -n world-war-game deployment/world-war-game 8080:80
# Access: http://localhost:8080

# Uninstall
.\deploy.ps1 -Uninstall
```

---

## Links

- **Production**: https://worldwar.lab.hq.solidrust.net
- **Docker Hub**: https://hub.docker.com/r/suparious/world-war-game
- **GitHub**: https://github.com/SolidRusT/srt-world-war-game
- **Platform**: https://github.com/SolidRusT/srt-hq-k8s

---

**Last Updated**: 2025-11-09
**Deployed By**: SRT-HQ Kubernetes Platform
