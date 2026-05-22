import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';

import { api } from '@shared/api/client';
import { useAddSeRuleMutation, useDeleteSeRuleMutation, useSeDictionary } from '@shared/api/side-effects';

type SeDictionaryItem = {
	id: string;
	uku_code: string;
	name_ru: string;
	name_en: string;
	body_system: string | null;
};

type SeRuleRecord = {
	id: string;
	se_id: string;
	se: SeDictionaryItem;
	frequency_days: number | null;
};

type Props = {
	patientId: string;
	onClose: () => void;
};

export const SEMonitoringModal: React.FC<Props> = props => {
	const [searchQ, setSearchQ] = useState('');
	const [selectedSeId, setSelectedSeId] = useState('');
	const [frequencyDays, setFrequencyDays] = useState('');

	const dictQuery = useSeDictionary(searchQ);
	const dictItems = ((dictQuery.data as { items?: SeDictionaryItem[] })?.items ?? []) as SeDictionaryItem[];

	const rulesQuery = useQuery({
		queryKey: ['se', 'rules', props.patientId],
		queryFn: () =>
			api.get(
				'/api/v1/doctor/patients/{patient_id}/se-rules' as never,
				{
					params: { path: { patient_id: props.patientId } },
				} as never
			),
	});
	const rules = (rulesQuery.data ?? []) as unknown as SeRuleRecord[];

	const addMutation = useAddSeRuleMutation(props.patientId);
	const deleteMutation = useDeleteSeRuleMutation(props.patientId);

	const handleAdd = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedSeId) return;
		addMutation.mutate(
			{
				se_id: selectedSeId,
				frequency_days: frequencyDays ? parseInt(frequencyDays, 10) : null,
			},
			{
				onSuccess: () => {
					setSelectedSeId('');
					setSearchQ('');
					setFrequencyDays('');
					rulesQuery.refetch();
				},
			}
		);
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
			<div className='bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4'>
				<div className='flex justify-between items-center'>
					<h2 className='font-semibold'>Мониторинг побочных эффектов</h2>
					<button className='text-sm text-muted-foreground hover:text-foreground' onClick={props.onClose}>
						✕
					</button>
				</div>

				<div>
					<h3 className='text-xs font-medium text-muted-foreground mb-2'>Активные правила</h3>
					{rules.length === 0 && <p className='text-xs text-muted-foreground'>Правила мониторинга не назначены.</p>}
					{rules.map(rule => (
						<div
							key={rule.id}
							className='flex justify-between items-center py-1.5 border-t border-border first:border-0 text-sm'
						>
							<span>
								{rule.se.name_ru}
								{rule.frequency_days && (
									<span className='text-xs text-muted-foreground ml-2'>каждые {rule.frequency_days} д.</span>
								)}
							</span>
							<button
								className='text-xs text-red-500 hover:underline disabled:opacity-40'
								disabled={deleteMutation.isPending}
								onClick={() => deleteMutation.mutate(rule.id, { onSuccess: () => rulesQuery.refetch() })}
							>
								Удалить
							</button>
						</div>
					))}
				</div>

				<form onSubmit={handleAdd} className='space-y-3 border-t border-border pt-3'>
					<h3 className='text-xs font-medium text-muted-foreground'>Добавить правило</h3>

					<div>
						<input
							type='text'
							placeholder='Поиск побочного эффекта…'
							className='w-full border border-border rounded px-2 py-1 text-sm'
							value={searchQ}
							onChange={e => setSearchQ(e.target.value)}
						/>
						{dictItems.length > 0 && (
							<ul className='border border-border rounded mt-1 max-h-36 overflow-y-auto text-sm'>
								{dictItems.map(item => (
									<li
										key={item.id}
										className={`px-2 py-1 cursor-pointer hover:bg-accent ${selectedSeId === item.id ? 'bg-accent font-medium' : ''}`}
										onClick={() => {
											setSelectedSeId(item.id);
											setSearchQ(item.name_ru);
										}}
									>
										{item.uku_code} — {item.name_ru}
									</li>
								))}
							</ul>
						)}
					</div>

					<div className='flex gap-2 items-center'>
						<input
							type='number'
							min={1}
							placeholder='Период (дней)'
							className='border border-border rounded px-2 py-1 text-sm w-36'
							value={frequencyDays}
							onChange={e => setFrequencyDays(e.target.value)}
						/>
						<button
							type='submit'
							disabled={addMutation.isPending || !selectedSeId}
							className='text-xs bg-primary text-primary-foreground rounded px-3 py-1.5 disabled:opacity-40'
						>
							{addMutation.isPending ? 'Добавление…' : 'Добавить'}
						</button>
					</div>
				</form>

				<div className='flex justify-end'>
					<button className='text-sm text-muted-foreground hover:underline' onClick={props.onClose}>
						Закрыть
					</button>
				</div>
			</div>
		</div>
	);
};
