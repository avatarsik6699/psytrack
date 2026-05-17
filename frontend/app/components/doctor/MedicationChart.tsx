import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { useMedicationChart } from '@shared/api/medications';

interface ChartPoint {
	date: string;
	dose_mg: number | null;
}

interface ChartSeries {
	inn: string;
	medication_id: string;
	points: ChartPoint[];
}

const COLORS = ['#5B5BD6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function MedicationChart({ patientId }: { patientId: string }) {
	const { data: series = [], isLoading } = useMedicationChart(patientId);

	if (isLoading) return <p className='text-xs text-muted-foreground'>Loading chart…</p>;
	if (!series.length) return <p className='text-xs text-muted-foreground'>No medication data.</p>;

	const allDates = Array.from(
		new Set((series as ChartSeries[]).flatMap(s => s.points.map(p => p.date))),
	).sort();

	const chartData = allDates.map(date => {
		const row: Record<string, string | number | null> = { date };
		for (const s of series as ChartSeries[]) {
			const pt = s.points.find(p => p.date === date);
			row[s.inn] = pt?.dose_mg ?? null;
		}
		return row;
	});

	return (
		<div className='mt-4'>
			<h3 className='text-xs font-semibold text-muted-foreground mb-2'>Medication Dose History</h3>
			<ResponsiveContainer width='100%' height={220}>
				<LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
					<CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
					<XAxis dataKey='date' tick={{ fontSize: 11 }} />
					<YAxis tick={{ fontSize: 11 }} unit=' mg' />
					<Tooltip
						contentStyle={{ fontSize: 12 }}
						formatter={(value) => (value != null ? `${value} mg` : '—')}
					/>
					<Legend wrapperStyle={{ fontSize: 12 }} />
					{(series as ChartSeries[]).map((s, i) => (
						<Line
							key={s.medication_id}
							type='monotone'
							dataKey={s.inn}
							stroke={COLORS[i % COLORS.length]}
							dot={{ r: 4 }}
							connectNulls
						/>
					))}
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
