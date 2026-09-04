import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GroupScopeOption } from './GroupScopeOption';

describe('GroupScopeOption', () => {
    it.each([true, false])('renders selected=%s and invokes selection', (selected) => {
        const onSelect = vi.fn();
        const { container } = render(
            <GroupScopeOption
                name="Weekend Trip"
                selected={selected}
                title="Full group name"
                onSelect={onSelect}
            />,
        );
        const button = screen.getByRole('button', { name: 'Weekend Trip' });
        expect(button).toHaveAttribute('title', 'Full group name');
        if (selected) expect(container.querySelector('svg')).toBeInTheDocument();
        else expect(container.querySelector('svg')).not.toBeInTheDocument();
        fireEvent.click(button);
        expect(onSelect).toHaveBeenCalledOnce();
    });
});
