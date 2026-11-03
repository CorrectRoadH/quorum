import { needsAction, senderOf, type Fact } from './mail.ts'
import type { Folder, Inbox, Mail } from './model.ts'

/* ==========================================================================
   The Inbox submodel (GDD 18): how Mail joins its Thread, resolves, and is
   read. Every function takes the Inbox and returns the next one.
   ========================================================================== */

const MAIL_KEPT = 40
const THREAD_ENTRIES = 20

/** Senders whose Mail is about the Design now: a Thread resolves when its cause is gone. */
const ADVISING = new Set(['cloud', 'monitoring', 'vendor', 'investor', 'finance', 'mentor'])

export const EMPTY_INBOX: Inbox = {
  mail: [],
  focus: null,
  peek: null,
  bucket: 0,
  sample: 'random',
  folder: 'action',
}

/** Mail waits for a decision (Needs action), or only informs (FYI), or the filter caught it (Spam). */
export const folderHolds = (mail: Mail, folder: Folder): boolean =>
  folder === 'trash'
    ? mail.trashed
    : !mail.trashed &&
      (folder === 'spam' ? mail.spam : !mail.spam && needsAction(mail) === (folder === 'action'))

/** A fact joins its Thread, or starts one. The same news twice changes nothing.
 *  `open` says the Inbox panel is on screen, so new Mail needs no preview card. */
export const mailed = (
  inbox: Inbox,
  fact: Fact,
  time: number,
  open: boolean,
  repeats = false,
): Inbox => {
  const existing = inbox.mail.find((mail) => mail.key === fact.key && !mail.trashed)
  if (
    !repeats &&
    existing &&
    existing.resolved === null &&
    existing.entries.at(-1)?.text === fact.text
  )
    return inbox
  const others = inbox.mail.filter((mail) => mail !== existing)
  const thread: Mail = existing
    ? {
        ...existing,
        time,
        read: false,
        answer: null,
        resolved: null,
        actions: fact.actions,
        entries: [...existing.entries, { time, text: fact.text }].slice(-THREAD_ENTRIES),
      }
    : {
        id: Math.max(0, ...inbox.mail.map((mail) => mail.id)) + 1,
        key: fact.key,
        sender: fact.sender,
        subject: fact.subject,
        time,
        entries: [{ time, text: fact.text }],
        actions: fact.actions,
        answer: null,
        read: false,
        trashed: false,
        spam: fact.spam,
        resolved: null,
      }
  // Mail that wants the player (a decision, or a provider, alarm or advisory) previews above the
  // Inbox button until it is read, so a new letter cannot go unnoticed.
  const loud =
    needsAction(thread) ||
    ['cloud', 'monitoring', 'security'].includes(senderOf(thread.sender).kind)
  const peek = !thread.spam && loud && !open ? thread.id : inbox.peek
  return { ...inbox, mail: [...others, thread].slice(-MAIL_KEPT), peek }
}

/** Advice about anything but `key` no longer holds. */
export const resolvedExcept = (inbox: Inbox, key: string, time: number): Inbox => ({
  ...inbox,
  mail: inbox.mail.map((mail) =>
    ADVISING.has(mail.sender) && mail.key !== key && mail.resolved === null
      ? { ...mail, resolved: time }
      : mail,
  ),
})

/** A Thread whose cause is over: it records the last line and resolves. */
export const closed = (inbox: Inbox, key: string, time: number, text: string): Inbox => ({
  ...inbox,
  mail: inbox.mail.map((mail) =>
    mail.key === key && !mail.trashed
      ? {
          ...mail,
          read: false,
          resolved: time,
          entries: [...mail.entries, { time, text }].slice(-THREAD_ENTRIES),
        }
      : mail,
  ),
})

/** The Mail in the open folder, newest first. */
export const folderList = (inbox: Inbox): ReadonlyArray<Mail> =>
  inbox.mail.filter((mail) => folderHolds(mail, inbox.folder)).reverse()

/** The Inbox on one Mail, or the newest in its folder, which counts as read. */
export const reading = (inbox: Inbox, focus: number | null = null): Inbox => {
  const inFolder = folderList(inbox)
  const id = (inFolder.find((mail) => mail.id === focus) ?? inFolder[0])?.id ?? null
  return {
    ...inbox,
    focus: id,
    peek: null,
    mail: inbox.mail.map((mail) => (mail.id === id ? { ...mail, read: true } : mail)),
  }
}

export const withMail = (inbox: Inbox, id: number, change: Partial<Mail>): Inbox => ({
  ...inbox,
  mail: inbox.mail.map((mail) => (mail.id === id ? { ...mail, ...change } : mail)),
})
