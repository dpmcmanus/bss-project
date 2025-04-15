"use client"

import { Todo } from "@/database/schema";
import { Checkbox } from "@/components/ui/checkbox";

import { toggleTodo } from "@/actions/todos";
import { useState } from "react";
import { useOptimistic } from "react";

export function TodoItem({ todo }: { todo: Todo }) {
    const [isLoading, setIsLoading] = useState(false);

    // Simplified optimistic update strategy - only track the completed state change
    const [optimisticTodo, updateOptimisticTodo] = useOptimistic<Todo, boolean>(
        todo,
        (prev, completed) => {
            return { ...prev, completed };
        }
    );
  
    async function handleToggle() {
        // Calculate the new completed state
        const newCompleted = !optimisticTodo.completed;
      
        // Optimistically update the state by passing only the boolean value
        updateOptimisticTodo(newCompleted);
      
        setIsLoading(true);
        try {
            const updatedTodo = await toggleTodo(optimisticTodo.id);
            if (updatedTodo && updatedTodo.completed !== newCompleted) {
                updateOptimisticTodo(updatedTodo.completed);
            }
        } catch (error) {
            console.error("Error toggling todo, reverting optimistic update", error);
            updateOptimisticTodo(!newCompleted);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <li className="flex items-center gap-2 rounded-lg border px-4 py-2">
            <Checkbox
                checked={optimisticTodo.completed}
                onCheckedChange={handleToggle}
                disabled={isLoading} 
            />
            <span className={`flex-1 ${optimisticTodo.completed ? "line-through text-muted-foreground" : ""}`}>
                {optimisticTodo.title}
            </span>
        </li>
    )
}