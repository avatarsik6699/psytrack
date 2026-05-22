import { useMyMedications } from '@shared/api/medications';
import { usePatientMe } from '@shared/api/patient-me';
import { useMySideEffects } from '@shared/api/side-effects';
import { usePatientTasks } from '@shared/api/tasks';
import { date } from '@shared/lib/date';
import type { components } from '@shared/types/schema';

type PatientMedicationOut = components['schemas']['PatientMedicationOut'];
type PatientSideEffectOut = components['schemas']['PatientSideEffectOut'];

export function useDashboardData() {
	const meQuery = usePatientMe();
	const tasksQuery = usePatientTasks();
	const medsQuery = useMyMedications();
	const seQuery = useMySideEffects();

	const now = date.now();

	const allMeds = (medsQuery.data ?? []) as PatientMedicationOut[];
	const activeMeds = allMeds.filter(m => date.isDateOnOrAfterToday(m.ended_at));

	const tasks = tasksQuery.data ?? [];
	const todayMedTasks = tasks.filter(t => t.task_type === 'medication_log' && t.status === 'pending');
	const pendingTestCount = tasks.filter(t => t.task_type === 'test' && t.status === 'pending').length;

	const allSE = (seQuery.data ?? []) as PatientSideEffectOut[];
	const activeSE = allSE.filter(r => !r.resolved);

	const firstName = meQuery.data?.full_name.split(' ')[0] ?? '';

	return {
		now,
		firstName,
		activeMeds,
		takenMedCount: activeMeds.length - todayMedTasks.length,
		pendingTestCount,
		activeSE,
	};
}
