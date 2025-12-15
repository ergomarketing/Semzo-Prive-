export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()

  check(identifier: string, maxAttempts: number, windowMs: number): { success: boolean; remaining: number } {
    const now = Date.now()
    const windowStart = now - windowMs

    const userAttempts = this.attempts.get(identifier) || []
    const recentAttempts = userAttempts.filter((time) => time > windowStart)

    if (recentAttempts.length >= maxAttempts) {
      return { success: false, remaining: 0 }
    }

    recentAttempts.push(now)
    this.attempts.set(identifier, recentAttempts)

    return { success: true, remaining: maxAttempts - recentAttempts.length }
  }

  reset(identifier: string) {
    this.attempts.delete(identifier)
  }
}

export const loginLimiter = new RateLimiter()
export const checkoutLimiter = new RateLimiter()
export const giftCardLimiter = new RateLimiter()
