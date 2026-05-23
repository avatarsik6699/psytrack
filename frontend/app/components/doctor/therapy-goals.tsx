import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCreateGoalMutation, useTherapyGoals, useToggleGoalMutation } from '@shared/api/therapy-goals';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
	patientId: string;
};

export const TherapyGoals: React.FC<Props> = props => {
	const { t } = useTranslation('common');
	const goalsQuery = useTherapyGoals(props.patientId);
	const goals = goalsQuery.data ?? [];
	const createMutation = useCreateGoalMutation(props.patientId);
	const toggleMutation = useToggleGoalMutation(props.patientId);
	const [newDesc, setNewDesc] = useState('');
	const [adding, setAdding] = useState(false);

	const completed = goals.filter(g => g.is_completed).length;
	const total = goals.length;
	const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

	const handleAdd = (e: React.FormEvent) => {
		e.preventDefault();
		if (!newDesc.trim()) return;
		createMutation.mutate(newDesc.trim(), {
			onSuccess: () => {
				setNewDesc('');
				setAdding(false);
			},
		});
	};

	if (goalsQuery.isLoading) return <p className='text-xs text-muted-foreground'>{t('loading')}</p>;

	return (
		<div>
			{total > 0 && (
				<div className='mb-3'>
					<div className='flex justify-between text-xs text-muted-foreground mb-1'>
						<span>{t('therapyGoal.progress')}</span>
						<span>{t('therapyGoal.complete', { completed, total })}</span>
					</div>
					<div className='w-full bg-muted rounded-full h-2'>
						<div className='bg-docassist-primary h-2 rounded-full transition-all' style={{ width: `${pct}%` }} />
					</div>
				</div>
			)}

			<ul className='space-y-2'>
				{goals.map(g => (
					<li key={g.id} className='flex items-start gap-2'>
						<input
							type='checkbox'
							checked={g.is_completed}
							onChange={e => toggleMutation.mutate({ goalId: g.id, isCompleted: e.target.checked })}
							className='mt-0.5 accent-docassist-primary cursor-pointer'
						/>
						<span className={`text-sm ${g.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
							{g.description}
						</span>
					</li>
				))}
			</ul>

			{adding ? (
				<form onSubmit={handleAdd} className='mt-3 flex gap-2'>
					<Input
						autoFocus
						type='text'
						value={newDesc}
						onChange={e => setNewDesc(e.target.value)}
						placeholder={t('therapyGoal.newGoalPlaceholder')}
						className='flex-1 h-7 text-xs'
					/>
					<Button type='button' variant='ghost' size='sm' onClick={() => setAdding(false)}>
						{t('therapyGoal.cancel')}
					</Button>
					<Button type='submit' size='sm' disabled={createMutation.isPending}>
						{t('therapyGoal.add')}
					</Button>
				</form>
			) : (
				<Button
					type='button'
					variant='link'
					size='sm'
					className='mt-3 px-0 text-xs h-auto'
					onClick={() => setAdding(true)}
				>
					{t('therapyGoal.addGoal')}
				</Button>
			)}
		</div>
	);
};
