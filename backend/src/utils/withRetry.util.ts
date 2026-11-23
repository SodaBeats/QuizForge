export async function withRetry<T>(
  fn: () => Promise<T>,
  {
    retries = 1,
    delayMs = 5000,
    label = 'operation',
  }: { retries?: number; delayMs?: number; label?: string } = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.error(
        `[${label}] attempt ${attempt + 1}/${retries + 1} failed:`,
        error,
      );

      if (attempt < retries) {
        // exponential backoff: 1s, 2s, 4s...
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * 2 ** attempt),
        );
      }
    }
  }

  throw lastError;
}
