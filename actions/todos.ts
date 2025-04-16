"use server"

import { sql, eq, and } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { db } from "@/database/db"
import { todos, insertTodoSchema } from "@/database/schema"

export async function createTodo(title: string) {
    /* YOUR CODE HERE */
    // Retrieve the session via the request headers.
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("You must be signed in to add a todo.");
    }

    // Validate the title using the Zod schema,
    // but only validate the title property so that userId isn't expected.
    insertTodoSchema.pick({ title: true }).parse({ title });

    // Simulate a delay for testing optimistic UI updates.
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Insert the new Todo into the database.
    // Defaults for completed, createdAt, and updatedAt come from your schema.
    const [newTodo] = await db
        .insert(todos)
        .values({
        title: title, 
        userId: session.user.id,
        })
        .returning();

    return newTodo;
}

export async function toggleTodo(id: string) {
    await new Promise((resolve => setTimeout(resolve, 1000)));

    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        throw new Error("Sign in to toggle a todo.");
    }

    // Perform a single query to verify ownership and toggle the Todo
    const updatedTodo = await db
        .update(todos)
        .set({
            completed: sql`NOT ${todos.completed}`, 
        })
        .where(
            and(
                eq(todos.id, id),
                eq(todos.userId, session.user.id) 
            )
        )
        .returning()

    if (updatedTodo.length === 0) {
        throw new Error("Todo not found or you do not have permission to toggle it.")
    }
    
    revalidatePath("/todos");
    
    return updatedTodo[0];
}

export async function deleteTodo(formData: FormData) {
    /* YOUR AUTHORIZATION CHECK HERE */

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        throw new Error("You must be signed in to delete a todo.");
    }

    const id = formData.get("id") as string;
    if (session && session.user.role == "admin") {
        await db.delete(todos)
            .where(eq(todos.id, id));
    }

    revalidatePath("/admin");
}
