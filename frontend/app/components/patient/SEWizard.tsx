import { useState } from 'react';
import { X } from 'lucide-react';

import { useSeDictionary, useReportSideEffectMutation } from '@shared/api/side-effects';

import type { components } from '@shared/types/schema';

type SeDictionaryOut = components['schemas']['SeDictionaryOut'];

const BODY_SYSTEMS = [
	{ key: '', label: 'Все' },
	{ key: 'Психические', label: 'Психические' },
	{ key: 'ЦНС', label: 'ЦНС' },
	{ key: 'Вегетативные', label: 'Вегетативные' },
	{ key: 'ЖКТ', label: 'ЖКТ' },
	{ key: 'Кожные', label: 'Кожные' },
	{ key: 'Другое', label: 'Другое' },
];

const SEVERITY_LABELS: Record<number, string> = {
	0: 'Нет',
	1: 'Лёгкая',
	2: 'Умеренная',
	3: 'Тяжёлая',
	4: 'Очень тяжёлая',
};

interface WizardState {
	selectedSe: SeDictionaryOut | null;
	severity: number | null;
	duration: 'lt_24h' | 'gte_24h' | null;
	startedAt: string;
}

interface Props {
	onClose: () => void;
	onSuccess: () => void;
}

export function SEWizard({ onClose, onSuccess }: Props) {
	const [step, setStep] = useState(1);
	const [bodySystem, setBodySystem] = useState('');
	const [state, setState] = useState<WizardState>({
		selectedSe: null,
		severity: null,
		duration: null,
		startedAt: new Date().toISOString().slice(0, 10),
	});

	const { data: dictPage } = useSeDictionary('', bodySystem || undefined);
	const items: SeDictionaryOut[] = dictPage?.items ?? [];

	const reportMutation = useReportSideEffectMutation();

	const TOTAL = 4;

	const handleSubmit = () => {
		if (!state.selectedSe || state.severity === null) return;
		reportMutation.mutate(
			{
				se_id: state.selectedSe.id,
				severity: state.severity,
				date_precision: state.duration === 'lt_24h' ? 'lt_24h' : 'exact',
				duration_label: state.duration === 'lt_24h' ? 'Менее 24 часов' : '24 часа и более',
				started_at: state.startedAt ? `${state.startedAt}T00:00:00Z` : null,
			},
			{ onSuccess }
		);
	};

	return (
		<div className='fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto'>
			<div className='bg-white rounded-xl w-full max-w-lg mt-8 mb-8 shadow-xl'>
				{/* Header */}
				<div className='flex items-center justify-between px-5 pt-5 pb-3 border-b border-border'>
					<div>
						<button
							onClick={step > 1 ? () => setStep(s => s - 1) : onClose}
							className='text-xs text-primary hover:underline mr-3'
						>
							← Назад
						</button>
						<span className='font-medium text-sm'>Добавить побочный эффект</span>
					</div>
					<div className='flex items-center gap-3'>
						<span className='text-xs text-muted-foreground'>
							{step === 1 ? 'Выбор симптома' : step === 2 ? 'Тяжесть' : step === 3 ? 'Длительность' : 'Подтверждение'}
						</span>
						<button onClick={onClose} className='text-muted-foreground hover:text-foreground'>
							<X size={16} />
						</button>
					</div>
				</div>

				{/* Progress bar */}
				<div className='h-1 bg-muted'>
					<div
						className='h-1 bg-primary transition-all'
						style={{ width: `${(step / TOTAL) * 100}%` }}
					/>
				</div>

				<div className='p-5 space-y-4'>
					{/* Step 1: Symptom selection */}
					{step === 1 && (
						<>
							<h2 className='font-semibold'>Что вас беспокоит?</h2>
							<div className='flex flex-wrap gap-2'>
								{BODY_SYSTEMS.map(bs => (
									<button
										key={bs.key}
										onClick={() => setBodySystem(bs.key)}
										className={`px-3 py-1 rounded-full text-xs border transition-colors ${
											bodySystem === bs.key
												? 'bg-docassist-accent-subtle border-docassist-accent text-docassist-accent'
												: 'border-border text-muted-foreground hover:bg-muted'
										}`}
									>
										{bs.label}
									</button>
								))}
							</div>
							<div className='grid grid-cols-2 gap-2 max-h-64 overflow-y-auto'>
								{items.map(se => (
									<button
										key={se.id}
										onClick={() => {
											setState(s => ({ ...s, selectedSe: se }));
											setStep(2);
										}}
										className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
											state.selectedSe?.id === se.id
												? 'border-primary bg-docassist-primary-subtle text-primary'
												: 'border-border hover:bg-muted'
										}`}
									>
										{se.name_ru}
									</button>
								))}
								{items.length === 0 && (
									<p className='col-span-2 text-xs text-muted-foreground'>Нет симптомов</p>
								)}
							</div>
						</>
					)}

					{/* Step 2: Severity */}
					{step === 2 && (
						<>
							<h2 className='font-semibold'>Насколько тяжело?</h2>
							{state.selectedSe && (
								<p className='text-xs text-muted-foreground'>{state.selectedSe.name_ru}</p>
							)}
							<div className='space-y-2'>
								{[0, 1, 2, 3, 4].map(v => (
									<button
										key={v}
										onClick={() => setState(s => ({ ...s, severity: v }))}
										className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors ${
											state.severity === v
												? 'border-amber-400 bg-amber-50 text-amber-700'
												: 'border-border hover:bg-muted'
										}`}
									>
										<span className='font-medium w-4'>{v}</span>
										<span>{SEVERITY_LABELS[v]}</span>
									</button>
								))}
							</div>
							<button
								disabled={state.severity === null}
								onClick={() => setStep(3)}
								className='w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40'
							>
								Далее →
							</button>
						</>
					)}

					{/* Step 3: Duration */}
					{step === 3 && (
						<>
							<h2 className='font-semibold'>Как давно это началось?</h2>
							{state.selectedSe && (
								<p className='text-xs text-muted-foreground'>{state.selectedSe.name_ru}</p>
							)}
							<div className='space-y-2'>
								{(['lt_24h', 'gte_24h'] as const).map(d => (
									<button
										key={d}
										onClick={() => setState(s => ({ ...s, duration: d }))}
										className={`w-full px-4 py-3 rounded-lg border text-sm text-left transition-colors ${
											state.duration === d
												? 'border-docassist-accent bg-docassist-accent-subtle text-docassist-accent'
												: 'border-border hover:bg-muted'
										}`}
									>
										{d === 'lt_24h' ? 'Менее 24 часов' : '24 часа и более'}
									</button>
								))}
							</div>
							<div>
								<label className='text-xs text-muted-foreground block mb-1'>Дата начала</label>
								<input
									type='date'
									value={state.startedAt}
									onChange={e => setState(s => ({ ...s, startedAt: e.target.value }))}
									className='w-full border border-input rounded-md px-3 py-2 text-sm'
								/>
							</div>
							<button
								disabled={state.duration === null}
								onClick={() => setStep(4)}
								className='w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40'
							>
								Далее →
							</button>
						</>
					)}

					{/* Step 4: Confirmation */}
					{step === 4 && (
						<>
							<h2 className='font-semibold'>Подтверждение</h2>
							<div className='border border-border rounded-lg divide-y divide-border'>
								{[
									['Симптом', state.selectedSe?.name_ru ?? '—'],
									['Категория', state.selectedSe?.body_system ?? '—'],
									['Тяжесть', state.severity !== null ? `UKU ${state.severity} — ${SEVERITY_LABELS[state.severity]}` : '—'],
									['Начало', state.startedAt || '—'],
									['Длительность', state.duration === 'lt_24h' ? 'Менее 24 часов' : '24 часа и более'],
								].map(([label, value]) => (
									<div key={label} className='flex justify-between px-4 py-2.5 text-sm'>
										<span className='text-muted-foreground'>{label}</span>
										<span className='font-medium'>{value}</span>
									</div>
								))}
							</div>
							<button
								disabled={reportMutation.isPending}
								onClick={handleSubmit}
								className='w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40'
							>
								{reportMutation.isPending ? 'Сохранение…' : 'Сохранить'}
							</button>
							{reportMutation.isError && (
								<p className='text-xs text-red-500'>Ошибка. Попробуйте снова.</p>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
