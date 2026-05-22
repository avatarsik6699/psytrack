import { useState } from 'react';

import {
	useCreateGoalMutation,
	useTherapyGoals,
	useToggleGoalMutation,
} from '@shared/api/therapy-goals';

interface Props {
	patientId: string;
}

export function TherapyGoals({ patientId }: Props) {
	const { data: goals = [], isLoading } = useTherapyGoals(patientId);
	const createMutation = useCreateGoalMutation(patientId);
	const toggleMutation = useToggleGoalMutation(patientId);
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

	if (isLoading) return <p className='text-xs text-muted-foreground'>Loading…</p>;

	return (
		<div>
			{total > 0 && (
				<div className='mb-3'>
					<div className='flex justify-between text-xs text-muted-foreground mb-1'>
						<span>Progress</span>
						<span>{completed}/{total} complete</span>
					</div>
					<div className='w-full bg-gray-100 rounded-full h-2'>
						<div
							className='bg-teal-500 h-2 rounded-full transition-all'
							style={{ width: `${pct}%` }}
						/>
					</div>
				</div>
			)}

			<ul className='space-y-2'>
				{goals.map(g => (
					<li key={g.id} className='flex items-start gap-2'>
						<input
							type='checkbox'
							checked={g.is_completed}
							onChange={e =>
								toggleMutation.mutate({ goalId: g.id, isCompleted: e.target.checked })
							}
							className='mt-0.5 accent-teal-500 cursor-pointer'
						/>
						<span
							className={`text-sm ${g.is_completed ? 'line-through text-muted-foreground' : 'text-gray-800'}`}
						>
							{g.description}
						</span>
					</li>
				))}
			</ul>

			{adding ? (
				<form onSubmit={handleAdd} className='mt-3 flex gap-2'>
					<input
						autoFocus
						type='text'
						value={newDesc}
						onChange={e => setNewDesc(e.target.value)}
						placeholder='New goal…'
						className='flex-1 border border-border rounded px-2 py-1 text-xs'
					/>
					<button
						type='button'
						onClick={() => setAdding(false)}
						className='text-xs text-muted-foreground hover:text-gray-700'
					>
						Cancel
					</button>
					<button
						type='submit'
						disabled={createMutation.isPending}
						className='text-xs text-teal-600 font-medium disabled:opacity-50'
					>
						Add
					</button>
				</form>
			) : (
				<button
					className='mt-3 text-xs text-primary hover:underline'
					onClick={() => setAdding(true)}
				>
					+ Add goal
				</button>
			)}
		</div>
	);
}
