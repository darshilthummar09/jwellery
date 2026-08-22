import { MockUser } from '../types/user.types';

/**
 * Mock users for session-based authentication (no database).
 * Replace this file's usage in auth.service.ts with Supabase queries when ready.
 */
export const MOCK_USERS: MockUser[] = [
  {
    id: 'usr_superadmin_001',
    username: 'superadmin',
    password: '123456',
    name: 'Super Admin',
    email: 'superadmin@dreamjewels.com',
    role: 'super-admin',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'usr_admin_001',
    username: 'admin',
    password: '123456',
    name: 'Arjun Mehta',
    email: 'admin@dreamjewels.com',
    role: 'admin',
    createdAt: '2024-01-02T00:00:00Z',
  },
  // {
  //   id: 'usr_designer_001',
  //   username: 'designer1',
  //   password: '123456',
  //   name: 'Riya Sharma',
  //   email: 'designer1@dreamjewels.com',
  //   role: 'designer',
  //   createdAt: '2024-01-03T00:00:00Z',
  // },
  {
    id: 'usr_customer_001',
    username: 'customer1',
    password: '123456',
    name: 'Priya Patel',
    email: 'customer1@dreamjewels.com',
    role: 'customer',
    createdAt: '2024-01-04T00:00:00Z',
  },
  {
    id: 'usr_customer_002',
    username: 'customer2',
    password: '123456',
    name: 'Aarav Shah',
    email: 'customer2@dreamjewels.com',
    role: 'customer',
    createdAt: '2024-01-05T00:00:00Z',
  },
];
