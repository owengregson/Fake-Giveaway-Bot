export interface PendingGiveaway {
  guildId: string;
  channelId: string;
  name: string;
  description?: string;
  hostId: string;
  winnersCount: number;
  duration: string;
  durationMs: number;
  ping: boolean;
}

export const pendingGiveaways = new Map<string, PendingGiveaway>();

// Auto-cleanup pending giveaways after 5 minutes
export function storePending(id: string, data: PendingGiveaway): void {
  pendingGiveaways.set(id, data);
  setTimeout(() => pendingGiveaways.delete(id), 5 * 60 * 1000);
}
