// Deal model for PostgreSQL using Sequelize
// Should define:
// - id (primary key, auto-increment)
// - title (required)
// - amount (decimal, required)
// - stage (required, references admin stages)
// - outcome (enum: 'won', 'lost', 'pending')
// - assignedTo (foreign key to User.id)
// - createdAt, updatedAt timestamps
// - Associations with User model (belongs to)
// - Associations with Stage model (belongs to) 