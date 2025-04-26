"use client"

import Link from "next/link"
import { Button } from "./ui/button"

export function AdminNavEntry() {
    return (
        <Link href="/admin">
            <Button variant="ghost">Admin</Button>
        </Link>
    )
}