import { TodoList } from "@/components/TodoList"
import { todos as todosTable, Todo } from "@/database/schema"

import { auth } from "@/lib/auth"
import { headers } from "next/headers";

import { db } from "@/database/db";
import { eq, desc } from "drizzle-orm";

export default async function TodosPage() {

    const session = await auth.api.getSession({
        headers: await headers(),
      });
    
      if (!session) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-black">
            <p className="text-xl font-medium text-center text-white">
              Please sign in to view your todos.
            </p>
          </div>
        );
      }

    // Query todos from the DB where the owner is the authenticated user.
    const todos: Todo[] = await db.query.todos.findMany({
        where: eq(todosTable.userId, session.user.id),
        orderBy: [desc(todosTable.createdAt)],
    });

    return (
        <main className="py-8 px-4">
            <section className="container mx-auto">
                <h1 className="text-2xl font-bold mb-6">My Todos</h1>
                <TodoList todos={todos} />
            </section>
        </main>
    )
} 