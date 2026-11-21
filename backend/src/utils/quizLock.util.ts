import type { Response } from 'express';
import { QuizAttemptsRepo } from '../repository/QuizAttemptsRepository.js'; // adjust path/name to where hasAnyAttempt lives

export const QUIZ_LOCKED_MESSAGE =
  'This quiz has existing attempts and can no longer be modified';

/** Sends 409 + returns true when the quiz has ≥1 attempt (any status). */
export async function rejectIfQuizLocked(
  res: Response,
  quizId: number,
): Promise<boolean> {
  const locked = await QuizAttemptsRepo.hasAnyAttempt(quizId);

  if (locked) {
    res.status(409).json({ message: QUIZ_LOCKED_MESSAGE });
    return true;
  }

  return false;
}
