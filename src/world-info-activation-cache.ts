export type WorldInfoActivationEntry = {
  id: unknown;
};

type PendingActivation = {
  userId: string;
  chatId: string;
  entryIds: string[] | null;
};

type BoundActivation = {
  messageId: string;
  entryIds: string[];
};

/**
 * Correlates Lumiverse's activation event with the assistant message produced
 * by that generation. The event itself has no generation id, so captures are
 * accepted only when exactly one generation is pending for the user/chat.
 */
export class WorldInfoActivationCache {
  private readonly pendingByGenerationId = new Map<string, PendingActivation>();
  private readonly boundByScope = new Map<string, BoundActivation>();

  begin(userId: string, generationId: string, chatId: string): void {
    if (!userId || !generationId || !chatId) return;
    // Lumiverse serializes main generations per user/chat. If a terminal event
    // was lost, a newer start supersedes that orphan instead of leaving every
    // future activation ambiguous until the extension restarts.
    for (const [pendingGenerationId, pending] of this.pendingByGenerationId) {
      if (pending.userId === userId && pending.chatId === chatId) {
        this.pendingByGenerationId.delete(pendingGenerationId);
      }
    }
    this.pendingByGenerationId.set(generationId, {
      userId,
      chatId,
      entryIds: null,
    });
  }

  capture(userId: string, chatId: string, entries: readonly WorldInfoActivationEntry[]): boolean {
    const matching = Array.from(this.pendingByGenerationId.values()).filter(
      (pending) => pending.userId === userId && pending.chatId === chatId,
    );
    if (matching.length !== 1) return false;

    matching[0].entryIds = uniqueEntryIds(entries);
    return true;
  }

  complete(
    userId: string,
    generationId: string,
    chatId: string,
    messageId: string | null | undefined,
  ): boolean {
    const pending = this.takePending(userId, generationId, chatId);
    // No capture means the host did not provide a trustworthy snapshot. Keep
    // the caller on its normal getActivated() fallback instead of assuming none.
    if (!pending || pending.entryIds === null || !messageId) return false;

    this.boundByScope.set(scopeKey(userId, chatId), {
      messageId,
      entryIds: [...pending.entryIds],
    });
    return true;
  }

  discard(userId: string, generationId: string, chatId: string): void {
    this.takePending(userId, generationId, chatId);
  }

  get(userId: string, chatId: string, messageId: string): string[] | null {
    const bound = this.boundByScope.get(scopeKey(userId, chatId));
    if (!bound || bound.messageId !== messageId) return null;
    return [...bound.entryIds];
  }

  invalidateChat(userId: string, chatId: string): void {
    this.boundByScope.delete(scopeKey(userId, chatId));
  }

  private takePending(
    userId: string,
    generationId: string,
    chatId: string,
  ): PendingActivation | null {
    const pending = this.pendingByGenerationId.get(generationId);
    if (!pending || pending.userId !== userId || pending.chatId !== chatId) return null;
    this.pendingByGenerationId.delete(generationId);
    return pending;
  }
}

function uniqueEntryIds(entries: readonly WorldInfoActivationEntry[]): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const entry of entries) {
    const id = typeof entry?.id === "string" ? entry.id.trim() : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function scopeKey(userId: string, chatId: string): string {
  return JSON.stringify([userId, chatId]);
}
