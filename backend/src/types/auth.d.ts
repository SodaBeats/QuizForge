export interface UserInfo {
  id: number;
  email: string;
  role: string;
  status: string;
  isVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user: UserInfo;
    }
  }
}
