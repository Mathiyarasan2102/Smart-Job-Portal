# Smart Job Portal

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/Frontend-React_19-blue) ![Node](https://img.shields.io/badge/Backend-Node.js-green) ![MySQL](https://img.shields.io/badge/Database-MySQL-orange)

> A production-ready, full-stack recruitment platform designed to streamline the hiring process. Built with modern web technologies, it features role-based access control, real-time application tracking, and secure data handling.

---

## 📖 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture & Design](#-architecture--design)
- [Getting Started](#-getting-started)
- [Database Schema](#-database-schema)


---

## � Overview

**Smart Job Portal** bridges the gap between talent and opportunity. It serves as a dual-facing platform:
1.  **For Recruiters:** An Applicant Tracking System (ATS) to post jobs, manage applications, and shortlist candidates efficiently.
2.  **For Candidates:** A seamless interface to search for jobs, apply with one click, and track application status.

This project demonstrates **full-stack proficiency**, emphasizing security (JWT, Bcrypt), performance (MySQL Connection Pooling), and modern UI/UX principles (Tailwind CSS, Responsive Design).

---

## 🚀 Key Features

### 🏢 For Recruiters (Admin Panel)
*   **Dashboard Analytics**: Visual insights into active jobs, total applications, and recent activities.
*   **Job Management**: Create, edit, and delete job postings with rich details (salary, skills, location).
*   **Applicant Tracking System (ATS)**:
    *   View all applicants per job.
    *   **Resume Preview**: View PDF/DOCX resumes directly in the browser without downloading.
    *   **Status Workflow**: Move candidates through stages (Pending → Shortlisted → Rejected/Hired).
*   **Export Data**: Download applicant lists as CSV for offline analysis.

### 👨‍💻 For Candidates
*   **Advanced Search**: Filter jobs by keyword, location, type (Full-time, Contract), and salary range.
*   **One-Click Apply**: Streamlined application process with file upload support.
*   **Application History**: specialized dashboard to mark saved jobs and track status of applied positions.
*   **Mobile Optimized**: Fully responsive interface for on-the-go access.

---

## 🛠 Tech Stack

### Frontend
*   **Framework**: [React 19](https://react.dev/) (latest) with [Vite](https://vitejs.dev/) for lightning-fast builds.
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) for a utility-first, custom design system.
*   **Icons**: [Lucide React](https://lucide.dev/) for consistent, crisp iconography.
*   **Routing**: [React Router 7](https://reactrouter.com/) for seamless client-side navigation.
*   **Notifications**: `react-hot-toast` for user-friendly alerts.

### Backend
*   **Runtime**: Node.js
*   **Framework**: [Express 5](https://expressjs.com/) (latest beta) for robust API handling.
*   **Database**: MySQL with `mysql2` driver (utilizing connection pools for scalability).
*   **Authentication**:
    *   **JWT (JSON Web Tokens)**: Stateless, secure session handling.
    *   **Bcrypt**: Industry-standard password hashing.
*   **File Handling**: `Multer` for secure resume uploads and storage.

---

## 🏗 Architecture & Design

*   **MVC Pattern**: Strict separation of concerns (Models/Controllers/Routes) ensures code maintainability.
*   **Security First**:
    *   **Input Validation**: Strict validation on all API endpoints.
    *   **SQL Injection Prevention**: All queries use parameterized statements.
    *   **Secure Headers**: CORS configured for controlled access.
*   **Performance**:
    *   **Component Composition**: React components designed for reusability.
    *   **Optimized Queries**: Raw SQL used for complex joins to avoid ORM overhead.

---

## ⚡ Getting Started

Follow these steps to set up the project locally.

### Prerequisites
*   Node.js (v18 or higher)
*   MySQL Server installed and running

### 1. Database Setup
Create the database and tables using the provided schema.
```sql
-- Log in to MySQL
mysql -u root -p

-- Create Database & Tables
source backend/db/schema.sql;
```

### 2. Backend Installation
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure Environment Variables
# Create a .env file in /backend with:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=job_portal
JWT_SECRET=your_super_secure_secret_key

# Start the server
npm run dev
```

### 3. Frontend Installation
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app should now be running at `http://localhost:5173` (Frontend) and `http://localhost:5000` (Backend).

---

## 🗄 Database Schema

The core database consists of three primary tables linked by foreign keys:

*   **Users**: Stores authentication data and roles (`recruiter` or `candidate`).
*   **Jobs**: Stores job details, linked to the recruiter who posted it.
*   **Applications**: Links `Users` (candidates) to `Jobs`, storing resume paths and status.

---



---

## � License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Developed by **Mathiyarasan P**
