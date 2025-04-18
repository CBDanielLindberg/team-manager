"use client"

import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { ButtonProps } from "@/components/ui/button"

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
}

export function LoadingButton({ children, loading, ...props }: LoadingButtonProps) {
  return (
    <Button {...props} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
} 