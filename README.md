# Central Region Muslim Funeral Service - CRM System

> A comprehensive member and payment management system built for Falkirk Central Mosque's death committee (Central Region Muslim Funeral Service).

**Built by:** [Kelpie AI](https://kelpieai.co.uk)  
**Version:** 0.11.0  
**Status:** Active Development  
**Tech Stack:** React + TypeScript + Supabase + Tailwind CSS + Resend

---

## 📋 Overview

The Central Region Muslim Funeral Service CRM is a modern web application designed to streamline member registration, payment tracking, and administrative operations for Falkirk Central Mosque's funeral service committee. The system replaces the previous Microsoft Access-based solution with a responsive, cloud-based platform accessible from any device.

### Purpose

This CRM serves the death committee's operational needs by:
- Digitising member registration and data management
- Automating payment calculations with pro-rata and age-based fees
- Automating email reminders and late payment warnings
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
  - **Profile Tab** - User information and role display
  - **Appearance Tab** - Dark mode toggle (experimental feature)
  - **Email Preferences Tab:**
    - Customizable email sender name
    - Email signature configuration
    - CC committee on member emails toggle
    - Member action notification settings
  - **Payment Configuration Tab** (read-only):
    - View annual membership fee (£350)
    - View age-based joining fees (£75-£500)
    - View late payment grace period
    - View payment reminder schedule
    - "Request Changes" button to contact developer
  - **GDPR & Privacy Tab:**
    - Privacy Policy download section
    - Deletion Requests management interface
    - Data protection obligations guidance
  - **About Tab** - System information:
    - CRMFS version number
    - Database statistics (members, revenue, activity)
    - Email statistics (sent, pending actions)
    - System health status
    - Technical support contact
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
- **10-Step Registration Wizard** with professional sidebar navigation:
  - Fixed left sidebar showing all steps with clear progress indicators
  - Green checkmarks for completed steps, dark green for active, gray for pending
  - Click completed steps to navigate back and review
  - Quick Actions: Save Progress, Back to Members, Email Copy, Print Progress
  - Automatic application reference generation (APP-YYYYMMDD-XXXX format)
  - Application references displayed in header and tracked in database
  - Auto-save on every step change
  - Resume saved applications from dashboard widget
  - **10 Registration Steps:**
    1. Membership Type (Single/Joint)
    2. Main Member (personal details with age auto-calculation)
    3. Joint Member (if applicable)
    4. Children (add multiple children with details)
    5. Next of Kin (mandatory emergency contact)
    6. Medical Info (conditional Yes/No health questions, no default selection)
    7. GP Details & Medical Consent (practice info + consent declaration showing applicant's actual name)
    8. Declaration (T&Cs acceptance, emergency fund agreement, information accuracy + signature — separate dedicated step)
    9. Documents (Photo ID, Proof of Address upload)
    10. Payment (pro-rata calculation with age-based fees, payment status toggle)
  - **Human-Readable Membership IDs:**
    - Format: FCM-XXXXX (e.g., FCM-32614)
    - FCM = Falkirk Central Mosque
    - Sequential 5-digit number starting from random offset (10000-99999)
    - Future-proof with mosque-specific prefixes
  - **Email Token System** - Committee manually sends secure email links from Member Detail:
    - Document upload link (Photo ID + Proof of Address)
    - Declarations signature link (Medical Consent + Terms & Conditions)
    - Links expire after 7 days, single-use for security
    - No automatic emails sent during registration
    - Committee controls timing of email sending
- **Save Progress Feature** - Resume incomplete registrations with searchable reference numbers
- **Comprehensive Member Detail Pages** with redesigned interface:
  - Islamic green gradient hero section with member name and membership ID
  - Displays FCM-XXXXX instead of UUID hash
  - Quick info strip showing phone, email, age, total paid, location
  - Modern card-based layout with hover effects and mosque gold accents
  - **Email Token Status Widget:**
    - Shows document upload status (pending/expired/completed)
    - Shows declarations signature status (pending/expired/completed)
    - Email sent timestamps and expiry dates
    - "Send" buttons when no email sent yet
    - "Resend" buttons for expired or pending links
    - Real-time status updates with toast notifications
  - Sub-navigation sidebar with 10 information tabs
  - Personal Info tab (two-card side-by-side layout for joint members — main member left, joint member right)
  - Joint Member tab (partner details)
  - Children tab (add/edit/delete with premium modals)
  - Next of Kin tab (mandatory emergency contacts with CRUD)
  - GP Details tab (add/edit GP practice info with modal)
  - Medical Info tab (conditional based on health questions)
  - Documents tab (upload/manage documents with drag & drop modal)
  - Declarations tab (sign declarations digitally with signature modal)
  - Payments tab (transaction history with summary cards, collapsible breakdown)
  - Activity Log tab (complete audit trail with timeline)
  - **GDPR Data Rights section (committee actions)**
- **Member Actions:**
  - Edit mode with inline field editing
  - Activate Member directly from Member Detail (with full validation check)
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
  - Activation blocked if outstanding balance remains

### 📄 Document Management System
- **Secure Email Token System:**
  - Committee sends secure upload link via email after registration
  - Member uploads documents from home via tokenized link
  - Token expires after 7 days, single-use for security
  - Committee can resend expired links from Member Detail page
  - Photo ID (passport/driving licence) for main and joint members
  - Proof of Address (utility bill/council tax) for main and joint members
  - File validation (JPG, PNG, PDF only, max 5MB)
  - Upload progress indicators
- **Public Upload Pages:**
  - Branded upload interface with CRMFS styling
  - Token validation with expiry checking
  - Drag & drop file upload or click to browse
  - Real-time validation and error handling
  - Success confirmation after upload
  - Automatic activity logging for audit trail
- **Document Management in Member Detail:**
  - Upload/manage documents modal with drag & drop interface
  - Browse files button for traditional file selection
  - Visual feedback (green border when selected, blue when dragging)
  - Preview documents in new tab (eye icon)
  - Download documents locally (download icon)
  - Replace existing documents (upsert functionality)
  - Status indicators (uploaded/missing)
  - Organized by member type (main/joint/children)
  - Empty state guidance for missing documents
  - Documents refresh immediately after upload (no manual page refresh needed)
- **Secure Storage:**
  - All files stored in Supabase Storage bucket (member-documents)
  - RLS policies correctly configured for authenticated uploads and reads
  - Encrypted at rest and in transit
  - Public URLs for authenticated access
  - Organized file structure with timestamps and file extensions
  - Easy search by member in database

### 💰 Payment Management
- **Pro-Rata Annual Fees** - Calculated from signup date to December 31st
- **Age-Based Joining Fees:**
  - Ages 18-25: £75
  - Ages 26-35: £100
  - Ages 36-45: £200
  - Ages 46-55: £300
  - Ages 56-65+: £500
  - Legacy members: £0 joining fee waived for main member only (joint member still pays age-based fee)
- **Smart Payment Features:**
  - Automatic fee calculation based on age and signup date
  - Adjustment field for prepaying following year
  - Clear coverage period display (signup date - Dec 31, YYYY)
  - Payment received toggle (sets member Active/Pending)
  - Multiple payment methods (cash, card, bank transfer, cheque)
  - Payment type must be actively selected — no pre-filled default (prevents wrong entries)
- **Payment Tracking:**
  - Payment status badges (Pending, Completed, Overdue, Failed, Refunded)
  - Payment Summary Cards (Total Paid, Pending, Transaction Count)
  - Pending amount shows actual remaining balance (total due minus completed payments)
  - Late Payment Widget with highlights
  - Search and filter by member, status, or date range
  - Complete payment history per member
- **Activation Protection:**
  - Member cannot be activated if outstanding balance remains
  - Clear error shown: "Cannot activate — outstanding balance of £X.XX remaining"
  - Activate Member button disabled with tooltip when balance unpaid
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
- **Alerts Widget** (action-required items):
  - 📄 Documents Pending - members who haven't uploaded documents
  - ✍️ Declarations Pending - members who haven't signed declarations
  - 💰 Payments Overdue - members with late payments
  - 📧 Emails Failed - bounced emails requiring attention
  - Clickable rows navigate to filtered Members List
  - Shows "No alerts - all members up to date ✓" when empty
- Recent member activity feed
- Command Palette (Cmd+K / Ctrl+K) for quick navigation

### 💀 Deceased Member Management
- Comprehensive funeral record system with 4-step wizard
- **Pending Status by Default:**
  - Deceased members marked as "pending" until Record of Death form completed
  - Ensures data integrity for funeral service documentation
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

### 📧 Automated Email System
- **Professional Email Infrastructure:**
  - Resend API integration for reliable delivery
  - Custom domain sending (crmfs@kelpieai.co.uk)
  - SPF, DKIM, and DMARC verification for deliverability
  - Won't hit spam folders - proper authentication
- **7 Email Types with Progressive Urgency:**
  - 30-day renewal reminder (calm green branding)
  - 14-day renewal reminder (increased urgency)
  - 7-day renewal reminder (🔔 URGENT red badge)
  - Day 0 overdue notification
  - Late Payment Warning 1 - 30 days (orange badge, £10 fee)
  - Late Payment Warning 2 - 60 days (deep red, £20 total fees)
  - Late Payment Warning 3 - 90 days (⚠️ FINAL WARNING, £30 total fees)
- **Automated Daily Execution (Cron Jobs):**
  - Renewal reminders run at 9:00 AM UTC daily
  - Late payment warnings run at 10:00 AM UTC daily
  - Auto-pause members run at 10:30 AM UTC daily
  - Powered by Supabase pg_cron scheduled jobs
  - Zero manual intervention required
- **Instant Trigger Emails (Database Triggers):**
  - Welcome email sent immediately on new member registration (🎉 green badge)
  - Payment confirmation sent instantly when payment recorded (✓ receipt)
  - Reactivation success email when paused member returns (🎊 celebration)
  - Membership paused notification with reactivation instructions
- **Smart Email Features:**
  - Personalized with member names and amounts
  - Clear payment breakdowns showing late fees
  - Direct payment portal links
  - Unsubscribe options for non-critical emails
  - GDPR compliant with opt-out preferences
- **Activity Logging & Audit Trail:**
  - Every email logged to email_activity table
  - Tracks sent/failed/bounced status
  - Resend email ID for delivery tracking
  - Metadata stored (amounts, dates, sequence)
  - Duplicate prevention (won't spam members)
- **Member Preferences:**
  - Email preferences stored per member
  - Can opt out of newsletters
  - Renewal reminders can be disabled
  - Late payment warnings are mandatory
  - Unsubscribe tokens with 90-day expiry
- **Beautiful Branded Design:**
  - Islamic green header (CRMFS branding)
  - Mobile-responsive HTML templates
  - Professional typography and spacing
  - Color-coded urgency levels (green → orange → red)
  - Clear call-to-action buttons

### 📝 Legal Compliance & Declarations
- **Declaration as Dedicated Registration Step (Step 8):**
  - Separated from other steps for clear focus
  - T&Cs acceptance, emergency fund agreement, information accuracy
  - Electronic signature capture
  - Sits between GP Details and Documents steps
- **Digital Signature Modal (Member Detail Page):**
  - Sign declarations directly from Declarations tab
  - Professional modal interface with checkbox + signature fields
  - Auto-populates member's actual name as signature
  - Color-coded sections (blue for medical consent, purple for final declaration)
  - Separate sections for main and joint members
  - Auto-date stamping on signature submission
- **Medical Disclosure Declaration (Section 6):**
  - Displays applicant's actual first and last name (not generic "Main Member" label)
  - Electronic signature auto-populated from member name
  - Timestamp recording
- **Final Declaration (Section 7):**
  - T&Cs acceptance with signature
  - Emergency fund contribution agreement
  - Information accuracy confirmation
- Both medical and final declarations required for main and joint members
- Stored permanently for audit and compliance
- Can be signed during registration OR retroactively from Member Detail page

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
- **Persistent Footer:**
  - Fixed footer on all registration steps
  - Always shows "Kelpie AI" and current version number
  - Never overlaps form content or navigation buttons
- **Dark Mode (Experimental):**
  - Toggle switch in Settings > Appearance
  - App-wide theme context with localStorage persistence
  - Dark variants for Dashboard, Members, Member Detail
  - Islamic green and gold branding maintained in both themes
  - Marked as "EXPERIMENTAL" - ongoing polish in progress
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
  - React Error Boundary for crash handling
  - Custom error pages (404, 500, crash) with support links
  - Proper spacing and breathing room

### 📈 Reports (Basic)
- Report generation framework
- Analytics dashboard structure
- Exportable data views (planned enhancement)

---

## 🗄️ Database Schema

Built on Supabase PostgreSQL with the following tables:

### Core Tables
- **members** - Primary member records with age-based fees, document URLs, pause status, GDPR consents, email preferences
- **joint_members** - Joint membership details
- **children** - Dependent information (with document_url for birth certificates)
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

### Email Automation Tables
- **email_activity** - Complete log of all sent emails with status tracking
- **email_queue** - Scheduled emails with retry logic
- **unsubscribe_tokens** - Secure unsubscribe link management

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
- **member-documents** - Supabase Storage bucket for uploaded files (RLS policies configured for authenticated access)

**Edge Functions:**
- **send-renewal-reminders** - Daily automated renewal reminder emails
- **send-late-payment-warnings** - Daily automated late payment escalation emails

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
  - Edge Functions (Deno runtime)
  - pg_cron (scheduled jobs)

### Email Infrastructure
- **Resend** - Transactional email API
  - 3,000 emails/month free tier
  - React Email template support
  - Delivery tracking and analytics
  - Domain verification (SPF/DKIM/DMARC)
  - Bounce and complaint handling

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
6. Add mandatory GP details + confirm medical consent (shows applicant's actual name)
7. Complete conditional medical declarations
8. Sign legal declarations electronically (dedicated step)
9. Upload supporting documents (Photo ID, Proof of Address)
10. Review pro-rata fees and submit
11. Mark payment as received (sets Active/Pending status)

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
1. Upload documents during registration or from Member Detail
2. Files saved to Supabase Storage bucket with correct RLS permissions
3. URLs stored in members table
4. View documents in Member Detail → Documents tab (refreshes immediately after upload)
5. Preview documents in new tab (eye icon)
6. Download documents locally (download icon)
7. Search documents by member in Supabase Table Editor

### Membership Activation
1. Record payment in Member Detail → Payments tab
2. System checks: all completed payments must cover the total amount due
3. If balance remains outstanding, activation is blocked with clear message
4. Once fully paid, "Activate Member" button available directly in Member Detail
5. Validation check runs: payment complete + documents uploaded
6. If requirements met, member status updates to Active immediately

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

### Email Automation Workflow
1. **Daily at 9:00 AM UTC:** Renewal reminder cron job runs
2. Database function checks for members with renewals in 30/14/7/0 days
3. Edge Function generates personalized emails using HTML templates
4. Resend API sends emails from crmfs@kelpieai.co.uk
5. Email activity logged to database with status
6. Members receive professional branded emails in inbox
7. **Daily at 10:00 AM UTC:** Late payment warning cron job runs
8. Database function identifies members 30/60/90+ days overdue
9. Escalating warning emails sent with color-coded urgency
10. After 90 days: Manual or automated membership pause triggered

---

## 🎯 Planned Features

### Phase 3 (Q1–Q2 2026)
- [x] **Email automation system** ✅ (Completed Jan 2026)
- [x] **Document upload system** ✅ (Fixed May 2026)
- [ ] Automated pause after Warning 3 (currently manual)
- [ ] Welcome email for new member registrations
- [ ] Membership paused notification email
- [ ] Payment received confirmation emails
- [ ] Newsletter/announcement manual send system
- [ ] Children turn 18 automation (90-day tracking, auto-removal, notifications)
- [ ] SMS reminders (via Twilio integration)
- [ ] Advanced reporting and analytics
- [ ] Export to CSV/Excel
- [ ] PDF receipt generation

### Phase 4 (Q3 2026)
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
   git clone https://github.com/KelpieAI/CRMFS.git
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
5. Configure RLS policies on storage bucket (authenticated uploads, reads, updates, deletes)
6. Set up authentication provider  
7. Run activity log trigger creation script
8. Run GDPR compliance table creation script
9. Run email automation table creation script
10. Deploy Edge Functions (send-renewal-reminders, send-late-payment-warnings)
11. Configure pg_cron scheduled jobs
12. Update environment variables  

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

- **Total Components:** 55+
- **Database Tables:** 25 (including email automation tables)
- **Storage Buckets:** 1 (member-documents)
- **Edge Functions:** 3 (send-renewal-reminders, send-late-payment-warnings, auto-pause-members)
- **Cron Jobs:** 3 (9:00 AM, 10:00 AM, 10:30 AM UTC daily)
- **Database Triggers:** 3 (welcome email, payment confirmation, reactivation success)
- **Email Templates:** 11 (8 cron-based + 3 instant trigger-based)
- **Lines of Code:** ~44,000
- **Pages:** 18
- **API Endpoints:** 115+ (via Supabase + Resend)
- **Member Detail Tabs:** 10
- **Deceased Detail Tabs:** 7
- **Registration Steps:** 10
- **Document Types:** 5
- **Premium Modals:** 7
- **Premium Features:** 18

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
- **Resend** - For reliable email infrastructure

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
- Supabase Storage RLS policies for authenticated file access
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

### v0.11.0 (22 May 2026)
**Pre-launch polish and bug fixes** based on final committee testing. This release resolves the last batch of outstanding issues before go-live, covering document uploads, payment data integrity, registration wizard improvements, and a range of UI/UX fixes across Member Detail and the registration flow.

- **Document Upload System (Full Fix):**
  - Fixed Supabase Storage RLS policies blocking uploads from the frontend — all four policies now correctly configured (INSERT, UPDATE, SELECT, DELETE for authenticated users)
  - Fixed document URLs not being saved to the `members` table on AddMember submission — all URL fields now included in the member insert object
  - Fixed DocumentUploadModal in MemberDetail not refreshing after upload — now uses `resetQueries` to force a full fresh fetch
  - Added file extension to storage paths (previously missing, causing broken previews)
  - Added `upsert: true` to all upload calls to allow document replacement
  - Documents tab now refreshes immediately after upload without needing a manual page refresh
  - Children's birth certificate URLs now saved to `children` table via `document_url` column
  - All upload errors now show proper toast notifications instead of `alert()` calls
  - Added `console.log` success/error logging throughout upload flow for easier debugging

- **Legacy Fee Fix:**
  - Legacy membership fee waiver now correctly applies to main member only
  - Joint member always pays their normal age-based joining fee, regardless of membership type
  - Fixed both the live fee calculation and the submission calculation in `AddMember.tsx`

- **Declaration as Dedicated Step:**
  - Declaration (Section 7) is now its own separate step in the registration wizard
  - Sits between GP Details and Documents steps
  - Step count updated to 10 and progress bar reflects correctly
  - Declaration validation (main + joint required) runs on this step only
  - No change to declaration content or fields

- **Payment Type Forced Selection:**
  - Record Payment modal no longer pre-fills payment type as "renewal"
  - Default is now blank with a "Select payment type" placeholder
  - Form cannot be submitted without selecting a payment type
  - Prevents accidental wrong-type entries

- **Partial Payment Activation Block:**
  - Members can no longer be activated if their outstanding balance hasn't been fully paid
  - Activation button is disabled with a tooltip showing the remaining balance
  - Clear error message shown: "Cannot activate — outstanding balance of £X.XX remaining"
  - Pending amount in the Payments tab summary now shows the actual remaining balance (total due minus completed payments) rather than the original full amount

- **Child Details Saving Fixed:**
  - Add Child and Edit Child now correctly save to Supabase in all cases
  - Confirmed `child.id` is correctly passed on update, `member_id` on insert
  - `queryClient.invalidateQueries` correctly targets `['member-detail', memberId]`
  - Error logging added on mutation failure for easier debugging
  - Children list refreshes immediately after save

- **Medical Consent Names:**
  - Section 6 declarations now show the applicant's actual name instead of the generic "Main Member" / "Joint Member" labels
  - Uses `formData.first_name + formData.last_name` for main member
  - Uses `formData.joint_first_name + formData.joint_last_name` for joint member
  - Falls back to "Main Member" / "Joint Member" only if name fields are empty
  - Same fix applied to DeclarationsSignatureModal in MemberDetail

- **Two-Card Layout in View Member:**
  - Personal Info tab now shows main member and joint member as two cards side by side for joint applications (`grid-cols-1 lg:grid-cols-2`)
  - Main member on left, joint member on right, pulling `joint_` prefixed fields
  - Single member applications continue to display the single-card layout unchanged
  - Joint member card styled consistently with the main member card

- **Persistent Footer on Registration:**
  - Fixed footer bar added to all AddMember registration steps
  - Always visible, never overlaps form content or navigation buttons
  - Shows "Kelpie AI" left-aligned and version number right-aligned
  - 44px height with subtle top border
  - Bottom padding added to form container to accommodate footer

**Committee Impact:**
- Document uploads now fully working — resolves the main blocker from final testing
- Legacy members' joint partners now correctly charged their joining fee
- Payment type errors prevented at source
- Partial payments can no longer bypass activation requirements
- Children records now reliably save and update
- Declarations feel more personal with applicant names shown
- Joint member info visible at a glance in View Member
- Kelpie AI branding and version always visible at the bottom of registration

**Bug Fixes:**
- Fixed: Documents not uploading from AddMember or MemberDetail
- Fixed: Documents not visible after upload without page refresh
- Fixed: Legacy fee incorrectly waiving joint member's joining fee
- Fixed: Payment type defaulting to "renewal" in Record Payment modal
- Fixed: Partial payment allowing membership activation
- Fixed: Pending amount not updating after partial payment
- Fixed: Add/Edit Child not saving in MemberDetail
- Fixed: Medical consent showing "Main Member" instead of applicant name
- Fixed: Joint member info not shown in Personal Info tab
- Fixed: Kelpie AI footer missing from registration steps

**Files Changed:**
- `AddMember.tsx` — Legacy fee fix, declaration step, consent names, footer, upload fixes
- `MemberDetail.tsx` — Child save fix, payment type default, activation block, two-card layout, consent names

---

### v0.10.2 (18 April 2026)
**Declaration signature workflow simplification** based on committee feedback that text signature inputs were "annoying and pointless." This release removes all manual signature typing from the declaration process — when members tick the checkbox, their full name is automatically used as the signature. Also fixes field name bugs in AddMember that were causing "undefined undefined" signatures.

- **Signature Text Inputs Removed:**
  - Removed ALL "Type your signature" text input fields from declaration modals
  - Declarations now only require checkboxes — dead simple
  - When checkbox ticked, member's full name automatically saved as signature
  - Works for both main member and joint member
  - No validation on signature text anymore — just checkbox required
  - Signature still displays in Member Detail but user never has to type it
- **Declaration Display Cleanup:**
  - Removed redundant "Signed by: John Smith" display from Member Detail
  - Now just shows: ✅ "Signed and Agreed" + "Signed on 18 April 2026"
  - Cleaner interface — we already know whose record we're looking at
  - Amber warning box for unsigned declarations unchanged
- **AddMember Signature Auto-Population:**
  - Fixed field name bug: was using `formData.main_first_name` (doesn't exist)
  - Corrected to `formData.first_name` + `formData.last_name` for main member
  - Joint member uses `formData.joint_first_name` + `formData.joint_last_name`
  - Signatures now correctly populated during registration
  - No more "undefined undefined" in declaration signatures
- **MemberDetail Modal Fixes:**
  - Sign Declarations modal updated to use member's actual name
  - Joint member name displayed in modal heading
  - Auto-populates signatures with correct member names when saving
  - Fixed database table: was trying to update `members` table instead of `declarations` table
  - Now uses `upsert` on `declarations` table so works whether record exists or not
  - Joint member sections hidden for single memberships

**Bug Fixes:**
- Fixed: "Sign & Save" button not working (wrong database table)
- Fixed: "undefined undefined" signatures in new members
- Fixed: Joint member name not showing in signature modal
- Fixed: Joint member getting main member's name as signature

**Files Changed:**
- `AddMember.tsx` — Auto-populate signatures with member names
- `MemberDetail.tsx` — Remove signature inputs, fix table, hide signature display

---

### v0.10.1 (17 April 2026)
**Critical bug fixes and UX improvements** based on extensive committee testing. This release addresses data integrity issues, routing errors, form layout problems, and workflow gaps discovered during live usage.

- **Bulk Action Safety System (CRITICAL FIX):**
  - Activation validation: members can no longer be activated without payment + documents
  - Context-aware action bar: single vs multiple member selections handled differently
  - Enhanced delete protection: mandatory reason field + password confirmation
  - Visual feedback: disabled actions at 50% opacity with tooltips
- **Routing & Navigation Fixes:**
  - Payments Page View Button: fixed 404 error (wrong route `/member/` → `/members/`)
  - Documents Display Fix: fixed column name mismatch between AddMember and DocumentsTab
- **Form Layout Improvements:**
  - Next of Kin step reorganized into logical rows
  - GP Details step reorganized with Postcode on address row, Phone + Email on same row
- **Registration Workflow Split:**
  - Declaration and Payment separated into 2 distinct steps (8 steps total)
- **Payment Status Auto-Update:**
  - Recording a completed payment automatically activates a pending member
- **Document Upload During Registration (Re-enabled):**
  - Files upload to Supabase Storage during registration
  - URLs saved correctly to members table
- **UI/UX Improvements:**
  - Joint member declaration sections hidden for single applicants
  - Declarations tab redesigned to show actual legal text
  - Members List search View button fixed
  - Hover bar overlay causing unclickable rows removed

**Files Changed:**
- `AddMember.tsx`, `MemberDetail.tsx`, `BulkActionsBar.tsx`, `Payments.tsx`

---

### v0.10.0 (19 February 2026)
**Major registration workflow overhaul based on committee feedback.** Streamlines member registration from 9 steps to 7 steps, introduces human-readable membership IDs, implements automatic application tracking, and gives the committee full control over when emails are sent.

- Streamlined 7-step registration (removed GDPR and Paper Form steps)
- Human-readable membership IDs: FCM-XXXXX format
- Automatic application reference tracking: APP-YYYYMMDD-XXXX format
- Manual email control (removed auto-send from registration)
- Form input sizing redesigned for natural content-appropriate widths
- Medical Info default state changed (no longer defaults to "No")
- Payment adjustment field made read-only during registration
- Revamped registration success screen

---

### v0.9.6.0 (15 February 2026)
Administrative experience improvements with expanded Settings page, actionable dashboard alerts, dark mode, and comprehensive error handling.

- Dashboard Alerts Widget (Documents, Declarations, Payments, Emails)
- Settings Page expanded with 6 tabs
- Dark Mode (Experimental)
- Custom error pages (404, 500, crash) with support links
- Toast notifications replace blocking alerts throughout

---

### v0.9.5.0 (08 February 2026)
Email token system admin controls and registration wizard streamlined to 9 steps.

- Email Token Status widget on Member Detail
- Registration reduced from 10 to 9 steps (documents now via email)
- Edge Function authentication fixes
- Public upload page RLS policy fixes

---

### v0.9.4.0 (05 February 2026)
🎊 **Instant Email Triggers Complete!** Three instant-trigger emails completing the full email automation system.

- Welcome email on registration, payment confirmation, reactivation success
- Auto-pause system (third Edge Function deployed)
- 11 total email scenarios now fully automated

---

### v0.9.3.0 (03 February 2026)
🎨 **Registration Flow Redesign** — horizontal stepper replaced with professional sidebar navigation.

- Fixed left sidebar replacing horizontal stepper
- Click completed steps to navigate back
- Quick Actions section (Save Progress, Back to Members, etc.)
- Deceased members now marked as "pending" by default

---

### v0.9.2.0 (01 February 2026)
🎨 **Member Detail Interface Revamp** — complete visual redesign with Islamic branding.

- Islamic green gradient hero section
- Modern card-based Personal Info tab with mosque gold accents
- Enhanced sub-navigation sidebar
- Quick info strip in hero (phone, email, age, total paid, location)

---

### v0.9.1.0 (26 January 2026)
🎉 **Email Automation Complete!** Fully automated email communication system.

- Resend API integration with crmfs@kelpieai.co.uk
- 7 automated email types with progressive urgency
- Daily cron jobs (9:00 AM and 10:00 AM UTC)
- Member email preferences and unsubscribe tokens
- Saves ~10 hours/month on manual reminders

---

### v0.8.0.0 (22 January 2026)
🔐 **Production Ready!** Authentication system fully operational and battle-tested.

- Fixed infinite recursion in RLS policy
- Corrected Supabase client configuration (anon key vs service_role key)
- Non-blocking profile fetching
- Personalized dashboard greetings
- All committee members can log in successfully

---

### v0.7.1.0 (1 January 2026)
🎉 **Happy New Year!** Modal functionality completed across all Member Detail tabs.

- GP Details Modal
- Declarations Signature Modal
- Document Upload Modal
- Collapsible payment breakdown in Payments tab

---

### v0.7.0.0 (30 December 2025)
GDPR compliance and data protection tools.

- Export Member Data (GDPR Article 15)
- Deletion Request workflow (GDPR Article 17)
- Access Log for audit transparency
- Paper Form compliance tracking

---

### v0.6.0.0 (30 December 2025)
Profile-based navigation and Settings page.

- Profile button in sidebar with dropdown
- Settings page with deletion requests and GDPR guidance

---

### v0.5.0.0 (30 December 2025)
Document management and membership lifecycle handling.

- Document upload during registration
- Supabase Storage integration
- Membership Pause/Unpause system
- Age-based reactivation fee calculation

---

### v0.4.0.0 (29 December 2025)
Phase 1 critical features — legal compliance and payment accuracy.

- Pro-rata and age-based fee calculations
- Medical and posthumous authorization declarations
- Password-protected member deletion

---

### v0.3.1.0 (29 December 2025)
Security hardening — RLS enabled on all 18 tables, routing bug fixes.

---

### v0.3.0.0 (28 December 2025)
Legal compliance — electronic declarations required for funeral cover validity.

---

### v0.2.5.0 (28 December 2025)
Payment system overhaul — pro-rata fees, age-based joining fees, legacy membership.

---

### v0.2.3 (27 December 2025)
Islamic branding and form validation improvements.

---

### v0.2.2 (27 December 2025)
Loading skeletons, Command Palette, aggressive caching, bulk actions.

---

### v0.2.1 (26 December 2025)
Major UI/UX overhaul — collapsible sidebar, Member Detail with 10 tabs, Activity Log, Deceased Member System.

---

### v0.1.5 (24 December 2025)
Feature complete MVP — registration wizard, payment management, dashboard analytics.

---

### v0.1.4 (22 December 2025)
Initial MVP — basic CRUD, Supabase Auth, database schema, routing.

---

## 🎯 Goals

**Mission:** Modernise and streamline the administrative operations of Central Region Muslim Funeral Service, enabling the committee to focus on serving the community rather than managing paperwork, while ensuring full GDPR compliance and data protection for all members.

**Vision:** A fully integrated, automated system that handles member lifecycle management, financial tracking, document management, GDPR compliance, and community engagement — setting the standard for mosque administrative systems in Scotland and demonstrating that data protection and operational efficiency can coexist.

---

**Built with ❤️ in Falkirk, Scotland by [Kelpie AI](https://kelpieai.co.uk)**

*Proving Scotland can dominate technology, one project at a time.*