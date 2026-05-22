import React from 'react';

type Props = {
	onClose?: () => void;
	children: React.ReactNode;
};

export const ModalOverlay: React.FC<Props> = props => {
	return (
		<div className='fixed inset-0 bg-black/40 flex items-center justify-center z-50' onClick={props.onClose}>
			<div className='bg-white rounded-xl p-6 shadow-lg w-[400px]' onClick={e => e.stopPropagation()}>
				{props.children}
			</div>
		</div>
	);
};
