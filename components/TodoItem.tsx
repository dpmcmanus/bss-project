import { Todo } from "@/database/schema";
import { Checkbox } from "@/components/ui/checkbox";

import { toggleTodo } from "@/actions/todos";
import { useState } from "react";

export function TodoItem({ todo }: { todo: Todo }) {

    const [isCompleted, setIsCompleted] = useState(todo.completed);
    const [isLoading, setIsLoading] = useState(false);

    async function handleToggle() {
        setIsLoading(true)
        try {
            // Optimistically toggle the UI
            setIsCompleted((prev) => !prev)

            // Call the server action to toggle the Todo
            await toggleTodo(todo.id)
        } catch (err) {
            // Revert the optimistic update if an error occurs
            setIsCompleted(todo.completed)
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <li
            key={todo.id}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2`}
        >
            <Checkbox
                checked={isCompleted}
                onCheckedChange={handleToggle}
                disabled={isLoading}
            />
            <span className={`flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                {todo.title}
            </span>
        </li>
    )
}