"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>, VariantProps<typeof labelVariants> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, onMouseDown, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(labelVariants(), className)}
      onMouseDown={(event) => {
        const target = event.target as HTMLElement | null;
        if (target?.closest("button, input, select, textarea")) return;
        onMouseDown?.(event);
        if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
      }}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label };
