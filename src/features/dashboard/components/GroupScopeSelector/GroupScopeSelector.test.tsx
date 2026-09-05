import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DashboardGroupSpend } from '@features/dashboard/api/dashboardApi';
import { GroupScopeSelector } from './GroupScopeSelector';

vi.mock('@shared/components', () => ({
    ResponsivePopoverContent: ({
        children,
        sideOffset: _sideOffset,
        onOpenAutoFocus: _onOpenAutoFocus,
        ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
        sideOffset?: number;
        onOpenAutoFocus?: (event: Event) => void;
    }) => <div {...props}>{children}</div>,
}));

const groups = ['Alpha', 'Beach Trip', 'Cooking', 'Dinner', 'Events', 'Family'].map(
    (name, index) => ({ groupId: `${index}`, name }) as DashboardGroupSpend,
);

describe('GroupScopeSelector', () => {
    it('shows the current scope and selects all groups', () => {
        const onChange = vi.fn();
        render(
            <GroupScopeSelector
                scope="dashboard"
                groups={groups.slice(0, 2)}
                value="1"
                onChange={onChange}
            />,
        );
        const trigger = screen.getByRole('button', { name: 'Group: Beach Trip' });
        fireEvent.click(trigger);
        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'All groups' }));
        expect(onChange).toHaveBeenCalledWith(null);
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('filters larger group collections case-insensitively and resets after selection', () => {
        const onChange = vi.fn();
        render(
            <GroupScopeSelector
                scope="analytics"
                groups={groups}
                value={null}
                onChange={onChange}
            />,
        );
        const trigger = screen.getByRole('button', { name: 'Group: All groups' });
        fireEvent.click(trigger);
        const search = screen.getByRole('searchbox', { name: 'Search groups' });
        fireEvent.change(search, { target: { value: '  BEACH ' } });
        expect(screen.getByRole('button', { name: 'Beach Trip' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'All groups' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Beach Trip' }));
        expect(onChange).toHaveBeenCalledWith('1');
        fireEvent.click(trigger);
        expect(screen.getByRole('searchbox')).toHaveValue('');
    });

    it('shows a no-results message for an unmatched query', () => {
        render(
            <GroupScopeSelector
                scope="dashboard"
                groups={groups}
                value={null}
                onChange={vi.fn()}
            />,
        );
        fireEvent.click(screen.getByRole('button', { name: 'Group: All groups' }));
        fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'missing' } });
        expect(screen.getByText('No groups found')).toBeInTheDocument();
    });
});
