import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
	React.ElementRef<typeof SliderPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
	<SliderPrimitive.Root
		ref={ref}
		className={cn("relative flex h-5 w-full touch-none select-none items-center", className)}
		{...props}
	>
		<SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-foreground/12">
			<SliderPrimitive.Range className="absolute h-full bg-brand" />
		</SliderPrimitive.Track>
		<SliderPrimitive.Thumb className="block size-4 rounded-full border border-brand/70 bg-surface-raised shadow-[0_1px_4px_hsl(var(--shadow-color)/0.22)] transition-[transform,box-shadow] duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/35 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45" />
	</SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
