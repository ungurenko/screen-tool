import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] text-sm font-medium tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow,transform] duration-150 [transition-timing-function:var(--ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"border border-brand/80 bg-brand text-white shadow-[0_1px_2px_hsl(var(--shadow-color)/0.12),0_5px_14px_hsl(var(--accent)/0.18)] hover:border-brand-hover hover:bg-brand-hover",
				destructive:
					"border border-recording/80 bg-recording text-white shadow-[0_1px_2px_hsl(var(--shadow-color)/0.12)] hover:border-recording-hover hover:bg-recording-hover",
				outline:
					"border border-border bg-surface-raised text-foreground shadow-[0_1px_2px_hsl(var(--shadow-color)/0.05)] hover:border-[hsl(var(--border-strong))] hover:bg-surface-control",
				secondary:
					"border border-transparent bg-surface-control text-foreground hover:bg-surface-control-hover",
				ghost: "text-foreground/80 hover:bg-surface-control hover:text-foreground",
				link: "text-brand underline-offset-4 hover:text-brand-hover hover:underline",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 px-3 text-xs",
				lg: "h-10 px-5 text-sm",
				icon: "h-9 w-9 p-0",
			},
			// Special variant for icon buttons with consistent sizing
			iconSize: {
				default: "[&_svg]:size-4",
				sm: "[&_svg]:size-3.5",
				lg: "[&_svg]:size-5",
				xl: "[&_svg]:size-6",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
			iconSize: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	/** Whether to render the button as a child component (useful for composition) */
	asChild?: boolean;
	/** Size of the icon inside the button */
	iconSize?: "default" | "sm" | "lg" | "xl";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, iconSize, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, iconSize, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
