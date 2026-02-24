export interface UserInfo {
  id: number;
  email: string;
  role: string;
}

declare global{
  namespace Express {
    interface Request {
      user?: UserInfo;
    }
  }
}