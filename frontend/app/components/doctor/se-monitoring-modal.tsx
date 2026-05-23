import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '@shared/api/client';
import { useAddSeRuleMutation, useDeleteSeRuleMutation, useSeDictionary } from '@shared/api/side-effects';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

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
	const { t } = useTranslation('common');
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
					void rulesQuery.refetch();
				},
			}
		);
	};

	return (
		<Dialog open onOpenChange={open => { if (!open) props.onClose(); }}>
			<DialogContent className='max-w-md space-y-4'>
				<DialogHeader>
					<DialogTitle>{t('seMonitoring.title')}</DialogTitle>
				</DialogHeader>

				<div>
					<h3 className='text-xs font-medium text-muted-foreground mb-2'>{t('seMonitoring.activeRules')}</h3>
					{rules.length === 0 && <p className='text-xs text-muted-foreground'>{t('seMonitoring.noRules')}</p>}
					{rules.map(rule => (
						<div
							key={rule.id}
							className='flex justify-between items-center py-1.5 border-t border-border first:border-0 text-sm'
						>
							<span>
								{rule.se.name_ru}
								{rule.frequency_days && (
									<span className='text-xs text-muted-foreground ml-2'>
										{t('seMonitoring.everyDays', { days: rule.frequency_days })}
									</span>
								)}
							</span>
							<Button
								variant='ghost'
								size='xs'
								className='text-destructive hover:text-destructive'
								disabled={deleteMutation.isPending}
								onClick={() => deleteMutation.mutate(rule.id, { onSuccess: () => void rulesQuery.refetch() })}
							>
								{t('seMonitoring.delete')}
							</Button>
						</div>
					))}
				</div>

				<form onSubmit={handleAdd} className='space-y-3 border-t border-border pt-3'>
					<h3 className='text-xs font-medium text-muted-foreground'>{t('seMonitoring.addRule')}</h3>

					<div className='relative'>
						<Input
							type='text'
							placeholder={t('seMonitoring.searchPlaceholder')}
							value={searchQ}
							onChange={e => setSearchQ(e.target.value)}
						/>
						{dictItems.length > 0 && (
							<ul className='absolute z-10 w-full border border-border rounded-lg mt-1 max-h-36 overflow-y-auto bg-popover text-popover-foreground text-sm shadow-sm'>
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
						<Input
							type='number'
							min={1}
							placeholder={t('seMonitoring.periodPlaceholder')}
							className='w-36'
							value={frequencyDays}
							onChange={e => setFrequencyDays(e.target.value)}
						/>
						<Button type='submit' size='sm' disabled={addMutation.isPending || !selectedSeId}>
							{addMutation.isPending ? t('seMonitoring.adding') : t('seMonitoring.add')}
						</Button>
					</div>
				</form>

				<div className='flex justify-end'>
					<Button variant='ghost' size='sm' onClick={props.onClose}>
						{t('seMonitoring.close')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
