import { fireEvent, render, screen } from '@testing-library/react';
import { UserRound } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { UserMenuItem } from './UserMenuItem';

describe('UserMenuItem', () => {
    it('renders the supplied label and icon and invokes its action', () => {
        const onClick = vi.fn();
        const { container } = render(
            <UserMenuItem icon={UserRound} label="Profile settings" onClick={onClick} />,
        );

        const button = screen.getByRole('button', { name: 'Profile settings' });
        expect(button).toHaveAttribute('type', 'button');
        expect(container.querySelector('svg')).toBeInTheDocument();

        fireEvent.click(button);
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('remains an operable menu button when no callback is supplied', () => {
        render(<UserMenuItem icon={UserRound} label="Profile settings" />);

        expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
    });
});
