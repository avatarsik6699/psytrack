import { Link } from 'react-router';

import { useMyAssignedScales } from '@shared/api/scales';

export default function HomePage() {
	const { data: scales = [], isLoading } = useMyAssignedScales();

	return (
		<main className='p-6 space-y-6'>
			<header>
				<h1 className='text-2xl font-semibold'>My Assessments</h1>
				<p className='text-sm text-muted-foreground mt-1'>Complete the tests assigned by your doctor.</p>
			</header>

			{isLoading && <p className='text-sm text-muted-foreground'>Loading…</p>}

			{!isLoading && scales.length === 0 && (
				<p className='text-sm text-muted-foreground'>No assessments assigned yet.</p>
			)}

			{scales.length > 0 && (
				<ul className='space-y-3'>
					{scales.map(ps => (
						<li key={ps.id} className='bg-white border border-border rounded-lg p-4 flex justify-between items-center'>
							<div>
								<p className='text-sm font-medium'>{ps.scale?.name ?? 'Assessment'}</p>
								<p className='text-xs text-muted-foreground mt-0.5'>Every {ps.frequency_days} days</p>
							</div>
							<Link
								to={`/assessment/${ps.id}`}
								className='text-xs bg-[#5B5BD6] text-white px-3 py-1.5 rounded hover:opacity-90'
							>
								Start
							</Link>
						</li>
					))}
				</ul>
			)}

			<nav className='flex gap-4 pt-2'>
				<Link to='/history' className='text-sm text-primary hover:underline'>
					View history →
				</Link>
			</nav>
		</main>
	);
}
