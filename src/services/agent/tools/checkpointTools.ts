import { ToolRegistry } from './ToolRegistry';
import { globalCheckpointManager } from '../CheckpointManager';

export function registerCheckpointTools() {
  ToolRegistry.register(
    {
      name: 'create_checkpoint',
      description: 'Create a restorable snapshot of the current agent state to allow rewinding if a plan fails.',
      parameters: {
        type: 'object',
        properties: {
          session_id: { type: 'string' },
          reason: { type: 'string', description: 'Why this checkpoint is being created.' }
        },
        required: ['session_id']
      }
    },
    async (args: { session_id: string, reason?: string }) => {
      // Create a mock state snapshot
      const state = { task_idx: 0, memory_len: 12 };
      const id = globalCheckpointManager.createCheckpoint(args.session_id, state);
      return {
        success: true,
        data: { checkpoint_id: id },
        summary: `Created checkpoint ${id} for session ${args.session_id}`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'restore_checkpoint',
      description: 'Restore the agent state to a previous checkpoint.',
      parameters: {
        type: 'object',
        properties: {
          checkpoint_id: { type: 'string' }
        },
        required: ['checkpoint_id']
      }
    },
    async (args: { checkpoint_id: string }) => {
      const state = globalCheckpointManager.restoreCheckpoint(args.checkpoint_id);
      if (!state) return { success: false, error: 'Checkpoint not found', summary: 'Checkpoint not found' };
      
      return {
        success: true,
        data: { state },
        summary: `Restored session to checkpoint ${args.checkpoint_id}`
      };
    }
  );
}
