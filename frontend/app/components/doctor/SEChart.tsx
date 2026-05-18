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

import { useSeChart } from '@shared/api/side-effects';

interface SeSeverityDataPoint {
	date: string;
	se_id: string;
	se_name: string;
	severity: number;
}

const COLORS = ['#5B5BD6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#0ea5e9'];

export function SEChart({ patientId }: { patientId: string }) {
	const { data: rawPoints = [], isLoading } = useSeChart(patientId);
	const points = rawPoints as SeSeverityDataPoint[];

	if (isLoading) return <p className='text-xs text-muted-foreground'>Загрузка графика…</p>;
	if (!points.length) return <p className='text-xs text-muted-foreground'>Данные о побочных эффектах отсутствуют.</p>;

	const seNames = Array.from(new Set(points.map(p => p.se_name)));
	const allDates = Array.from(new Set(points.map(p => p.date))).sort();

	const chartData = allDates.map(date => {
		const row: Record<string, string | number | null> = { date };
		for (const name of seNames) {
			const pt = points.find(p => p.date === date && p.se_name === name);
			row[name] = pt?.severity ?? null;
		}
		return row;
	});

	return (
		<div className='mt-4'>
			<h3 className='text-xs font-semibold text-muted-foreground mb-2'>
				Динамика побочных эффектов (тяжесть)
			</h3>
			<ResponsiveContainer width='100%' height={220}>
				<LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
					<CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
					<XAxis dataKey='date' tick={{ fontSize: 11 }} />
					<YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 11 }} />
					<Tooltip
						contentStyle={{ fontSize: 12 }}
						formatter={(value) => (value != null ? String(value) : '—')}
					/>
					<Legend wrapperStyle={{ fontSize: 11 }} />
					{seNames.map((name, i) => (
						<Line
							key={name}
							type='monotone'
							dataKey={name}
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
