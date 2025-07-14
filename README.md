# MockCRM

CRM Application
This is a CRM application built with a Node.js/Express backend and a React frontend. The project implements specific business logic and user feedback, including role-based permissions, dynamic data filtering, and inline editing capabilities.

Features Implemented
This system translates direct user feedback into concrete features:

Role-Based Data Access: The GET /api/deals endpoint automatically filters data based on the user's role. Sales Reps only see deals assigned to them, while Admins can view all deals across the organization.

Admin-Only Controls: Critical actions, like deleting a deal (DELETE /api/deals/:id), are protected by middleware and restricted to users with an admin role.

Dynamic Filtering: The frontend allows users to filter the deals list by Stage and Outcome. These selections are passed as query parameters to the API, which returns a filtered dataset.

Inline Editing: Sales Reps can change a deal's stage directly from the main list view, providing a seamless and efficient user experience. This is powered by a useMutation hook in React Query.

Admin Configuration: A dedicated set of admin routes (e.g., GET /api/admin/stages) allows administrators to manage application-specific values like deal stages.

Tech Stack
Backend: Node.js, Express.js

Frontend: React, React Query (@tanstack/react-query)

Authentication: JWT-based, with role checks via custom middleware.

API Endpoints
Method	Endpoint	Description	Access
GET	/api/deals	Gets a list of deals. Accepts stage and outcome query params.	Rep (own), Admin (all)
PUT	/api/deals/:id	Updates a specific deal (e.g., changing the stage).	Rep (own), Admin (all)
DELETE	/api/deals/:id	Deletes a specific deal.	Admin Only
GET	/api/admin/stages	Gets the list of configurable deal stages.	Admin Only
POST	/api/admin/stages	Adds a new possible deal stage.	Admin Only

Export to Sheets
Project Setup
Clone the repository.

Setup and run the backend server:

Bash

cd server
npm install
npm start
Setup and run the frontend client:

Bash

cd client
npm install
npm start
