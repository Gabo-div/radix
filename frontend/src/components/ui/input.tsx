import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium hover:border-input/80 focus-visible:outline-none focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
