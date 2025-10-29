# 🚀 Complete Deployment Guide - University Chatbot

## Problem Statement
**Issue:** Intent model (`suplex-city/intent_classifier`) is too large for Vercel deployment (exceeds 250MB serverless function limit)

**Solution:** Deploy components separately with appropriate platforms based on requirements

---

## 📊 Deployment Architecture Overview

```
Frontend (Vercel/Netlify)
    ↓
Backend (Railway/Render/Heroku)
    ↓
AI Agent (Hugging Face Spaces / AWS Lambda / Google Cloud Run)
    ↓
MongoDB Atlas (Cloud Database)
```

---

## 🎯 Recommended Deployment Strategy

### **Option 1: Cost-Effective (Best for Students/Small Projects)**

| Component | Platform | Cost | Reason |
|-----------|----------|------|--------|
| Frontend | **Vercel** | Free | Fast CDN, auto-deploy from Git |
| Backend | **Railway** | Free tier (500hrs) | Easy Node.js deployment |
| AI Agent | **Hugging Face Spaces** | Free | Built for ML models, no size limits |
| Database | **MongoDB Atlas** | Free (512MB) | Managed MongoDB service |

### **Option 2: Production-Ready (Scalable)**

| Component | Platform | Cost | Reason |
|-----------|----------|------|--------|
| Frontend | **Vercel Pro** | $20/month | Better performance, analytics |
| Backend | **Railway Pro** | Pay-as-you-go | Auto-scaling, monitoring |
| AI Agent | **Google Cloud Run** | Pay-as-you-go | Containerized, auto-scale, GPU support |
| Database | **MongoDB Atlas M10** | ~$60/month | Dedicated cluster, backups |

### **Option 3: AWS-Based (Enterprise)**

| Component | Platform | Cost | Reason |
|-----------|----------|------|--------|
| Frontend | **AWS S3 + CloudFront** | ~$5/month | Global CDN, highly available |
| Backend | **AWS ECS Fargate** | Pay-as-you-go | Containerized, managed |
| AI Agent | **AWS Lambda + ECR** | Pay-as-you-go | Serverless with container support |
| Database | **MongoDB Atlas** | Variable | Cross-cloud compatibility |

---

## 📦 Step-by-Step Deployment Guide

## Part 1: Deploy Database (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Account
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create new cluster (M0 Free tier)
4. Choose cloud provider and region closest to your backend
5. Create database user with password
6. Whitelist IP address (use `0.0.0.0/0` for all IPs during development)
7. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/chatbot?retryWrites=true&w=majority`

### Step 2: Update Backend .env
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot?retryWrites=true&w=majority
```

---

## Part 2: Deploy AI Agent (Hugging Face Spaces - Recommended)

### Why Hugging Face Spaces?
- ✅ No size limits for models
- ✅ Free tier available
- ✅ Built-in GPU support
- ✅ Persistent storage
- ✅ Automatic HTTPS

### Step 1: Prepare Agent Code

Create `Agent/requirements.txt` (optimize for deployment):
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-dotenv==1.0.0
PyPDF2==3.0.1
pillow==10.1.0
pytesseract==0.3.10
scikit-learn==1.3.2
numpy==1.26.2
langchain-google-genai==0.0.6
transformers==4.35.2
torch==2.1.1
```

### Step 2: Create Dockerfile for AI Agent

Create `Agent/Dockerfile`:
```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the model (this solves the size issue)
RUN python -c "from transformers import pipeline; pipeline('text-classification', model='suplex-city/intent_classifier')"

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 3: Deploy to Hugging Face Spaces

1. **Create Space:**
   - Go to [huggingface.co/spaces](https://huggingface.co/spaces)
   - Click "Create new Space"
   - Name: `university-chatbot-agent`
   - SDK: **Docker**
   - Make it Public or Private

2. **Push Code to Space:**
```bash
# Install Git LFS (for large files)
git lfs install

# Clone your space
git clone https://huggingface.co/spaces/YOUR_USERNAME/university-chatbot-agent
cd university-chatbot-agent

# Copy your Agent files
cp -r d:/Project/Agent/* .

# Add environment variables in HF Spaces settings:
# Go to Settings → Repository secrets
# Add: GOOGLE_API_KEY=your_gemini_api_key

# Commit and push
git add .
git commit -m "Initial deployment"
git push
```

3. **Get Your API URL:**
   - Space URL: `https://YOUR_USERNAME-university-chatbot-agent.hf.space`
   - API endpoints will be:
     - `https://YOUR_USERNAME-university-chatbot-agent.hf.space/predict_intent`
     - `https://YOUR_USERNAME-university-chatbot-agent.hf.space/extract_slots`
     - `https://YOUR_USERNAME-university-chatbot-agent.hf.space/query`

### Alternative: Google Cloud Run

If you prefer Google Cloud Run:

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/chatbot-agent

# Deploy to Cloud Run
gcloud run deploy chatbot-agent \
  --image gcr.io/YOUR_PROJECT_ID/chatbot-agent \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --set-env-vars GOOGLE_API_KEY=your_api_key
```

---

## Part 3: Deploy Backend (Railway)

### Why Railway?
- ✅ Simple deployment from Git
- ✅ Automatic HTTPS
- ✅ Environment variable management
- ✅ Free tier (500 hours/month)
- ✅ Supports Node.js out of the box

### Step 1: Prepare Backend Code

Update `Backend/package.json` to include start script:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set root directory to `/Backend`

### Step 3: Configure Environment Variables

In Railway dashboard, add these variables:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot
INTENT_API_URL=https://YOUR_USERNAME-university-chatbot-agent.hf.space
SLOT_API_URL=https://YOUR_USERNAME-university-chatbot-agent.hf.space
RAG_API_URL=https://YOUR_USERNAME-university-chatbot-agent.hf.space
PORT=5000
NODE_ENV=production
```

### Step 4: Deploy

Railway auto-deploys on push. Get your backend URL:
- Example: `https://university-chatbot-backend-production.up.railway.app`

### Alternative: Render.com

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Root Directory: `Backend`
5. Build Command: `npm install`
6. Start Command: `node server.js`
7. Add environment variables
8. Deploy

---

## Part 4: Deploy Frontend (Vercel)

### Step 1: Update API URLs in Frontend

Update `Frontend/src/App.jsx` to use deployed backend:

```javascript
// Replace localhost with your deployed backend URL
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// In handleStartConversation:
const response = await fetch(`${BACKEND_URL}/api/chat/start`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId: Date.now().toString(),
  }),
});

// In handleSendMessage:
const response = await fetch(`${BACKEND_URL}/api/chat/message`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sessionId: userId, text: inputValue }),
});
```

### Step 2: Create Environment File

Create `Frontend/.env.production`:
```env
VITE_BACKEND_URL=https://your-backend-url.railway.app
```

### Step 3: Deploy to Vercel

**Option A: Via CLI**
```bash
cd Frontend
npm install -g vercel
vercel --prod
# Follow prompts to link project
```

**Option B: Via GitHub (Recommended)**
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set root directory to `Frontend`
5. Add environment variable: `VITE_BACKEND_URL=https://your-backend-url.railway.app`
6. Deploy

### Step 4: Configure CORS

Update `Backend/server.js` to allow your Vercel domain:
```javascript
app.use(cors({ 
  origin: [
    "https://your-frontend.vercel.app",
    "http://localhost:5173" // Keep for local development
  ]
}));
```

---

## 🔧 Optimizing Large Model Deployment

### Strategy 1: Model Quantization (Reduce Size)

Update `Agent/intent_model.py`:
```python
from transformers import pipeline
import torch

MODEL_PATH = "suplex-city/intent_classifier"

# Load with quantization to reduce memory
intent_model = pipeline(
    "text-classification", 
    model=MODEL_PATH,
    device=-1,  # Use CPU
    model_kwargs={
        "torch_dtype": torch.float16,  # Half precision
        "low_cpu_mem_usage": True
    }
)
```

### Strategy 2: Lazy Loading

```python
# Load model only when needed
_intent_model = None

def get_intent_model():
    global _intent_model
    if _intent_model is None:
        _intent_model = pipeline("text-classification", model=MODEL_PATH)
    return _intent_model

def predict_intent(query: str):
    model = get_intent_model()
    result = model(query)[0]
    # ... rest of code
```

### Strategy 3: External Model Hosting

Host model on Hugging Face Inference API:

```python
import requests
import os

HF_API_TOKEN = os.getenv("HF_API_TOKEN")
MODEL_API_URL = "https://api-inference.huggingface.co/models/suplex-city/intent_classifier"

def predict_intent(query: str):
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}
    response = requests.post(MODEL_API_URL, headers=headers, json={"inputs": query})
    result = response.json()[0]
    
    label = result["label"]
    confidence = result["score"]
    intent_name = LABEL_TO_INTENT.get(label, label)
    
    return {"intent": intent_name, "confidence": confidence}
```

---

## 🐳 Complete Docker Compose Setup (For VPS/Self-Hosting)

Create `docker-compose.yml` at project root:

```yaml
version: '3.8'

services:
  # MongoDB
  mongodb:
    image: mongo:7
    container_name: chatbot-mongodb
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: your_password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  # AI Agent (Python/FastAPI)
  agent:
    build:
      context: ./Agent
      dockerfile: Dockerfile
    container_name: chatbot-agent
    restart: always
    environment:
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
    ports:
      - "8000:8000"
    volumes:
      - ./Agent/admin_docs:/app/admin_docs

  # Backend (Node.js/Express)
  backend:
    build:
      context: ./Backend
      dockerfile: Dockerfile
    container_name: chatbot-backend
    restart: always
    environment:
      - MONGO_URI=mongodb://admin:your_password@mongodb:27017/chatbot?authSource=admin
      - INTENT_API_URL=http://agent:8000
      - SLOT_API_URL=http://agent:8000
      - RAG_API_URL=http://agent:8000
      - PORT=5000
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
      - agent

  # Frontend (React/Vite) - Production build served by Nginx
  frontend:
    build:
      context: ./Frontend
      dockerfile: Dockerfile
    container_name: chatbot-frontend
    restart: always
    environment:
      - VITE_BACKEND_URL=http://localhost:5000
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

### Create Backend Dockerfile

`Backend/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

### Create Frontend Dockerfile

`Frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Create `Frontend/nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Deploy with Docker Compose

```bash
# Create .env file
echo "GOOGLE_API_KEY=your_api_key" > .env

# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f

# Access application at http://localhost
```

---

## 🌐 Domain & HTTPS Setup

### Using Cloudflare (Free HTTPS)

1. Buy domain (Namecheap, GoDaddy, etc.)
2. Add site to Cloudflare (free plan)
3. Point DNS records:
   - `A` record: `@` → Your server IP
   - `CNAME` record: `www` → `@`
4. Enable Cloudflare proxy (orange cloud icon)
5. SSL/TLS mode: Full (strict)

### Using Let's Encrypt (Self-Hosted)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Update nginx.conf to use SSL
```

---

## 📊 Monitoring & Logging

### Add Health Check Endpoints

`Backend/server.js`:
```javascript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    uptime: process.uptime()
  });
});
```

### Use Monitoring Services

- **Uptime Robot** - Free uptime monitoring
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Google Analytics** - User analytics

---

## 💰 Cost Estimation

### Free Tier (For Testing)
- MongoDB Atlas: Free (512MB)
- Railway: Free (500 hours/month)
- Hugging Face Spaces: Free (with rate limits)
- Vercel: Free (with limits)
- **Total: $0/month**

### Production (Medium Traffic)
- MongoDB Atlas M10: $60/month
- Railway Pro: ~$20/month
- Google Cloud Run: ~$30/month (with AI workload)
- Vercel Pro: $20/month
- **Total: ~$130/month**

### High Traffic (Scalable)
- MongoDB Atlas M30: $200/month
- AWS ECS: ~$100/month
- AWS Lambda + GPU: ~$200/month
- CloudFront: ~$50/month
- **Total: ~$550/month**

---

## 🚨 Common Deployment Issues & Solutions

### Issue 1: CORS Errors
**Solution:** Update backend CORS to include frontend domain

### Issue 2: Environment Variables Not Working
**Solution:** Check platform-specific variable syntax (Railway uses `${{VARIABLE}}`)

### Issue 3: Model Loading Timeout
**Solution:** Increase timeout limits in FastAPI and use model caching

### Issue 4: Database Connection Fails
**Solution:** Whitelist deployment server IPs in MongoDB Atlas

### Issue 5: Large Model Memory Issues
**Solution:** Use model quantization or external API

---

## ✅ Pre-Deployment Checklist

- [ ] Remove hardcoded secrets (API keys, passwords)
- [ ] Add all domains to CORS whitelist
- [ ] Test all API endpoints with deployed URLs
- [ ] Set up error logging (Sentry)
- [ ] Configure database backups
- [ ] Add rate limiting to prevent abuse
- [ ] Enable HTTPS for all services
- [ ] Set up monitoring alerts
- [ ] Document API endpoints
- [ ] Create deployment runbook

---

## 🔄 CI/CD Setup (Automated Deployment)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy University Chatbot

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd Frontend && npm install && npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./Frontend

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          # Railway auto-deploys from GitHub
          echo "Backend deploys automatically via Railway"

  deploy-agent:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Hugging Face Spaces
        run: |
          git remote add hf https://huggingface.co/spaces/${{ secrets.HF_USERNAME }}/university-chatbot-agent
          git subtree push --prefix Agent hf main
```

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Hugging Face Spaces](https://huggingface.co/docs/hub/spaces)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [Docker Documentation](https://docs.docker.com)
- [Google Cloud Run](https://cloud.google.com/run/docs)

---

**Need Help?** Open an issue on GitHub or contact the development team.

*Last Updated: October 2025*
