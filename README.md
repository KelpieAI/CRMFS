# Central Region Muslim Funeral Service - CRM System

> A comprehensive member and payment management system built for Falkirk Central Mosque's death committee (Central Region Muslim Funeral Service).

**Built by:** [Kelpie AI](https://kelpieai.co.uk)  
**Version:** 0.1.5  
**Status:** Active Development  
**Tech Stack:** React + TypeScript + Supabase + Tailwind CSS

---

## 📋 Overview

The Central Region Muslim Funeral Service CRM is a modern web application designed to streamline member registration, payment tracking, and administrative operations for Falkirk Central Mosque's funeral service committee. The system replaces the previous Microsoft Access-based solution with a responsive, cloud-based platform accessible from any device.

### Purpose

This CRM serves the death committee's operational needs by:
- Digitising member registration and data management
- Automating payment calculations and renewal tracking
- Providing real-time insights into membership and finances
- Centralising all member information in one secure location
- Reducing administrative overhead and manual paperwork

---

## ✨ Current Features

### 🔐 Authentication & Security
- Secure login system with Supabase authentication
- Protected routes and session management
- Row-level security on all database tables
- Environment validation and connection monitoring

### 👥 Member Management
- **10-Step Registration Wizard** with progress tracking:
  - Personal details
  - Joint member registration (optional)
  - Children information
  - Next of kin details
  - GP information
  - Medical declarations
  - Document upload placeholders
  - Terms & conditions
  - Automated payment calculation
  - Review and submit
- **Save Progress Feature** - Resume incomplete registrations
- **Member Profiles** with comprehensive data tabs
- **Edit Mode** for updating member information
- **Member Actions:**
  - View payment history
  - Pause membership (temporary suspension)
  - Mark as deceased (preserves records)
  - Delete member (removes all data)

### 💰 Payment Management
- Payment recording and tracking
- Multiple payment methods (cash, card, bank transfer, cheque)
- Automatic fee calculation based on member age
- Payment status tracking (Pending, Completed, Overdue, Failed, Refunded)
- Late fee management
- **Late Payment Widget** - Highlights overdue payments
- Search and filter by member, status, or date range
- Payment history per member

### 📊 Dashboard & Analytics
- Real-time statistics:
  - Total members
  - Active members
  - Pending applications
  - Total revenue
- **Applications In Progress** - Shows saved registrations
- **Upcoming Renewals** (30-day advance warning):
  - Color-coded urgency (Red: ≤7 days, Orange: 8-14 days, Yellow: 15-30 days)
  - Automatic anniversary calculation
  - Direct links to member profiles
- Recent member activity feed

### 🎨 User Experience
- Responsive design (desktop, tablet, mobile)
- Toast notifications for user feedback
- Loading states and skeleton screens
- Empty states with helpful guidance
- Error boundaries for graceful failure handling
- Custom 404 page
- Islamic-themed color scheme (emerald green + gold)
- Professional Montserrat typography

### 📈 Reports (Basic)
- Report generation framework
- Analytics dashboard structure
- Exportable data views (planned enhancement)

---

## 🗄️ Database Schema

Built on Supabase PostgreSQL with the following tables:

### Core Tables
- **members** - Primary member records
- **joint_members** - Joint membership details
- **children** - Dependent information
- **next_of_kin** - Emergency contacts
- **gp_details** - Medical practitioner information
- **medical_info** - Health declarations

### Financial Tables
- **payments** - Transaction records
- **fee_structure** - Age-based pricing

### Administrative Tables
- **documents** - File attachments
- **declarations** - Terms acceptance records

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
  - RESTful API

### Developer Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Git** - Version control

---

## 📱 Key Workflows

### Member Registration
1. Start application (single or joint membership)
2. Enter personal details
3. Add joint member (if applicable)
4. Register children
5. Provide next of kin information
6. Add GP details
7. Complete medical declarations
8. Upload supporting documents
9. Accept terms and conditions
10. Review fees and submit

**Progress can be saved at any step and resumed later.**

### Payment Processing
1. Select member from dashboard
2. Navigate to payments tab
3. Record payment details
4. System calculates fees based on age
5. Generate receipt (planned)
6. Track payment status
7. Monitor renewals

### Membership Renewal
1. System identifies members approaching anniversary
2. Dashboard displays upcoming renewals (30-day window)
3. Committee contacts member
4. Process renewal payment
5. Update member status

---

## 🎯 Planned Features

### Phase 2 (Q1 2025)
- [ ] Document upload and storage integration
- [ ] PDF receipt generation
- [ ] Email notifications for renewals
- [ ] SMS reminders (via Twilio integration)
- [ ] Advanced reporting and analytics
- [ ] Export to CSV/Excel
- [ ] Bulk operations (mass email, status updates)
- [ ] Payment reminders automation

### Phase 3 (Q2 2025)
- [ ] Multi-language support (Arabic, Urdu)
- [ ] Mobile app (React Native)
- [ ] WhatsApp integration for notifications
- [ ] Advanced search with filters
- [ ] Audit logs and activity tracking
- [ ] Role-based access control (Admin, Treasurer, Volunteer)
- [ ] Donation tracking module
- [ ] Automated backup system

### Future Considerations
- [ ] Integration with mosque management systems
- [ ] Event management (funeral arrangements)
- [ ] Volunteer scheduling
- [ ] Inventory tracking (burial supplies)
- [ ] Financial reporting for audits
- [ ] API for third-party integrations

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
3. Configure Row Level Security policies
4. Set up authentication provider
5. Update environment variables

---

## 🎨 Customization

### Branding
The system uses Falkirk Central Mosque's color scheme:
- **Primary:** Emerald Green (#10b981) - Islamic tradition
- **Secondary:** Gold (#eab308) - Accent color
- **Font:** Montserrat - Modern, readable typography

### Theme Modification
1. **Font**: Update `src/index.css` and `tailwind.config.js`
2. **Colors**: Find & replace color classes (e.g., `emerald` → `blue`)
3. **Logo**: Replace in `src/components/Layout.tsx`

See `STYLING_GUIDE.md` for detailed instructions.

---

## 📊 Project Metrics

- **Total Components:** 20+
- **Database Tables:** 10
- **Lines of Code:** ~15,000
- **Pages:** 8
- **API Endpoints:** 40+ (via Supabase)
- **Test Coverage:** TBD

---

## 🤝 Contributing

This is a private project developed by Kelpie AI for Falkirk Central Mosque. For inquiries about similar projects or custom development:

**Contact:** [Kelpie AI](https://kelpieai.co.uk)  
**Email:** info@kelpieai.co.uk
**Phone:** +447984 058973
**Location:** Falkirk, Scotland

---

## 📄 License

This project is proprietary software developed for Falkirk Central Mosque. All rights reserved.

Unauthorized copying, modification, distribution, or use of this software is strictly prohibited without explicit written permission from Kelpie AI.

---

## 🙏 Acknowledgments

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
- Row Level Security on all database tables
- Secure authentication with Supabase Auth
- Environment variable protection
- Regular security audits
- GDPR compliance considerations

**Report security vulnerabilities to:** security@kelpieai.co.uk

---

## 📈 Version History

### v0.1.5 (Current - 26 December 2025)
- Complete member registration wizard
- Payment management system
- Dashboard with analytics
- Late payment tracking
- Upcoming renewals widget
- Member action buttons (pause, deceased, delete)
- Responsive mobile design
- Toast notifications and UX polish

### v0.1.4 (24 December 2025)
- Initial MVP release
- Basic CRUD operations
- Authentication system
- Database schema implementation

---

## 🎯 Goals

**Mission:** Modernize and streamline the administrative operations of Central Region Muslim Funeral Service, enabling the committee to focus on serving the community rather than managing paperwork.

**Vision:** A fully integrated, automated system that handles member lifecycle management, financial tracking, and community engagement—setting the standard for mosque administrative systems in Scotland.

---

**Built with ❤️ in Falkirk, Scotland by [Kelpie AI](https://kelpieai.co.uk)**

*Proving Scotland can dominate technology, one project at a time.*