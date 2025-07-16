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
- **Authentication System**: Okta OAuth integration with session management
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
- **API Integration**: Axios with authentication headers
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
This case is for already used accounts, but for new accounts will need OAuth 2.0 to add new sales team accounts via email
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

## TODO: E2E Testing for OAuth
- **REMINDER:** Implement E2E tests with real browser (Cypress/Playwright) for OAuth authentication flow
- Current unit tests mock Passport and don't test actual Okta integration
- Need to test full OAuth flow: login redirect → Okta authentication → callback → session creation
- Test both successful authentication and error scenarios
- Verify user roles and permissions work correctly after OAuth login

# Deployment and Operations
Hosting: The frontend will be on Vercel while the Backend can be on Google Cloud Run (for production environments)
CI/CD pipeline: Using GitHub Actions to automate testing and deployment
Monitoring: Using Google Cloud Monitoring for performance for possible production environments
Will finds specifics of latency along with with failure rates logged here

# Okta OAuth Integration

## Credentials and Setup
- **Client ID:** [REDACTED - use environment variable REACT_APP_OKTA_CLIENT_ID]
- **Okta Domain:** [REDACTED - use environment variable REACT_APP_OKTA_ISSUER]
- **Callback URL:** http://localhost:5000/auth/okta/callback
- **Client Secret:** (stored in .env, not in this doc)

## Integration Steps
- Use Passport.js with the `passport-openidconnect` strategy for Okta OAuth.
- Configure Express session middleware with a custom session secret (not provided by Okta).
- On successful login, look up or create the user in the app database and assign roles (admin, sales, etc.).
- Store and manage user roles in the app database, not in Okta.
- Protect routes using Passport's `req.isAuthenticated()` and custom role middleware.

## Why a Session Secret is Needed
- The session secret is required by `express-session` to sign and verify session cookies.
- It is not provided by Okta; you must generate your own (e.g., with `openssl rand -hex 32`).
- This secret ensures that session cookies cannot be tampered with by clients.
- The session secret should be kept private and stored in your `.env` file.

## Example .env entries
```
OKTA_DOMAIN=your_okta_domain.okta.com
OKTA_CLIENT_ID=your_client_id_here
OKTA_CLIENT_SECRET=your_client_secret_here
OKTA_CALLBACK_URL=http://localhost:5000/auth/okta/callback
SESSION_SECRET=your_session_secret_here
REACT_APP_OKTA_ISSUER=https://your_okta_domain.okta.com/oauth2/default
REACT_APP_OKTA_CLIENT_ID=your_client_id_here
```

---
