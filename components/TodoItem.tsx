"use client"

import { Todo } from "@/database/schema";
import { Checkbox } from "@/components/ui/checkbox";

import { toggleTodo } from "@/actions/todos";
import { useState } from "react";
import { useOptimistic } from "react";

export function TodoItem({ todo }: { todo: Todo }) {
    const [isLoading, setIsLoading] = useState(false);

    const [localTodo, updateOptimisticTodo] = useOptimistic<Todo, boolean | Todo>(
        todo,
        (prev, diff) => {
            return typeof diff === "boolean" ? { ...prev, completed: diff } : diff;
        }
    );
  
    async function handleToggle() {
        const newCompleted = !localTodo.completed;
      
        // Optimistically update the state with the full object
        updateOptimisticTodo({ ...localTodo, completed: newCompleted });
      
        setIsLoading(true);
        try {
          // Call the server action to toggle the todo
          const updatedTodo = await toggleTodo(localTodo.id);
        } catch (error) {
          console.error("Error toggling todo, reverting optimistic update", error);
          // Revert the optimistic update on error by restoring the previous completed value
          updateOptimisticTodo({ ...localTodo, completed: localTodo.completed });
        } finally {
          setIsLoading(false);
        }
      }

    return (
        <li className="flex items-center gap-2 rounded-lg border px-4 py-2">
            <Checkbox
                checked={localTodo.completed}
                onCheckedChange={handleToggle}
                disabled={isLoading} 
            />
            <span className={`flex-1 ${localTodo.completed ? "line-through text-muted-foreground" : ""}`}>
                {localTodo.title}
            </span>
        </li>
    )
}