# Ekklesia

A modern, full-featured Church Management System for managing members, departments, attendance, and finances.

[![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)

**Live Demo:** [https://church-hub-1a558.web.app](https://church-hub-1a558.web.app)

---

## Features

### Member Management
- Add, edit, and delete church members
- Member profiles with photos
- Department assignment
- Contact information tracking
- Automatic flagging for members with attendance concerns

### Department Management
- Create and organize church departments
- Track member count per department
- Department-based member filtering

### Attendance Tracking
- Record weekly attendance by department
- Mark members as present, absent, or excused
- Historical attendance records
- Automatic absence tracking (flags 2+ absences in 60 days)

### Finance & Tithes
- Record member tithes and offerings
- Track payment methods
- Financial reporting
- Member contribution history

### Dashboard & Analytics
- Real-time statistics overview
- Member growth charts
- Attendance trends
- Quick access to key metrics

### Multi-Church Support
- Each admin is scoped to their church
- Complete data isolation between churches
- Role-based access control

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16+ (App Router) |
| **UI Library** | React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 |
| **Database** | Firebase Firestore |
| **Authentication** | Firebase Auth |
| **Storage** | Firebase Storage |
| **Hosting** | Firebase Hosting |
| **Charts** | Chart.js + react-chartjs-2 |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase account with a project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rofyray/churchhub.git
   cd churchhub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Fill in your Firebase credentials in `.env`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Set up Firebase**

   - Create a Firestore database in [Firebase Console](https://console.firebase.google.com/)
   - Enable Firebase Authentication (Email/Password)
   - Create a Storage bucket
   - Deploy security rules:
     ```bash
     firebase deploy --only firestore:rules,storage
     ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
churchhub/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Authentication routes
│   │   │   └── login/          # Login page
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── members/        # Member management
│   │   │   ├── departments/    # Department management
│   │   │   ├── attendance/     # Attendance tracking
│   │   │   ├── finance/        # Tithes & finances
│   │   │   └── settings/       # Church settings
│   │   ├── globals.css         # Tailwind v4 theme
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── layout/             # Header, Sidebar
│   │   ├── members/            # Member components
│   │   └── dashboard/          # Dashboard widgets
│   ├── context/
│   │   └── AuthContext.tsx     # Firebase auth state
│   └── lib/
│       ├── firebase/           # Firebase configuration
│       ├── hooks/              # Custom React hooks
│       ├── types/              # TypeScript interfaces
│       └── utils/              # Utility functions
├── public/                     # Static assets
├── firebase.json               # Firebase CLI config
├── firestore.rules             # Database security rules
├── storage.rules               # Storage security rules
└── firestore.indexes.json      # Composite indexes
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

---

## Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server locally
npm run start

# Run linting
npm run lint
```

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js configuration
- Tailwind CSS for styling (no separate CSS files)
- React Context for state management

---

## Deployment

### Deploy to Firebase Hosting

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy**
   ```bash
   firebase deploy
   ```

### Deploy Commands

```bash
# Full deployment (hosting + rules)
npm run build && firebase deploy

# Hosting only
npm run build && firebase deploy --only hosting

# Security rules only
firebase deploy --only firestore:rules,storage
```

### CI/CD with GitHub Actions

The project includes a GitHub Actions workflow for automatic deployment. See `.github/workflows/firebase-deploy.yml`.

To set up:
1. Add `FIREBASE_SERVICE_ACCOUNT` secret to GitHub
2. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables as secrets
3. Push to `main` branch to trigger deployment

---

## Database Schema

```
Firestore Structure:

/churches/{churchId}
    ├── /departments/{departmentId}
    │       └── name, description, memberCount
    ├── /members/{memberId}
    │       └── firstName, lastName, email, phone,
    │           departmentId, photoURL, joinDate, flagged
    ├── /attendance/{date}
    │       └── records: [{memberId, status, departmentId}]
    └── /tithes/{titheId}
            └── memberId, amount, date, paymentMethod, notes

/admins/{userId}
    └── email, churchId, role
```

---

## Security

- All database queries are scoped by `churchId`
- Firestore security rules enforce church-based access
- Admin users can only access their assigned church's data
- Storage rules limit uploads to authenticated users (5MB max, images only)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For questions or issues, please open an issue on GitHub.
