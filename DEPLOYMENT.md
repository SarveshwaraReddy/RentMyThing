# Rent My Thing Deployment

## Backend

1. In backend folder:

```bash
cd backend
npm install
```

2. Set env vars:

- MONGO_URI
- JWT_SECRET
- JWT_EXPIRE (optional)
- CLIENT_URL
- PORT (optional)
- NODE_ENV=production

3. Start backend:

```bash
npm start
```

## Frontend

1. In frontend folder:

```bash
cd frontend
npm install
```

2. Set env var:

- VITE_API_BASE_URL=https://your-backend.com/api

3. Build frontend:

```bash
npm run build
```

## Netlify

1. Push repo to Git.
2. Create site on Netlify.
3. Set build options:
   - Base directory: frontend
   - Build command: npm run build
   - Publish directory: dist
4. Set Netlify env var:
   - VITE_API_BASE_URL=https://your-backend.com/api
5. Set backend env var:
   - CLIENT_URL=https://<your-netlify-site>.netlify.app

## Vercel (Frontend - Recommended)

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Import the repository into your Vercel Dashboard.
3. In the project configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (or other if detected automatically).
   - Verify the build command is `npm run build` and output directory is `dist`.
4. Add the Environment Variable under **Environment Variables**:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-api.com/api` (the URL where your backend is hosted).
5. Click **Deploy**.
6. Set your backend's `CLIENT_URL` environment variable to your Vercel deployment URL (e.g. `https://your-site.vercel.app`) to allow CORS request credentials.

> [!IMPORTANT]
> Because the backend utilizes WebSockets (socket.io) for live chat and local image uploads, it should be deployed to a stateful hosting platform like Render, Railway, or fly.io instead of Vercel.

## Example env

Backend:

```text
MONGO_URI=...
JWT_SECRET=...
CLIENT_URL=https://<your-netlify-site>.netlify.app
PORT=5000
NODE_ENV=production
```

Frontend:

```text
VITE_API_BASE_URL=https://your-backend.com/api
```
