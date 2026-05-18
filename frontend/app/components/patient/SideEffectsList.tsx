import { useState } from 'react';

import { useDeleteSideEffectMutation, useMySideEffects } from '@shared/api/side-effects';

import { SideEffectForm } from './SideEffectForm';

interface SeDictionaryItem {
	id: string;
	uku_code: string;
	name_ru: string;
	name_en: string;
	body_system: string | null;
	severity_min: number;
	severity_max: number;
}

interface SideEffectRecord {
	id: string;
	se_id: string;
	se: SeDictionaryItem;
	severity: number | null;
	resolved: boolean;
	notes: string | null;
	started_at: string | null;
	created_at: string;
}

const SEVERITY_LABELS: Record<number, string> = {
	0: 'Нет',
	1: 'Лёгкая',
	2: 'Умеренная',
	3: 'Тяжёлая',
	4: 'Очень тяжёлая',
};

export function SideEffectsList() {
	const { data, isLoading } = useMySideEffects();
	const deleteMutation = useDeleteSideEffectMutation();
	const [editing, setEditing] = useState<string | null>(null);
	const [adding, setAdding] = useState(false);

	const records = (data ?? []) as SideEffectRecord[];

	if (isLoading) return <p className='text-xs text-muted-foreground'>Загрузка…</p>;

	return (
		<div className='space-y-2'>
			<div className='flex justify-between items-center'>
				<h2 className='font-semibold text-sm'>Побочные эффекты</h2>
				<button className='text-xs text-primary hover:underline' onClick={() => setAdding(v => !v)}>
					{adding ? 'Отмена' : '+ Добавить'}
				</button>
			</div>

			{adding && (
				<SideEffectForm
					onSuccess={() => setAdding(false)}
					onCancel={() => setAdding(false)}
				/>
			)}

			{records.length === 0 && !adding && (
				<p className='text-xs text-muted-foreground'>Побочные эффекты не зарегистрированы.</p>
			)}

			{records.map(r => (
				<div key={r.id} className='border border-border rounded p-3 text-sm space-y-1'>
					{editing === r.id ? (
						<SideEffectForm
							record={r}
							onSuccess={() => setEditing(null)}
							onCancel={() => setEditing(null)}
						/>
					) : (
						<>
							<div className='flex justify-between items-start'>
								<span className='font-medium'>{r.se.name_ru}</span>
								<div className='flex gap-2'>
									<button
										className='text-xs text-primary hover:underline'
										onClick={() => setEditing(r.id)}
									>
										Изменить
									</button>
									<button
										className='text-xs text-red-500 hover:underline disabled:opacity-40'
										disabled={deleteMutation.isPending}
										onClick={() => {
											if (window.confirm('Удалить запись о побочном эффекте?')) {
												deleteMutation.mutate(r.id);
											}
										}}
									>
										Удалить
									</button>
								</div>
							</div>
							{r.severity !== null && (
								<p className='text-xs text-muted-foreground'>
									Выраженность: {SEVERITY_LABELS[r.severity] ?? r.severity}
								</p>
							)}
							{r.notes && <p className='text-xs text-muted-foreground'>Заметки: {r.notes}</p>}
							{r.resolved && (
								<span className='text-xs bg-green-100 text-green-700 rounded px-1'>Разрешён</span>
							)}
						</>
					)}
				</div>
			))}
		</div>
	);
}
