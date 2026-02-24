import bcrypt from 'bcrypt';
import { type InferInsertModel } from 'drizzle-orm';
import { users } from '../db/schema.js';

export type Role = 'student' | 'teacher' | 'admin';
export interface RegistrationInput {
  first_name: string,
  last_name: string,
  email: string,
  role: Role
}

//hashing logic
//PASSWORD: STRING clarifies that the password is a string
// : PROMISE <STRING> clarifies that the output will be a promise with a string eventually

export const hashPassword = async (password: string): Promise<string> =>{
  return await bcrypt.hash(password, 10);
};

//user creation logic
export const formatNewUser = (
  data: RegistrationInput, 
  hashedPassword: string
) => {
  const allowedRoles = ['teacher', 'student'];
  return{
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    password_hash: hashedPassword,
    role: allowedRoles.includes(data.role) ? data.role : 'student' //default to student if role is not valid
  };
};