import { Redis } from '@upstash/redis/cloudflare';

/** Max failed attempts before locking the account */
export const LOCKOUT_THRESHOLD = 5;
/** Window (seconds) in which failures are counted */
export const LOCKOUT_WINDOW    = 15 * 60;
/** How long (seconds) the account stays locked after threshold is hit */
export const LOCKOUT_DURATION  = 15 * 60;

const failKey = (email: string) => `lockout:fail:${email}`;
const lockKey = (email: string) => `lockout:lock:${email}`;

// ─── In-memory fallback (local dev without Upstash) ──────────────────────────

type MemEntry = { count: number; expiresAt: number };
const memFail = new Map<string, MemEntry>();
const memLock = new Map<string, number>(); // expiresAt

function createLocalLockout() {
  return {
    isLocked(email: string): { locked: boolean; retryAfter: number } {
      const now    = Date.now();
      const expiry = memLock.get(email) ?? 0;
      if (now < expiry) return { locked: true, retryAfter: Math.ceil((expiry - now) / 1000) };
      return { locked: false, retryAfter: 0 };
    },
    recordFailure(email: string): { attempts: number; locked: boolean } {
      const now = Date.now();
      let entry = memFail.get(email);
      if (!entry || now > entry.expiresAt) {
        entry = { count: 0, expiresAt: now + LOCKOUT_WINDOW * 1000 };
      }
      entry.count++;
      memFail.set(email, entry);
      if (entry.count >= LOCKOUT_THRESHOLD) {
        memLock.set(email, now + LOCKOUT_DURATION * 1000);
        return { attempts: entry.count, locked: true };
      }
      return { attempts: entry.count, locked: false };
    },
    clearFailures(email: string): void {
      memFail.delete(email);
      memLock.delete(email);
    }
  };
}

// ─── Redis-backed lockout ─────────────────────────────────────────────────────

function createRedisLockout(redis: Redis) {
  return {
    async isLocked(email: string): Promise<{ locked: boolean; retryAfter: number }> {
      const ttl = await redis.ttl(lockKey(email));
      if (ttl > 0) return { locked: true, retryAfter: ttl };
      return { locked: false, retryAfter: 0 };
    },

    async recordFailure(email: string): Promise<{ attempts: number; locked: boolean }> {
      const fk      = failKey(email);
      const count   = await redis.incr(fk);
      // Set TTL on first increment only (INCR creates key if absent)
      if (count === 1) await redis.expire(fk, LOCKOUT_WINDOW);

      if (count >= LOCKOUT_THRESHOLD) {
        await redis.set(lockKey(email), '1', { ex: LOCKOUT_DURATION });
        return { attempts: count, locked: true };
      }
      return { attempts: count, locked: false };
    },

    async clearFailures(email: string): Promise<void> {
      await redis.del(failKey(email), lockKey(email));
    }
  };
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export type LockoutStore = ReturnType<typeof createLocalLockout>;

export function createLockoutStore(
  upstashUrl?: string,
  upstashToken?: string
): LockoutStore {
  if (upstashUrl && upstashToken) {
    const redis = new Redis({ url: upstashUrl, token: upstashToken });
    const store = createRedisLockout(redis);
    // Wrap async methods to satisfy the sync-compatible interface shape
    return {
      isLocked:      (email) => store.isLocked(email) as any,
      recordFailure: (email) => store.recordFailure(email) as any,
      clearFailures: (email) => store.clearFailures(email) as any
    };
  }
  return createLocalLockout();
}
