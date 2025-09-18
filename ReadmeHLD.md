
## 🎯 High Level Design (HLD)

### 1. **Architecture Overview**
- **Frontend:**  
  - React (or Next.js for SSR + SEO)  
  - TailwindCSS / Material UI for quick and clean UI  
  - Axios / Fetch for API calls  

- **Backend:**  
  - Node.js + Express (REST APIs) OR Django/FastAPI (if team prefers Python stack)  
  - JWT-based Authentication  
  - Role-based Access Control (Student, Faculty, Admin)  

- **Database:**  
  - PostgreSQL/MySQL (Relational → better for structured student data & activities)  
  - MongoDB (Optional if you want flexible portfolio/achievements storage)  

- **File Storage:**  
  - For prototype → Local storage (uploads folder)  
  - Later → Cloud (AWS S3, GCP, Azure Blob, etc.)  

- **Deployment (Prototype stage):**  
  - Render / Railway / Heroku (free-tier backend hosting)  
  - Vercel / Netlify (frontend hosting)  
  - ElephantSQL / NeonDB / PlanetScale (free database hosting)  

---

### 2. **Core Modules**
1. **Authentication & User Management**  
   - JWT login (Student, Faculty, Admin)  
   - Google SSO (optional for prototype polish)  

2. **Student Profile (Portfolio)**  
   - Basic Info (Name, Roll, Department, Contact)  
   - Academic Achievements (GPA, Courses, Certifications)  
   - Extracurricular Activities (Events, Clubs, Volunteering, Projects)  
   - Upload Certificates/Proof (PDF, Images)  

3. **Faculty & Admin Dashboard**  
   - View/manage students  
   - Validate student claims (approve/reject certificates)  
   - Generate reports  

4. **Analytics Module (Prototype-lite)**  
   - Simple dashboards (graphs with chart.js / recharts)  
   - Stats like: no. of events participated, avg GPA, top skills  

5. **Export/Sharing**  
   - Download portfolio as PDF (prototype can just generate a styled HTML-to-PDF)  

---

### 3. **Data Flow (Simplified)**  
1. Student → logs in → fills profile data → uploads certificates  
2. Backend API → stores in DB → stores file locally  
3. Faculty/Admin → logs in → validates submissions  
4. Student Portfolio → visible in dashboard → exportable as PDF  
5. Analytics Dashboard → queries aggregated DB results → shows charts  

---

### 4. **Tech Stack Suggestion (Prototype-Friendly)**  
- **Frontend:** React + TailwindCSS + Recharts  
- **Backend:** Node.js + Express  
- **DB:** PostgreSQL (via free NeonDB/ElephantSQL)  
- **Auth:** JWT  
- **File Upload:** Multer (for handling certificate uploads)  
- **Deployment:**  
  - Frontend → Vercel  
  - Backend → Render/Heroku  
  - DB → Free hosted Postgres  

---

### 5. **System Design Diagram (Prototype HLD)**  

```
[ React Frontend ]  <-->  [ Express Backend API ]  <-->  [ Postgres DB ]
                                 |
                           [ File Storage ]
```

---

⚡ **Execution Path for Presentation Prototype:**  
- Build **3–4 screens**: Login, Student Dashboard, Faculty Dashboard, Analytics.  
- Hook with simple backend CRUD APIs.  
- Store data in a hosted Postgres DB.  
- Use dummy certificate uploads + basic charting.  
- Export portfolio → PDF with one click (jsPDF).  

---