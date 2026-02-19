declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // List your .env variables here
      DATABASE_URL: string;
      PORT: string;
      JWT_SECRET: string;
      REFRESH_TOKEN_SECRET: string;
      
      // Use Union Types for specific allowed values
      NODE_ENV: 'development' | 'production' | 'test';
      
      // Use optional if the variable isn't always there
      DEBUG_MODE?: 'true' | 'false';
    }
  }
}

// This empty export is crucial to tell TS this is a module
export {};