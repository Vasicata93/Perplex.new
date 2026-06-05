import { ToolRegistry } from './ToolRegistry';

const todos: { id: string, task: string, completed: boolean }[] = [];

export function registerTodoTools() {
  ToolRegistry.register(
    {
      name: 'add_todo',
      description: 'Add a simple task to the active session to-do list.',
      parameters: {
        type: 'object',
        properties: {
          task: { type: 'string', description: 'The task description.' }
        },
        required: ['task']
      }
    },
    async (args: { task: string }) => {
      const todo = { id: `todo_${Date.now()}`, task: args.task, completed: false };
      todos.push(todo);
      return {
        success: true,
        data: { todo },
        summary: `Added to-do: ${args.task}`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'list_todos',
      description: 'List all open and completed to-do items.',
      parameters: { type: 'object', properties: {} }
    },
    async () => {
      return {
        success: true,
        data: { todos },
        summary: `Listed ${todos.length} to-dos.`
      };
    }
  );

  ToolRegistry.register(
    {
      name: 'complete_todo',
      description: 'Mark a to-do item as completed.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The ID of the to-do item.' }
        },
        required: ['id']
      }
    },
    async (args: { id: string }) => {
      const todo = todos.find(t => t.id === args.id);
      if (!todo) return { success: false, error: 'To-do not found', summary: 'To-do not found' };
      todo.completed = true;
      return {
        success: true,
        data: { todo },
        summary: `Completed to-do: ${todo.task}`
      };
    }
  );
}
