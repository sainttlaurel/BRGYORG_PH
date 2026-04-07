# Payatas Ledger - Civic Management System

A barangay management system for Barangay Payatas, Quezon City, Philippines. This web application provides comprehensive civic administration tools including resident management, document request processing, complaint handling, project tracking, and community announcements.

## ✨ Latest Enhancements

- **Public Resident Directory** - New secure lookup portal for residents to verify their registration status.
- **Privacy-First Design** - Public resident searches now strictly limit data exposure to Name, Purok, and Status.
- **Premium Glassmorphism UI** - System-wide aesthetic overhaul using modern blur effects, translucent surfaces, and vibrant accent colors.
- **Mobile Responsive Optimization** - Fully optimized for all smartphone displays (Chrome, Safari, iOS/Android) with flexible tabbed interfaces.
- **Advanced Document Workflow** - Integrated **Admin Remarks** and **Status Timelines** for transparent document processing.

## Features

### Core Modules
- **Dashboard** - Overview of barangay statistics, recent activities, and quick actions.
- **Residents** - Manage resident directory with CRUD operations and detailed profile drawers.
- **Document Requests** - Process and track official document certifications (Clearance, Indigency, Residency, etc.) with custom remarks.
- **Public Verification** - Dual-purpose portal for verifying document authenticity AND resident registration status.
- **Complaints** - Handle and track citizen complaints with priority levels and bulk resolution tools.
- **Projects** - Manage and display community infrastructure and social projects with progress tracking.
- **Announcements** - Post and manage community announcements reachable by all residents.
- **Reports** - Generate operational reports and analytics with date-range filtering.

---

## 🎨 Design System

The platform follows a **Civic Horizon** design language:
- **Glassmorphism**: Surfaces use `backdrop-filter: blur(20px)` and semi-transparent backgrounds for a high-end feel.
- **Dynamic Themes**: Fully responsive Light and Dark mode support that persists across sessions.
- **Navigation**: Desktop uses a fixed slide-out drawer; Mobile uses a responsive overlay menu.
- **Typography**: Optimized using `Public Sans` for bold, accessible headings and `Inter` for clean body text.

---

## 🛠️ Technology Stack

- **HTML5 & CSS3** - Modern semantic markup and advanced CSS Grid/Flexbox layouts.
- **Vanilla JavaScript** - Robust ES6+ logic for real-time state management and DOM manipulation.
- **Supabase** - Backend-as-a-Service providing PostgreSQL database and Real-time subscriptions.
- **Material Symbols** - Standardized modern icons for clear visual hierarchy.
- **Responsive Web Design (RWD)** - Optimized for multiple viewports from mobile browsers (Safari/Chrome) to desktop displays.

---

## Login & Authentication

### Default Users (for testing)
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Super Administrator |
| staff1 | staff123 | Staff |
| staff2 | staff123 | Staff |


### Authentication Functions
| Function | Description |
|----------|-------------|
| `checkAuth()` | Check if user is logged in on page load |
| `login()` | Authenticate user with username/password |
| `logout()` | Open logout confirmation modal |
| `confirmLogout()` | Confirm logout and clear session |
| `updateAdminUI()` | Show/hide admin-only elements |

---

## 📊 Administrative Tools

### Document Detail Panel (Drawer)
Slide-out panel for viewing and processing document requests.
- **Status Management**: Toggle between Pending, Approved, and Rejected.
- **Quick Select Remarks**: Predefined templates for common approval/rejection messages.
- **History Timeline**: Visual tracking of document status changes.

### Resident Profile Panel
Comprehensive view of resident data, including their entire document request and complaint history.

---

## ⚙️ Project Setup

### 1. Database Configuration
Edit `supabase-config.js`:
```javascript
const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key-here'
};
```

### 2. Database Schema
Run the `sql/supabase-schema.sql` script in your Supabase SQL Editor to initialize all tables, RLs policies, and sample data.

---

## Project Structure

```
brgyorg-ph/
├── index.html              # Public Portal (Landing & Verification)
├── admin.html              # Administrative Dashboard
├── css/
│   ├── landing.css         # Public portal styles (Mobile Responsive)
│   └── styles.css          # Admin portal styles
├── js/
│   ├── landing.js          # Public portal logic & Verification
│   └── app.js              # Administrative engine
├── md/
│   ├── README.md           # This file
│   └── DESIGN.md           # System design & architecture
├── img/                    # Logos, seals, and backgrounds
├── sql/                    # Database schemas and migrations
└── vercel.json             # Deployment config for clean URLs
```

---

&copy; 2026 Barangay Payatas Digital Division. Powered by **Payatas Ledger**.