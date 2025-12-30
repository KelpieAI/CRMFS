# Central Region Muslim Funeral Service - CRM System

> A comprehensive member and payment management system built for Falkirk Central Mosque's death committee (Central Region Muslim Funeral Service).

**Built by:** [Kelpie AI](https://kelpieai.co.uk)  
**Version:** 0.7.0.0  
**Status:** Active Development  
**Tech Stack:** React + TypeScript + Supabase + Tailwind CSS

---

## 📋 Overview

The Central Region Muslim Funeral Service CRM is a modern web application designed to streamline member registration, payment tracking, and administrative operations for Falkirk Central Mosque's funeral service committee. The system replaces the previous Microsoft Access-based solution with a responsive, cloud-based platform accessible from any device.

### Purpose

This CRM serves the death committee's operational needs by:
- Digitising member registration and data management
- Automating payment calculations with pro-rata and age-based fees
- Providing real-time insights into membership and finances
- Centralising all member information in one secure location
- Managing document uploads and storage securely
- Handling membership pauses and reactivations
- Ensuring GDPR compliance and data protection
- Reducing administrative overhead and manual paperwork
- Maintaining comprehensive audit trails for legal compliance

---

## ✨ Current Features

### 🔐 Authentication & Security
- Secure login system with Supabase authentication
- Protected routes and session management
- Row-level security (RLS) enabled on all database tables
- Supabase Storage integration for secure file uploads
- Environment validation and connection monitoring
- Password-protected member deletion
- Complete audit trails for compliance
- GDPR-compliant data handling

### 🛡️ GDPR & Data Protection
- **Profile Management:**
  - Profile button with user avatar in sidebar
  - Dropdown menu (Settings + Sign Out)
  - Committee member identification
- **Settings & Privacy:**
  - Dedicated Settings page for GDPR administration
  - Privacy Policy download section
  - Deletion Requests management interface
  - Data protection obligations guidance
- **Member Data Rights:**
  - Export Member Data function (GDPR Article 15 compliance)
  - One-click JSON export of complete member records
  - Create Deletion Request workflow (GDPR Article 17)
  - Committee review and approval process (30-day deadline)
  - View Access Log for audit transparency
- **Paper Form Compliance:**
  - Paper application form tracking (v01.25)
  - Signature capture from Section 7 declarations
  - Record of who entered data and when
  - Confirmation that physical forms are filed
  - Automatic consent recording from paper forms
- **Access Logging:**
  - Automatic logging when viewing member data
  - Complete audit trail of data access
  - GDPR Article 30 compliance
  - Tracks who, what, and when for all data access
  - Searchable access history per member

### 👥 Member Management
- **10-Step Registration Wizard** with progress tracking:
  - Personal details with age auto-calculation
  - Joint member registration (optional)
  - Children information
  - Next of kin details (mandatory fields with relation dropdown)
  - GP information (mandatory)
  - Medical declarations with conditional Yes/No questions
  - Legal declarations with electronic signatures
  - Document uploads (Photo ID, Proof of Address, Children certificates)
  - **Paper Form Record (GDPR compliance tracking)**
  - Pro-rata payment calculation with age-based fees
- **Save Progress Feature** - Resume incomplete registrations
- **Comprehensive Member Detail Pages** with:
  - Modern Supabase-style collapsible navigation
  - Sub-navigation sidebar with 10 information tabs
  - Personal Info tab (editable)
  - Joint Member tab (partner details)
  - Children tab (add/edit/delete with premium modals)
  - Next of Kin tab (mandatory emergency contacts with CRUD)
  - GP Details tab (mandatory medical practitioner info)
  - Medical Info tab (conditional based on health questions)
  - Documents tab (view, preview, download all uploaded files)
  - Declarations tab (legal compliance with signatures)
  - Payments tab (transaction history with summary cards)
  - Activity Log tab (complete audit trail with timeline)
  - **GDPR Data Rights section (committee actions)**
- **Member Actions:**
  - Edit mode with inline field editing
  - View payment history with status badges
  - Pause membership (temporary suspension with warning system)
  - Unpause membership (reactivation with age-based fees)
  - Export member data (GDPR request handling)
  - Create deletion request (on member's behalf)
  - View access log (audit transparency)
  - Mark as deceased (preserves records)
  - Delete member (password-protected with confirmation)
- **Enhanced Validations:**
  - Mobile number must be 11 digits
  - Email format validation
  - Age display next to date of birth
  - Mandatory GP and Next of Kin fields
  - Document upload validation (file size, type)
  - Paper form confirmation required

### 📄 Document Management System
- **Document Upload During Registration:**
  - Photo ID (passport/driving licence) for main and joint members
  - Proof of Address (utility bill/council tax) for main and joint members
  - Birth certificates for all children
  - File validation (JPG, PNG, PDF only, max 5MB)
  - Upload progress indicators
  - Delete functionality with confirmation
- **Document Viewing in Member Detail:**
  - Preview documents in new tab (eye icon)
  - Download documents locally (download icon)
  - Status indicators (uploaded/missing)
  - Organized by member type (main/joint/children)
  - Empty state guidance for missing documents
- **Secure Storage:**
  - All files stored in Supabase Storage bucket
  - Encrypted at rest and in transit
  - Public URLs for authenticated access
  - Organized file structure with timestamps
  - Easy search by member in database

### 💰 Payment Management
- **Pro-Rata Annual Fees** - Calculated from signup date to December 31st
- **Age-Based Joining Fees:**
  - Ages 18-25: £75
  - Ages 26-35: £100
  - Ages 36-45: £200
  - Ages 46-55: £300
  - Ages 56-65+: £500
  - Legacy members: £0 (waived for children turning 18 within 90 days)
- **Smart Payment Features:**
  - Automatic fee calculation based on age and signup date
  - Adjustment field for prepaying following year
  - Clear coverage period display (signup date - Dec 31, YYYY)
  - Payment received toggle (sets member Active/Pending)
  - Multiple payment methods (cash, card, bank transfer, cheque)
- **Payment Tracking:**
  - Payment status badges (Pending, Completed, Overdue, Failed, Refunded)
  - Payment Summary Cards (Total Paid, Pending, Transaction Count)
  - Late Payment Widget with highlights
  - Search and filter by member, status, or date range
  - Complete payment history per member
- **Reactivation Payments:**
  - Age-based joining fee + annual membership
  - Late fees waived on reactivation
  - One-time courtesy for paused members

### ⏸️ Membership Pause/Unpause System
- **Automatic Pause Logic:**
  - Late warning system (£10/month for 3 months)
  - Auto-pause after 3 ignored warnings
  - Paused status displayed throughout app
- **Paused Member Management:**
  - Red "Paused" status badges
  - Warning banner on member detail page
  - "Unpause Membership" button with payment flow
  - Clear reason for pause displayed
- **Reactivation Process:**
  - Age-based joining fee calculation (£75-£500)
  - Annual membership fee (£100)
  - Late fees waived (£0)
  - Payment confirmation required
  - Status updates to Active immediately
  - Late warnings reset to 0
  - Payment recorded with "reactivation" type
- **Filtering & Search:**
  - Filter members by paused status
  - View all paused members at once
  - Quick access to unpause functionality

### 📊 Dashboard & Analytics
- Real-time statistics:
  - Total members
  - Active members
  - Pending applications
  - Paused members
  - Total revenue
- **Applications In Progress** - Shows saved registrations
- **Upcoming Renewals** (30-day advance warning):
  - Colour-coded urgency (Red: ≤7 days, Orange: 8–14 days, Yellow: 15–30 days)
  - Automatic anniversary calculation
  - Direct links to member profiles
- Recent member activity feed
- Command Palette (Cmd+K / Ctrl+K) for quick navigation

### 💀 Deceased Member Management
- Comprehensive funeral record system with 4-step wizard
- Deceased member list with search and filter
- **7 Information Tabs per Deceased Member:**
  - Overview (deceased info, family contacts)
  - Funeral Details (burial information, dates, locations)
  - Documents (death certificates, burial permits)
  - Family Contacts (relatives with relationships)
  - Expenses (itemised funeral costs)
  - Payments (contributions and transactions)
  - Activity Log (complete audit trail)
- Family contact management
- Expense tracking with categories
- Payment processing for funeral costs
- Document management for certificates

### 📝 Legal Compliance & Declarations
- **Medical Disclosure Declaration:**
  - Electronic signature capture
  - Timestamp recording
  - Statement: "I confirm that I have no known medical conditions or illnesses, other than those I have already disclosed in Section 14 (Medical History) of this application, that could invalidate my application"
- **Posthumous Medical Authorization:**
  - Electronic signature capture
  - Timestamp recording
  - Statement: "In the event of my death, I authorise CRMFS to request information from my medical records relevant to my application for funeral cover"
- Both declarations required for main and joint members
- Stored permanently for audit and compliance

### 📝 Activity Logging & Audit Trail
- Automatic activity tracking on all database operations
- Database triggers on all major tables (members, payments, deceased, etc.)
- **Activity Log Features:**
  - Complete timeline view with relative timestamps ("2 hours ago")
  - Colour-coded action types (payments, updates, status changes)
  - Expandable details showing before/after values
  - Statistics cards (total events, payments, updates)
  - Icon-based visual indicators
  - 50 most recent events per member
- **Tracked Actions:**
  - Member creation and updates
  - Status changes
  - Payment recording
  - Document uploads
  - Membership pause/unpause
  - Deceased marking
  - Funeral arrangements
  - Expense additions
  - Contact additions
  - Data exports (GDPR)
  - Deletion requests (GDPR)
  - Access logging (GDPR)

### 🎨 User Experience
- **Modern Islamic Design:**
  - Sidebar: Dark Islamic Green (#06420c)
  - Accents: Mosque Gold (#D4AF37)
  - Clean white content areas
  - Professional typography
- **Navigation System:**
  - Collapsible main sidebar (64px collapsed, 256px expanded)
  - Profile button with avatar at bottom
  - Dropdown menu (Settings + Sign Out)
  - Supabase-style smooth animations
  - Hover-to-expand functionality
  - Mobile hamburger menu
  - Context-aware sub-navigation for detail pages
  - Command Palette (Cmd+K) for power users
- **Premium Form Experience:**
  - Professional validation with inline error messages
  - Auto-focus on first input field
  - Loading states during save operations
  - Keyboard shortcuts (ESC to close, Enter to submit)
  - Smooth fade-in animations
  - Date pickers for date fields
  - Dropdowns for constrained values
  - Conditional field display (medical info)
  - File upload with drag-and-drop
- **Performance Features:**
  - Loading skeletons with shimmer animations
  - Aggressive caching (5 min stale, 30 min cache)
  - Optimistic UI updates with rollback
  - Bulk actions with multi-select
- **Responsive Design:**
  - Desktop, tablet, and mobile optimized
  - Mobile-first member detail cards
  - Touch-friendly interfaces
- **Polish:**
  - Toast notifications for user feedback
  - Empty states with helpful guidance
  - Error boundaries for graceful failure handling
  - Custom 404 page
  - Proper spacing and breathing room

### 📈 Reports (Basic)
- Report generation framework
- Analytics dashboard structure
- Exportable data views (planned enhancement)

---

## 🗄️ Database Schema

Built on Supabase PostgreSQL with the following tables:

### Core Tables
- **members** - Primary member records with age-based fees, document URLs, pause status, GDPR consents
- **joint_members** - Joint membership details
- **children** - Dependent information
- **next_of_kin** - Mandatory emergency contacts
- **gp_details** - Mandatory medical practitioner information
- **medical_info** - Conditional health declarations

### Financial Tables
- **payments** - Transaction records with pro-rata calculations and reactivation payments
- **fee_structure** - Age-based pricing tiers

### Deceased Management Tables
- **deceased** - Deceased member records
- **funeral_details** - Burial information
- **funeral_contacts** - Family contacts
- **funeral_expenses** - Itemised costs
- **funeral_payments** - Contributions

### GDPR & Compliance Tables
- **deletion_requests** - Member data deletion requests with committee review workflow
- **access_log** - Automatic audit trail of all data access (GDPR Article 30)
- **consent_withdrawals** - Tracking of consent withdrawals
- **data_breaches** - Breach reporting (72-hour ICO notification)

### Administrative Tables
- **documents** - File attachments metadata
- **declarations** - Legal acceptance records with signatures
- **activity_log** - Automatic audit trail with triggers
- **admin_users** - System administrators

**Storage:**
- **member-documents** - Supabase Storage bucket for uploaded files

All tables include Row Level Security (RLS) policies for data protection.

---

## 🚀 Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Query (React Query)** - Server state management
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Row Level Security
  - Storage (file uploads)
  - Real-time subscriptions
  - Database triggers for activity logging
  - RESTful API

### Developer Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Git** - Version control with automatic version incrementing

---

## 📱 Key Workflows

### Member Registration
1. Start application (single or joint membership)
2. Enter personal details with auto-age calculation
3. Add joint member (if applicable)
4. Register children
5. Provide mandatory next of kin information
6. Add mandatory GP details
7. Complete conditional medical declarations
8. Sign legal declarations electronically
9. Upload supporting documents (Photo ID, Proof of Address, Children certificates)
10. **Record paper form details (GDPR compliance)**
11. Review pro-rata fees and submit
12. Mark payment as received (sets Active/Pending status)

**Progress can be saved at any step and resumed later.**

### GDPR Data Request Handling
1. Member contacts committee (email/phone/letter) requesting their data
2. Committee opens member detail page
3. Clicks "Export Member Data" button
4. System generates comprehensive JSON export
5. Committee sends file to member via email/post
6. Export logged automatically for audit trail

**All data access is logged in accordance with GDPR Article 30.**

### Document Management
1. Upload documents during registration
2. Files saved to Supabase Storage bucket
3. URLs stored in members table
4. View documents in Member Detail → Documents tab
5. Preview documents in new tab (eye icon)
6. Download documents locally (download icon)
7. Search documents by member in Supabase Table Editor

### Membership Pause & Reactivation
1. Member misses 3 renewal payments
2. System or admin sets status to "Paused"
3. Red status badge appears throughout app
4. Committee member opens member detail
5. Clicks "Unpause Membership" button
6. System calculates: Joining fee (age-based) + £100 annual
7. Late fees waived (£0)
8. Confirm payment received
9. Member status → Active
10. Late warnings → Reset to 0
11. Payment recorded with reactivation type

### Payment Processing
1. System auto-calculates age-based joining fee
2. Pro-rates annual fee from signup date to Dec 31
3. Optional adjustment for prepaying next year
4. Clear display of coverage period
5. Toggle payment received status
6. Member activated or marked pending
7. Payment recorded in history

**Example:** Joining Dec 28, 2025 (age 22)
- Joining Fee: £75 (age 18-25)
- Pro-rata: £0.82 (3 days to Dec 31)
- Adjustment: £100 (prepay 2026)
- Total: £175.82
- Coverage: Dec 28, 2025 - Dec 31, 2026

### Membership Renewal
1. System identifies members approaching December 31st renewal
2. Dashboard displays upcoming renewals (30-day window)
3. Committee contacts member
4. Process renewal payment (full £100 for next year)
5. Update member status

### Deceased Member Management
1. Navigate to Deceased section
2. Record Death (4-step wizard)
3. Add funeral arrangements
4. Track family contacts
5. Monitor expenses and payments
6. Upload required documents
7. View complete audit trail

---

## 🎯 Planned Features

### Phase 3 (Q1 2026)
- [ ] Children turn 18 automation (90-day tracking, auto-removal, notifications)
- [ ] Late fee warning system (3-tier automated warnings)
- [ ] Automated pause after 3 warnings (currently manual)
- [ ] Email notifications for renewals and warnings
- [ ] SMS reminders (via Twilio integration)
- [ ] Advanced reporting and analytics
- [ ] Export to CSV/Excel
- [ ] Bulk operations (mass email, status updates)
- [ ] PDF receipt generation

### Phase 4 (Q2 2026)
- [ ] User authentication with role-based access control
- [ ] Multi-language support (Arabic, Urdu)
- [ ] Mobile app (React Native)
- [ ] WhatsApp integration for notifications
- [ ] Advanced search with filters
- [ ] Multi-user role system (Admin, Treasurer, Volunteer)
- [ ] Donation tracking module

### Future Considerations
- [ ] Integration with mosque management systems
- [ ] Event management (funeral arrangements)
- [ ] Volunteer scheduling
- [ ] Inventory tracking (burial supplies)
- [ ] Financial reporting for audits
- [ ] API for third-party integrations
- [ ] Email open tracking
- [ ] Membership card generation
- [ ] Document expiry tracking (passport expiration)
- [ ] Bulk document download (ZIP archives)

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/CRMFS.git
   cd CRMFS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

### Database Setup

1. Create a Supabase project  
2. Run the provided SQL schema (see `/supabase` directory)  
3. Enable Row Level Security on all tables
4. Create Storage bucket: `member-documents`
5. Set up authentication provider  
6. Run activity log trigger creation script
7. Run GDPR compliance table creation script
8. Update environment variables  

---

## 🎨 Customisation

### Branding
The system uses Islamic-themed colour scheme:
- **Primary:** Islamic Green (#06420c) - Sidebar and main actions
- **Secondary:** Mosque Gold (#D4AF37) - Accents and highlights
- **Background:** Clean white/light gray for content
- **Font:** Plus Jakarta Sans - Modern, readable typography

### Theme Modification
1. **Font**: Update `src/index.css` and `tailwind.config.js`
2. **Colours**: Modify `mosque-green` and `mosque-gold` in tailwind.config.js
3. **Logo**: Replace in `src/components/CollapsibleSidebar.tsx`

See `STYLING_GUIDE.md` for detailed instructions.

---

## 📊 Project Metrics

- **Total Components:** 50+
- **Database Tables:** 22 (including GDPR compliance tables)
- **Storage Buckets:** 1 (member-documents)
- **Lines of Code:** ~32,000
- **Pages:** 18
- **API Endpoints:** 110+ (via Supabase)
- **Member Detail Tabs:** 10
- **Deceased Detail Tabs:** 7
- **Registration Steps:** 10
- **Document Types:** 5 (Photo ID, Proof of Address x2, Children x multiple)
- **Premium Features:** 10 (Skeletons, Cmd+K, Caching, Optimistic, Bulk, Documents, Pause, GDPR Tools, Access Logging, Profile Menu)

---

## 🤝 Contributing

This is a private project developed by Kelpie AI for Falkirk Central Mosque. For enquiries about similar projects or custom development:

**Contact:** [Kelpie AI](https://kelpieai.co.uk)  
**Email:** info@kelpieai.co.uk  
**Phone:** +447984 058973  
**Location:** Falkirk, Scotland

---

## 📄 Licence

This project is proprietary software developed for Falkirk Central Mosque. All rights reserved.

Unauthorised copying, modification, distribution, or use of this software is strictly prohibited without explicit written permission from Kelpie AI.

---

## 🙏 Acknowledgements

- **Falkirk Central Mosque** - For the opportunity and requirements  
- **Central Region Muslim Funeral Service** - For subject matter expertise  
- **Supabase** - For the excellent backend platform  
- **React Community** - For the robust ecosystem  

---

## 📞 Support

For technical support or feature requests:
- Open an issue in this repository  
- Contact Kelpie AI: info@kelpieai.co.uk  
- Visit: [kelpieai.co.uk](https://kelpieai.co.uk)

---

## 🔒 Security

This system handles sensitive personal data. Security measures include:
- Encrypted data at rest and in transit
- Row Level Security (RLS) enabled on all database tables
- Secure file storage with Supabase Storage
- Secure authentication with Supabase Auth
- Password-protected destructive operations
- Document access control
- Environment variable protection
- Automatic activity logging for audit compliance
- GDPR Article 30 compliance (access logging)
- GDPR Article 15 compliance (right to access)
- GDPR Article 17 compliance (right to erasure)
- Regular security audits
- ICO notification procedures for data breaches

**Report security vulnerabilities to:** info@kelpieai.co.uk

---

## 📈 Version History

### v0.7.0.0 (Current - 30 December 2025)
This release focuses on GDPR compliance and data protection, implementing the final administrative tools needed for handling member data requests. The system now provides complete transparency around data access and gives committee members the ability to respond to member requests efficiently while maintaining full audit trails.

- **GDPR Admin Tools:**
  - Export Member Data function with one-click JSON generation
  - Create Deletion Request workflow with committee approval process
  - View Access Log for complete transparency of data access
  - All tools accessible from Member Detail page for convenience
  - Automatic logging of all data exports and access
- **Paper Form Compliance:**
  - New Step 9 in registration wizard for paper form tracking
  - Records paper application form version (v01.25)
  - Captures main and joint member signatures from Section 7
  - Tracks who entered data and when for audit purposes
  - Confirms physical paper forms are filed for 7-year retention
  - Auto-records all GDPR consents obtained via paper form
- **Access Logging System:**
  - Automatic logging whenever member data is accessed
  - Tracks who viewed data, what was accessed, and when
  - Complete audit trail for GDPR Article 30 compliance
  - Searchable access history per member
  - Access logs viewable from Member Detail page

### v0.6.0.0 (30 December 2025)
Following user feedback about the previous navigation structure, this release introduces a cleaner interface with better organization of system settings and privacy controls. The new profile-based navigation makes it easier for committee members to access their settings while keeping the main sidebar focused on core workflows.

- **Profile & Settings Navigation:**
  - Profile button with user avatar added to bottom of sidebar
  - Dropdown menu for Settings and Sign Out (cleaner than before)
  - Automatic user identification from Supabase Auth session
  - Responsive dropdown positioning on mobile and desktop
- **Settings Page:**
  - New dedicated page for system administration and privacy
  - Privacy Policy download section for member distribution
  - Deletion Requests management with pending/approved/rejected stats
  - Committee approval workflow with 30-day deadline tracking
  - Data protection obligations guidance for committee members
  - GDPR Article 17 compliance (right to erasure)
- **Database Updates:**
  - Created deletion_requests table with review workflow
  - Created access_log table for audit trail
  - Added consent_withdrawals and data_breaches tables
  - Implemented proper indexes for performance

### v0.5.0.0 (30 December 2025)
This release addresses two critical operational needs: document management and membership lifecycle handling. The document system eliminates the need for physical filing of ID copies, while the pause/unpause system provides a more humane approach to handling members who fall behind on payments.

- **Document Management System:**
  - Document upload during registration (Photo ID, Proof of Address, Children certificates)
  - Supabase Storage integration with secure file handling
  - Document viewing in Member Detail with preview and download options
  - Upload progress indicators and delete functionality
  - File validation (type, size, format) for security
  - Organized display by member type with status indicators
- **Membership Pause/Unpause System:**
  - Paused status tracking with reason and warning counter
  - Red status badges throughout app for visibility
  - "Unpause Membership" button with payment modal
  - Age-based reactivation fee calculation (£75-£600)
  - Late fees waived on reactivation as one-time courtesy
  - Filter members by paused status for bulk management
- **Database Enhancements:**
  - Added 5 document URL columns for file references
  - Added 3 pause tracking columns (status, reason, warnings)
  - Storage bucket policies configured for secure access
  - Payment types enum updated with "reactivation"

### v0.4.0.0 (29 December 2025)
The Phase 1 critical features release brings the system to production-ready status with proper legal compliance and payment accuracy. This version implements the core business logic that was missing from earlier builds, including the age-based fee structure requested by the committee and the legal declarations required for funeral cover validity.

- **Payment System Accuracy:**
  - Pro-rata calculations from signup date to December 31st
  - Age-based joining fees in 5 tiers (£75-£500)
  - Registration success screens with payment status indicators
- **Legal Compliance:**
  - Password-protected member deletion for safety
  - Medical disclosure declaration with electronic signatures
  - Posthumous medical authorization with electronic signatures
  - Final T&Cs acceptance requirement
  - GP details integration as mandatory field

### v0.3.1.0 (29 December 2025)
Security hardening release addressing vulnerabilities discovered during internal audit. Row Level Security (RLS) was not properly enabled on all tables, creating potential data exposure risks. This release also fixed several routing bugs that were causing 404 errors when navigating to deceased member records.

- Enabled Row Level Security (RLS) on all 18 database tables
- Fixed deceased system routing issues (404 errors)
- Resolved table name mismatches in deceased workflows
- Added debug logging for troubleshooting

### v0.3.0.0 (28 December 2025)
Legal compliance focused release implementing the two critical declarations required for funeral cover validity. Without these signed declarations, the mosque cannot legally provide funeral services, making this a non-negotiable requirement before production deployment.

- Medical disclosure declaration with electronic signatures
- Posthumous medical authorization with electronic signatures
- Registration success screen redesigned with payment-based status
- Removed generic "What happens next?" section
- Added prominent "Register Another Member" button

### v0.2.5.0 (28 December 2025)
Major payment system overhaul to implement fair pricing based on age brackets and signup timing. The previous flat-rate system didn't account for the actuarial risk differences across age groups or the unfairness of charging full annual fees for December signups.

- Pro-rata annual fee calculation (signup date → Dec 31)
- Age-based joining fees (£75-£500 across 5 age brackets)
- Legacy membership support (£0 joining fee for children turning 18)
- Adjustment field for prepaying following year
- Clear coverage period display on all payment screens
- Conditional medical information (Yes/No question with text box)

### v0.2.3 (27 December 2025)
Branding update to align with Islamic visual identity and fix several form validation gaps discovered during user testing. Mobile number validation was particularly important as incorrect numbers were causing payment reminder failures.

- Sidebar redesigned with Islamic Green (#06420c)
- Mosque Gold (#D4AF37) accents throughout
- Mobile number validation (must be 11 digits)
- Email format validation
- GP details now mandatory
- Next of Kin fields now mandatory with relation dropdown
- Age auto-calculation next to date of birth

### v0.2.2 (27 December 2025)
Premium polish release adding professional UX features that significantly improve daily usage. The loading skeletons and caching prevent the jarring "blank screen" experience, while Command Palette enables power users to navigate quickly.

- Loading skeletons with shimmer animations
- Command Palette (Cmd+K / Ctrl+K) for quick navigation
- Aggressive caching (5min stale, 30min cache)
- Optimistic UI updates with rollback
- Bulk actions with floating action bar
- 4-step Death Record Wizard with Islamic verse display

### v0.2.1 (26 December 2025)
Major UI/UX overhaul based on feedback that the previous interface felt cramped and difficult to navigate. The Supabase-style collapsible navigation creates more breathing room while maintaining quick access to all features.

- Supabase-style collapsible navigation sidebar
- Mobile hamburger menu for responsive design
- Member Detail page completely redesigned with 10 tabs
- Premium CRUD modals for Children and Next of Kin
- Activity Logging System with automatic database triggers
- Deceased Member System with 7 information tabs

### v0.1.5 (24 December 2025)
Feature complete MVP with all core workflows functional. This version was the first to be tested with real data from existing members, revealing several pain points that were addressed in subsequent releases.

- Complete member registration wizard
- Payment management system with tracking
- Dashboard with real-time analytics
- Late payment identification and tracking
- Upcoming renewals widget with colour-coded urgency
- Responsive mobile design

### v0.1.4 (22 December 2025)
Initial MVP release demonstrating core CRUD operations and database connectivity. This version established the technical foundation and proved the Supabase integration was viable for the mosque's needs.

- Basic CRUD operations for members
- Authentication system with Supabase Auth
- Database schema implementation
- Initial UI components and routing

---

## 🎯 Goals

**Mission:** Modernise and streamline the administrative operations of Central Region Muslim Funeral Service, enabling the committee to focus on serving the community rather than managing paperwork, while ensuring full GDPR compliance and data protection for all members.

**Vision:** A fully integrated, automated system that handles member lifecycle management, financial tracking, document management, GDPR compliance, and community engagement—setting the standard for mosque administrative systems in Scotland and demonstrating that data protection and operational efficiency can coexist.

---

**Built with ❤️ in Falkirk, Scotland by [Kelpie AI](https://kelpieai.co.uk)**

*Proving Scotland can dominate technology, one project at a time.*