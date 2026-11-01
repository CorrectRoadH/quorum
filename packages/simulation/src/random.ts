/* A small deterministic generator, so a saved Game replays the same incidents. */

/** The next value in [0, 1) and the seed after it. */
export const nextRandom = (seed: number): readonly [number, number] => {
  const next = (seed * 1_103_515_245 + 12_345) % 2_147_483_648
  return [next / 2_147_483_648, next]
}

/** Picks an entry with probability proportional to its weight, or undefined when all weigh 0. */
export const pickWeighted = <A>(
  entries: ReadonlyArray<readonly [A, number]>,
  roll: number,
): A | undefined => {
  const total = entries.reduce((sum, [, weight]) => sum + Math.max(0, weight), 0)
  if (total <= 0) return undefined
  let left = roll * total
  for (const [entry, weight] of entries) {
    left -= Math.max(0, weight)
    if (left < 0) return entry
  }
  return entries.at(-1)?.[0]
}
