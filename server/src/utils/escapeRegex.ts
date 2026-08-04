/**
 * Escape special regex characters to prevent ReDoS / NoSQL injection.
 * Use this before passing any user input into `new RegExp(...)`.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
