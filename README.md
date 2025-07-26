# MockCRM

A modern, full-stack CRM application built with Node.js/Express backend and React frontend, featuring role-based access control, invite-only user registration, and comprehensive business management tools.

## Features

### Authentication & Security
- **JWT-based authentication** with bcrypt password hashing
- **Invite-only registration system** - only admins can create new user accounts
- **Role-based access control** (Admin & Sales Rep)
- **Protected routes** with proper middleware
- **Self-protection mechanisms** - admins cannot delete their own accounts

### User Management
- **Admin-only user creation** - invite users by email
- **User role management** - assign admin or sales rep roles
- **User deletion** - admins can delete any user except themselves
- **Account isolation** - multi-tenant architecture

### Business Management
- **Customer management** - full CRUD operations with search and filtering
- **Deal tracking** - manage sales pipeline with customizable stages
- **Task management** - assign and track tasks with priorities
- **Analytics dashboard** - view key metrics and performance data

### Admin Controls
- **Deal stage management** - create, edit, and delete sales stages
- **User administration** - manage all users in the system
- **System configuration** - control application settings

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React** - UI framework
- **React Query** - Data fetching and caching
- **React Router** - Navigation
- **TailwindCSS** - Styling
- **Jest** - Testing

## API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/auth/login` | User login | Public |
| POST | `/auth/register` | User registration (invite-only) | Pre-created users |
| POST | `/auth/logout` | User logout | Authenticated |
| GET | `/auth/verify` | Verify JWT token | Authenticated |

### Admin Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/auth/admin/create-user` | Create new user account | Admin only |
| DELETE | `/auth/admin/users/:id` | Delete user | Admin only |
| GET | `/api/admin/stages` | Get deal stages | Admin only |
| POST | `/api/admin/stages` | Create deal stage | Admin only |
| PUT | `/api/admin/stages/:id` | Update deal stage | Admin only |
| DELETE | `/api/admin/stages/:id` | Delete deal stage | Admin only |

### Business Data
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/customers` | Get customers | All authenticated |
| POST | `/api/customers` | Create customer | All authenticated |
| PUT | `/api/customers/:id` | Update customer | All authenticated |
| DELETE | `/api/customers/:id` | Delete customer | Admin only |
| GET | `/api/deals` | Get deals | Rep (own), Admin (all) |
| POST | `/api/deals` | Create deal | All authenticated |
| PUT | `/api/deals/:id` | Update deal | Rep (own), Admin (all) |
| DELETE | `/api/deals/:id` | Delete deal | Admin only |
| GET | `/api/tasks` | Get tasks | All authenticated |
| POST | `/api/tasks` | Create task | All authenticated |
| PUT | `/api/tasks/:id` | Update task | All authenticated |
| DELETE | `/api/tasks/:id` | Delete task | Admin only |

## Project Structure

```
MockCRM/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── ...
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/             # Database configuration
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── server.js           # Main server file
│   └── package.json
├── Design.md              # Detailed design documentation
└── README.md              # This file
```

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MockCRM
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb mockcrm

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your database credentials
```

### 3. Backend Setup
```bash
cd server
npm install
npm start
```

The server will start on `http://localhost:5000`

### 4. Frontend Setup
```bash
cd client
npm install
npm start
```

The application will open on `http://localhost:3000`

### 5. Initial Setup
1. **Create your first admin account** using the database:
   ```sql
   INSERT INTO users (email, name, role, account_id) 
   VALUES ('admin@example.com', 'Admin User', 'admin', 1);
   ```

2. **Register with the admin email** to set your password

3. **Start managing your CRM!**

## Environment Variables

### Backend (.env)
```env
JWT_SECRET=your_jwt_secret_here
DB_USER=mockcrmuser
DB_HOST=localhost
DB_NAME=mockcrm
DB_PASSWORD=your_password
DB_PORT=5432
```

## Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

## Documentation

- **Design.md** - Comprehensive system design and architecture documentation
- **API Documentation** - See the API Endpoints section above

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**MockCRM** - Modern CRM for modern businesses
