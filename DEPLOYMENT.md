# Deployment Guide

This project is configured as a monorepo containing both a `frontend` (Next.js) and `backend` (Node.js/Express). Below are the easiest ways to deploy to the most popular platforms.

## 1. Vercel (Easiest Fullstack Deployment)

A `vercel.json` file is included in the root directory. Vercel will deploy your Next.js frontend and automatically configure your Node.js backend as serverless functions.

**Steps:**
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **Add New > Project**.
3. Import your GitHub repository.
4. Leave the Framework Preset and Root Directory as default (the `vercel.json` handles routing).
5. In the **Environment Variables** section, add your `GEMINI_API_KEY`.
6. Click **Deploy**.
   
*Note: Your API will be accessible at `/api/import`.*

---

## 2. Render (Infrastructure as Code)

A `render.yaml` Blueprint is provided which defines two separate services: a frontend web service and a backend web service.

**Steps:**
1. Push your repository to GitHub.
2. Go to the [Render Dashboard](https://dashboard.render.com/) and click **New > Blueprint**.
3. Connect your repository.
4. Render will automatically detect the `render.yaml` file and prompt you to create both `groweasy-frontend` and `groweasy-backend`.
5. Enter your `GEMINI_API_KEY` securely when prompted.
6. Click **Apply**. Render will build and deploy both services automatically.

---

## 3. Railway (Best for Long-Running Backends)

Railway is excellent for this setup but is best configured directly through their UI to create two distinct services from a single repository.

**Steps:**
1. Push your repository to GitHub.
2. Go to [Railway](https://railway.app/) and click **New Project > Deploy from GitHub repo**.
3. Select your repository. This will create your first service (e.g., Backend).
4. **Configure the Backend:**
   - Go to the Service Settings.
   - Set the **Root Directory** to `/backend`.
   - Add your `GEMINI_API_KEY` in the Variables tab.
   - Generate a domain for the backend in the Networking tab.
5. **Add the Frontend:**
   - Click **+ New > GitHub Repo** and select the *same* repository again.
   - Go to this new Service's Settings.
   - Set the **Root Directory** to `/frontend`.
   - In the Variables tab, add `NEXT_PUBLIC_API_URL` pointing to your Railway backend domain.
   - Generate a domain for the frontend.
6. Railway will automatically build using Nixpacks and deploy both services!
