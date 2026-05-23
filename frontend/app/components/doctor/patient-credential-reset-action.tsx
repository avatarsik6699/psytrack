import { Copy, KeyRound, X } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useResetPatientCredentialsMutation } from '@shared/api/patients';

import { Button } from '@/components/ui/button';

type Props = {
	patientId: string;
	patientName: string;
};

export const PatientCredentialResetAction: React.FC<Props> = props => {
	const { t } = useTranslation('common');
	const [open, setOpen] = useState(false);
	const mutation = useResetPatientCredentialsMutation(props.patientId);
	const credentials = mutation.data;

	const reset = () => {
		mutation.reset();
		setOpen(true);
	};

	const copyCredentials = async () => {
		if (!credentials) return;
		await navigator.clipboard.writeText(
			`${t('addPatient.login')}: ${credentials.temp_login}\n${t('addPatient.password')}: ${credentials.temp_password}`
		);
	};

	return (
		<>
			<Button type='button' variant='outline' size='sm' onClick={reset}>
				<KeyRound size={14} />
				{t('resetCredentials.action')}
			</Button>
			{open ? (
				<div className='fixed inset-0 z-[80] grid place-items-center bg-black/40 p-4'>
					<div className='w-full max-w-sm rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl'>
						<div className='mb-4 flex items-start justify-between gap-3'>
							<div>
								<h2 className='text-base font-semibold'>{t('resetCredentials.title')}</h2>
								<p className='mt-1 text-sm text-muted-foreground'>{props.patientName}</p>
							</div>
							<Button
								type='button'
								variant='ghost'
								size='icon-sm'
								onClick={() => setOpen(false)}
								aria-label={t('resetCredentials.close')}
							>
								<X size={16} />
							</Button>
						</div>
						{credentials ? (
							<div className='space-y-3'>
								<div className='rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm'>
									<p>login: {credentials.temp_login}</p>
									<p>password: {credentials.temp_password}</p>
								</div>
								<p className='text-xs text-muted-foreground'>{t('resetCredentials.once')}</p>
								<div className='flex justify-end gap-2'>
									<Button type='button' variant='outline' onClick={() => void copyCredentials()}>
										<Copy size={14} />
										{t('actions.copy')}
									</Button>
									<Button type='button' onClick={() => setOpen(false)}>
										{t('actions.done')}
									</Button>
								</div>
							</div>
						) : (
							<div className='space-y-4'>
								<p className='text-sm text-muted-foreground'>{t('resetCredentials.warning')}</p>
								{mutation.isError ? <p className='text-sm text-destructive'>{t('resetCredentials.error')}</p> : null}
								<div className='flex justify-end gap-2'>
									<Button type='button' variant='outline' onClick={() => setOpen(false)}>
										{t('actions.cancel')}
									</Button>
									<Button
										type='button'
										disabled={mutation.isPending}
										onClick={() => mutation.mutate()}
										className='bg-docassist-primary text-white'
									>
										{mutation.isPending ? t('resetCredentials.resetting') : t('resetCredentials.generate')}
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>
			) : null}
		</>
	);
};
