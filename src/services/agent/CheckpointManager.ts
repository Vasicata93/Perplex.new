export class CheckpointManager {
  private checkpoints: Map<string, any> = new Map();

  createCheckpoint(session_id: string, state: any): string {
    const checkpointId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    // Deep clone the state to ensure the checkpoint is immutable
    this.checkpoints.set(checkpointId, { session_id, timestamp: Date.now(), state: JSON.parse(JSON.stringify(state)) });
    return checkpointId;
  }

  restoreCheckpoint(checkpointId: string): any | null {
    const chk = this.checkpoints.get(checkpointId);
    if (!chk) return null;
    return JSON.parse(JSON.stringify(chk.state));
  }

  listCheckpoints(session_id: string): { id: string; timestamp: number }[] {
    const list: { id: string; timestamp: number }[] = [];
    for (const [id, chk] of this.checkpoints.entries()) {
      if (chk.session_id === session_id) {
        list.push({ id, timestamp: chk.timestamp });
      }
    }
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }

  deleteCheckpoint(checkpointId: string): boolean {
    return this.checkpoints.delete(checkpointId);
  }
}

export const globalCheckpointManager = new CheckpointManager();
