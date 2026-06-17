declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        role: string;
        step?: string;
      };
    }
  }
}

export {};
