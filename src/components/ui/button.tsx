import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium tracking-wide ring-offset-background transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] hover:scale-[1.03] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",

  {
    variants: {
      variant: {
        default: "bg-primary/90 text-primary-foreground backdrop-blur-xl border border-white/20 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3),0_4px_16px_-4px_rgba(0,0,0,0.4)] hover:bg-primary hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_8px_24px_-4px_hsl(var(--primary)/0.5)]",
        destructive: "bg-destructive/90 text-destructive-foreground backdrop-blur-xl border border-white/15 hover:bg-destructive",
        outline: "border border-white/15 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/25",
        secondary: "bg-white/10 text-secondary-foreground backdrop-blur-xl border border-white/10 hover:bg-white/15",
        ghost: "hover:bg-white/10 backdrop-blur-md hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-to-br from-primary/90 via-accent/80 to-primary/90 text-primary-foreground font-semibold backdrop-blur-xl border border-white/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4),0_8px_32px_-4px_hsl(var(--primary)/0.5)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_12px_40px_-4px_hsl(var(--accent)/0.6)] hover:brightness-110 transition-all duration-500",
        "ghost-gold": "border border-primary/40 bg-primary/5 text-primary backdrop-blur-xl hover:bg-primary/15 hover:border-primary/60 transition-all duration-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
