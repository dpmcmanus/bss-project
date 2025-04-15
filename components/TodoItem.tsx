"use client"

import { Todo } from "@/database/schema";
import { Checkbox } from "@/components/ui/checkbox";

import { toggleTodo } from "@/actions/todos";
import { useState } from "react";
import { useOptimistic, useTransition } from "react";

export function TodoItem({ todo }: { todo: Todo }) {
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
  
    // Initialize optimistic state. The updater function is prepared to merge a boolean delta.
    const [localTodo, setLocalTodo] = useOptimistic<Todo, Todo | boolean>(
      todo,
      (prev, update) =>
        typeof update === "boolean" ? { ...prev, completed: update } : update
    );
  
    async function handleToggle() {
      const newCompleted = !localTodo.completed;
  
      // Optimistically update the state with a new Todo object (not just a boolean)
      setLocalTodo({ ...localTodo, completed: newCompleted });
  
      setIsLoading(true);
      startTransition(async () => {
        try {
          // Call the server action to toggle the todo; expect a full Todo object back.
          const updatedTodo = await toggleTodo(localTodo.id);
          // Use the server response to update the optimistic state.
          setLocalTodo(updatedTodo);
        } catch (error) {
          console.error("Error toggling todo, reverting optimistic update", error);
          // Revert to the previous state in case of error.
          setLocalTodo({ ...localTodo, completed: !newCompleted });
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