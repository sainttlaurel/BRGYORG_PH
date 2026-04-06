# Payatas Ledger - Civic Management System

A barangay management system for Barangay Payatas, Quezon City, Philippines. This web application provides comprehensive civic administration tools including resident management, document request processing, complaint handling, project tracking, and community announcements.

## Features

### Core Modules
- **Dashboard** - Overview of barangay statistics, recent activities, and quick actions
- **Residents** - Manage resident directory with CRUD operations
- **Document Requests** - Process and track official document certifications
- **Complaints** - Handle and track citizen complaints with priority levels
- **Projects** - Manage community infrastructure and social projects
- **Announcements** - Post and manage community announcements
- **Reports** - Generate operational reports and analytics
- **Settings** - Configure system preferences and barangay information
- **Users** - User management (Admin only)

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
| `showMainApp()` | Show main application after login |
| `hideMainApp()` | Hide main app and show login screen |
| `updateUserInfo()` | Update topbar with current user info |
| `getInitials(name)` | Get initials from user name |
| `togglePassword()` | Toggle password visibility |
| `isAdmin()` | Check if current user is admin |
| `updateAdminUI()` | Show/hide admin-only elements |

---

## User Management (Admin Only)

### Functions
| Function | Description |
|----------|-------------|
| `renderUsersTable()` | Render user management table |
| `updateUserStats()` | Update user statistics cards |
| `openAddUserModal()` | Open add new user modal |
| `saveNewUser()` | Create new user account |
| `viewUser(id)` | View user details |
| `editUser(id)` | Edit user information |
| `updateUser(id)` | Save user changes |
| `deleteUser(id)` | Open delete confirmation |
| `confirmDeleteUser(id)` | Delete user permanently |
| `exportUsersCSV()` | Export users to CSV |

### Features
- Users navigation item (admin only)
- User statistics cards (Total, Admins, Staff, Active)
- User table with actions (View, Edit, Delete)
- Export and Add User buttons

---

## Session Timeout (NEW)

Automatically logs out users after 30 minutes of inactivity with a warning at 25 minutes.

| Function | Description |
|----------|-------------|
| `startSessionTimeout()` | Start session timeout timer on login |
| `clearSessionTimeout()` | Clear all session timeout timers |
| `resetSessionTimeout()` | Reset timeout on user activity |
| `showSessionWarning()` | Display session warning banner |
| `extendSession()` | Extend session for another 30 minutes |

---

## Bulk Actions (NEW)

### Document Bulk Actions
| Function | Description |
|----------|-------------|
| `toggleDocSelection(id, checked)` | Toggle document selection |
| `renderDocBulkBar()` | Render bulk action toolbar |
| `bulkApproveDocuments()` | Approve all selected documents |
| `bulkRejectDocuments()` | Reject all selected documents |
| `bulkDeleteDocuments()` | Delete all selected documents |
| `clearDocSelection()` | Clear all selections |

### Complaint Bulk Actions
| Function | Description |
|----------|-------------|
| `toggleComplaintSelection(id, checked)` | Toggle complaint selection |
| `renderComplaintBulkBar()` | Render bulk action toolbar |
| `bulkResolveComplaints()` | Resolve all selected complaints |
| `bulkDeleteComplaints()` | Delete all selected complaints |
| `clearComplaintSelection()` | Clear all selections |

---

## Date Filters (NEW)

### Document Date Filter
| Function | Description |
|----------|-------------|
| `injectDocDateFilters()` | Inject date filter UI |
| `onDocDateFilter()` | Handle date filter changes |
| `clearDocDateFilter()` | Clear date filter |

---

## Announcement Sort (NEW)

| Function | Description |
|----------|-------------|
| `setAnnSort(sort, btn)` | Set announcement sort order (newest/oldest) |

---

## Document Detail Panel (NEW)

Slide-out panel for viewing and editing document requests with timeline.

| Function | Description |
|----------|-------------|
| `openDocPanel(id)` | Open document detail panel |
| `buildTimeline(status)` | Build document status timeline |
| `saveDocPanel()` | Save changes from panel |
| `closeDocPanel(e)` | Close document panel |
| `closeDocPanelDirect()` | Direct close function |

---

## Resident Profile Panel (NEW)

Slide-out panel for viewing resident details with document and complaint history.

| Function | Description |
|----------|-------------|
| `openResidentPanel(id)` | Open resident profile panel |
| `closeResidentPanel(e)` | Close resident panel |
| `closeResidentPanelDirect()` | Direct close function |
| `editResidentFromPanel()` | Open edit modal from panel |
| `printResidentFromPanel()` | Print resident from panel |

---

## Print Functions

| Function | Description |
|----------|-------------|
| `printContent(content, title)` | Base print function |
| `printDocumentRequest(id)` | Print document request certificates |
| `printResidentRecord(id)` | Print resident identification records |
| `printComplaintRecord(id)` | Print complaint acknowledgments |
| `printProjectReport()` | Print community projects report |
| `printAnnouncement(id)` | Print official announcements |
| `printResidentProfile(id)` | Print resident profile with history |
| `printDocument()` | Print document from detail panel |
| `printResidentFromPanel()` | Print resident from profile panel |

---

## Export Functions

### CSV Export
| Function | Description |
|----------|-------------|
| `exportToCSV(data, filename, headers)` | Base CSV export function |
| `exportResidentsCSV()` | Export all residents data |
| `exportDocumentsCSV()` | Export all document requests |
| `exportComplaintsCSV()` | Export all complaints data |
| `exportProjectsCSV()` | Export all projects data |
| `exportUsersCSV()` | Export all users data |

### PDF Export
| Function | Description |
|----------|-------------|
| `exportToPDF(content, title)` | Base PDF export function |
| `exportDashboardReport()` | Export dashboard overview |
| `generateResidentPDF(id)` | Generate resident certificate |
| `exportAllReports()` | Export all operational data |

---

## New Request Functions

| Function | Description | Location |
|----------|-------------|-----------|
| `openNewRequestModal()` | New document request | Dashboard, Documents |
| `openNewComplaintModal()` | File new complaint | Complaints |
| `openNewProjectModal()` | Create new project | Projects |
| `openNewAnnouncementModal()` | Post new announcement | Announcements |
| `openNewResidentModal()` | Add new resident | Residents |
| `openDateRangeModal()` | Select date range | Reports |

---

## Filter Functions

| Function | Description |
|----------|-------------|
| `showFilterComplaintsModal()` | Filter complaints by category, status, date |
| `showFilterAnnouncementsModal()` | Filter announcements by category, date |
| `showHistoricalData()` | View historical performance data |

---

## Profile & Session

- Click on avatar to view profile modal
- Shows user info: name, role, email, last login
- Logout button in profile modal

---

## Supabase Database Setup

### Prerequisites
1. Create a Supabase account at https://supabase.com
2. Create a new project
3. Get your project URL and anon key

### Setup Steps

#### 1. Configure Supabase Client
Edit `supabase-config.js` and replace the configuration:
```javascript
const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key-here'
};
```

#### 2. Run Database Schema
In Supabase SQL Editor, run the contents of `supabase-schema.sql` to create:
- All required tables
- Default users (admin, staff, viewer)
- Sample data
- Row Level Security policies
- Performance indexes

#### 3. Include Supabase Client
In `index.html`, add the Supabase SDK before `app.js`:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
<script src="app.js"></script>
```

### Database Tables
| Table | Description |
|-------|-------------|
| users | User accounts and authentication |
| residents | Resident directory |
| documents | Document requests |
| complaints | Citizen complaints |
| projects | Community projects |
| announcements | Community announcements |
| user_roles | Role-based access control |

### Key Functions
- `getUsers()`, `createUser()`, `updateUser()`, `deleteUser()`
- `getResidents()`, `createResident()`, `updateResident()`, `deleteResident()`
- `getDocuments()`, `createDocument()`, `updateDocument()`, `deleteDocument()`
- `getComplaints()`, `createComplaint()`, `updateComplaint()`, `deleteComplaints()`
- `getProjects()`, `createProject()`, `updateProject()`, `deleteProject()`
- `getAnnouncements()`, `createAnnouncement()`, `updateAnnouncement()`, `deleteAnnouncement()`
- `subscribeToTable()` - Real-time subscriptions

---

## Technology Stack

- **HTML5** - Semantic markup
- **CSS3** - Custom styling with CSS variables
- **JavaScript** - Vanilla JS for interactivity
- **Supabase** - Backend-as-a-Service (database & auth)
- **Google Fonts** - Inter font family
- **Material Symbols** - Icon library

---

## Getting Started

1. Open `index.html` in a modern web browser
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`
3. Navigate between modules using the sidebar
4. Use action buttons to perform CRUD operations
5. Access User Management (Admin only) from sidebar

---

## Project Structure

```
brgyorg-ph/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Custom styles
├── js/
│   └── app.js              # Application logic
├── md/
│   ├── README.md           # This file
│   └── CHANGELOG.md        # Version history
├── supabase-config.js      # Supabase client configuration
├── supabase-schema.sql     # Database schema
└── .env                    # Environment variables
```
