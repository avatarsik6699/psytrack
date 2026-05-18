import { useState } from 'react';

import { useReportSideEffectMutation, useSeDictionary, useUpdateSideEffectMutation } from '@shared/api/side-effects';

interface SeDictionaryItem {
	id: string;
	name_ru: string;
	name_en: string;
	uku_code: string;
	body_system: string | null;
	severity_min: number;
	severity_max: number;
}

interface SideEffectRecord {
	id: string;
	se_id: string;
	se: SeDictionaryItem;
	severity: number | null;
	notes: string | null;
	resolved: boolean;
}

interface Props {
	record?: SideEffectRecord;
	onSuccess: () => void;
	onCancel: () => void;
}

export function SideEffectForm({ record, onSuccess, onCancel }: Props) {
	const isEdit = !!record;
	const [searchQ, setSearchQ] = useState('');
	const [selectedSeId, setSelectedSeId] = useState(record?.se_id ?? '');
	const [severity, setSeverity] = useState<string>(record?.severity?.toString() ?? '');
	const [notes, setNotes] = useState(record?.notes ?? '');
	const [resolved, setResolved] = useState(record?.resolved ?? false);

	const { data: dictPage } = useSeDictionary(searchQ);
	const dictItems = ((dictPage as { items?: SeDictionaryItem[] })?.items ?? []) as SeDictionaryItem[];

	const reportMutation = useReportSideEffectMutation();
	const updateMutation = useUpdateSideEffectMutation(record?.id ?? '');

	const isPending = reportMutation.isPending || updateMutation.isPending;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const sevNum = severity !== '' ? parseInt(severity, 10) : null;

		if (isEdit) {
			updateMutation.mutate(
				{ severity: sevNum ?? undefined, notes: notes || null, resolved },
				{ onSuccess },
			);
		} else {
			if (!selectedSeId) return;
			reportMutation.mutate(
				{ se_id: selectedSeId, severity: sevNum ?? undefined, notes: notes || null },
				{ onSuccess },
			);
		}
	};

	return (
		<form onSubmit={handleSubmit} className='space-y-3 py-2'>
			{!isEdit && (
				<div>
					<label className='text-xs font-medium block mb-1'>Побочный эффект</label>
					<input
						type='text'
						placeholder='Поиск по названию…'
						className='w-full border border-border rounded px-2 py-1 text-sm'
						value={searchQ}
						onChange={e => setSearchQ(e.target.value)}
					/>
					{dictItems.length > 0 && (
						<ul className='border border-border rounded mt-1 max-h-40 overflow-y-auto text-sm'>
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
			)}

			<div>
				<label className='text-xs font-medium block mb-1'>Выраженность (0–3)</label>
				<select
					className='w-full border border-border rounded px-2 py-1 text-sm'
					value={severity}
					onChange={e => setSeverity(e.target.value)}
				>
					<option value=''>— не указана —</option>
					<option value='0'>0 — Нет</option>
					<option value='1'>1 — Лёгкая</option>
					<option value='2'>2 — Умеренная</option>
					<option value='3'>3 — Тяжёлая</option>
				</select>
			</div>

			<div>
				<label className='text-xs font-medium block mb-1'>Заметки</label>
				<textarea
					className='w-full border border-border rounded px-2 py-1 text-sm'
					rows={2}
					value={notes}
					onChange={e => setNotes(e.target.value)}
				/>
			</div>

			{isEdit && (
				<label className='flex items-center gap-2 text-sm cursor-pointer'>
					<input
						type='checkbox'
						checked={resolved}
						onChange={e => setResolved(e.target.checked)}
					/>
					Отмечено как разрешённое
				</label>
			)}

			<div className='flex gap-2'>
				<button
					type='submit'
					disabled={isPending || (!isEdit && !selectedSeId)}
					className='text-xs bg-primary text-primary-foreground rounded px-3 py-1 disabled:opacity-40'
				>
					{isPending ? 'Сохранение…' : isEdit ? 'Сохранить' : 'Добавить'}
				</button>
				<button type='button' className='text-xs hover:underline' onClick={onCancel}>
					Отмена
				</button>
			</div>
		</form>
	);
}
