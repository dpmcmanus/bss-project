"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Todo } from "@/database/schema"
import { TodoItem } from "./TodoItem"

import { useState } from "react"
import { createTodo } from "@/actions/todos"

export function TodoList({ todos }: { todos: Todo[] }) {
  // State for the list of todos (optimistic updates)
  const [optimisticTodos, setOptimisticTodos] = useState(todos)
  // State for the input value (controlled component)
  const [title, setTitle] = useState("")
  // States for error and loading
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAddTodo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    // Validate input.
    if (!title.trim()) {
      setError("Todo title cannot be empty.")
      return
    }

    // Create a placeholder todo with all required fields.
    const placeholderTodo: Todo = {
      id: `temp-${Date.now()}`,
      title,
      completed: false,
      userId: "temp",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setTitle("") // Clear the input field.
    // Optimistically update the UI with the placeholder todo.
    setOptimisticTodos((prev) => [...prev, placeholderTodo])
    setIsLoading(true)
    try {
      // Call the server action to create a new todo.
      const newTodo = await createTodo(title)
      // Replace the placeholder with the actual todo from the server.
      setOptimisticTodos((prev) =>
        prev.map((todo) =>
          todo.id === placeholderTodo.id ? newTodo : todo
        )
      )
    } catch (err: any) {
      // Handle errors by removing the placeholder and setting an error state.
      setError(err.message)
      setOptimisticTodos((prev) =>
        prev.filter((todo) => todo.id !== placeholderTodo.id)
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddTodo} className="flex gap-2 items-stretch">
        <Input
          name="title"
          placeholder="Add a new todo..."
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          className={error ? "border-red-500" : ""}
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