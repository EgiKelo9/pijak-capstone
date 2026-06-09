export type AuthCookieValue = {
  accessToken: string;
  tokenType?: string;
};

export interface User extends AuthCookieValue {
  id?: string;
  name: string;
  email: string;
  password?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date;
}