import { X } from 'lucide-react';
import React from 'react';

import { BODY_SYSTEMS, SEVERITY_LABELS } from './constants/body-systems';
import { useSEWizard } from './hooks/use-se-wizard';

type Props = {
	onClose: () => void;
	onSuccess: () => void;
};

export const SEWizard: React.FC<Props> = props => {
	const wizard = useSEWizard({ onSuccess: props.onSuccess });

	const stepLabel =
		wizard.step === 1
			? 'Выбор симптома'
			: wizard.step === 2
				? 'Тяжесть'
				: wizard.step === 3
					? 'Длительность'
					: 'Подтверждение';

	return (
		<div className='fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto'>
			<div className='bg-card text-card-foreground rounded-xl w-full max-w-lg mt-8 mb-8 shadow-xl'>
				{/* Header */}
				<div className='flex items-center justify-between px-5 pt-5 pb-3 border-b border-border'>
					<div>
						<button
							onClick={wizard.step > 1 ? wizard.goBack : props.onClose}
							className='text-xs text-primary hover:underline mr-3'
						>
							← Назад
						</button>
						<span className='font-medium text-sm'>Добавить побочный эффект</span>
					</div>
					<div className='flex items-center gap-3'>
						<span className='text-xs text-muted-foreground'>{stepLabel}</span>
						<button onClick={props.onClose} className='text-muted-foreground hover:text-foreground'>
							<X size={16} />
						</button>
					</div>
				</div>

				{/* Progress bar */}
				<div className='h-1 bg-muted'>
					<div
						className='h-1 bg-primary transition-all'
						style={{ width: `${(wizard.step / wizard.totalSteps) * 100}%` }}
					/>
				</div>

				<div className='p-5 space-y-4'>
					{/* Step 1: Symptom selection */}
					{wizard.step === 1 && (
						<>
							<h2 className='font-semibold'>Что вас беспокоит?</h2>
							<div className='flex flex-wrap gap-2'>
								{BODY_SYSTEMS.map(bs => (
									<button
										key={bs.key}
										onClick={() => wizard.setBodySystem(bs.key)}
										className={`px-3 py-1 rounded-full text-xs border transition-colors ${
											wizard.bodySystem === bs.key
												? 'bg-docassist-accent-subtle border-docassist-accent text-docassist-accent'
												: 'border-border text-muted-foreground hover:bg-muted'
										}`}
									>
										{bs.label}
									</button>
								))}
							</div>
							<div className='grid grid-cols-2 gap-2 max-h-64 overflow-y-auto'>
								{wizard.items.map(se => (
									<button
										key={se.id}
										onClick={() => wizard.selectSymptom(se)}
										className={`text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
											wizard.state.selectedSe?.id === se.id
												? 'border-primary bg-docassist-primary-subtle text-primary'
												: 'border-border hover:bg-muted'
										}`}
									>
										{se.name_ru}
									</button>
								))}
								{wizard.items.length === 0 && <p className='col-span-2 text-xs text-muted-foreground'>Нет симптомов</p>}
							</div>
						</>
					)}

					{/* Step 2: Severity */}
					{wizard.step === 2 && (
						<>
							<h2 className='font-semibold'>Насколько тяжело?</h2>
							{wizard.state.selectedSe && (
								<p className='text-xs text-muted-foreground'>{wizard.state.selectedSe.name_ru}</p>
							)}
							<div className='space-y-2'>
								{[0, 1, 2, 3, 4].map(v => (
									<button
										key={v}
										onClick={() => wizard.selectSeverity(v)}
										className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors ${
											wizard.state.severity === v
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
								disabled={wizard.state.severity === null}
								onClick={wizard.goNext}
								className='w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40'
							>
								Далее →
							</button>
						</>
					)}

					{/* Step 3: Duration */}
					{wizard.step === 3 && (
						<>
							<h2 className='font-semibold'>Как давно это началось?</h2>
							{wizard.state.selectedSe && (
								<p className='text-xs text-muted-foreground'>{wizard.state.selectedSe.name_ru}</p>
							)}
							<div className='space-y-2'>
								{(['lt_24h', 'gte_24h'] as const).map(d => (
									<button
										key={d}
										onClick={() => wizard.selectDuration(d)}
										className={`w-full px-4 py-3 rounded-lg border text-sm text-left transition-colors ${
											wizard.state.duration === d
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
									value={wizard.state.startedAt}
									onChange={e => wizard.setStartedAt(e.target.value)}
									className='w-full border border-input rounded-md px-3 py-2 text-sm'
								/>
							</div>
							<button
								disabled={wizard.state.duration === null}
								onClick={wizard.goNext}
								className='w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40'
							>
								Далее →
							</button>
						</>
					)}

					{/* Step 4: Confirmation */}
					{wizard.step === 4 && (
						<>
							<h2 className='font-semibold'>Подтверждение</h2>
							<div className='border border-border rounded-lg divide-y divide-border'>
								{[
									['Симптом', wizard.state.selectedSe?.name_ru ?? '—'],
									['Категория', wizard.state.selectedSe?.body_system ?? '—'],
									[
										'Тяжесть',
										wizard.state.severity !== null
											? `UKU ${wizard.state.severity} — ${SEVERITY_LABELS[wizard.state.severity]}`
											: '—',
									],
									['Начало', wizard.state.startedAt || '—'],
									['Длительность', wizard.state.duration === 'lt_24h' ? 'Менее 24 часов' : '24 часа и более'],
								].map(([label, value]) => (
									<div key={label} className='flex justify-between px-4 py-2.5 text-sm'>
										<span className='text-muted-foreground'>{label}</span>
										<span className='font-medium'>{value}</span>
									</div>
								))}
							</div>
							<button
								disabled={wizard.isPending}
								onClick={wizard.submit}
								className='w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40'
							>
								{wizard.isPending ? 'Сохранение…' : 'Сохранить'}
							</button>
							{wizard.isError && <p className='text-xs text-red-500'>Ошибка. Попробуйте снова.</p>}
						</>
					)}
				</div>
			</div>
		</div>
	);
};
