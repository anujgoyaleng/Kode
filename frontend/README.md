Frontend (React + Vite)

Prerequisites
- Node 18+
- Backend running on http://localhost:5000 (or set VITE_API_URL)

Setup
```bash
cd frontend
npm install
npm run dev
```

If backend URL differs, create `.env` in `frontend`:
```bash
VITE_API_URL=http://localhost:5000/api
```

Pages
- Login `/login`
- Student `/student`
- Faculty `/faculty`
- Analytics `/analytics`

Notes
- JWT stored in localStorage; refresh handled automatically.
- Certificates upload supported for students (PDF/images).

