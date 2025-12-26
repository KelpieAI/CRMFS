# Central Region Muslim Funeral Service - CRM System

A modern web-based CRM and membership management system for Central Region Muslim Funeral Service.

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (mosque green & gold branding)
- **Backend**: Supabase (PostgreSQL database + Auth + Storage)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **SMS**: Twilio
- **Email**: Supabase Email
- **Icons**: Lucide React

## 📋 Features

### Current (Weekend Prototype)
- ✅ Dashboard with stats and overview
- ✅ Member list with search and filtering
- ✅ Login/Authentication
- ✅ Islamic mosque branding (green & gold)
- ✅ Responsive design

### Coming Soon
- 🔄 Payment management
- 🔄 Document uploads (max 1GB, GDPR compliant)
- 🔄 Automated email & SMS reminders
- 🔄 PayPal integration

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Supabase Setup

Make sure your Supabase database has all the tables set up (from the schema you already created).

### 4. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
crmfs-bolt/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Layout.tsx    # Main layout with sidebar
│   │   └── ProtectedRoute.tsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/              # Utilities and configs
│   │   └── supabase.ts   # Supabase client & types
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── MemberList.tsx
│   │   ├── MemberDetail.tsx
│   │   ├── AddMember.tsx
│   │   ├── Payments.tsx
│   │   └── Reports.tsx
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── package.json
├── tailwind.config.js    # Tailwind with mosque colors
├── vite.config.ts
└── tsconfig.json
```

## 🎨 Design System

### Colors
- **Primary Green**: `#16a34a` (emerald-600)
- **Dark Green**: `#166534` (emerald-800)
- **Accent Gold**: `#facc15` (yellow-400)
- **Primary Gold**: `#ca8a04` (yellow-600)

### Typography
- Clean, professional sans-serif
- Hierarchy: 3xl for headers, sm for body text

## 🔐 Authentication

Currently uses Supabase Auth with email/password. Three users will have access initially.

To create admin users in Supabase:
1. Go to Authentication > Users in Supabase dashboard
2. Click "Add User"
3. Add email and password
4. User will be able to log in

## 📝 Database Schema

All tables are already set up in your Supabase instance:
- `members` - Main member records
- `joint_members` - Joint membership info
- `children` - Children covered under membership
- `next_of_kin` - Emergency contacts
- `gp_details` - GP/Doctor information
- `medical_info` - Medical conditions
- `fee_structure` - Age-based pricing
- `payments` - Payment records
- `documents` - Document tracking
- `declarations` - Legal signatures
- `admin_users` - User roles

## 🚨 TODO for Production

- [ ] Add PayPal payment integration
- [ ] Implement Twilio SMS reminders
- [ ] Set up automated email reminders
- [ ] Add document upload functionality
- [ ] Implement GDPR compliance features
- [ ] Create comprehensive reporting
- [ ] Add multi-step member registration wizard
- [ ] Build member detail view with all tabs
- [ ] Add data export functionality

## 👨‍💻 Development Notes

- Uses React Query for data fetching and caching
- Supabase RLS (Row Level Security) should be configured for production
- All timestamps are in ISO format
- File uploads will use Supabase Storage
- SMS reminders will use Twilio API
- Emails use Supabase's built-in email service

## 📞 Support

Built for Central Region Muslim Funeral Service by Kelpie AI.

---

**Weekend Prototype Goal**: Dashboard + Member List + Login working with real Supabase data
