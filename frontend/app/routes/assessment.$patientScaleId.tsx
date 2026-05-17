import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { usePatientScale, useScaleQuestions, useSubmitTestMutation } from '@shared/api/scales';

export default function AssessmentPage() {
	const { patientScaleId } = useParams<{ patientScaleId: string }>();
	const navigate = useNavigate();

	const { data: patientScale, isLoading: loadingScale } = usePatientScale(patientScaleId!);
	const { data: questions = [], isLoading: loadingQs } = useScaleQuestions(
		patientScale?.scale_id ?? '',
	);

	const [step, setStep] = useState(0);
	const [answers, setAnswers] = useState<{ question_id: number; value: number }[]>([]);
	const mutation = useSubmitTestMutation(patientScaleId!);

	if (loadingScale || loadingQs) {
		return <div className='p-6 text-sm text-muted-foreground'>Loading assessment…</div>;
	}

	if (!patientScale || questions.length === 0) {
		return <div className='p-6 text-sm text-red-500'>Assessment not found.</div>;
	}

	const currentQuestion = questions[step];
	const progressPct = Math.round((step / questions.length) * 100);

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
				{ onSuccess: () => navigate('/history') },
			);
		}
	};

	return (
		<div className='max-w-lg mx-auto p-6 space-y-6'>
			<div>
				<h1 className='text-base font-semibold'>{patientScale.scale?.name}</h1>
				<p className='text-xs text-muted-foreground mb-2'>
					Question {step + 1} of {questions.length}
				</p>
				{/* Purple progress bar — SPEC §5.4 --color-accent-500 */}
				<div className='h-2 w-full bg-gray-200 rounded-full'>
					<div
						className='h-2 rounded-full transition-all'
						style={{ width: `${progressPct}%`, backgroundColor: '#5B5BD6' }}
					/>
				</div>
			</div>

			<p className='text-sm font-medium'>{currentQuestion.text}</p>

			<div className='space-y-2'>
				{currentQuestion.options.map(opt => (
					<button
						key={opt.value as number}
						onClick={() => handleAnswer(opt.value as number)}
						disabled={mutation.isPending}
						className='w-full text-left border border-border rounded px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50'
					>
						{opt.label as string}
					</button>
				))}
			</div>

			{step > 0 && (
				<button onClick={() => setStep(s => s - 1)} className='text-xs text-muted-foreground hover:underline'>
					← Back
				</button>
			)}

			{mutation.error && <p className='text-xs text-red-500'>Submission failed. Please try again.</p>}
		</div>
	);
}
