# HostelSphere - Modern Hostel Management System (HMS)

HostelSphere is a production-grade, ERP-style Hostel Management System built with a modern web stack. It features real-time occupancy statistics, an automated transaction-safe room allocation algorithm, bulk student import capabilities via CSV, and security audit logs.

## 🚀 Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Data Exporting**: SheetJS (`xlsx`) for Excel spreadsheets, `jspdf` & `jspdf-autotable` for PDF ledgers
- **Data Visualizations**: `recharts` for dynamic capacity comparisons and weekly visitor check-in trends
- **Database ORM**: Prisma 6 ORM with MySQL
- **Authentication**: JWT stored in secure `HttpOnly` cookies & `bcryptjs` password hashing
- **Hosting Compatibilities**: Vercel (Frontend/Serverless APIs), Render & Railway (MySQL Databases & Docker)

---

## 📂 Project Folder Structure

```text
amar/
├── prisma/
│   ├── migrations/            # SQL migration history files
│   ├── schema.prisma          # Prisma schema model definitions
│   └── seed.ts                # Database reset and mock data seeding script
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── api/               # Next.js Serverless Route Handlers
│   │   │   ├── auth/          # Login, logout, session routes
│   │   │   ├── dashboard/     # Dashboard aggregates and trends
│   │   │   ├── furniture/     # Furniture inventory management
│   │   │   ├── hostels/       # Hostel CRUD routes
│   │   │   ├── logs/          # System audit logs
│   │   │   ├── rooms/         # Room CRUD routes
│   │   │   ├── students/      # Student CRUD & bulk imports
│   │   │   └── visitors/      # Visitor check-ins and check-outs
│   │   ├── dashboard/         # Dashboard Page
│   │   ├── furniture/         # Furniture Inventory Page
│   │   ├── hostels/           # Hostels Page
│   │   ├── login/             # Administrator Login Page
│   │   ├── logs/              # Activity Logs Page
│   │   ├── rooms/             # Rooms Page
│   │   ├── students/          # Students Page
│   │   ├── visitors/          # Visitor Register Page
│   │   ├── layout.tsx         # Global Providers and Root Layout
│   │   ├── page.tsx           # Server-side landing redirection route
│   │   └── globals.css        # Global CSS styling
│   ├── components/
│   │   ├── LoadingSkeleton.tsx # Pulse skeleton loader components
│   │   └── SidebarLayout.tsx  # Responsive admin navigation drawer layout
│   ├── context/
│   │   ├── AuthContext.tsx    # Administrator sessions state
│   │   └── ToastContext.tsx   # Custom glassmorphic notifications state
│   └── lib/
│       ├── allocation.ts      # Transaction-safe room allocation algorithms
│       ├── api-error.ts       # Unified API error handler wrapper
│       ├── auth.ts            # JWT and Bcrypt authentication helpers
│       ├── prisma.ts          # Singleton Prisma Client instance
│       └── validations.ts     # Zod input verification schemas
├── .env                       # Local environment variables
├── Dockerfile                 # Multi-stage production build configuration
├── docker-compose.yml         # Container configuration for local stack
├── package.json               # Package dependencies and run scripts
├── prisma.config.ts           # Prisma CLI configuration
├── railway.json               # Railway deployment configuration
├── render.yaml                # Render Blueprint setup
└── vercel.json                # Vercel deployment configuration
```

---

## 🔑 Environment Variables Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="mysql://root:P1r0a2v9%40@localhost:3306/hostel_management"
JWT_SECRET="d5f8e32cbb54d587c63901b0f5923c588bf0a568ee29bc8628b030e4414c9902"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

*Note: Since the MySQL database password contains `@` at the end (`P1r0a2v9@`), it is URL-encoded as `%40` in the connection string to prevent Prisma parsing errors.*

---

## 🗄️ Database Entity Schema Design

- **Administrator**: Admin credentials (`username`, `password_hash`), name, and optional assigned `hostel_id`. (1-to-1 relation with Hostel).
- **Hostel**: Name and number of rooms/students. (1-to-many with Room, 1-to-many with Student).
- **Room**: Room number, capacity limits, active occupants, and availability status (`AVAILABLE`, `FULL`, `MAINTENANCE`).
- **Student**: Profile information, department, year of study, and room placement references. (1-to-many with Visitor).
- **Furniture**: Assigned items in a room (e.g. Bed, Table, Chair). (Many-to-1 with Room).
- **Visitor**: Logs of guest entries (`visitor_name`, `date`, `in_time`, `out_time`) linked to boarders.
- **ActivityLog**: Security audit logs recording events, operations, and administrators.

---

## 🌐 API Endpoints Reference

### 🔐 Authentication

| Method | Endpoint | Description | Payload / Cookies |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate admin, signs JWT, sets HttpOnly cookie | `{ "username": "admin", "password": "admin123" }` |
| `POST` | `/api/auth/logout` | Clears JWT HttpOnly cookie, logs out session | None |
| `GET` | `/api/auth/me` | Fetch active logged-in administrator profile details | Reads cookie |

### 🏨 Hostels & Rooms

| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/hostels` | Fetch all hostel wings, counts, and managers | None |
| `POST` | `/api/hostels` | Register a new hostel wing | `{ "hostel_name": "Tesla Hall of Residence" }` |
| `DELETE` | `/api/hostels/[id]` | Remove hostel wing (cascades rooms and furniture) | None |
| `GET` | `/api/rooms` | Query rooms (Supports filters: `search`, `hostelId`, `status`) | Query Params |
| `POST` | `/api/rooms` | Add a new room | `{ "room_number": "104", "capacity": 3, "status": "AVAILABLE", "hostel_id": 1 }` |
| `DELETE` | `/api/rooms/[id]` | Remove room (updates student placement associations) | None |

### 🎓 Students

| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | Paginated boarders list with search and filters | Query Params |
| `POST` | `/api/students` | Register student & trigger automatic room allocation | `{ "fname": "Amit", "lname": "Sharma", "mob_no": "9999999999", "dept": "Computer Science", "year_of_study": 3, "hostel_id": 1 }` |
| `POST` | `/api/students/import` | Bulk register students from CSV parsed payload | `{ "students": [{ "fname": "Raj", "lname": "Verma", ... }] }` |
| `DELETE` | `/api/students/[id]` | Deallocate student from room and delete profile | None |

### 🛋️ Furniture & Visitors

| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/furniture` | Fetch inventory (Filters: `search` by item, `roomId`) | Query Params |
| `POST` | `/api/furniture` | Assign furniture to a room | `{ "furniture_type": "Steel Almirah", "room_id": 1 }` |
| `GET` | `/api/visitors` | List check-in records (Filters: `search` by visitor name) | Query Params |
| `POST` | `/api/visitors` | Check in a visitor for a student | `{ "visitor_name": "Rohan Sen", "date": "2026-06-09", "in_time": "10:30 AM", "student_id": 1 }` |
| `PUT` | `/api/visitors/[id]` | Check out visitor (records out timestamp) | `{ "out_time": "04:15 PM" }` |

---

## 🛠️ Local Installation & Running Guide

### Prerequisites
- Node.js (v18 or higher)
- MySQL Database running locally (port `3306`)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Environment Variables
Create `.env` based on the configuration above.

### Step 3: Run Database Migrations & Seeding
This command executes migrations and seeds the database with initial admin credentials (`admin`/`admin123`) and sample data:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment Guide

### Running locally with Docker Compose
If you have Docker installed, you can spin up the application and database together in isolated containers:

```bash
# Start the containers
docker-compose up --build -d

# Run Prisma migrations and seed the containerized database
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
```
Access the application at [http://localhost:3000](http://localhost:3000).

---

## ☁️ Cloud Production Deployment Guide

### 📂 Backend & Database Deployments (Render / Railway)

#### Option A: Railway
1. Push your repository to GitHub.
2. In Railway, click **New Project** -> **GitHub Repo**.
3. Railway will read the `railway.json` configuration file, provision resources, build the standalone container via Nixpacks, and deploy the application.
4. Provision a MySQL Database in the same project, copy the connection URI, and set it as the `DATABASE_URL` environment variable for the web service.

#### Option B: Render Blueprints
1. Connect your GitHub repository to Render.
2. Go to **Blueprints** -> **New Blueprint Instance**.
3. Select your repository. Render will read `render.yaml` to spin up a managed database and Next.js Web service automatically.

### 🌐 Frontend Hosting (Vercel)
If you prefer serverless page rendering:
1. Connect your repository to Vercel.
2. Set the `DATABASE_URL` and `JWT_SECRET` variables in settings.
3. Deploy. Vercel will optimize the App Router routes and handle edge execution of the API paths.
