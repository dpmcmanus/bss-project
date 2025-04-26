"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Todo } from "@/database/schema"
import { TodoItem } from "./TodoItem"

import { useState } from "react"
import { createTodo } from "@/actions/todos"

import { useActionState } from "react"
import { useOptimistic } from "react"

export function TodoList({ todos }: { todos: Todo[] }) {
    const [todosState, formAction, isAdding] = useActionState(

      async (previousTodos: Todo[], formData: FormData) => {
        const title = String(formData.get("title") ?? "").trim()
        if (!title) {
        // simple validation
          throw new Error("Title cannot be empty")
        }
        const newTodo = await createTodo(title)
        return [...previousTodos, newTodo]
      },
      todos 
    )
  
    const [optimisticTodos, addOptimistic] = useOptimistic<Todo[], Todo>(
      todosState,
      (prev, newTodo) => [...prev, newTodo]
    )
  
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault()
      const fm = new FormData(e.currentTarget)
      const title = String(fm.get("title") ?? "").trim()
        if (!title) {
            // simple validation 
            throw new Error("Title cannot be empty")
        }
      const placeholder: Todo = {
        id: `temp-${Date.now()}`,
        title,
        completed: false,
        userId: "temp", 
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      addOptimistic(placeholder)
    }
  
    return (
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2 items-stretch">
          <Input name="title" placeholder="Add a new todo…" />
          <Button type="submit" disabled={isAdding}>
            {isAdding ? "Adding…" : "Add"}
          </Button>
        </form>
  
        <ul className="space-y-2">
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      </div>
    )
  }