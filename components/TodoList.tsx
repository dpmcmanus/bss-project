"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Todo } from "@/database/schema"
import { TodoItem } from "./TodoItem"

import { useState } from "react"
import { createTodo } from "@/actions/todos"

export function TodoList({ todos }: { todos: Todo[] }) {
    const [optimisticTodos, setOptimisticTodos] = useState(todos)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
  
    async function handleAddTodo(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault()
      const formData = new FormData(event.currentTarget)
      const title = formData.get("title") as string
  
      // Reset error state
      setError(null)
  
      // Validate input
      if (!title || title.trim() === "") {
        setError("Todo title cannot be empty.")
        return
      }
  
      // Optimistic update
      const placeholderTodo: Todo = {
        id: `temp-${Date.now()}`,
        title,
        completed: false,
        userId: "temp",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setOptimisticTodos((prev) => [...prev, placeholderTodo])
  
      setIsLoading(true)
      try {
        // Call the server action to create a new todo, passing the title string.
        const newTodo = await createTodo(title)
        // Replace the placeholder with the actual todo from the server.
        setOptimisticTodos((prev) =>
          prev.map((todo) =>
            todo.id === placeholderTodo.id ? newTodo : todo
          )
        )
      } catch (err: any) {
        // Handle errors and remove the placeholder todo.
        setError(err.message)
        setOptimisticTodos((prev) =>
          prev.filter((todo) => todo.id !== placeholderTodo.id)
        )
      } finally {
        setIsLoading(false)
      }
  
      // Reset the form
      event.currentTarget.reset()
    }
  
    return (
      <div className="space-y-4">
        <form className="flex gap-2 items-stretch" onSubmit={handleAddTodo}>
          <Input
            name="title"
            placeholder="Add a new todo..."
            className={error ? "border-red-500" : ""}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add"}
          </Button>
        </form>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <ul className="space-y-2">
          {optimisticTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      </div>
    )
  }