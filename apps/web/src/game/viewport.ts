/* ==========================================================================
   The phone: narrow in portrait, short in landscape. These are the bounds of
   the `compact` variant in styles.css; keep the two in step.
   ========================================================================== */

export const isPhone = (): boolean => matchMedia('(max-width: 639px), (max-height: 499px)').matches
