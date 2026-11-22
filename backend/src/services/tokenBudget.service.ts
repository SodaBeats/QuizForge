import { TokenUsageRepo } from '../repository/TokenUsageRepo.js';

// Daily limits per kind of usage. Move to env vars or per-role later.
export const DAILY_LIMITS = {
  embedding: 50_000,
  generation: 50_000,
};

const COLUMNS = {
  embedding: 'embedding_tokens',
  generation: 'generation_tokens',
};

type UsageKind = 'embedding' | 'generation';

// "Midnight" = midnight UTC. Change the timeZone if you want it to match your users.
export const today = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); // YYYY-MM-DD

export class BudgetExceededError extends Error {
  status = 429;
  kind: UsageKind;
  used: number;
  limit: number;

  constructor(kind: UsageKind, used: number, limit: number) {
    super(`Daily ${kind} token budget reached`);
    this.name = 'BudgetExceededError';
    this.kind = kind;
    this.used = used;
    this.limit = limit;
  }
}

// Call BEFORE the expensive work. `estimated` is a rough guess of what it will cost.
export async function assertBudget(
  userId: number,
  kind: UsageKind,
  estimated = 0,
) {
  const usage = await TokenUsageRepo.getUsage(userId, today());
  const used = usage?.[kind] ?? 0;
  const limit = DAILY_LIMITS[kind];

  if (used + estimated > limit) {
    throw new BudgetExceededError(kind, used, limit);
  }
}

// Rough estimate when you don't have a count yet (about 4 characters per token).
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);
