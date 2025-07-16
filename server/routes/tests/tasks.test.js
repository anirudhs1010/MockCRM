const request = require('supertest');
const express = require('express');
const tasksRoute = require('../tasks');
const pool = require('../../config/database');

// Mock the database connection pool for testing
jest.mock('../../config/database', () => {
  const mockQuery = jest.fn();
  return {
    query: mockQuery,
    end: jest.fn(),
  };
});

describe('Tasks Routes', () => {
  let app;
  let adminApp;
  let salesRepApp;

  beforeEach(() => {
    // Create separate app instances for different user roles
    app = express();
    adminApp = express();
    salesRepApp = express();

    app.use(express.json());
    adminApp.use(express.json());
    salesRepApp.use(express.json());

    // Mock authentication for admin user
    adminApp.use((req, res, next) => {
      req.isAuthenticated = () => true;
      req.user = {
        id: 1,
        account_id: 100,
        role: 'admin',
      };
      req.app = { locals: { pool } };
      next();
    });

    // Mock authentication for sales rep user
    salesRepApp.use((req, res, next) => {
      req.isAuthenticated = () => true;
      req.user = {
        id: 2,
        account_id: 100,
        role: 'sales_rep',
      };
      req.app = { locals: { pool } };
      next();
    });

    // Mock unauthenticated user
    app.use((req, res, next) => {
      req.isAuthenticated = () => false;
      req.user = null;
      next();
    });

    adminApp.use('/api/tasks', tasksRoute);
    salesRepApp.use('/api/tasks', tasksRoute);
    app.use('/api/tasks', tasksRoute);

    pool.query.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('GET /api/tasks', () => {
    it('should return all tasks for admin user', async () => {
      const mockTasks = [
        { id: 1, name: 'Task 1', deal_name: 'Deal 1', user_name: 'User 1', status: 'todo' },
        { id: 2, name: 'Task 2', deal_name: 'Deal 2', user_name: 'User 2', status: 'completed' },
      ];
      pool.query.mockResolvedValue({ rows: mockTasks });

      const response = await request(adminApp).get('/api/tasks');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTasks);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT t.*, d.name as deal_name, u.name as user_name'),
        [100]
      );
    });

    it('should return only user tasks for sales rep user', async () => {
      const mockTasks = [
        { id: 1, name: 'Task 1', deal_name: 'Deal 1', user_name: 'User 2', status: 'todo' },
      ];
      pool.query.mockResolvedValue({ rows: mockTasks });

      const response = await request(salesRepApp).get('/api/tasks');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTasks);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND t.user_id = $2'),
        [100, 2]
      );
    });

    it('should filter tasks by status for admin user', async () => {
      const mockTasks = [
        { id: 1, name: 'Task 1', deal_name: 'Deal 1', user_name: 'User 1', status: 'todo' },
      ];
      pool.query.mockResolvedValue({ rows: mockTasks });

      const response = await request(adminApp).get('/api/tasks?status=todo');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTasks);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND t.status = $2'),
        [100, 'todo']
      );
    });

    it('should filter tasks by status for sales rep user', async () => {
      const mockTasks = [
        { id: 1, name: 'Task 1', deal_name: 'Deal 1', user_name: 'User 2', status: 'completed' },
      ];
      pool.query.mockResolvedValue({ rows: mockTasks });

      const response = await request(salesRepApp).get('/api/tasks?status=completed');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTasks);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('AND t.status = $3'),
        [100, 2, 'completed']
      );
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app).get('/api/tasks');
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Authentication required' });
    });

    it('should return 500 on database error', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(adminApp).get('/api/tasks');
      
      expect(response.status).toBe(500);
      expect(response.text).toBe('Server error');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return task for admin user', async () => {
      const mockTask = { id: 1, name: 'Task 1', deal_name: 'Deal 1', user_name: 'User 1' };
      pool.query.mockResolvedValue({ rows: [mockTask] });

      const response = await request(adminApp).get('/api/tasks/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTask);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT t.*, d.name as deal_name, u.name as user_name'),
        ['1', 100]
      );
    });

    it('should return task for sales rep user if they are assigned to it', async () => {
      const mockTask = { id: 1, name: 'Task 1', deal_name: 'Deal 1', user_name: 'User 2' };
      pool.query.mockResolvedValue({ rows: [mockTask] });

      const response = await request(salesRepApp).get('/api/tasks/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTask);
    });

    it('should return 403 for sales rep accessing task they are not assigned to', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(salesRepApp).get('/api/tasks/999');
      
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Access denied to this task' });
    });

    it('should return 404 for non-existent task', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(adminApp).get('/api/tasks/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Task not found' });
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app).get('/api/tasks/1');
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Authentication required' });
    });
  });

  describe('POST /api/tasks', () => {
    it('should create task for admin user', async () => {
      const newTask = { deal_id: 1, user_id: 1, name: 'New Task', due_date: '2024-01-01', status: 'todo' };
      const createdTask = { id: 3, ...newTask };
      
      // Mock deal check
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      // Mock task creation
      pool.query.mockResolvedValueOnce({ rows: [createdTask] });

      const response = await request(adminApp).post('/api/tasks').send(newTask);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdTask);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id FROM deals WHERE id = $1 AND account_id = $2',
        [1, 100]
      );
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO tasks (deal_id, user_id, name, due_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [1, 1, 'New Task', '2024-01-01', 'todo']
      );
    });

    it('should create task with default status if not provided', async () => {
      const newTask = { deal_id: 1, user_id: 1, name: 'New Task', due_date: '2024-01-01' };
      const createdTask = { id: 3, ...newTask, status: 'todo' };
      
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      pool.query.mockResolvedValueOnce({ rows: [createdTask] });

      const response = await request(adminApp).post('/api/tasks').send(newTask);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdTask);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO tasks (deal_id, user_id, name, due_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [1, 1, 'New Task', '2024-01-01', 'todo']
      );
    });

    it('should return 400 for invalid deal ID', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(adminApp).post('/api/tasks').send({
        deal_id: 999,
        user_id: 1,
        name: 'New Task',
        due_date: '2024-01-01'
      });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid deal ID' });
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app).post('/api/tasks').send({});
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Authentication required' });
    });

    it('should return 500 on database error', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(adminApp).post('/api/tasks').send({});
      
      expect(response.status).toBe(500);
      expect(response.text).toBe('Server error');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task for admin user', async () => {
      const updateData = { name: 'Updated Task', due_date: '2024-02-01', status: 'completed', user_id: 1 };
      const updatedTask = { id: 1, ...updateData };
      pool.query.mockResolvedValue({ rows: [updatedTask] });

      const response = await request(adminApp).put('/api/tasks/1').send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedTask);
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE tasks SET name = $1, due_date = $2, status = $3, user_id = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
        ['Updated Task', '2024-02-01', 'completed', 1, '1']
      );
    });

    it('should return 403 for sales rep updating task they are not assigned to', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(salesRepApp).put('/api/tasks/999').send({});
      
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Access denied to this task' });
    });

    it('should return 404 for non-existent task', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(adminApp).put('/api/tasks/999').send({});
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Task not found' });
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app).put('/api/tasks/1').send({});
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Authentication required' });
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task for admin user', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const response = await request(adminApp).delete('/api/tasks/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Task deleted successfully' });
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM tasks WHERE id = $1 AND deal_id IN'),
        ['1', 100]
      );
    });

    it('should return 403 for sales rep user (admin only)', async () => {
      const response = await request(salesRepApp).delete('/api/tasks/1');
      
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Admin access required' });
    });

    it('should return 404 for non-existent task', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(adminApp).delete('/api/tasks/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Task not found' });
    });

    it('should return 403 for unauthenticated user (admin only)', async () => {
      const response = await request(app).delete('/api/tasks/1');
      
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Admin access required' });
    });
  });
}); 