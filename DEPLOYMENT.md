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
