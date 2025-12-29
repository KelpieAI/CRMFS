# Central Region Muslim Funeral Service - CRM System

> A comprehensive member and payment management system built for Falkirk Central Mosque's death committee (Central Region Muslim Funeral Service).

**Built by:** [Kelpie AI](https://kelpieai.co.uk)  
**Version:** 0.3.1.0  
**Status:** Launch Ready  
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
- Reducing administrative overhead and manual paperwork
- Ensuring compliance with legal declarations and documentation

---

## ✨ Current Features

### 🔐 Authentication & Security
- Secure login system with Supabase authentication
- Protected routes and session management
- Row-level security (RLS) enabled on all database tables
- Environment validation and connection monitoring
- Password-protected member deletion
- Complete audit trails for compliance

### 👥 Member Management
- **10-Step Registration Wizard** with progress tracking:
  - Personal details with age auto-calculation
  - Joint member registration (optional)
  - Children information
  - Next of kin details (mandatory fields with relation dropdown)
  - GP information (mandatory)
  - Medical declarations with conditional Yes/No questions
  - Legal declarations with electronic signatures
  - Document upload placeholders
  - Pro-rata payment calculation with age-based fees
  - Review and submit
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
  - Documents tab (file management placeholder)
  - Declarations tab (legal compliance with signatures)
  - Payments tab (transaction history with summary cards)
  - Activity Log tab (complete audit trail with timeline)
- **Member Actions:**
  - Edit mode with inline field editing
  - View payment history with status badges
  - Pause membership (temporary suspension)
  - Mark as deceased (preserves records)
  - Delete member (password-protected with confirmation)
- **Enhanced Validations:**
  - Mobile number must be 11 digits
  - Email format validation
  - Age display next to date of birth
  - Mandatory GP and Next of Kin fields

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

### 📊 Dashboard & Analytics
- Real-time statistics:
  - Total members
  - Active members
  - Pending applications
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
  - Deceased marking
  - Funeral arrangements
  - Expense additions
  - Document uploads
  - Contact additions

### 🎨 User Experience
- **Modern Islamic Design:**
  - Sidebar: Dark Islamic Green (#06420c)
  - Accents: Mosque Gold (#D4AF37)
  - Clean white content areas
  - Professional typography
- **Navigation System:**
  - Collapsible main sidebar (64px collapsed, 256px expanded)
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
- **members** - Primary member records with age-based fees
- **joint_members** - Joint membership details
- **children** - Dependent information
- **next_of_kin** - Mandatory emergency contacts
- **gp_details** - Mandatory medical practitioner information
- **medical_info** - Conditional health declarations

### Financial Tables
- **payments** - Transaction records with pro-rata calculations
- **fee_structure** - Age-based pricing tiers

### Deceased Management Tables
- **deceased** - Deceased member records
- **funeral_details** - Burial information
- **funeral_contacts** - Family contacts
- **funeral_expenses** - Itemised costs
- **funeral_payments** - Contributions

### Administrative Tables
- **documents** - File attachments
- **declarations** - Legal acceptance records with signatures
- **activity_log** - Automatic audit trail with triggers
- **admin_users** - System administrators

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
9. Upload supporting documents
10. Review pro-rata fees and submit
11. Mark payment as received (sets Active/Pending status)

**Progress can be saved at any step and resumed later.**

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

### Phase 2 (Q1 2025)
- [ ] User authentication with role-based access control
- [ ] Document upload and storage integration (Supabase Storage)
- [ ] PDF receipt generation
- [ ] Email notifications for renewals
- [ ] SMS reminders (via Twilio integration)
- [ ] Advanced reporting and analytics
- [ ] Export to CSV/Excel
- [ ] Bulk operations (mass email, status updates)
- [ ] Automated payment reminders

### Phase 3 (Q2 2025)
- [ ] Children turn 18 automation (90-day tracking, auto-removal, notifications)
- [ ] Late fee warning system (3-tier automated warnings)
- [ ] Auto-pause after 3 warnings
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
4. Set up authentication provider  
5. Run activity log trigger creation script
6. Update environment variables  

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

- **Total Components:** 40+
- **Database Tables:** 18
- **Lines of Code:** ~25,000
- **Pages:** 15
- **API Endpoints:** 80+ (via Supabase)
- **Member Detail Tabs:** 10
- **Deceased Detail Tabs:** 7
- **Registration Steps:** 10
- **Premium Features:** 5 (Skeletons, Cmd+K, Caching, Optimistic, Bulk)

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
- Secure authentication with Supabase Auth
- Password-protected destructive operations
- Environment variable protection
- Automatic activity logging for audit compliance
- Regular security audits
- GDPR compliance considerations

**Report security vulnerabilities to:** info@kelpieai.co.uk

---

## 📈 Version History

### v0.3.1.0 (Current - 29 December 2024)
- **Security Hardening:**
  - Enabled Row Level Security (RLS) on all 18 database tables
  - Public access policies for internal mosque use
  - Password-protected member deletion
  - Fixed function search path vulnerabilities
- **Critical Bug Fixes:**
  - Fixed routing issues (deceased routes leading to 404)
  - Resolved table name mismatch in deceased system
  - Added debug logging for troubleshooting

### v0.3.0.0 (28 December 2024)
- **Legal Compliance:**
  - Medical disclosure declaration with electronic signatures
  - Posthumous medical authorization with electronic signatures
  - Both declarations required for main and joint members
  - Permanent storage with timestamps for audit compliance
- **Registration Success Redesign:**
  - Payment-based success screens (paid = green, pending = yellow)
  - Removed generic "What happens next?" section
  - Prominent "Register Another Member" button
  - Professional status indicators

### v0.2.5.0 (28 December 2024)
- **Payment System Overhaul:**
  - Pro-rata annual fee calculation (signup date → Dec 31)
  - Age-based joining fees (£75-£500 based on 5 age brackets)
  - Legacy membership support (£0 joining fee for children turning 18)
  - Adjustments field for prepaying following year
  - Clear coverage period display
  - Payment received toggle (Active/Pending status)
  - Automated fee breakdown with real-time totals
- **Medical Information Enhancement:**
  - Conditional Yes/No question for medical conditions
  - Text box appears only if conditions exist
  - Applied to both main and joint members
  - Removes "optional" labelling

### v0.2.0.0 (27 December 2024)
- **Islamic Branding Update:**
  - Sidebar redesigned with Islamic Green (#06420c)
  - Mosque Gold (#D4AF37) accents throughout
  - Active nav items highlighted in gold
  - Mobile hamburger button updated
- **Enhanced Validations:**
  - Mobile number validation (must be 11 digits)
  - Email format validation (@ and . required)
  - GP details now mandatory
  - Next of Kin fields now mandatory (address, town, city, postcode, email)
  - Relation field converted to dropdown (Spouse, Child, Parent, Sibling, Other)
- **UI Improvements:**
  - Age auto-calculation next to date of birth
  - Removed "Member since" field from registration
  - Removed deceased button from member detail page (use Record Death flow)
  - Improved form field organization

### v0.1.7.0 (27 December 2024)
- **Premium Polish Features:**
  - Loading skeletons with shimmer animations (Notion/Linear style)
  - Command Palette (Cmd+K / Ctrl+K) for quick navigation
  - Aggressive caching (5min stale, 30min cache time)
  - Optimistic UI updates with automatic rollback
  - Bulk actions with floating action bar
- **Death Record Wizard:**
  - 4-step guided flow (Select Member, Death Details, Burial Info, Review)
  - Islamic verse display
  - Progress indicator with checkmarks
  - Form validation at each step
  - Creates deceased record and updates member status

### v0.1.6.3 (26 December 2024)
- **Major UI/UX Overhaul:**
  - Implemented Supabase-style collapsible navigation (64px collapsed, 256px expanded)
  - Smooth hover-to-expand animations with fixed icon positions
  - Mobile hamburger menu with overlay
  - Proper content padding (32px top, responsive)
- **Member Detail Page Redesign:**
  - Complete rebuild with modern sub-navigation sidebar (224px compact)
  - 10 fully functional tabs with premium UX
  - Compact header (single line, no redundant info)
  - Quick info bar with 4 stat cards
  - Two-column layouts for efficient space usage
  - Professional card-based design with consistent spacing
- **Premium CRUD Modals:**
  - Children management (add/edit/delete with validation)
  - Next of Kin management (emergency contacts)
  - Medical Info management (conditions/allergies/medications)
  - Professional form validation with inline errors
  - Auto-focus, keyboard shortcuts, loading states
  - Smooth fade-in animations
- **Activity Logging System:**
  - Automatic database triggers on all tables
  - Complete audit trail with timeline view
  - Colour-coded action types with icons
  - Relative timestamps ("2 hours ago")
  - Statistics cards and expandable details
- **Deceased Member System:**
  - Complete funeral management with 7 information tabs
  - Family contact tracking
  - Expense and payment management
  - Document tracking for certificates

### v0.1.5 (24 December 2024)
- Complete member registration wizard
- Payment management system
- Dashboard with analytics
- Late payment tracking
- Upcoming renewals widget
- Member action buttons (pause, deceased, delete)
- Responsive mobile design
- Toast notifications and UX polish

### v0.1.4 (22 December 2024)
- Initial MVP release
- Basic CRUD operations
- Authentication system
- Database schema implementation
- Supabase integration

---

## 🎯 Goals

**Mission:** Modernise and streamline the administrative operations of Central Region Muslim Funeral Service, enabling the committee to focus on serving the community rather than managing paperwork.

**Vision:** A fully integrated, automated system that handles member lifecycle management, financial tracking, and community engagement—setting the standard for mosque administrative systems in Scotland.

---

**Built with ❤️ in Falkirk, Scotland by [Kelpie AI](https://kelpieai.co.uk)**

*Proving Scotland can dominate technology, one project at a time.*