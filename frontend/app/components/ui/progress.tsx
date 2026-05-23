import { Progress as ProgressPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Progress({
	className,
	value = 0,
	...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
	value?: number;
}) {
	const safeValue = Math.max(0, Math.min(100, value));

	return (
		<ProgressPrimitive.Root
			data-slot='progress'
			className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/15', className)}
			value={safeValue}
			{...props}
		>
			<ProgressPrimitive.Indicator
				data-slot='progress-indicator'
				className='h-full w-full flex-1 rounded-full bg-primary transition-transform duration-300 ease-out'
				style={{ transform: `translateX(-${100 - safeValue}%)` }}
			/>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
