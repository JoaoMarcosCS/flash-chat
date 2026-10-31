declare namespace Express {
  export interface Request {
    user: {
      id: string;
      name: string;
      nickname: string;
    };
  }

  export interface Response {
    body?: unknown;
  }
}
