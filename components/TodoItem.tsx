"use client"

import { Todo } from "@/database/schema";
import { Checkbox } from "@/components/ui/checkbox";

import { toggleTodo } from "@/actions/todos";
import { useState } from "react";
import { useOptimistic, useTransition } from "react";

export function TodoItem({ todo }: { todo: Todo }) {
    // Use transition to track server action state
    const [isPending, startTransition] = useTransition();
    
    // Track the local loading state separately
    const [isLoading, setIsLoading] = useState(false);

    // Use the optimistic version of the todo
    const [optimisticTodo, setOptimisticTodo] = useOptimistic(
        todo,
        (state, newCompleted: boolean) => ({
            ...state,
            completed: newCompleted
        })
    );
  
    function handleToggle() {
        const newCompleted = !optimisticTodo.completed;
        
        // Update optimistically first
        setOptimisticTodo(newCompleted);
        
        // Set loading state
        setIsLoading(true);
        
        // Use transition for the server action
        startTransition(async () => {
            try {
                // The server action should return the updated todo
                const result = await toggleTodo(optimisticTodo.id);
                
                // No need to update state here as the server component
                // will re-render with the latest data
            } catch (error) {
                console.error("Error toggling todo:", error);
                // Only revert on error
                setOptimisticTodo(!newCompleted);
            } finally {
                setIsLoading(false);
            }
        });
    }

    // Use the combined loading state
    const isDisabled = isLoading || isPending;

    return (
        <li className="flex items-center gap-2 rounded-lg border px-4 py-2">
            <Checkbox
                checked={optimisticTodo.completed}
                onCheckedChange={handleToggle}
                disabled={isDisabled} 
            />
            <span className={`flex-1 ${optimisticTodo.completed ? "line-through text-muted-foreground" : ""}`}>
                {optimisticTodo.title}
            </span>
        </li>
    )
}