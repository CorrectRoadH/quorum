/** `SLOW_TESTS=1 pnpm test` also runs the multi-minute balance and pacing checks. */
export const SLOW = process.env.SLOW_TESTS === '1'
