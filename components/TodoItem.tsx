import { Todo } from "@/database/schema";
import { Checkbox } from "@/components/ui/checkbox";

import { toggleTodo } from "@/actions/todos";
import { useState } from "react";

export function TodoItem({ todo }: { todo: Todo }) {
    const [localTodo, setLocalTodo] = useState(todo);

    async function handleToggle() {
      try {
        const updated = await toggleTodo(localTodo.id);
        setLocalTodo(updated);
      } catch (error) {
        console.error("Error toggling todo:", error);
      }
    }
  
    return (
      <li className="flex items-center gap-2 rounded-lg border px-4 py-2">
        <Checkbox
          checked={localTodo.completed}
          onCheckedChange={handleToggle}
        />
        <span className={`flex-1 ${localTodo.completed ? "line-through text-muted-foreground" : ""}`}>
          {localTodo.title}
        </span>
      </li>
    );
  }