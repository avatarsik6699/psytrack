import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { usePatientScale, useScaleQuestions, useSubmitTestMutation } from '@shared/api/scales';
import type { components } from '@shared/types/schema';

type TestCompletionOut = components['schemas']['TestCompletionOut'];

const SEVERITY: Record<string, [number, string][]> = {
	'PHQ-9': [[4, 'Минимальная'], [9, 'Лёгкая'], [14, 'Умеренная'], [19, 'Умеренно-тяжёлая']],
	'GAD-7': [[4, 'Минимальная'], [9, 'Лёгкая'], [14, 'Умеренная']],
	'YMRS':  [[7, 'Минимальная'], [15, 'Лёгкая'], [25, 'Умеренная']],
};

function severityLabel(code: string, score: number): string {
	const table = SEVERITY[code];
	if (!table) return '';
	for (const [threshold, label] of table) {
		if (score <= threshold) return label;
	}
	return 'Тяжёлая';
}

function TestSuccessScreen({ result }: { result: TestCompletionOut }) {
	const scaleName = result.scale?.name ?? 'Тест';
	const scaleCode = result.scale?.code ?? '';
	const label = scaleCode ? severityLabel(scaleCode, result.score) : '';

	return (
		<div className='flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4'>
			<div className='w-20 h-20 rounded-full bg-green-500 flex items-center justify-center'>
				<svg viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth={2.5} className='w-10 h-10'>
					<polyline points='20 6 9 17 4 12' />
				</svg>
			</div>
			<h1 className='text-xl font-semibold'>Тест пройден!</h1>
			<p className='text-muted-foreground text-sm'>Ответы переданы врачу</p>
			{label && (
				<p className='text-sm text-muted-foreground'>
					Результат {scaleName}: {result.score} — {label}
				</p>
			)}
			<Link
				to='/tests'
				className='mt-4 px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity'
			>
				К списку тестов
			</Link>
		</div>
	);
}

export default function AssessmentPage() {
	const { patientScaleId } = useParams<{ patientScaleId: string }>();
	const navigate = useNavigate();

	const { data: patientScale, isLoading: loadingScale } = usePatientScale(patientScaleId!);
	const { data: questions = [], isLoading: loadingQs } = useScaleQuestions(
		patientScale?.scale_id ?? '',
	);

	const [step, setStep] = useState(0);
	const [answers, setAnswers] = useState<{ question_id: number; value: number }[]>([]);
	const [result, setResult] = useState<TestCompletionOut | null>(null);

	const mutation = useSubmitTestMutation(patientScaleId!);

	if (loadingScale || loadingQs) {
		return <div className='p-6 text-sm text-muted-foreground'>Загрузка…</div>;
	}

	if (!patientScale || questions.length === 0) {
		return <div className='p-6 text-sm text-red-500'>Тест не найден.</div>;
	}

	if (result) {
		return <TestSuccessScreen result={result} />;
	}

	const currentQuestion = questions[step];
	const progressPct = Math.round((step / questions.length) * 100);
	const currentAnswer = answers.find(a => a.question_id === currentQuestion.id);

	const handleAnswer = (value: number) => {
		const updated = [
			...answers.filter(a => a.question_id !== currentQuestion.id),
			{ question_id: currentQuestion.id, value },
		];
		setAnswers(updated);

		if (step < questions.length - 1) {
			setStep(s => s + 1);
		} else {
			mutation.mutate(
				{ answers: updated, baseline: false },
				{
					onSuccess: data => {
						setResult(data as TestCompletionOut);
					},
					onError: () => {
						navigate('/tests');
					},
				},
			);
		}
	};

	return (
		<div className='max-w-lg mx-auto'>
			{/* Header bar */}
			<div className='bg-white border-b border-border px-4 py-3'>
				<div className='flex items-center justify-between'>
					<Link to='/tests' className='text-xs text-primary hover:underline'>
						← К тестам
					</Link>
					<span className='text-sm font-medium flex-1 text-center px-4 truncate'>
						{patientScale.scale?.name ?? ''}
					</span>
					<span className='text-xs text-muted-foreground shrink-0'>
						{step + 1} / {questions.length}
					</span>
				</div>
				<div className='mt-2 h-1.5 w-full bg-muted rounded-full'>
					<div
						className='h-1.5 rounded-full transition-all'
						style={{ width: `${progressPct}%`, backgroundColor: 'var(--docassist-primary)' }}
					/>
				</div>
			</div>

			<div className='p-6 space-y-6'>
				<p className='text-sm font-medium'>{currentQuestion.text}</p>

				<div className='space-y-2'>
					{currentQuestion.options.map(opt => {
						const isSelected = currentAnswer?.value === (opt.value as number);
						return (
							<button
								key={opt.value as number}
								onClick={() => handleAnswer(opt.value as number)}
								disabled={mutation.isPending}
								className={`w-full text-left border rounded-lg px-4 py-3 text-sm transition-colors disabled:opacity-50 ${
									isSelected
										? 'border-primary bg-docassist-primary-subtle text-primary'
										: 'border-border hover:bg-gray-50'
								}`}
							>
								{opt.label as string}
							</button>
						);
					})}
				</div>

				{/* Prev / Next explicit navigation */}
				<div className='flex justify-between pt-2'>
					{step > 0 ? (
						<button
							onClick={() => setStep(s => s - 1)}
							className='text-xs text-muted-foreground hover:underline'
						>
							← Назад
						</button>
					) : <span />}
					<button
						onClick={() => currentAnswer && handleAnswer(currentAnswer.value)}
						disabled={!currentAnswer || mutation.isPending}
						className='px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 transition-opacity'
					>
						{step < questions.length - 1 ? 'Далее →' : 'Завершить'}
					</button>
				</div>

				{mutation.error && (
					<p className='text-xs text-red-500'>Ошибка отправки. Попробуйте снова.</p>
				)}
			</div>
		</div>
	);
}
