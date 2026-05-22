import React from 'react';

type Props = {
	title: string;
	children: React.ReactNode;
};

export const ProfileSection: React.FC<Props> = props => {
	return (
		<div className='bg-white border border-border rounded-xl p-5 space-y-3'>
			<h2 className='text-sm font-semibold'>{props.title}</h2>
			{props.children}
		</div>
	);
};
