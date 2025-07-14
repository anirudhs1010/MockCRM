// User model for PostgreSQL using Sequelize
// Should define:
// - id (primary key, auto-increment)
// - username (unique, required)
// - email (unique, required)
// - password (hashed, required)
// - role (enum: 'admin', 'sales_rep', required)
// - createdAt, updatedAt timestamps
// - Associations with Deal model (one-to-many)
// - Password hashing before save
// - Instance methods for password comparison 