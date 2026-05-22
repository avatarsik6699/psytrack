import React from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useScoreChart } from '@shared/api/charts';
import { computeDelta, formatWeekLabel } from '@shared/lib/score-utils';

import { AssessmentResultsTable } from './assessment-results-table';

const SCALE_COLORS: Record<string, string> = {
	'PHQ-9': '#0D9E7E',
	'GAD-7': '#5B5BD6',
	YMRS: '#f59e0b',
};
const FALLBACK_COLORS = ['#0D9E7E', '#5B5BD6', '#f59e0b', '#ef4444', '#8b5cf6'];

type Props = {
	patientId: string;
};

export const ScoreChart: React.FC<Props> = props => {
	const chartQuery = useScoreChart(props.patientId);
	const series = chartQuery.data ?? [];

	if (chartQuery.isLoading) return <p className='text-xs text-muted-foreground'>Loading chart…</p>;
	if (!series.length) return <p className='text-xs text-muted-foreground'>No score data.</p>;

	const allDates = Array.from(new Set(series.flatMap(s => s.points.map(p => p.completed_at)))).sort();

	const chartData = allDates.map(dt => {
		const row: Record<string, string | number | null> = { date: formatWeekLabel(dt), rawDate: dt };
		for (const s of series) {
			const pt = s.points.find(p => p.completed_at === dt);
			row[s.scale_code] = pt?.score ?? null;
		}
		return row;
	});

	const deltaChips = series
		.map(s => {
			const pts = s.points;
			if (pts.length < 2) return null;
			const delta = computeDelta(pts[pts.length - 1].score, pts[pts.length - 2].score);
			const arrow = delta < 0 ? '↓' : delta > 0 ? '↑' : '→';
			return { code: s.scale_code, delta, arrow };
		})
		.filter(Boolean);

	return (
		<div>
			<div className='flex items-center justify-between mb-2'>
				<h3 className='text-xs font-semibold text-muted-foreground'>Score Trends</h3>
				<div className='flex gap-2'>
					{deltaChips.map(
						chip =>
							chip && (
								<span
									key={chip.code}
									className={`text-xs font-medium px-2 py-0.5 rounded-full border ${chip.delta < 0 ? 'border-green-300 text-green-700 bg-green-50' : chip.delta > 0 ? 'border-red-300 text-red-700 bg-red-50' : 'border-gray-200 text-gray-600 bg-gray-50'}`}
								>
									{chip.code} {chip.arrow}
									{Math.abs(chip.delta)}
								</span>
							)
					)}
				</div>
			</div>

			<ResponsiveContainer width='100%' height={240}>
				<LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
					<CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
					<XAxis dataKey='date' tick={{ fontSize: 11 }} />
					<YAxis tick={{ fontSize: 11 }} />
					<Tooltip contentStyle={{ fontSize: 12 }} />
					<Legend wrapperStyle={{ fontSize: 12 }} />
					{series.map((s, i) => (
						<Line
							key={s.scale_id}
							type='monotone'
							dataKey={s.scale_code}
							stroke={SCALE_COLORS[s.scale_code] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
							dot={{ r: 4 }}
							connectNulls
						/>
					))}
				</LineChart>
			</ResponsiveContainer>

			<AssessmentResultsTable series={series} />
		</div>
	);
};
