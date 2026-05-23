import React from 'react';

import { Dialog, DialogContent } from '@/components/ui/dialog';

type Props = {
	onClose?: () => void;
	children: React.ReactNode;
};

export const ModalOverlay: React.FC<Props> = props => {
	return (
		<Dialog
			open
			onOpenChange={open => {
				if (!open && props.onClose) props.onClose();
			}}
		>
			<DialogContent className='max-w-100'>{props.children}</DialogContent>
		</Dialog>
	);
};
