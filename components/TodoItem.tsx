"use client"

import { Todo } from "@/database/schema";
import { Checkbox } from "@/components/ui/checkbox";

import { toggleTodo } from "@/actions/todos";
import { useState } from "react";
import { useOptimistic } from "react";

export function TodoItem({ todo }: { todo: Todo }) {
    const [isLoading, setIsLoading] = useState(false)

    // useOptimistic
    const [localTodo, setLocalTodo] = useOptimistic(
        todo,
        (state, newCompleted: boolean) => ({ ...state, completed: newCompleted })
    )

    async function handleToggle() {
        const newCompleted = !localTodo.completed

        // Optimistically update the state
        setLocalTodo(newCompleted)

        setIsLoading(true)
        try {
            // Call the toggleTodo server action
            const updated = await toggleTodo(localTodo.id)
            setLocalTodo(newCompleted)
        } catch (error) {
            console.error("Error toggling todo, reverting optimistic update", error)
            setLocalTodo(!newCompleted)
        } finally {
            setIsLoading(false)
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