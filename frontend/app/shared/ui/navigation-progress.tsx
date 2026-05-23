import { useEffect, useState } from 'react';
import { useNavigation } from 'react-router';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const SHOW_DELAY_MS = 120;
const COMPLETE_DELAY_MS = 180;

export function NavigationProgress() {
	const navigation = useNavigation();
	const isPending = navigation.state !== 'idle';
	const [isVisible, setIsVisible] = useState(false);
	const [value, setValue] = useState(0);

	useEffect(() => {
		let showTimer: ReturnType<typeof setTimeout> | undefined;
		let settleTimer: ReturnType<typeof setTimeout> | undefined;

		if (isPending) {
			setValue(navigation.state === 'submitting' ? 42 : 64);
			showTimer = setTimeout(() => {
				setIsVisible(true);
				setValue(navigation.state === 'submitting' ? 58 : 78);
			}, SHOW_DELAY_MS);
		} else if (isVisible) {
			setValue(100);
			settleTimer = setTimeout(() => {
				setIsVisible(false);
				setValue(0);
			}, COMPLETE_DELAY_MS);
		}

		return () => {
			if (showTimer) {
				clearTimeout(showTimer);
			}
			if (settleTimer) {
				clearTimeout(settleTimer);
			}
		};
	}, [isPending, isVisible, navigation.state]);

	return (
		<div
			className={cn(
				'pointer-events-none fixed inset-x-0 top-0 z-[70] h-1 opacity-0 transition-opacity duration-150',
				isVisible && 'opacity-100'
			)}
			aria-hidden={!isVisible}
		>
			<Progress
				value={value}
				aria-label='Navigation loading progress'
				className='navigation-progress h-1 rounded-none bg-transparent'
			/>
		</div>
	);
}
