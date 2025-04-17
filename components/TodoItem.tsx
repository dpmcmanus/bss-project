"use client"

import { Todo } from "@/database/schema";
import { Checkbox } from "@/components/ui/checkbox";

import { toggleTodo } from "@/actions/todos";
import { useTransition, startTransition } from "react";

// Nest useActionState and useOptimistic in a single component?
// Follow up on Piazza - push code to GitHub and ask for feedback

export function TodoItem({ todo }: { todo: Todo }) {
    const [isPending, startTransition] = useTransition();
    async function handleToggle() {
        startTransition(async () => {
            await toggleTodo(todo.id);
        });
      }
  
    return (
      <li className="flex items-center gap-2 rounded-lg border px-4 py-2">
        <Checkbox
        //   checked={todo.completed}
          onCheckedChange={handleToggle}
          disabled={isPending}
          defaultChecked={todo.completed}
        />
        <span className={`flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
          {todo.title}
        </span>
      </li>
    );
  }