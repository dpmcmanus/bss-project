"use server"

import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

import { auth } from "@/lib/auth"
import { db } from "@/database/db"
import { todos, insertTodoSchema } from "@/database/schema"
import type { Todo } from "@/database/schema"

export async function createTodo(title: string) {
    /* YOUR CODE HERE */
    // Retrieve the session from the request headers.
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    
    if (!session) {
        throw new Error("You must be signed in to add a todo.");
    }
    
    // Validate the title using the Zod schema; this will throw if the title is empty.
    insertTodoSchema.pick({ title: true }).parse({ title });
    
    // Simulate a network delay (for optimistic UI demonstration)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Insert the new todo into the database.
    // We explicitly set the title property.
    const [newTodo] = await db
        .insert(todos)
        .values({
        title,
        userId: session.user.id,
        })
        .returning();
    
    return newTodo;
}

export async function toggleTodo(/* */) {
    /* YOUR CODE HERE */
}

export async function deleteTodo(formData: FormData) {
    /* YOUR AUTHORIZATION CHECK HERE */
    const id = formData.get("id") as string;
    await db.delete(todos)
        .where(eq(todos.id, id));

    revalidatePath("/admin");
}
