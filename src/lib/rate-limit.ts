// In-memory store for basic user-action rate limiting.
// Note: In a distributed edge environment like Vercel, this is per-isolate.
// It provides a good baseline defense against spamming server actions.
const actionRateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkActionRateLimit(userId: string, actionName: string, limit: number, windowMs: number): boolean {
  const key = `${userId}-${actionName}`;
  const now = Date.now();
  const record = actionRateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    actionRateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true; // Allowed
  }

  if (record.count >= limit) {
    return false; // Rate limited
  }

  record.count++;
  actionRateLimitMap.set(key, record);
  return true; // Allowed
}
