import { useState } from 'react';

import { usePatientScale, useScaleQuestions, useSubmitTestMutation } from '@shared/api/scales';
import { useRouter } from '@shared/hooks/use-router';
import type { components } from '@shared/types/schema';

type TestCompletionOut = components['schemas']['TestCompletionOut'];

type Answer = { question_id: number; value: number };

type Params = {
	patientScaleId: string;
};

export function useAssessmentWizard(params: Params) {
	const router = useRouter();

	const scaleQuery = usePatientScale(params.patientScaleId);
	const questionsQuery = useScaleQuestions(scaleQuery.data?.scale_id ?? '');

	const [step, setStep] = useState(0);
	const [answers, setAnswers] = useState<Answer[]>([]);
	const [result, setResult] = useState<TestCompletionOut | null>(null);

	const mutation = useSubmitTestMutation(params.patientScaleId);

	const questions = questionsQuery.data ?? [];
	const currentQuestion = questions[step];
	const progressPct = questions.length > 0 ? Math.round((step / questions.length) * 100) : 0;
	const currentAnswer = currentQuestion ? answers.find(a => a.question_id === currentQuestion.id) : undefined;

	function selectAnswer(value: number) {
		if (!currentQuestion) return;
		setAnswers(prev => [
			...prev.filter(a => a.question_id !== currentQuestion.id),
			{ question_id: currentQuestion.id, value },
		]);
	}

	function advance() {
		if (!currentQuestion || !currentAnswer) return;
		const updated: Answer[] = [
			...answers.filter(a => a.question_id !== currentQuestion.id),
			{ question_id: currentQuestion.id, value: currentAnswer.value },
		];
		setAnswers(updated);

		if (step < questions.length - 1) {
			setStep(s => s + 1);
		} else {
			mutation.mutate(
				{ answers: updated, baseline: false },
				{
					onSuccess: function onSuccessFx(data) {
						setResult(data as TestCompletionOut);
					},
					onError: function onErrorFx() {
						router.navigate('/tests');
					},
				}
			);
		}
	}

	function goBack() {
		setStep(s => s - 1);
	}

	return {
		isLoading: scaleQuery.isLoading || questionsQuery.isLoading,
		patientScale: scaleQuery.data,
		questions,
		step,
		currentQuestion,
		currentAnswer,
		progressPct,
		result,
		isMutationPending: mutation.isPending,
		mutationError: mutation.error,
		selectAnswer,
		advance,
		goBack,
	};
}
