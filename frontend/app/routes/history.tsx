import { useTestHistory } from '@shared/api/scales';

export default function HistoryPage() {
	const { data, isLoading } = useTestHistory();
	const items = data?.items ?? [];

	if (isLoading) {
		return <div className='p-6 text-sm text-muted-foreground'>Loading history…</div>;
	}

	return (
		<div className='p-6 space-y-4'>
			<h1 className='text-lg font-semibold'>Assessment History</h1>
			{items.length === 0 ? (
				<p className='text-sm text-muted-foreground'>No assessments completed yet.</p>
			) : (
				<ul className='space-y-2'>
					{items.map(item => (
						<li key={item.id} className='border border-border rounded p-3'>
							<div className='flex justify-between items-center'>
								<span className='text-sm font-medium'>{item.scale?.name ?? item.scale_id}</span>
								<span className='text-xs text-muted-foreground'>
									{new Date(item.completed_at).toLocaleDateString()}
								</span>
							</div>
							<p className='text-xs text-muted-foreground mt-0.5'>
								Score: <span className='font-medium text-foreground'>{item.score}</span>
								{item.baseline && ' (baseline)'}
							</p>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
