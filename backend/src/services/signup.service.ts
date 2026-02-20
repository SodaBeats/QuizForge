import bcrypt from 'bcrypt';

//hashing logic
export const hashPassword = async (password: string): Promise<string> =>{
  return await bcrypt.hash(password, 10);
};

//user creation logic
export const formatNewUser = (data: any, hashedPassword: string) => {
  return{
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    password_hash: hashedPassword,
    role: data.role || 'student'
  };
};