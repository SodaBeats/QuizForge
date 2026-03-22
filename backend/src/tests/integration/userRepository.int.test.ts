// tests/integration/userRepository.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { eq } from 'drizzle-orm';
import { db } from '../../db/db.js';
import { users } from '../../db/schema.js';
import { UserRepository } from '../../repository/UserRepository.js';

describe('UserRepository Integration Tests', () => {
  
  // Setup: Run once before all tests
  beforeAll(async () => {
    // Optional: Ensure database connection is ready
    // await db.execute(sql`SELECT 1`);
  });

  // Cleanup: Run after each test to keep tests isolated
  beforeEach(async () => {
    // Clear the users table before each test
    await db.delete(users);
  });

  // Cleanup: Run once after all tests
  afterAll(async () => {
    // Clean up test data
    await db.delete(users);
  });

  describe('selectUserByEmail', () => {
    it('should return user when email exists', async () => {
      // Arrange: Create a test user
      const testEmail = 'test@example.com';
      await db.insert(users).values({
        first_name: 'Test',
        last_name: 'User',
        email: testEmail,
        password_hash: 'hashedpassword123',
        role: 'student'
      });

      // Act: Find the user
      const result = await UserRepository.selectUserByEmail(testEmail);

      // Assert: Verify result
      expect(result).not.toBeNull();
      expect(result?.email).toBe(testEmail);
      expect(result?.first_name).toBe('Test');
    });

    it('should return null when email does not exist', async () => {
      // Act: Try to find non-existent user
      const result = await UserRepository.selectUserByEmail('nonexistent@example.com');

      // Assert: Should be null
      expect(result).toBeNull();
    });

    it('should be case-sensitive for email', async () => {
      // Arrange: Create user with lowercase email
      await db.insert(users).values({
        email: 'test@example.com',
        password_hash: 'hashedpassword123',
        first_name: 'Test',
        last_name: 'User',
        role: 'student'
      });

      // Act: Search with uppercase
      const result = await UserRepository.selectUserByEmail('TEST@EXAMPLE.COM');

      // Assert: Should not find it (depends on your DB collation)
      // Adjust this test based on your actual DB behavior
      expect(result).toBeNull();
    });

    it('should handle special characters in email', async () => {
      // Arrange: Create user with special chars
      const specialEmail = 'test+special@example.com';
      await db.insert(users).values({
        email: specialEmail,
        password_hash: 'hashedpassword123',
        first_name: 'Special',
        last_name: 'User',
        role: 'student'
      });

      // Act
      const result = await UserRepository.selectUserByEmail(specialEmail);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.email).toBe(specialEmail);
    });
  });

  describe('registerUser', () => {
    it('should insert user into database', async() =>{
      //Arrange
      const userData = {
        first_name: 'Test',
        last_name: 'Bond',
        email: 'test@gmail.com',
        password_hash: 'hashedPassword12345',
        role: 'student' as const
      };

      //Act
      await UserRepository.registerUser(userData);

      //Assert
      const [insertedUser] = await db.select()
        .from(users)
        .where(eq(users.email, 'test@gmail.com'));

      expect(insertedUser).toBeDefined();
      expect(insertedUser?.email).toBe(userData.email);
      expect(insertedUser?.first_name).toBe(userData.first_name);
      expect(insertedUser?.last_name).toBe(userData.last_name);
      expect(insertedUser?.role).toBe(userData.role);
    });

    it('should create user with all required fields', async () => {
      //Arrange
      const userData = {
        first_name: 'Test',
        last_name: 'Bond',
        email: 'test@gmail.com',
        password_hash: 'hashedPassword12345',
        role: 'student' as const
      }

      //Act
      await UserRepository.registerUser(userData);

      //Assert
      const [user] = await db.select().from(users).where(eq(users.email, 'test@gmail.com'));

      expect(user?.id).toBeDefined();
      expect(user?.created_at).toBeDefined();
      expect(user?.user_id).toBeDefined();
      expect(user?.updated_at).toBeDefined();
      expect(user?.password_hash).toBe('hashedPassword12345');
      expect(user?.role).toBeDefined();
    });

    it('should throw an error when inserting duplicate email', async() => {
      //Arrange
      const userData = {
        first_name: 'Test',
        last_name: 'Bond',
        email: 'test@gmail.com',
        password_hash: 'hashedPassword12345',
        role: 'teacher' as const
      };
      await UserRepository.registerUser(userData);

      //Act and Assert
      expect(UserRepository.registerUser(userData)).rejects.toThrow();
    });

    it('should not insert when email is missing', async () => {
      //Arrange
      const invalidData = {
        first_name: 'Test',
        last_name: 'Bond',
        email: null,
        password_hash: 'hashedPassword12345',
        role: 'teacher' as const
      };
      //Act and Assert
      expect(UserRepository.registerUser(invalidData as any)).rejects.toThrow();

      //verify nothing was inserted
      const allUsers = await db.select().from(users);
      expect(allUsers.length).toBe(0);
    });

  });
});