import { useState } from 'react';

import { useSeDictionary, useReportSideEffectMutation } from '@shared/api/side-effects';
import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

type SeDictionaryOut = components['schemas']['SeDictionaryOut'];

type WizardState = {
	selectedSe: SeDictionaryOut | null;
	severity: number | null;
	duration: 'lt_24h' | 'gte_24h' | null;
	startedAt: string;
};

type Params = {
	onSuccess: () => void;
};

const TOTAL_STEPS = 4;

export function useSEWizard(params: Params) {
	const [step, setStep] = useState(1);
	const [bodySystem, setBodySystem] = useState('');
	const [state, setState] = useState<WizardState>({
		selectedSe: null,
		severity: null,
		duration: null,
		startedAt: date.todayIso(),
	});

	const dictionaryQuery = useSeDictionary('', bodySystem || undefined);
	const items: SeDictionaryOut[] = dictionaryQuery.data?.items ?? [];

	const reportMutation = useReportSideEffectMutation();

	function submit() {
		if (!state.selectedSe || state.severity === null) {
			return;
		}

		reportMutation.mutate(
			{
				se_id: state.selectedSe.id,
				severity: state.severity,
				date_precision: state.duration === 'lt_24h' ? 'lt_24h' : 'exact',
				duration_label: state.duration === 'lt_24h' ? 'Менее 24 часов' : '24 часа и более',
				started_at: state.startedAt ? `${state.startedAt}T00:00:00Z` : null,
			},
			{ onSuccess: params.onSuccess }
		);
	}

	function selectSymptom(se: SeDictionaryOut) {
		setState(s => ({ ...s, selectedSe: se }));
		setStep(2);
	}

	function selectSeverity(severity: number) {
		setState(s => ({ ...s, severity }));
	}

	function selectDuration(duration: 'lt_24h' | 'gte_24h') {
		setState(s => ({ ...s, duration }));
	}

	function setStartedAt(value: string) {
		setState(s => ({ ...s, startedAt: value }));
	}

	function goBack() {
		setStep(s => s - 1);
	}

	function goNext() {
		setStep(s => s + 1);
	}

	return {
		step,
		totalSteps: TOTAL_STEPS,
		bodySystem,
		setBodySystem,
		state,
		items,
		isPending: reportMutation.isPending,
		isError: reportMutation.isError,
		submit,
		selectSymptom,
		selectSeverity,
		selectDuration,
		setStartedAt,
		goBack,
		goNext,
	};
}
