# Barangay Management System – Web Dashboard

A modern web-based Barangay Management System designed to help barangay staff manage residents, document requests, complaints, projects, announcements, reports, and system settings in one centralized dashboard. The system provides real-time search, live updates, notifications, data export, and interactive admin tools to streamline daily operations.

This project focuses on delivering a clean, user-friendly SaaS-style dashboard that digitizes manual barangay processes and improves overall efficiency.

---

## Features

### Global
- Real-time search across residents, complaints, announcements, and projects
- Notification panel with mark-as-read functionality
- Admin profile modal with logout
- Quick access to post announcements

### Residents
- Add, edit, and delete residents with validation
- Instant search and status filtering
- Export data to CSV

### Documents
- Create document requests
- Approve or reject requests with reason tracking
- Generate PDF and print support
- View detailed request information
- Advanced filtering options

### Complaints
- File new complaints
- Filter system with tags
- View resolution reports
- Load more entries dynamically

### Projects
- Create and manage community projects
- Export reports
- View volunteering details and registration

### Announcements
- Post announcements
- Category filtering
- View full guidelines
- Interactive content modals

### Reports
- Date range filtering
- Chart view (line and bar toggle)
- Export reports
- Historical data view

### Settings
- Save system preferences
- Notification toggle switches

---

## Database

- The system currently runs without a database (frontend-based data handling for demo and UI functionality).
- Supabase is planned for future integration as the main database and backend service.
- Future versions will include real-time database, authentication, and cloud storage.

---

## Scalability and Future Improvements

The system is designed to be scalable and flexible, allowing additional features and modules to be integrated as needed. Planned future improvements include:

- Role-based access control (Admin, Staff, Resident)
- Online resident portal for self-service requests and tracking
- Mobile-responsive design or Progressive Web App (PWA) support
- SMS and email notification integration
- Advanced analytics and reporting dashboards
- Automated document templates
- Security enhancements and audit logs
- Supabase backend integration

---

## Notes

- All core functions are implemented and working within the dashboard interface.
- The system is continuously evolving, and more features will be added in future updates.
- The project is designed for easy expansion and integration with other services.
