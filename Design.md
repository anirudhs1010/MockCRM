# Context and Scope
This document describes the design of a full-stack mock CRM system. It supports contact and deal management status, basic analytics, searching/filtering, and multi-role access. A central account table has been made to support multi-tenant architecture which allows for a single CRM instance to serve multiple companies. Currently, the scope of this project's architecture is for a small scale of companies but will have changes made to integrate to a larger scale system. This CRM is designed to serve small businesses and aid their sales teams.

## Goals and Non-Goals

The system goals include allowing users to manage leads, customers, and deals under their own organization (account). Role-based permissions will be enabled for view access to the sales team and having an admin with write and read access. The typical CRM features such as searching, filtering, and analytics will be included. 

Furthermore, access control needs to be added to the system to have admins invite sales users to view the platform via email, so they can join the CRM's instance. For sales users, they should be able to view all contacts on one screen to determine who to contact. 

There should also be detailed metrics personally for the developers to see performance, reliability, and user adoption to see activity. For example, seeing how many API requests were successful, how reliable the service is, and how much activity there is in terms of the sales teams. This will be recorded in one global logging system.

Some of the non-goals that also could be added include advanced marketing automation features, integration with third-party applications like calendar or email, and detailed reporting that can be customized. Furthermore, increasing scale would allow for larger business and more traffic for requests and queries in the CRM. Additionally, notifications could be added every time a deal is won to admins and other triggers when status is updated could be made.

## Design
Currently, the frontend will be React with TailwindCSS for styling. It will have pages for login, dashboard, customers, deals, tasks, and search. For state management, need to use React Query and routing will use React Router. The backend will involve Node.js with Express along with middleware of JWT authentication along with Testing in Jest for unit tests and Postman for API tests. The database will be using SQL queries on PostgreSQL with a normalized schema.

## Frontend Implementation Status

### ✅ Completed Components
- **Authentication System**: Custom email/password authentication with JWT tokens
- **Navigation**: Role-based navigation with admin-only links
- **Dashboard Page**: Analytics overview with charts, metrics, and recent activity
- **Customers Page**: Full CRUD operations with search and filtering
- **Deals Page**: Deal management with stage filtering and outcome tracking
- **Tasks Page**: Task management with priority and status filtering
- **Admin Page**: Stage management and user management for admins
- **Protected Routes**: Role-based access control
- **React Query Integration**: Optimistic updates and caching
- **Responsive Design**: Mobile-friendly layouts with TailwindCSS

### 🎨 UI/UX Features
- Modern, clean interface with TailwindCSS
- Loading states and error handling
- Modal forms for create/edit operations
- Search and filtering capabilities
- Role-based UI elements (admin-only features)
- Responsive tables and layouts
- Status badges and visual indicators

### 🔧 Technical Implementation
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: React Router with protected routes
- **Styling**: TailwindCSS with custom components
- **API Integration**: Fetch API with authentication headers
- **Error Handling**: Toast notifications and error boundaries
- **Performance**: Optimistic updates and query invalidation

# System-Context Diagram
The tables in the database will be set up following this relationship.

accounts 
└── has many users 
└── has many customers
 └── has many deals 
└── has many tasks

The following permissions need to be added to the system for access control.

Because of this, there will be different pages for each given user. Sales teams will be able to access pages related to a dashboard along with a specific amount of contacts. Each item in the tasks table should be updated given the status from the progress made by the sales team. This in turn will update the deals with possible stages that have been accomplished by the sales team for a given item in the customer table. Finally, this will globally update the accounts table that manages all given companies. This is the layout of the cascade that will be implemented.

# APIs

These routes are custom REST API endpoints that map user actions from the React frontend to the Node.js backend logic.

POST /api/v1/customers
Creates a new customer
User Action: A user fills out and submits the "New Customer" form.
Required Data: {name, email, phone}
Responds with 201 Created with the new customer object

GET /api/v1/customers
Gets all customers for the user's account
A user navigates to the "Customers" page.
Responds with 200 OK with an array of customer objects

GET /api/v1/customers/:id
Gets a single customer's details
User clicks on a specific customer in a list
Responds with 200 OK with a single customer object

PUT /api/v1/customer/:id
 Updates an existing customer
A user edits a customer's details and saves the changes
Required Data: {name, email, phone}
Responds with 200 OK with updated customer object

# Error Handling/EdgeCases
When an API call fails, the user will be shown a non-intrusive "toast" notification with a clear error message
All error responses will follow a standard JSON format with {"Error" : {message : "", code: ""}}
Edge case: If a user tries to create a deal for a customer that doesn't exit the API will return a 404 Not Found error.
Additionally, each request will be logged for analytics for developers**

# Cross-cutting concerns
This section elaborates on any additional questions concerning the system.

Security and Access Control: JWT-based authentication determines user's role and whether or not they have access to read or write such as { "id": "1234567890", "name": "John Doe", "admin": true }
This case is for already used accounts, but for new accounts will need email-based registration to add new sales team accounts

### Role-Based Navigation Access
- **Admin Users**: Can access Dashboard, Customers, Deals, Tasks, and Admin pages
  - Can view, create, edit, and delete customers
  - Can create, edit, and delete users
  - Can manage deal stages
- **Sales Users**: Can access Dashboard, Customers, Deals, and Tasks pages
  - Can view, create, and edit customers (cannot delete)
  - Cannot access Admin panel
- **Route Protection**: 
  - `/customers` route is accessible to all authenticated users
  - `/admin` route is protected with `adminOnly` - only admin users can access
  - All other routes are accessible to authenticated users

## Querying Logic and Database Access Patterns

### Authentication Flow
- **JWT Token Verification**: Uses JWT tokens for authentication with bcrypt password hashing
- **Invite-Only Registration**: Users can only register if they have been pre-created by an admin
- **Account Isolation**: Each user belongs to an account, ensuring multi-tenant data isolation
- **Role-Based Access**: Users can only access data within their account scope

### Database Query Patterns
- **Account-Scoped Queries**: All data queries include `account_id` filter for multi-tenant isolation
- **Role-Based Filtering**: Sales reps see only their assigned deals/tasks, admins see all data within their account
- **Consistent Error Handling**: All database operations include proper error handling and logging
- **Connection Pooling**: Uses PostgreSQL connection pool for efficient database connections
- **Global Stages**: Deal stages are global across all accounts (not account-specific) to maintain consistency in sales processes

### Fixed Querying Issues
- **Authentication Middleware**: Fixed inconsistent use of `req.isAuthenticated()` vs `req.user` across middleware
- **Database Pool Access**: Standardized database pool access pattern across all middleware and routes
- **User Creation Logic**: Improved user creation with fallback name extraction and proper default role assignment
- **Role Middleware**: Fixed database access patterns in role-based access control middleware
- **Admin API Schema Mismatch**: Fixed admin routes to use correct table name `stages` instead of `deal_stages` and removed account_id filtering since stages are global
- **User Creation Schema**: Fixed admin user creation to include required fields with proper validation
Search and Filters: Will generate a unique SQL queries for filtering to Postgres based on indicated user actions and return filtered data accordingly in results for Deals or Accounts page
Dashboard and Analytics: Will show win/loss ratio sorted by customer in pi chart, along with ratio of tasks completed to stage of sale
Other Features: CSV export of tables for customers? 

Testing Plan 
Units tests in Jest for individual queries along with display to dashboard and analytics
Tests in Postman for API responses and JWT authentication
E.g. PUT /api/v1/customer/:id endpoint and verify that it updates the DB
End to end tests for user workflow
E2E Test Case - Successful Company or Deal Creation - user must be authenticated and logged into the system
User must have a role with permissions to create companies (test one for admin, test two for sales teams)
Test #1: Navigate to the companies page -> click add new companies -> input info (company name, industry) -> save. Verify that system displays "Company created successfully" message and redirects to the new company page
Test #2: Navigate to the "Deals" page -> click "Add new deal" -> input details of deal name, associated contact, and value -> save. Verify that the system has a new deal in the table and the opening deal details page shows correct inputted data. Notification feed? should also show that a new deal was created (along with a reference to tasks for the deal)
E2E Test Case - Role-based Access Control - a standard salesperson cannot deal a deal they do not own. 
Have two accounts one with salesperson A with sales permission and salesperson B with admin permission
While logged into salesperson A, check if a deal in "Deals" page can be deleted - should not be allowed (sale teams permission)
While logging into salesperson B, deal should be deleted 
Additionally all dashboard/analytics should be updated accordingly - pi chart with w/l ratio for now - can add additional functionality for it

## Recent Authentication System Improvements

### Authentication System
- **Real JWT authentication** with proper token verification
- **Role-based access control** for admin and sales users
- **Account isolation** maintained for multi-tenant security
- **Proper login/logout flow** implemented

### Access Control Updates
- **Fixed Admin tab visibility** - now only shows for admin users
- **Corrected role-based navigation** - admin users see Admin tab, sales users don't
- **Proper route protection** - all routes now require authentication
- **Role-based UI elements** - delete buttons only visible to appropriate users

### User Management Enhancements
- **Admin user deletion** - admins can delete any user except themselves
- **Invite-only registration** - prevents unauthorized user creation
- **Secure user creation** - only admins can create new user accounts
- **Self-protection mechanisms** - prevents accidental self-deletion

## TODO: E2E Testing for Authentication
- **REMINDER:** Implement E2E tests with real browser (Cypress/Playwright) for authentication flow
- Current unit tests mock authentication and don't test actual JWT integration
- Need to test full authentication flow: registration → login → token verification → session management
- Test both successful authentication and error scenarios
- Verify user roles and permissions work correctly after authentication

# Deployment and Operations
Hosting: The frontend will be on Vercel while the Backend can be on Google Cloud Run (for production environments)
CI/CD pipeline: Using GitHub Actions to automate testing and deployment
Monitoring: Using Google Cloud Monitoring for performance for possible production environments
Will finds specifics of latency along with with failure rates logged here

# Custom Email Authentication System

## Authentication Flow
- **Registration**: Users can register with email, password, and name
- **Login**: Users authenticate with email and password
- **JWT Tokens**: Authentication uses JWT tokens stored in localStorage
- **Password Security**: Passwords are hashed using bcrypt with salt rounds
- **Token Verification**: Backend verifies JWT tokens on protected routes

## Environment Variables
```
JWT_SECRET=your_jwt_secret_here
DB_USER=mockcrmuser
DB_HOST=localhost
DB_NAME=mockcrm
DB_PASSWORD=rucbar@7SH
DB_PORT=5432
```

## Database Schema Updates
- **users table**: Added `password_hash` column for storing bcrypt hashed passwords
- **Removed**: `okta_id` column (replaced with custom authentication)
- **Authentication**: Uses custom email/password system with JWT tokens

## Security Features
- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: 24-hour expiration
- **Invite-Only System**: Only admins can create new user accounts
- **Self-Protection**: Admins cannot delete their own accounts

## Admin User Management System

### User Creation (Admin-Only)
- **Endpoint**: `POST /auth/admin/create-user`
- **Access**: Admin users only
- **Process**: 
  1. Admin creates user account with email, name, and role
  2. User account is created without password (password_hash = NULL)
  3. User receives invitation and can register with their email
  4. User sets their own password during registration

### User Registration (Invite-Only)
- **Endpoint**: `POST /auth/register`
- **Access**: Pre-created users only
- **Process**:
  1. User attempts to register with their email
  2. System checks if email exists in database
  3. System checks if password_hash is NULL (not set yet)
  4. If both conditions met, user can set password and complete registration
  5. If email doesn't exist: "You must be invited by an administrator"
  6. If password already set: "User already exists"

### User Deletion (Admin-Only)
- **Endpoint**: `DELETE /auth/admin/users/:userId`
- **Access**: Admin users only
- **Features**:
  - Admin can delete any user except themselves
  - Admin can delete other admins
  - Proper error handling and confirmation
  - Automatic user list refresh after deletion

### Admin Panel Features
- **User Management**: View, create, edit, and delete users
- **Deal Stages Management**: Create, edit, and delete deal stages
- **Role-Based UI**: Delete buttons only visible to admin users
- **Real-time Updates**: User list refreshes after operations
- **Account Isolation**: Multi-tenant architecture maintained
- **Role-Based Access**: Admin and sales_rep roles supported

---

# Current Database State (as of latest inspection)

## Table Overview
- **accounts**: Table exists. All account names are currently set to "undefined's Account" (likely a bug in account creation logic). 10 rows present.
- **users**: Table exists. 1 user present, role is 'admin', account_id matches an account.
- **customers**: Table exists. 1 customer present, account_id matches, data valid.
- **stages**: Table exists. Only two stages ('won', 'lost') are present and active. Other default stages (e.g., 'Prospecting', 'Qualified', etc.) are missing from the data.
- **deals**: Table exists. 1 deal present, outcome is 'won', foreign keys match existing records.
- **tasks**: Table exists. 1 task present, status is 'in_progress', deal_id matches existing deal.

## Observed Discrepancies and Bugs
- All account names are set to "undefined's Account". This is likely a bug in the account creation logic and should be fixed.
- Only two deal stages are present; the rest of the default stages described in the design are missing. Consider re-inserting all default stages if the full sales pipeline is desired.
- Data is sparse, but the schema matches the intended design.
