# 🎓 SMART CEMS — College Event Management System

> **"One Platform. Every Event. One Campus Experience."**  
> **Discover → Register → Participate → Get Certified**

Smart CEMS is an institutional, production-grade event ecosystem engineered for universities and colleges. Built with **React 18**, **Vite 5**, **Tailwind CSS 3**, **Motion for React**, **Node.js 22**, **Express.js**, and powered by **Google Firebase** (**Authentication**, **Cloud Firestore**, and **Firebase Cloud Storage**).

---

## 🏛️ Deployment & Cloud Architecture

Smart CEMS is designed for seamless modern multi-cloud deployment with zero vendor lock-in:

```text
                               GitHub Repository
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
             Vercel Frontend                       Render Backend
             (React 18 + Vite)                    (Node.js + Express)
             SPA Deep-Link Rewrites               REST API + PDFKit + QR
                   │                                     │
                   └──────────────────┬──────────────────┘
                                      │
                                      ▼
                               Google Firebase
                     ┌────────────────┼────────────────┐
                     ▼                ▼                ▼
                Firebase Auth     Firestore     Firebase Storage
              (Custom Claims)     (Transactions)   (Banners & Proofs)
```

---

## 🔄 Connected Lifecycle: Cross-Role Workflow

Smart CEMS eliminates disconnected CRUD silos. Actions taken by one role synchronously drive the lifecycle for all roles:

```text
ADMIN (Super Administrator)
   │  Approves proposals, verifies payments, inspects institution analytics & audit logs
   ▼
STAFF / FACULTY (Event Coordinators)
   │  Creates event proposals, configures venues & fees, scans gate QR passes, issues certificates
   ▼
EVENT ENGINE
   │  Applies venue conflict checks, eligibility verification, and atomic seat reservation
   ▼
STUDENT (Campus Community)
   │  Discovers recommended events, registers/joins waitlist, accesses digital QR pass
   ▼
LIVE CHECK-IN
   │  Faculty scans pass at gate → records attendance → prevents duplicate check-ins
   ▼
FEEDBACK & CERTIFICATION
   │  Event completes → feedback unlocks for attendees → cryptographically verified certificate issued
   ▼
ANALYTICS & COMPLIANCE
      Institutional reports, Excel/CSV participant rosters, and audit trails
```

---

## 🧠 Core Business Logic & Algorithms

### 1. Venue & Schedule Conflict Engine
When an event is created or edited, the backend verifies time intervals against existing approved events:
$$\text{Conflict} = (\text{Date}_A = \text{Date}_B) \land (\text{Venue}_A = \text{Venue}_B) \land (\max(\text{Start}_A, \text{Start}_B) < \min(\text{End}_A, \text{End}_B))$$
Overlapping bookings are rejected with a `409 VENUE_CONFLICT` status and highlighted in real-time on the faculty form.

### 2. Student Eligibility Verification Engine
Before registration or seat allocation, the system computes:
- User authentication & role verification (`role === 'student'`)
- Event publication status (`status === 'approved'` or `'published'`)
- Registration temporal window ($\text{Start} \le \text{Now} \le \text{Deadline}$)
- Department & academic year cohort eligibility
- Duplicate active registration prevention

### 3. Concurrency-Safe Capacity & Waitlist Engine
- **Atomic Transactions:** Uses `db.runTransaction()` to atomically read `seatsFilled` and `maxParticipants`, preventing overbooking race conditions under high concurrency.
- **Automated Waitlist Promotion:** When a confirmed attendee cancels, an atomic transaction immediately promotes the earliest waitlisted participant, generates their pass, and triggers real-time alerts.

### 4. Algorithmic Recommendations Formula
Student event discovery is personalized using a multi-factor weighted scoring formula:
$$\text{Score} = (W_{\text{cat}} \times 0.30) + (W_{\text{dept}} \times 0.25) + (W_{\text{interest}} \times 0.20) + (W_{\text{upcoming}} \times 0.15) + (W_{\text{pop}} \times 0.10)$$

### 5. Gate Attendance & Cryptographic QR Passes
- Digital passes feature cryptographically secure, high-entropy identifiers (`CEMS-2026-X8K4P2Q9`).
- Scanned gate entries are recorded using server-side timestamps with instant duplicate detection (`409 Already Checked In`).

### 6. Public Certificate Verification Portal
- Participation certificates include a secure identifier (`CERT-2026-XXXX`).
- Public verification is accessible without authentication at `/verify-certificate/:certificateId`.

---

## 👥 Role Permissions & Matrix

| Capability | Admin | Faculty / Staff | Student |
| :--- | :---: | :---: | :---: |
| Review & Approve Event Proposals | ✅ | ❌ | ❌ |
| Verify UPI Payments | ✅ | ✅ | ❌ |
| View System Compliance Audit Logs | ✅ | ❌ | ❌ |
| Create / Propose Events & Schedules | ❌ | ✅ | ❌ |
| Scan QR Passes at Event Gate | ❌ | ✅ | ❌ |
| Create & Version Feedback Surveys | ❌ | ✅ | ❌ |
| Export Attendance Rosters (PDF / Excel) | ✅ | ✅ | ❌ |
| Discover & Search Campus Events | ✅ | ✅ | ✅ |
| Register & Receive E-Ticket Pass | ❌ | ❌ | ✅ |
| Submit Event Feedback (Post-Attendance) | ❌ | ❌ | ✅ |
| Download & Verify Digital Certificates | ❌ | ❌ | ✅ |

---

## 🔐 Pre-Configured Demonstration Accounts

| Role | Email | Password | Primary Portal |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin@cems.edu` | `Admin@123` | `/admin/dashboard` |
| **Faculty Coordinator** | `faculty.cs@cems.edu` | `Faculty@123` | `/faculty/dashboard` |
| **Student** | `student.alex@cems.edu` | `Student@123` | `/student/dashboard` |

*(Convenient one-click quick-fill buttons are provided directly on `/login`).*

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite 5, React Router v6, Tailwind CSS 3, Vanilla CSS Design Tokens, Motion for React (`motion/react`), Recharts, Lucide Icons, Axios, html5-qrcode, canvas-confetti, xlsx.
- **Backend:** Node.js 22, Express.js, Firebase Admin SDK, Cloud Firestore, Firebase Auth, Firebase Storage, Cloud Functions v2, PDFKit, QR generation, ExcelJS / CSV, Nodemailer.
- **Database & Storage:** Google Cloud Firestore (NoSQL, transactions, real-time listeners), Firebase Cloud Storage.

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+ (Node.js 22 recommended)
- npm 9+
- Firebase Project configured on Google Cloud

### 1. Clone & Configure
```bash
git clone https://github.com/your-username/smart-cems.git
cd smart-cems
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Firebase and server credentials
npm start
# Server starts on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
# Vite server starts on http://localhost:5173
```

---

## ☁️ Production Deployment Guide

### A. Deploy Frontend to Vercel
1. In the Vercel dashboard, click **Add New Project** and select your GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Configure Build and Output settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Configure Environment Variables:
   - `VITE_API_URL`: `https://your-backend.onrender.com/api`
   - `VITE_FIREBASE_API_KEY`: Your Firebase Web API Key
   - `VITE_FIREBASE_AUTH_DOMAIN`: `your-app.firebaseapp.com`
   - `VITE_FIREBASE_PROJECT_ID`: `your-project-id`
   - `VITE_FIREBASE_STORAGE_BUCKET`: `your-app.firebasestorage.app`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Messaging Sender ID
   - `VITE_FIREBASE_APP_ID`: Your Web App ID
6. Deploy! Vercel automatically honors `frontend/vercel.json` for React Router SPA rewrites.

### B. Deploy Backend to Render
1. In Render, select **New Web Service** and connect your GitHub repository.
2. Set **Root Directory** to `backend`.
3. Set **Runtime** to `Node`.
4. Build & Start Commands:
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
5. Configure Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default, Render sets `PORT` automatically)
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`
   - `FIREBASE_PROJECT_ID`: `your-project-id`
   - `FIREBASE_CLIENT_EMAIL`: Your service account client email
   - `FIREBASE_PRIVATE_KEY`: Your service account private key (with `\n` preserved)
   - *(Or set `FIREBASE_SERVICE_ACCOUNT_BASE64` to the base64-encoded JSON)*
6. Deploy! Test health endpoint at `https://your-backend.onrender.com/api/health`.

### C. Deploy Firebase Rules & Indexes
```bash
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules,storage:rules,firestore:indexes
```

---

## 🔒 Security & Privacy Posture
- **Custom Claims & Server Verification:** Roles are stored in Firebase Auth custom claims and verified on every sensitive backend route. Frontend permissions are never trusted for transactions.
- **Composite Injection & Race Protection:** Transactions serialize concurrent seat requests to eliminate overselling.
- **Idempotency:** Critical actions (check-in, certificate creation, payment verification) enforce unique idempotency constraints.
- **Clean Git Repository:** All private keys, `.env` files, and service account credentials are strictly ignored in `.gitignore`.

---

## 📄 License
MIT License. Built for university campus ecosystems.
