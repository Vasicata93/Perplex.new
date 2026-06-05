import { ToolRegistry } from './ToolRegistry';
import { safeDigitalService } from '../../safeDigitalService';

export function registerKanbanTools() {
  ToolRegistry.register(
    {
      name: 'kanban_show',
      description: 'Read the full state of tasks in the Kanban board.',
      parameters: {
        type: 'object',
        properties: {
          task_id: {
            type: 'number',
            description: 'Optional ID of a specific task to view.'
          }
        }
      }
    },
    async (args: { task_id?: number }) => {
      const tasks = await safeDigitalService.getTasks();
      if (args.task_id) {
        const task = tasks.find(t => t.id === args.task_id);
        if (!task) return { success: false, error: 'Task not found', summary: 'Task not found' };
        return { success: true, data: { task }, summary: `Fetched task ${args.task_id}` };
      }
      return { success: true, data: { tasks }, summary: `Fetched ${tasks.length} kanban tasks.` };
    }
  );

  ToolRegistry.register(
    {
      name: 'kanban_create',
      description: 'Create a new kanban task, optionally as a child of another task.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short task title.' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] }
        },
        required: ['title']
      }
    },
    async (args: { title: string, priority?: 'low'|'medium'|'high' }) => {
      const tasks = await safeDigitalService.getTasks();
      const newTask = {
        id: Date.now(),
        title: args.title,
        isCompleted: false,
        priority: args.priority || 'medium'
      };
      
      const newTasks = [...tasks, newTask];
      await safeDigitalService.saveTasks(newTasks);
      
      return {
        success: true,
        data: newTask,
        summary: `Created kanban task: ${args.title}`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'kanban_complete',
      description: 'Mark your current task as done with a structured handoff.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'number' },
          summary: { type: 'string', description: 'Human-readable handoff summary.' }
        },
        required: ['task_id', 'summary']
      }
    },
    async (args: { task_id: number, summary: string }) => {
      const tasks = await safeDigitalService.getTasks();
      const taskIndex = tasks.findIndex(t => t.id === args.task_id);
      if (taskIndex === -1) return { success: false, error: 'Task not found', summary: 'Task not found' };
      
      const updated = { ...tasks[taskIndex], isCompleted: true, title: `${tasks[taskIndex].title} [${args.summary}]` };
      tasks[taskIndex] = updated;
      await safeDigitalService.saveTasks(tasks);
      
      return {
        success: true,
        data: updated,
        summary: `Completed task ${args.task_id}: ${args.summary}`
      };
    }
  );
  
  ToolRegistry.register(
    {
      name: 'kanban_block',
      description: 'Mark a task as blocked and provide a reason.',
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'number' },
          reason: { type: 'string', description: 'Reason for being blocked.' }
        },
        required: ['task_id', 'reason']
      }
    },
    async (args: { task_id: number, reason: string }) => {
      const tasks = await safeDigitalService.getTasks();
      const taskIndex = tasks.findIndex(t => t.id === args.task_id);
      if (taskIndex === -1) return { success: false, error: 'Task not found', summary: 'Task not found' };
      
      const updated = { ...tasks[taskIndex], title: `${tasks[taskIndex].title} [BLOCKED: ${args.reason}]` };
      tasks[taskIndex] = updated;
      await safeDigitalService.saveTasks(tasks);
      
      return {
        success: true,
        data: updated,
        summary: `Blocked task ${args.task_id} with reason: ${args.reason}`
      };
    }
  );
}
