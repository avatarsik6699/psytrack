import { useState } from 'react';

import { useCreatePatientMutation } from '@shared/api/patients';
import type { components } from '@shared/types/schema';

type PatientCreatedOut = components['schemas']['PatientCreatedOut'];

interface Props {
	onClose: () => void;
}

type Step = 'form' | 'credentials';

function CopyField({ label, value }: { label: string; value: string }) {
	const [copied, setCopied] = useState(false);
	const copy = () => {
		navigator.clipboard.writeText(value).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};
	return (
		<div className='flex items-center justify-between bg-gray-50 border border-border rounded-md px-3 py-2 mb-2'>
			<div>
				<p className='text-xs text-muted-foreground'>{label}</p>
				<p className='font-mono text-sm font-medium'>{value}</p>
			</div>
			<button
				className='text-xs text-primary hover:underline ml-4'
				onClick={copy}
			>
				{copied ? 'Copied!' : 'Copy'}
			</button>
		</div>
	);
}

function ModalOverlay({ onClose, children }: { onClose?: () => void; children: React.ReactNode }) {
	return (
		<div
			className='fixed inset-0 bg-black/40 flex items-center justify-center z-50'
			onClick={onClose}
		>
			<div
				className='bg-white rounded-xl p-6 shadow-lg w-[400px]'
				onClick={e => e.stopPropagation()}
			>
				{children}
			</div>
		</div>
	);
}

export function AddPatientModal({ onClose }: Props) {
	const [step, setStep] = useState<Step>('form');
	const [created, setCreated] = useState<PatientCreatedOut | null>(null);
	const [fullName, setFullName] = useState('');
	const [birthDate, setBirthDate] = useState('');
	const [gender, setGender] = useState('');
	const mutation = useCreatePatientMutation();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		mutation.mutate(
			{
				full_name: fullName,
				birth_date: birthDate || null,
				gender: gender || null,
			},
			{
				onSuccess: result => {
					setCreated(result);
					setStep('credentials');
				},
			}
		);
	};

	if (step === 'credentials' && created) {
		return (
			<ModalOverlay>
				<h2 className='text-lg font-semibold mb-1'>Patient created</h2>
				<p className='text-sm text-muted-foreground mb-4'>
					Share these credentials with the patient. They will not be shown again.
				</p>
				<CopyField label='Login' value={created.temp_login} />
				<CopyField label='Password' value={created.temp_password} />
				<button
					className='mt-4 w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90'
					onClick={onClose}
				>
					Done
				</button>
			</ModalOverlay>
		);
	}

	return (
		<ModalOverlay onClose={onClose}>
			<h2 className='text-lg font-semibold mb-4'>Add Patient</h2>
			<form onSubmit={handleSubmit} className='space-y-3'>
				<div>
					<label className='block text-sm font-medium mb-1'>Full name *</label>
					<input
						type='text'
						required
						value={fullName}
						onChange={e => setFullName(e.target.value)}
						className='w-full border border-border rounded-md px-3 py-2 text-sm'
					/>
				</div>
				<div>
					<label className='block text-sm font-medium mb-1'>Date of birth</label>
					<input
						type='date'
						value={birthDate}
						onChange={e => setBirthDate(e.target.value)}
						className='w-full border border-border rounded-md px-3 py-2 text-sm'
					/>
				</div>
				<div>
					<label className='block text-sm font-medium mb-1'>Gender</label>
					<select
						value={gender}
						onChange={e => setGender(e.target.value)}
						className='w-full border border-border rounded-md px-3 py-2 text-sm'
					>
						<option value=''>— not specified —</option>
						<option value='male'>Male</option>
						<option value='female'>Female</option>
						<option value='other'>Other</option>
					</select>
				</div>
				{mutation.error && (
					<p className='text-xs text-red-500'>Failed to create patient. Please try again.</p>
				)}
				<div className='flex gap-2 pt-1'>
					<button
						type='button'
						className='flex-1 px-3 py-2 border border-border rounded-md text-sm hover:bg-gray-50'
						onClick={onClose}
					>
						Cancel
					</button>
					<button
						type='submit'
						disabled={mutation.isPending}
						className='flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50'
					>
						{mutation.isPending ? 'Creating…' : 'Create'}
					</button>
				</div>
			</form>
		</ModalOverlay>
	);
}
