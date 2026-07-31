const RESOLVABLE_MACRO_RE = /\{\{|<(?:user|char|bot)>/i;

export function hasResolvableMacro(text: string): boolean {
  return RESOLVABLE_MACRO_RE.test(text);
}
