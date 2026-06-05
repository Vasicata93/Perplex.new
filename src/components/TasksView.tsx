import React, { useState } from "react";
import { CheckCircle, Clock, Calendar, MoreVertical, Search, Plus, Trash2, Edit2 } from "lucide-react";
import { useTasksStore, Task, TaskStatus } from "../store/useTasksStore";

export const TasksView: React.FC = () => {
  const { tasks, addTask, updateTaskStatus, deleteTask, updateTask } = useTasksStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | TaskStatus>("all");
  
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle.trim(), 'todo');
    setNewTaskTitle("");
    setIsAdding(false);
  };

  const handleStatusChange = (id: string, newStatus: TaskStatus) => {
    updateTaskStatus(id, newStatus);
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      updateTask(editingId, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const renderTask = (task: Task) => (
    <div key={task.id} className={`bg-pplx-card border ${task.status === 'in_progress' ? 'border-pplx-accent/30 shadow-[0_0_10px_rgba(37,99,235,0.1)] hover:border-pplx-accent/80' : 'border-pplx-border hover:border-pplx-accent/50'} rounded-lg p-3 transition-colors group relative ${task.status === 'completed' ? 'opacity-60 hover:opacity-100' : ''}`}>
      <div className="flex items-start justify-between">
         <div className="flex flex-col flex-1 mr-2">
            {editingId === task.id ? (
              <input
                autoFocus
                type="text"
                className="bg-transparent border-b border-pplx-accent outline-none text-sm font-medium w-full"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
              />
            ) : (
              <span className={`text-sm font-medium ${task.status === 'completed' ? 'line-through' : ''}`}>
                {task.title}
              </span>
            )}
            <span className="text-xs text-pplx-muted mt-1 flex items-center gap-1">
              <Calendar size={12}/> {new Date(task.createdAt).toLocaleDateString()}
            </span>
         </div>
         <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-pplx-sidebar/80 backdrop-blur-sm p-1 rounded-md shadow-sm absolute top-2 right-2">
            {task.status !== 'todo' && (
               <button onClick={() => handleStatusChange(task.id, 'todo')} className="p-1 hover:bg-pplx-hover rounded text-blue-400" title="Move to To Do">
                 <Clock size={14} />
               </button>
            )}
            {task.status !== 'in_progress' && (
               <button onClick={() => handleStatusChange(task.id, 'in_progress')} className="p-1 hover:bg-pplx-hover rounded text-amber-400" title="Move to In Progress">
                 <Clock size={14} />
               </button>
            )}
            {task.status !== 'completed' && (
               <button onClick={() => handleStatusChange(task.id, 'completed')} className="p-1 hover:bg-pplx-hover rounded text-emerald-400" title="Mark Completed">
                 <CheckCircle size={14} />
               </button>
            )}
            <button onClick={() => startEdit(task)} className="p-1 hover:bg-pplx-hover rounded text-pplx-muted" title="Edit Task">
               <Edit2 size={14} />
            </button>
            <button onClick={() => deleteTask(task.id)} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded text-pplx-muted" title="Delete Task">
               <Trash2 size={14} />
            </button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full p-6 md:p-12 max-w-7xl mx-auto text-pplx-text font-sans">
      <div className="flex flex-col mb-8 md:flex-row justify-between items-start md:items-end border-b border-pplx-border/50 pb-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-pplx-accent/20 flex items-center justify-center border border-pplx-accent/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
              <CheckCircle className="text-pplx-accent" size={24} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pplx-text to-pplx-muted">
              Tasks
            </h1>
          </div>
          <p className="text-pplx-muted font-light tracking-wide flex items-center gap-2 text-sm">
            Manage your daily tasks and productivity.
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-6 md:mt-0 font-mono text-xs">
           <button 
             onClick={() => setIsAdding(!isAdding)}
             className={`bg-pplx-accent hover:bg-pplx-accent/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${isAdding ? 'bg-pplx-accent/50' : ''}`}
           >
              <Plus size={16} className={isAdding ? 'rotate-45 transition-transform' : 'transition-transform'} />
              <span className="font-sans font-medium">{isAdding ? 'Cancel' : 'New Task'}</span>
           </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2 bg-pplx-card/80 border border-pplx-border px-3 py-1.5 rounded-lg w-full max-w-md focus-within:border-pplx-accent transition-colors shadow-sm">
              <Search size={16} className="text-pplx-muted shrink-0" />
              <input 
                 type="text" 
                 placeholder="Search tasks..." 
                 className="bg-transparent border-none outline-none text-sm text-pplx-text flex-1"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           <div className="flex gap-2">
              <select 
                 className="bg-pplx-card border border-pplx-border rounded-lg px-3 py-1.5 text-sm text-pplx-text outline-none focus:border-pplx-accent transition-colors cursor-pointer appearance-none font-medium"
                 value={filterStatus}
                 onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                 <option value="all">All Tasks</option>
                 <option value="todo">To Do</option>
                 <option value="in_progress">In Progress</option>
                 <option value="completed">Completed</option>
              </select>
           </div>
        </div>

        {isAdding && (
           <form onSubmit={handleAddTask} className="bg-pplx-card/40 border border-pplx-border border-dashed rounded-xl p-4 flex gap-3 items-center">
             <input
               autoFocus
               type="text"
               placeholder="What needs to be done?"
               className="bg-pplx-secondary border border-pplx-border rounded-lg px-4 py-2 text-sm text-pplx-text outline-none focus:border-pplx-accent flex-1 transition-colors"
               value={newTaskTitle}
               onChange={(e) => setNewTaskTitle(e.target.value)}
             />
             <button type="submit" disabled={!newTaskTitle.trim()} className="bg-pplx-accent disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
               Add
             </button>
           </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-pplx-card/40 border border-pplx-border rounded-xl p-4 flex flex-col gap-3 h-fit max-h-[70vh] overflow-y-auto custom-scrollbar">
             <div className="flex items-center justify-between border-b border-pplx-border/50 pb-2 mb-2 sticky top-0 bg-pplx-card/40 backdrop-blur z-10">
                <h3 className="font-medium text-sm flex items-center gap-2"><Clock size={16} className="text-blue-400"/> To Do</h3>
                <span className="text-xs bg-pplx-sidebar px-2 py-0.5 rounded-full text-pplx-muted">{todoTasks.length}</span>
             </div>
             {todoTasks.map(renderTask)}
             {todoTasks.length === 0 && <p className="text-xs text-pplx-muted/50 text-center py-4">No tasks in To Do</p>}
          </div>

          <div className="bg-pplx-card/40 border border-pplx-border rounded-xl p-4 flex flex-col gap-3 h-fit max-h-[70vh] overflow-y-auto custom-scrollbar">
             <div className="flex items-center justify-between border-b border-pplx-border/50 pb-2 mb-2 sticky top-0 bg-pplx-card/40 backdrop-blur z-10">
                <h3 className="font-medium text-sm flex items-center gap-2"><Clock size={16} className="text-amber-400"/> In Progress</h3>
                <span className="text-xs bg-pplx-sidebar px-2 py-0.5 rounded-full text-pplx-muted">{inProgressTasks.length}</span>
             </div>
             {inProgressTasks.map(renderTask)}
             {inProgressTasks.length === 0 && <p className="text-xs text-pplx-muted/50 text-center py-4">No tasks In Progress</p>}
          </div>

          <div className="bg-pplx-card/40 border border-pplx-border rounded-xl p-4 flex flex-col gap-3 h-fit max-h-[70vh] overflow-y-auto custom-scrollbar">
             <div className="flex items-center justify-between border-b border-pplx-border/50 pb-2 mb-2 sticky top-0 bg-pplx-card/40 backdrop-blur z-10">
                <h3 className="font-medium text-sm flex items-center gap-2"><CheckCircle size={16} className="text-emerald-400"/> Completed</h3>
                <span className="text-xs bg-pplx-sidebar px-2 py-0.5 rounded-full text-pplx-muted">{completedTasks.length}</span>
             </div>
             {completedTasks.map(renderTask)}
             {completedTasks.length === 0 && <p className="text-xs text-pplx-muted/50 text-center py-4">No completed tasks</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
