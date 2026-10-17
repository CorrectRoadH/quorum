/* ==========================================================================
   Shared type and scroll recipes.

   These are plain Tailwind strings so every rule in the app still lives in a
   class list. Import them instead of repeating the same twelve utilities.
   ========================================================================== */

/** The small mono label above a title or value. */
export const EYEBROW = 'font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground'

/** A scroll area with a hairline scrollbar on every platform. */
export const SCROLL = 'overflow-auto [scrollbar-width:thin]'
