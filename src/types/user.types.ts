import { UserRole } from './role.types';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface MockUser extends User {
  password: string;
}
