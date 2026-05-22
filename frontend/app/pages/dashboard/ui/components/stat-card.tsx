import React from 'react';
import { Link } from 'react-router';

type Props = {
	icon: React.ReactNode;
	iconBg: string;
	count: number | string;
	countLabel: string;
	title: string;
	subtitle: string;
	badge?: string;
	to: string;
};

export const StatCard: React.FC<Props> = props => {
	return (
		<Link
			to={props.to}
			className='relative flex flex-col gap-2 p-4 rounded-xl border border-border bg-white hover:shadow-md transition-shadow'
		>
			{props.badge && (
				<span className='absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white'>
					{props.badge}
				</span>
			)}
			<div className={`w-9 h-9 rounded-lg flex items-center justify-center ${props.iconBg}`}>{props.icon}</div>
			<div>
				<p className='text-2xl font-bold leading-none'>{props.count}</p>
				<p className='text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5'>{props.countLabel}</p>
			</div>
			<p className='text-sm font-medium'>{props.title}</p>
			<p className='text-xs text-muted-foreground'>{props.subtitle}</p>
		</Link>
	);
};
