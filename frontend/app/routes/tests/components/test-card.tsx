import { ClipboardList } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router';

import type { components } from '@shared/types/schema';

type PatientScaleOut = components['schemas']['PatientScaleOut'];

type Props = {
	scale: PatientScaleOut;
	isPending: boolean;
};

export const TestCard: React.FC<Props> = props => {
	return (
		<div className='bg-white border border-border rounded-lg p-4 flex items-center gap-4'>
			<div className='shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center'>
				<ClipboardList size={18} className='text-amber-600' />
			</div>
			<div className='flex-1 min-w-0'>
				<div className='flex items-center gap-2'>
					<span className='font-medium text-sm'>{props.scale.scale?.name ?? props.scale.scale_id}</span>
					{props.isPending && (
						<span className='text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700'>
							Ожидает
						</span>
					)}
				</div>
				{props.scale.scale?.code && (
					<p className='text-xs text-muted-foreground mt-0.5'>
						{props.scale.scale.code} · Каждые {props.scale.frequency_days} дн.
					</p>
				)}
			</div>
			<Link
				to={`/assessment/${props.scale.id}`}
				className='shrink-0 px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity'
			>
				Пройти
			</Link>
		</div>
	);
};
