import React, { useState } from 'react';

import { useCreatePatientMutation } from '@shared/api/patients';
import type { components } from '@shared/types/schema';

import { CopyField } from './components/copy-field';
import { ModalOverlay } from './components/modal-overlay';

type PatientCreatedOut = components['schemas']['PatientCreatedOut'];

type Step = 'form' | 'credentials';

type Props = {
	onClose: () => void;
};

export const AddPatientModal: React.FC<Props> = props => {
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
					onClick={props.onClose}
				>
					Done
				</button>
			</ModalOverlay>
		);
	}

	return (
		<ModalOverlay onClose={props.onClose}>
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
				{mutation.error && <p className='text-xs text-red-500'>Failed to create patient. Please try again.</p>}
				<div className='flex gap-2 pt-1'>
					<button
						type='button'
						className='flex-1 px-3 py-2 border border-border rounded-md text-sm hover:bg-gray-50'
						onClick={props.onClose}
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
};
