import { Todo } from "@/database/schema";
import { Checkbox } from "@/components/ui/checkbox";

import { toggleTodo } from "@/actions/todos";
import { useState } from "react";

export function TodoItem({ todo }: { todo: Todo }) {
    const [localTodo, setLocalTodo] = useState(todo);
    const [isToggling, setIsToggling] = useState(false);
  
    async function handleToggle() {
      // Prevent multiple clicks toggle in progress
      if (isToggling) return;
      setIsToggling(true);
      try {
        const updated = await toggleTodo(localTodo.id);
        setLocalTodo(updated);
      } catch (error) {
        console.error("Error toggling todo:", error);
      } finally {
        setIsToggling(false);
      }
    }
  
    return (
      <li className="flex items-center gap-2 rounded-lg border px-4 py-2">
        <Checkbox
          checked={localTodo.completed}
          disabled={isToggling}
          onCheckedChange={handleToggle}
        />
        <span className={`flex-1 ${localTodo.completed ? "line-through text-muted-foreground" : ""}`}>
          {localTodo.title}
        </span>
      </li>
    );
  }