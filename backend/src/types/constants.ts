//constants.ts
export const ALLOWED_ROLES = ['teacher', 'student'] as const;

/*
  typeof ALLOWED_ROLES: Tells TS to look at the actual variable in your code.
  Because of as const, TS sees it as readonly ["teacher", "student", "admin"].

  [number]: This is the "index access." 
  It tells TS: "Look at every item inside that array at any numeric position (0, 1, 2...)."

  Result: UserRole becomes 'teacher' | 'student' | 'admin'.
*/
export type UserRole = typeof ALLOWED_ROLES[number];