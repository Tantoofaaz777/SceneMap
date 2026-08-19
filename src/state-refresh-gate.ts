export type StateRefreshCompletion = {
  matched: boolean;
  rerun: boolean;
};

/**
 * Allows one frontend state request in flight and collapses any event burst
 * received meanwhile into at most one follow-up request.
 */
export class StateRefreshGate {
  private activeRequestId: string | null = null;
  private rerunRequested = false;

  begin(requestId: string): boolean {
    if (this.activeRequestId) {
      this.rerunRequested = true;
      return false;
    }
    this.activeRequestId = requestId;
    return true;
  }

  complete(value: unknown): StateRefreshCompletion {
    if (typeof value !== "string" || value !== this.activeRequestId) {
      return { matched: false, rerun: false };
    }
    this.activeRequestId = null;
    const rerun = this.rerunRequested;
    this.rerunRequested = false;
    return { matched: true, rerun };
  }

  reset(): void {
    this.activeRequestId = null;
    this.rerunRequested = false;
  }
}
