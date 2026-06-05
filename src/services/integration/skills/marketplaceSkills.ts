import { ISkill } from "../../../types/integration";

const mockSkills = [
  { id: "codebase_inspection", name: "Codebase Inspection", desc: "Analyze the architecture, dependencies, and flow of an entire repository.", req: ["github"], icon: "search" },
  { id: "creative_writing", name: "Creative Writer", desc: "Specialized output format for creative writing and brainstorming.", req: [], icon: "edit" },
  { id: "email_manager", name: "Email Orchestrator", desc: "Draft, read, and manage inboxes systematically.", req: ["email"], icon: "mail" },
  { id: "github_auth", name: "GitHub Automations", desc: "Automate PR assignments, merges, and labels.", req: ["github"], icon: "github" },
  { id: "github_code_review", name: "Code Reviewer", desc: "Perform deep, multi-file code reviews in Github PRs.", req: ["github"], icon: "check-circle" },
  { id: "github_issues", name: "Issue Manager", desc: "Triages, labels, and closes Github Issues.", req: ["github"], icon: "alert-circle" },
  { id: "kanban_orchestrator", name: "Kanban Orchestrator", desc: "Organizes and prioritizes tasks across boards.", req: [], icon: "layout" },
  { id: "kanban_worker", name: "Kanban Worker", desc: "Picks tasks from Kanban boards and implements them.", req: [], icon: "briefcase" },
  { id: "mcp_native", name: "Native MCP", desc: "Handles Model Context Protocol requests.", req: [], icon: "database" },
  { id: "mlops_eval", name: "MLOps Evaluator", desc: "Evaluate model outputs based on custom criteria.", req: [], icon: "bar-chart" },
  { id: "mlops_research", name: "MLOps Researcher", desc: "Searches the web for latest ML papers and synthesizes techniques.", req: [], icon: "book" },
  { id: "mlops_training", name: "MLOps Trainer", desc: "Monitors training loops and reports metrics.", req: [], icon: "activity" },
  { id: "mlops_vectordb", name: "VectorDB Manager", desc: "Manages embeddings pipelines for RAG systems.", req: [], icon: "database" },
  { id: "obsidian_sync", name: "Obsidian Sync", desc: "Two-way sync and markdown grooming in Obsidian vaults.", req: [], icon: "file-text" },
  { id: "webhook_subscriptions", name: "Webhook Subscriptions", desc: "Subscribes to external systems and reacts dynamically.", req: ["webhook"], icon: "webhook" },
  { id: "systematic_debugging", name: "Systematic Debugger", desc: "Applies 5-why root cause analysis for bug hunting.", req: [], icon: "tool" },
  { id: "test_driven_dev", name: "TDD Agent", desc: "Writes failing tests first, then implements logic to pass them.", req: [], icon: "check-square" },
  { id: "subagent_driven_dev", name: "Multi-Agent DEV", desc: "Deploys sub-agents for executing isolated features in parallel.", req: [], icon: "users" }
];

export const marketplaceSkills: ISkill[] = mockSkills.map(s => ({
  id: s.id,
  name: s.name,
  description: s.desc,
  icon: s.icon as any,
  isActive: false,
  requiredConnectors: s.req,
  schema: { type: "object", properties: {}, required: [] },
  execute: async () => ({ success: true, message: "Placeholder skill executed." })
}));
