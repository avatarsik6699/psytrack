import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useRouter } from '@shared/hooks/use-router';

import { TestSuccessScreen } from './components/test-success-screen';
import { useAssessmentWizard } from './hooks/use-assessment-wizard';

export function meta() {
	return [{ title: 'Тест — PsychTrack' }];
}

const AssessmentPage: React.FC = () => {
	const router = useRouter();
	const { i18n } = useTranslation();
	const isRu = i18n.language === 'ru';
	const patientScaleId = router.params.patientScaleId ?? '';

	const wizard = useAssessmentWizard({ patientScaleId });

	if (wizard.isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>Загрузка…</div>;
	}

	if (!wizard.patientScale || wizard.questions.length === 0) {
		return <div className='p-6 text-sm text-red-500'>Тест не найден.</div>;
	}

	if (wizard.result) {
		return <TestSuccessScreen result={wizard.result} />;
	}

	return (
		<div className='max-w-lg mx-auto'>
			{/* Header bar */}
			<div className='bg-card text-card-foreground border-b border-border px-4 py-3'>
				<div className='flex items-center justify-between'>
					<Link to='/tests' className='text-xs text-primary hover:underline'>
						← К тестам
					</Link>
					<span className='text-sm font-medium flex-1 text-center px-4 truncate'>
						{isRu
							? wizard.patientScale.scale?.name_ru || wizard.patientScale.scale?.name
							: wizard.patientScale.scale?.name}
					</span>
					<span className='text-xs text-muted-foreground shrink-0'>
						{wizard.step + 1} / {wizard.questions.length}
					</span>
				</div>
				<div className='mt-2 h-1.5 w-full bg-muted rounded-full'>
					<div
						className='h-1.5 rounded-full transition-all'
						style={{ width: `${wizard.progressPct}%`, backgroundColor: 'var(--docassist-primary)' }}
					/>
				</div>
			</div>

			<div className='p-6 space-y-6'>
				<p className='text-sm font-medium'>
					{isRu ? wizard.currentQuestion?.text_ru || wizard.currentQuestion?.text : wizard.currentQuestion?.text}
				</p>

				<div className='space-y-2'>
					{(wizard.currentQuestion?.options ?? []).map(opt => {
						const isSelected = wizard.currentAnswer?.value === (opt.value as number);

						return (
							<button
								key={opt.value as number}
								onClick={() => wizard.selectAnswer(opt.value as number)}
								disabled={wizard.isMutationPending}
								className={`w-full text-left border rounded-lg px-4 py-3 text-sm transition-colors disabled:opacity-50 ${
									isSelected
										? 'border-primary bg-docassist-primary-subtle text-primary font-medium'
										: 'border-border hover:bg-muted'
								}`}
							>
								{isRu ? (opt.label_ru as string) || (opt.label as string) : (opt.label as string)}
							</button>
						);
					})}
				</div>

				<div className='flex justify-between pt-2'>
					{wizard.step > 0 ? (
						<button onClick={wizard.goBack} className='text-xs text-muted-foreground hover:underline'>
							← Назад
						</button>
					) : (
						<span />
					)}
					<button
						onClick={wizard.advance}
						disabled={!wizard.currentAnswer || wizard.isMutationPending}
						className='px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 transition-opacity'
					>
						{wizard.step < wizard.questions.length - 1 ? 'Далее →' : 'Завершить'}
					</button>
				</div>

				{wizard.mutationError && <p className='text-xs text-red-500'>Ошибка отправки. Попробуйте снова.</p>}
			</div>
		</div>
	);
};

export default AssessmentPage;
