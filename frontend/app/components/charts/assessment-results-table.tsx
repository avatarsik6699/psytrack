import React from 'react';

import type { ScoreChartSeries } from '@shared/api/charts';
import { date } from '@shared/lib/date';
import { computeDelta, computeSeverityLabel, formatWeekLabel } from '@shared/lib/score-utils';

type Props = {
	series: ScoreChartSeries[];
};

const SEVERITY_COLOR: Record<string, string> = {
	Minimal: 'bg-green-100 text-green-800',
	Mild: 'bg-yellow-100 text-yellow-800',
	Moderate: 'bg-orange-100 text-orange-800',
	'Mod. Severe': 'bg-red-100 text-red-700',
	Severe: 'bg-red-200 text-red-900',
	'N/A': 'bg-muted text-muted-foreground',
};

type Row = {
	date: string;
	scaleCode: string;
	scaleName: string;
	score: number;
	severity: string;
	delta: number | null;
};

export const AssessmentResultsTable: React.FC<Props> = props => {
	const rows: Row[] = props.series.flatMap(s =>
		s.points.map((pt, idx) => ({
			date: pt.completed_at,
			scaleCode: s.scale_code,
			scaleName: s.scale_name,
			score: pt.score,
			severity: computeSeverityLabel(s.scale_code, pt.score),
			delta: idx > 0 ? computeDelta(pt.score, s.points[idx - 1].score) : null,
		}))
	);

	rows.sort((a, b) => date.timestamp(b.date) - date.timestamp(a.date));

	if (!rows.length) {
		return <p className='text-xs text-muted-foreground'>No assessment data.</p>;
	}

	return (
		<div className='overflow-x-auto mt-3'>
			<table className='min-w-full text-xs'>
				<thead>
					<tr className='border-b border-border text-left text-muted-foreground'>
						<th className='py-1 pr-3 font-medium'>DATE</th>
						<th className='py-1 pr-3 font-medium'>TEST</th>
						<th className='py-1 pr-3 font-medium'>SCORE</th>
						<th className='py-1 pr-3 font-medium'>INTERPRETATION</th>
						<th className='py-1 font-medium'>Δ</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((r, i) => (
						<tr key={i} className='border-b border-border last:border-0'>
							<td className='py-1.5 pr-3 text-muted-foreground'>{formatWeekLabel(r.date)}</td>
							<td className='py-1.5 pr-3 font-medium'>{r.scaleCode}</td>
							<td className='py-1.5 pr-3'>{r.score}</td>
							<td className='py-1.5 pr-3'>
								<span
									className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium ${SEVERITY_COLOR[r.severity] ?? SEVERITY_COLOR['N/A']}`}
								>
									{r.severity}
								</span>
							</td>
							<td className='py-1.5'>
								{r.delta !== null ? (
									<span className={r.delta < 0 ? 'text-green-600' : r.delta > 0 ? 'text-red-500' : 'text-muted-foreground'}>
										{r.delta > 0 ? `↑${r.delta}` : r.delta < 0 ? `↓${Math.abs(r.delta)}` : '—'}
									</span>
								) : (
									<span className='text-muted-foreground'>baseline</span>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};
