"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoadingButton } from "@/components/ui/loading-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Simulera inloggning
    setTimeout(() => {
      router.push("/admin/dashboard")
    }, 1000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="m.jordan@example.com"
          required 
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input 
          id="password" 
          type="password"
          required 
        />
      </div>
      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}
      <LoadingButton 
        type="submit" 
        className="w-full" 
        loading={loading}
      >
        Sign in
      </LoadingButton>
    </form>
  )
} 