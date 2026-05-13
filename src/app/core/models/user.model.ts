export enum UserRole {
  Admin = 'Admin',
  Editor = 'Editor',
  Viewer = 'Viewer',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface NewUserInput {
  name: string;
  email: string;
  role: UserRole;
}

export const USER_ROLES: readonly UserRole[] = [
  UserRole.Admin,
  UserRole.Editor,
  UserRole.Viewer,
] as const;
