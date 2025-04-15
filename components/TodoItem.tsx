"use client"

import { Todo } from "@/database/schema";
import { Checkbox } from "@/components/ui/checkbox";

import { toggleTodo } from "@/actions/todos";
import { useState } from "react";
import { useOptimistic, useTransition, useEffect } from "react";

export function TodoItem({ todo }: { todo: Todo }) {
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
  
    // Initialize optimistic state with the original todo
    const [localTodo, setLocalTodo] = useOptimistic<Todo, { completed?: boolean }>(
      todo,
      (prev, optimisticValue) => ({
        ...prev,
        ...optimisticValue,
      })
    );
    
    // Keep localTodo in sync with parent-provided todo
    useEffect(() => {
      if (!isPending && !isLoading) {
        setLocalTodo(todo);
      }
    }, [todo, isPending, isLoading]);
  
    async function handleToggle() {
      const newCompleted = !localTodo.completed;
  
      // Only update the completed property optimistically
      setLocalTodo({ completed: newCompleted });
  
      setIsLoading(true);
      startTransition(async () => {
        try {
            await toggleTodo(localTodo.id);
        } catch (error) {
            console.error("Error toggling todo, reverting optimistic update", error);
            // Revert optimistic update in case of error
            setLocalTodo({ completed: !newCompleted });
        } finally {
            setIsLoading(false);
        }
      });
    }
  
    const isDisabled = isLoading || isPending;
  
    return (
      <li className="flex items-center gap-2 rounded-lg border px-4 py-2">
        <Checkbox
          checked={localTodo.completed}
          onCheckedChange={handleToggle}
          disabled={isDisabled}
        />
        <span className={`flex-1 ${localTodo.completed ? "line-through text-muted-foreground" : ""}`}>
          {localTodo.title}
        </span>
      </li>
    );
}