import React, { useState } from 'react';

type Props = {
	label: string;
	value: string;
};

export const CopyField: React.FC<Props> = props => {
	const [copied, setCopied] = useState(false);

	const copy = () => {
		navigator.clipboard.writeText(props.value).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	return (
		<div className='flex items-center justify-between bg-gray-50 border border-border rounded-md px-3 py-2 mb-2'>
			<div>
				<p className='text-xs text-muted-foreground'>{props.label}</p>
				<p className='font-mono text-sm font-medium'>{props.value}</p>
			</div>
			<button className='text-xs text-primary hover:underline ml-4' onClick={copy}>
				{copied ? 'Copied!' : 'Copy'}
			</button>
		</div>
	);
};
