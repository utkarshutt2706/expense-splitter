import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DashboardSummary } from '@features/dashboard/api/dashboardApi';
import { useDashboard } from '@features/dashboard/hooks';
import { DashboardPage } from './DashboardPage';
import { dateInputValue } from './dashboardDateRange';
import { comparisonScale, contributionCopy } from './dashboardMetrics';

vi.mock('@features/dashboard/hooks', () => ({ useDashboard: vi.fn() }));

const dashboard: DashboardSummary = {
    actualPaid: 3200,
    currentUserShare: 1250,
    groupSpend: [
        {
            groupId: 'trip',
            name: 'A very long Goa trip group name',
            amount: 3000,
            actualPaid: 2800,
            currentUserShare: 1000,
            currentBalance: -125,
            memberShares: [
                {
                    userId: 'friend',
                    name: 'A participant with a very long name',
                    amount: 2000,
                    isCurrentUser: false,
                },
                { userId: 'me', name: 'Utkarsh', amount: 1000, isCurrentUser: true },
            ],
            spendingByMonth: [
                { month: '2026-07', amount: 1000, actualPaid: 800, currentUserShare: 400 },
                { month: '2026-08', amount: 2000, actualPaid: 2000, currentUserShare: 600 },
            ],
            spendingByDay: [
                { date: '2026-07-10', amount: 1000, actualPaid: 800, currentUserShare: 400 },
                { date: '2026-08-10', amount: 2000, actualPaid: 2000, currentUserShare: 600 },
            ],
        },
        {
            groupId: 'empty',
            name: 'Empty home',
            amount: 0,
            actualPaid: 0,
            currentUserShare: 0,
            currentBalance: 250,
            memberShares: [{ userId: 'me', name: 'Utkarsh', amount: 0, isCurrentUser: true }],
            spendingByMonth: [],
            spendingByDay: [],
        },
    ],
};

function renderPage(data: DashboardSummary = dashboard) {
    vi.mocked(useDashboard).mockReturnValue({
        data,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboard>);
    return render(
        <MemoryRouter>
            <DashboardPage />
        </MemoryRouter>,
    );
}

describe('DashboardPage', () => {
    beforeEach(() => vi.mocked(useDashboard).mockReset());

    it('does not show false zeroes while loading', () => {
        vi.mocked(useDashboard).mockReturnValue({ isLoading: true } as ReturnType<
            typeof useDashboard
        >);
        render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>,
        );
        expect(screen.getByRole('status', { name: /loading dashboard/i })).toBeInTheDocument();
        expect(screen.queryByText(/₹0/)).not.toBeInTheDocument();
    });

    it('shows a retryable, non-destructive error', () => {
        const refetch = vi.fn();
        vi.mocked(useDashboard).mockReturnValue({
            isError: true,
            isLoading: false,
            refetch,
        } as unknown as ReturnType<typeof useDashboard>);
        render(
            <MemoryRouter>
                <DashboardPage />
            </MemoryRouter>,
        );
        expect(screen.getByText(/expenses have not been changed/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /retry/i }));
        expect(refetch).toHaveBeenCalled();
    });

    it('renders the all-groups scope with gross balances and paired metrics', () => {
        renderPage();
        expect(screen.getByRole('heading', { name: 'Spending overview' })).toBeInTheDocument();
        expect(screen.getByText(/to receive ₹250.00/i)).toBeInTheDocument();
        expect(screen.getByText(/to pay ₹125.00/i)).toBeInTheDocument();
        expect(screen.getAllByText('Paid by you').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Your share').length).toBeGreaterThan(0);
        expect(
            screen.getByLabelText(/paid by you ₹2,800.00; your share ₹1,000.00/i),
        ).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /spending over time/i })).toBeInTheDocument();
    });

    it('renders chart values on every device', () => {
        renderPage();
        const trend = screen.getByRole('region', { name: /spending over time/i });
        const selector = within(trend).getByRole('button', { name: '10 Aug 2026' });
        expect(trend).not.toHaveClass('touch-device-only');
        expect(selector).toHaveTextContent('10 Aug 2026');
        expect(within(trend).getAllByText('₹2,000.00')).toHaveLength(2);
        expect(screen.queryByLabelText(/daily spending chart/i)).not.toBeInTheDocument();
        fireEvent.click(selector);
        fireEvent.click(screen.getByRole('option', { name: '10 Jul 2026' }));
        expect(within(trend).getByText('₹1,000.00')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /view analytics/i })).toHaveAttribute(
            'href',
            '/analytics',
        );
    });

    it('renders chart values through a responsive period selector', () => {
        renderPage();
        const trend = screen.getByRole('region', { name: /spending over time/i });
        const selector = within(trend).getByRole('button', { name: /10 Aug 2026/ });
        const visibleValues = trend.querySelector('dl')!;
        expect(trend).not.toHaveClass('touch-device-only');
        expect(within(visibleValues).getAllByText('₹2,000.00')).toHaveLength(2);
        fireEvent.click(selector);
        fireEvent.click(screen.getByRole('option', { name: '10 Jul 2026' }));
        expect(within(visibleValues).getByText('₹1,000.00')).toBeInTheDocument();
    });

    it('does not crash when a daily-range response comes from an older backend', () => {
        const legacyGroups = dashboard.groupSpend.map(
            ({ spendingByDay: _daily, ...group }) => group,
        );
        renderPage({ ...dashboard, groupSpend: legacyGroups });
        expect(
            screen.getByRole('heading', { name: /daily trend unavailable/i }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('table', { name: /monthly spending values/i }),
        ).not.toBeInTheDocument();
    });

    it('switches to a selected group and ranks participant shares', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /group:.*all groups/i }));
        fireEvent.click(screen.getByRole('button', { name: 'A very long Goa trip group name' }));
        expect(screen.getAllByText('Total group spending').length).toBeGreaterThan(0);
        expect(screen.getByText(/A participant with a very long name/)).toBeInTheDocument();
        expect(screen.getByText(/Utkarsh \(You\)/)).toBeInTheDocument();
        expect(screen.getByText('66.7%')).toBeInTheDocument();
    });

    it('filters the group scope options by name', () => {
        const extraGroups = Array.from({ length: 4 }, (_, index) => ({
            ...dashboard.groupSpend[1]!,
            groupId: `extra-${index}`,
            name: `Extra group ${index + 1}`,
        }));
        renderPage({ ...dashboard, groupSpend: [...dashboard.groupSpend, ...extraGroups] });
        fireEvent.click(screen.getByRole('button', { name: /group:.*all groups/i }));
        fireEvent.change(screen.getByRole('searchbox', { name: /search groups/i }), {
            target: { value: 'empty' },
        });
        expect(screen.getByRole('button', { name: 'Empty home' })).toHaveClass('cursor-pointer');
        expect(
            screen.queryByRole('button', { name: 'A very long Goa trip group name' }),
        ).not.toBeInTheDocument();
    });

    it('does not show group search for five or fewer groups', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /group:.*all groups/i }));
        expect(screen.queryByRole('searchbox', { name: /search groups/i })).not.toBeInTheDocument();
    });

    it('defaults to this month and supports the preset time filters', () => {
        renderPage();
        const filter = screen.getByRole('button', { name: /time period.*this month/i });
        fireEvent.click(filter);
        expect(screen.getByRole('dialog', { name: /choose dashboard time period/i })).toHaveClass(
            'rounded-lg',
            'p-2',
            'shadow-lg',
        );
        const previousMonth = screen.getByRole('button', { name: 'Previous month' });
        expect(previousMonth).toHaveClass('cursor-pointer');
        fireEvent.click(previousMonth);
        expect(vi.mocked(useDashboard).mock.calls.at(-1)?.[0]).toEqual(
            expect.objectContaining({ from: expect.any(String), to: expect.any(String) }),
        );
    });

    it('validates that custom ranges do not exceed one year', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /time period.*this month/i }));
        fireEvent.click(screen.getByRole('button', { name: /custom date range/i }));
        fireEvent.change(screen.getByLabelText(/custom range start/i), {
            target: { value: '2026-01-01' },
        });
        fireEvent.change(screen.getByLabelText(/custom range end/i), {
            target: { value: '2027-01-01' },
        });
        fireEvent.click(screen.getByRole('button', { name: /apply dates/i }));
        expect(screen.getByRole('alert')).toHaveTextContent(/cannot exceed one year/i);
    });

    it('constrains custom calendars using today, the start date, and one year', () => {
        renderPage();
        fireEvent.click(screen.getByRole('button', { name: /time period.*this month/i }));
        fireEvent.click(screen.getByRole('button', { name: /custom date range/i }));
        const startInput = screen.getByLabelText(/custom range start/i);
        const endInput = screen.getByLabelText(/custom range end/i);
        const showStartPicker = vi.fn();
        const showEndPicker = vi.fn();
        Object.defineProperty(startInput, 'showPicker', { value: showStartPicker });
        Object.defineProperty(endInput, 'showPicker', { value: showEndPicker });
        fireEvent.click(startInput);
        fireEvent.click(endInput);
        expect(showStartPicker).toHaveBeenCalledOnce();
        expect(showEndPicker).toHaveBeenCalledOnce();
        expect(startInput).toHaveAttribute('max', dateInputValue(new Date()));
        expect(endInput).toHaveAttribute('min', (startInput as HTMLInputElement).value);

        const oldStart = new Date(new Date().getFullYear() - 2, 0, 1);
        const expectedMaximum = new Date(oldStart);
        expectedMaximum.setFullYear(expectedMaximum.getFullYear() + 1);
        expectedMaximum.setDate(expectedMaximum.getDate() - 1);
        fireEvent.change(startInput, { target: { value: dateInputValue(oldStart) } });
        expect(endInput).toHaveAttribute('max', dateInputValue(expectedMaximum));

        fireEvent.change(startInput, { target: { value: '' } });
        expect(endInput).toBeDisabled();
    });

    it('renders groups-without-expenses and no-groups states', () => {
        const { unmount } = renderPage({
            actualPaid: 0,
            currentUserShare: 0,
            groupSpend: [dashboard.groupSpend[1]!],
        });
        expect(screen.getByText('No spending in this period')).toBeInTheDocument();
        unmount();
        renderPage({ actualPaid: 0, currentUserShare: 0, groupSpend: [] });
        expect(screen.getByText('No shared spending yet')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /create a group/i })).toHaveAttribute(
            'href',
            '/groups',
        );
    });

    it('automatically selects the only group without showing the group selector', () => {
        renderPage({
            actualPaid: 2800,
            currentUserShare: 1000,
            groupSpend: [dashboard.groupSpend[0]!],
        });
        expect(screen.queryByRole('button', { name: /view:/i })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: /view balances/i })).toHaveAttribute(
            'href',
            '/groups/trip/balance',
        );
        expect(screen.getAllByText('Total group spending').length).toBeGreaterThan(0);
        expect(screen.getByText(/Utkarsh \(You\)/)).toBeInTheDocument();
    });
});

describe('contributionCopy', () => {
    it.each([
        [200, 100, 'more than'],
        [100, 200, 'less than'],
        [100, 100, 'matches your share'],
    ])('describes contribution differences', (paid, share, copy) =>
        expect(contributionCopy(paid as number, share as number)).toContain(copy),
    );
});

describe('comparisonScale', () => {
    it('defines an independent axis from each group values', () => {
        expect(comparisonScale(100_000, 50_000)).toBe(100_000);
        expect(comparisonScale(100, 275)).toBe(275);
        expect(comparisonScale(0, 0)).toBe(1);
    });

    it('orders participant shares alphabetically with the current user first', () => {
        const group = dashboard.groupSpend[0]!;
        renderPage({
            ...dashboard,
            groupSpend: [
                {
                    ...group,
                    memberShares: [
                        { userId: 'u3', name: 'Zoe Tan', amount: 400, isCurrentUser: false },
                        { userId: 'u1', name: 'Priya Sharma', amount: 300, isCurrentUser: false },
                        { userId: 'me', name: 'Utkarsh', amount: 200, isCurrentUser: true },
                        { userId: 'u2', name: 'Arun Nair', amount: 100, isCurrentUser: false },
                    ],
                },
                ...dashboard.groupSpend.slice(1),
            ],
        });
        fireEvent.click(screen.getByRole('button', { name: /group:.*all groups/i }));
        fireEvent.click(screen.getByRole('button', { name: 'A very long Goa trip group name' }));

        const names = screen
            .getAllByRole('listitem')
            .map((item) => item.querySelector('span[title]')?.textContent)
            .filter(Boolean);
        expect(names).toEqual(['Utkarsh (You)', 'Arun Nair', 'Priya Sharma', 'Zoe Tan']);
    });
});
