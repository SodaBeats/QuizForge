//signup.test.ts

import { test, expect } from '@jest/globals';
import { formatNewUser} from "../../services/signup.service.js";
import { type Role, type RegistrationInput } from "../../services/signup.service.js"

const hashedPassword: string = 'hashed_password';
const data: RegistrationInput = {
  first_name: 'Vince',
  last_name: 'Bongon',
  email: 'email@gmail.com',
  role: 'admin'
}

test('Role should default to student if blank or invalid', ()=>{
  expect(formatNewUser(data, hashedPassword)).toEqual({
    first_name: 'Vince',
    last_name: 'Bongon',
    email: 'email@gmail.com',
    password_hash: 'hashed_password',
    role: 'student'
  })
});