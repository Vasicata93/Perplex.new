import { ToolRegistry } from './ToolRegistry';

let currentBudget = 10.0; // Dollars
let spentBudget = 0.0;

export function registerBudgetTools() {
  ToolRegistry.register(
    {
      name: 'check_budget',
      description: 'Check the remaining agent budget/token allowance before performing expensive tasks.',
      parameters: { type: 'object', properties: {} }
    },
    async () => {
      return {
        success: true,
        data: {
          budget_limit: currentBudget,
          budget_spent: spentBudget,
          budget_remaining: currentBudget - spentBudget,
          currency: 'USD'
        },
        summary: `Checked budget: $${(currentBudget - spentBudget).toFixed(2)} remaining.`
      };
    }
  );
}
