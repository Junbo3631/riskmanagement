"use client"

import { type InputHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

export interface FixedHeightInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const FixedHeightInput = forwardRef<HTMLInputElement, FixedHeightInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="h-10 min-h-[40px] flex items-center">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  },
)

FixedHeightInput.displayName = "FixedHeightInput"

