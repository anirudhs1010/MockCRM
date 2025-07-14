// Deal controller with business logic for deal operations
// Should include:
// - getDeals: Get deals with role-based filtering (sales_rep sees own, admin sees all)
// - getDealById: Get single deal with ownership check
// - createDeal: Create new deal (admin only or assigned to self)
// - updateDeal: Update deal with ownership/role validation
// - deleteDeal: Delete deal (admin only)
// - Filter by stage and outcome query parameters
// - Handle database operations with error handling 