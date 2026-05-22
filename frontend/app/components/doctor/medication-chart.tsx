import React from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useMedicationChart } from '@shared/api/medications';

type ChartPoint = {
	date: string;
	dose_mg: number | null;
};

type ChartSeries = {
	inn: string;
	medication_id: string;
	points: ChartPoint[];
};

type Props = {
	patientId: string;
};

const COLORS = ['#5B5BD6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const MedicationChart: React.FC<Props> = props => {
	const chartQuery = useMedicationChart(props.patientId);
	const series = (chartQuery.data ?? []) as ChartSeries[];

	if (chartQuery.isLoading) return <p className='text-xs text-muted-foreground'>Loading chart…</p>;
	if (!series.length) return <p className='text-xs text-muted-foreground'>No medication data.</p>;

	const allDates = Array.from(new Set(series.flatMap(s => s.points.map(p => p.date)))).sort();

	const chartData = allDates.map(d => {
		const row: Record<string, string | number | null> = { date: d };
		for (const s of series) {
			const pt = s.points.find(p => p.date === d);
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
					<Tooltip contentStyle={{ fontSize: 12 }} formatter={value => (value != null ? `${value} mg` : '—')} />
					<Legend wrapperStyle={{ fontSize: 12 }} />
					{series.map((s, i) => (
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
};
