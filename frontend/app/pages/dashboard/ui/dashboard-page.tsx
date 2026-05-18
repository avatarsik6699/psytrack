import { useTranslation } from 'react-i18next';

import { SideEffectsList } from '@/components/patient/SideEffectsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardPage() {
	const { t } = useTranslation('common');

	return (
		<main className='shell space-y-4'>
			<Card className='card'>
				<CardHeader>
					<CardTitle>{t('brand')}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className='text-muted-foreground'>Starter authenticated area placeholder.</p>
				</CardContent>
			</Card>

			<Card className='card'>
				<CardContent className='pt-4'>
					<SideEffectsList />
				</CardContent>
			</Card>
		</main>
	);
}
