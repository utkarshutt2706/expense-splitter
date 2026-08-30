import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DashboardSummary } from '@features/dashboard/api/dashboardApi';
import { useDashboard } from '@features/dashboard/hooks';
import { AnalyticsPage } from './AnalyticsPage';

vi.mock('@features/dashboard/hooks', () => ({ useDashboard: vi.fn() }));
vi.mock('@features/dashboard/components/SpendingTrendGraph', () => ({
    SpendingTrendGraph: () => <div aria-label="spending trend chart" />,
}));
vi.mock('recharts', () => {
    const Chart = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
    return {
        Bar: Chart,
        BarChart: Chart,
        CartesianGrid: Chart,
        Cell: () => null,
        Legend: () => null,
        Pie: Chart,
        PieChart: Chart,
        ReferenceLine: () => null,
        ResponsiveContainer: Chart,
        Sector: () => null,
        Tooltip: () => null,
        XAxis: () => null,
        YAxis: () => null,
    };
});

const dashboard: DashboardSummary = {
    actualPaid: 200,
    currentUserShare: 100,
    groupSpend: [
        {
            groupId: 'trip',
            name: 'Weekend Trip',
            amount: 200,
            actualPaid: 150,
            currentUserShare: 100,
            currentBalance: 0,
            memberShares: [
                { userId: 'me', name: 'Alex', amount: 100, isCurrentUser: true },
                { userId: 'friend', name: 'Priya', amount: 100, isCurrentUser: false },
            ],
            spendingByMonth: [
                {
                    month: '2026-08',
                    amount: 200,
                    actualPaid: 150,
                    currentUserShare: 100,
                },
            ],
            spendingByDay: [
                {
                    date: '2026-08-10',
                    amount: 200,
                    actualPaid: 150,
                    currentUserShare: 100,
                },
            ],
        },
        {
            groupId: 'dinner',
            name: 'Dinner',
            amount: 100,
            actualPaid: 50,
            currentUserShare: 50,
            currentBalance: 0,
            memberShares: [
                { userId: 'me', name: 'Alex', amount: 50, isCurrentUser: true },
                { userId: 'friend', name: 'Priya', amount: 50, isCurrentUser: false },
            ],
            spendingByMonth: [
                {
                    month: '2026-08',
                    amount: 100,
                    actualPaid: 50,
                    currentUserShare: 50,
                },
            ],
            spendingByDay: [
                {
                    date: '2026-08-15',
                    amount: 100,
                    actualPaid: 50,
                    currentUserShare: 50,
                },
            ],
        },
    ],
};

describe('AnalyticsPage', () => {
    beforeEach(() => {
        vi.mocked(useDashboard).mockReturnValue({
            data: dashboard,
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useDashboard>);
    });

    it('renders responsive analytics sections and web guidance', () => {
        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: 'Spending analytics' })).toBeInTheDocument();
        expect(screen.getByText(/best on web/i)).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Spending trend' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Spending by group' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Paid versus your share' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Participant share' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /time period.*overall/i })).toBeInTheDocument();
        expect(vi.mocked(useDashboard).mock.calls.at(-1)?.[0]).toBeUndefined();

        expect(screen.getByRole('button', { name: /group:.*all groups/i })).toBeInTheDocument();
        expect(
            screen.getByText(/select one group to view participant shares/i),
        ).toBeInTheDocument();
    });

    it('initializes the group filter from the group-detail deep link', () => {
        render(
            <MemoryRouter initialEntries={['/analytics?groupId=trip']}>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        expect(screen.getByRole('button', { name: /group:.*weekend trip/i })).toBeInTheDocument();
        expect(screen.queryByText(/select one group/i)).not.toBeInTheDocument();
        expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('resets the group filter to all groups when the deep link group does not exist', () => {
        render(
            <MemoryRouter initialEntries={['/analytics?groupId=unknown']}>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        expect(screen.getByRole('button', { name: /group:.*all groups/i })).toBeInTheDocument();
        expect(
            screen.getByText(/select one group to view participant shares/i),
        ).toBeInTheDocument();
    });

    it('does not render the group filter when there is only one group', () => {
        vi.mocked(useDashboard).mockReturnValue({
            data: {
                ...dashboard,
                groupSpend: [dashboard.groupSpend[0]!],
            },
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useDashboard>);

        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        expect(screen.queryByRole('button', { name: /group:/i })).not.toBeInTheDocument();
    });

    it('switches the selected group interactively via the group dropdown filter', () => {
        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        expect(
            screen.getByText(/select one group to view participant shares/i),
        ).toBeInTheDocument();

        // Open popover and select Weekend Trip
        fireEvent.click(screen.getByRole('button', { name: /group:.*all groups/i }));
        fireEvent.click(screen.getByRole('button', { name: 'Weekend Trip' }));

        expect(screen.getByRole('button', { name: /group:.*weekend trip/i })).toBeInTheDocument();
        expect(screen.getByText('You')).toBeInTheDocument();
        expect(
            screen.queryByText(/select one group to view participant shares/i),
        ).not.toBeInTheDocument();

        // Open popover again and select All groups
        fireEvent.click(screen.getByRole('button', { name: /group:.*weekend trip/i }));
        fireEvent.click(screen.getByRole('button', { name: 'All groups' }));

        expect(screen.getByRole('button', { name: /group:.*all groups/i })).toBeInTheDocument();
        expect(
            screen.getByText(/select one group to view participant shares/i),
        ).toBeInTheDocument();
    });

    it('filters group options when searching with more than 5 groups', () => {
        const extraGroups = Array.from({ length: 4 }, (_, index) => ({
            ...dashboard.groupSpend[1]!,
            groupId: `extra-${index}`,
            name: `Extra Group ${index + 1}`,
        }));

        vi.mocked(useDashboard).mockReturnValue({
            data: {
                ...dashboard,
                groupSpend: [...dashboard.groupSpend, ...extraGroups],
            },
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useDashboard>);

        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: /group:.*all groups/i }));
        const searchInput = screen.getByRole('searchbox', { name: /search groups/i });
        expect(searchInput).toBeInTheDocument();

        fireEvent.change(searchInput, { target: { value: 'Dinner' } });
        expect(screen.getByRole('button', { name: 'Dinner' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Weekend Trip' })).not.toBeInTheDocument();

        fireEvent.change(searchInput, { target: { value: 'Nonexistent' } });
        expect(screen.getByText('No groups found')).toBeInTheDocument();
    });

    it('renders the loading skeleton when data is loading', () => {
        vi.mocked(useDashboard).mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useDashboard>);

        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        expect(screen.getByRole('status', { name: /loading analytics/i })).toBeInTheDocument();
    });

    it('renders the error state and triggers refetch on retry', () => {
        const refetch = vi.fn();
        vi.mocked(useDashboard).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
            refetch,
        } as unknown as ReturnType<typeof useDashboard>);

        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('heading', { name: "We couldn't load analytics" }),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /retry/i }));
        expect(refetch).toHaveBeenCalledOnce();
    });

    it('renders the empty state when there are no groups with expenses', () => {
        vi.mocked(useDashboard).mockReturnValue({
            data: {
                actualPaid: 0,
                currentUserShare: 0,
                groupSpend: [],
            },
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useDashboard>);

        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        expect(screen.getByRole('heading', { name: 'No shared spending yet' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /open groups/i })).toHaveAttribute(
            'href',
            '/groups',
        );
    });

    it('renders fallback messaging when groups have zero spending in the current period', () => {
        vi.mocked(useDashboard).mockReturnValue({
            data: {
                actualPaid: 0,
                currentUserShare: 0,
                groupSpend: [
                    {
                        groupId: 'trip',
                        name: 'Trip',
                        amount: 0,
                        actualPaid: 0,
                        currentUserShare: 0,
                        currentBalance: 0,
                        memberShares: [],
                        spendingByMonth: [],
                        spendingByDay: [],
                    },
                    {
                        groupId: 'dinner',
                        name: 'Dinner',
                        amount: 0,
                        actualPaid: 0,
                        currentUserShare: 0,
                        currentBalance: 0,
                        memberShares: [],
                        spendingByMonth: [],
                        spendingByDay: [],
                    },
                ],
            },
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useDashboard>);

        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        // Spending by group, paid versus share, and net position over time all
        // draw from the same empty series.
        expect(screen.getAllByText('No spending in this period.')).toHaveLength(3);
    });

    it('smartly disambiguates participant first names on the participant share chart', () => {
        vi.mocked(useDashboard).mockReturnValue({
            data: {
                ...dashboard,
                groupSpend: [
                    {
                        groupId: 'trip',
                        name: 'Weekend Trip',
                        amount: 300,
                        actualPaid: 300,
                        currentUserShare: 100,
                        currentBalance: 0,
                        memberShares: [
                            {
                                userId: 'u1',
                                name: 'Vijay Srivastava',
                                amount: 100,
                                isCurrentUser: false,
                            },
                            {
                                userId: 'u2',
                                name: 'Vijay Singh',
                                amount: 100,
                                isCurrentUser: false,
                            },
                            {
                                userId: 'u3',
                                name: 'Vijay Tiwari',
                                amount: 100,
                                isCurrentUser: true,
                            },
                        ],
                        spendingByMonth: [],
                        spendingByDay: [],
                    },
                ],
            },
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useDashboard>);

        render(
            <MemoryRouter initialEntries={['/analytics?groupId=trip']}>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        expect(screen.getByText('Vijay Sr')).toBeInTheDocument();
        expect(screen.getByText('Vijay Si')).toBeInTheDocument();
        expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('orders the participant share chart alphabetically with the current user first', () => {
        vi.mocked(useDashboard).mockReturnValue({
            data: {
                ...dashboard,
                groupSpend: [
                    {
                        groupId: 'trip',
                        name: 'Weekend Trip',
                        amount: 400,
                        actualPaid: 400,
                        currentUserShare: 100,
                        currentBalance: 0,
                        memberShares: [
                            { userId: 'u1', name: 'Zoe Tan', amount: 100, isCurrentUser: false },
                            {
                                userId: 'u2',
                                name: 'Priya Sharma',
                                amount: 100,
                                isCurrentUser: false,
                            },
                            { userId: 'u3', name: 'Mira Rao', amount: 100, isCurrentUser: true },
                            { userId: 'u4', name: 'Arun Nair', amount: 100, isCurrentUser: false },
                        ],
                        spendingByMonth: [],
                        spendingByDay: [],
                    },
                ],
            },
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useDashboard>);

        render(
            <MemoryRouter initialEntries={['/analytics?groupId=trip']}>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        // The accessible table mirrors the pie's slice order, and unlike the SVG
        // it is readable in jsdom.
        const shareTable = screen.getByRole('table', { name: /participant share values/i });
        const participants = Array.from(shareTable.querySelectorAll('tbody th')).map(
            (cell) => cell.textContent,
        );
        expect(participants).toEqual(['You', 'Arun', 'Priya', 'Zoe']);
    });

    it('compares paid against share per time bucket, with the resulting balance', () => {
        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: /time period.*overall/i }));
        fireEvent.click(screen.getByRole('button', { name: 'This month' }));

        const table = screen.getByRole('table', { name: /paid versus share values/i });
        const headers = Array.from(table.querySelectorAll('thead th')).map(
            (cell) => cell.textContent,
        );
        expect(headers).toEqual(['Day', 'Paid by you', 'Your share', 'Balance']);

        // 10 Aug: paid 150 against a 100 share across the scoped groups.
        const row = Array.from(table.querySelectorAll('tbody tr')).find(
            (candidate) => candidate.querySelector('th')?.textContent === '10 Aug',
        );
        expect(row?.textContent).toContain('You are owed ₹50.00');

        // 15 Aug: paid 50 against a 50 share.
        const level = Array.from(table.querySelectorAll('tbody tr')).find(
            (candidate) => candidate.querySelector('th')?.textContent === '15 Aug',
        );
        expect(level?.textContent).toContain('Level with your share');
    });

    it('states the closing net position in words alongside the chart', () => {
        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        expect(screen.getByText(/you had fronted .* more than your share/i)).toBeInTheDocument();
    });

    it('reserves width so ten groups stay legible instead of compressing', () => {
        const groups = Array.from({ length: 10 }, (_, index) => ({
            groupId: `group-${index}`,
            name: `Group number ${index}`,
            amount: 100,
            actualPaid: 60,
            currentUserShare: 40,
            currentBalance: 20,
            memberShares: [],
            spendingByMonth: [
                { month: '2026-08', amount: 100, actualPaid: 60, currentUserShare: 40 },
            ],
            spendingByDay: [
                { date: '2026-08-01', amount: 40, actualPaid: 20, currentUserShare: 20 },
                { date: '2026-08-02', amount: 60, actualPaid: 40, currentUserShare: 20 },
            ],
        }));
        vi.mocked(useDashboard).mockReturnValue({
            data: { actualPaid: 600, currentUserShare: 400, groupSpend: groups },
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as unknown as ReturnType<typeof useDashboard>);

        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: /time period.*overall/i }));
        fireEvent.click(screen.getByRole('button', { name: 'This month' }));

        // Clustered by day: two buckets, each wide enough for ten bars.
        const byGroup = screen.getByLabelText('Spending by group chart');
        expect(byGroup).toHaveStyle({ minWidth: '400px' });

        // Also clustered by day, but only two series, so the label sets the width.
        const paidVsShare = screen.getByLabelText('Paid versus share chart');
        expect(paidVsShare).toHaveStyle({ minWidth: '112px' });

        for (const plot of [byGroup, paidVsShare]) {
            // The reserved width has to be absorbed by the scroll container, and
            // the card around it has to be allowed to shrink — a grid item
            // defaults to min-width:auto and would otherwise widen the page
            // instead of letting the plot scroll inside the card.
            expect(plot.parentElement).toHaveClass('overflow-x-auto');
            expect(plot.closest('section')).toHaveClass('min-w-0');
        }
    });

    it('plots spending by group as one series per group across time buckets', () => {
        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        const table = screen.getByRole('table', { name: /spending by group values/i });
        const headers = Array.from(table.querySelectorAll('thead th')).map(
            (cell) => cell.textContent,
        );

        // A time column, then a column per group.
        expect(headers).toEqual(['Month', 'Weekend Trip', 'Dinner']);
    });

    it('buckets spending by month once the range is longer than a month', () => {
        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        fireEvent.click(screen.getByRole('button', { name: /time period.*overall/i }));
        fireEvent.click(screen.getByRole('button', { name: 'This year' }));

        const table = screen.getByRole('table', { name: /spending by group values/i });
        expect(table.querySelector('thead th')?.textContent).toBe('Month');
        expect(table.querySelector('tbody th')?.textContent).toBe('Aug 26');
    });

    it('keeps the value axis and the series key out of the scrolling area', () => {
        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        const plot = screen.getByLabelText('Spending by group chart');
        expect(plot.parentElement).toHaveClass('overflow-x-auto');

        // The key names each series; scrolling through buckets must not carry
        // it off screen.
        const key = screen.getAllByText('Weekend Trip').find((node) => node.tagName === 'LI');
        expect(key).toBeDefined();
        expect(key?.closest('.overflow-x-auto')).toBeNull();

        // Same for the value axis, which is rendered beside the plot rather
        // than inside it.
        const axisTick = screen.getAllByText('₹0').find((node) => node.tagName === 'SPAN');
        expect(axisTick).toBeDefined();
        expect(axisTick?.closest('.overflow-x-auto')).toBeNull();
    });

    it('keeps the axis gutter inside the card rather than widening it', () => {
        render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        const scroller = screen.getByLabelText('Spending by group chart').parentElement!;

        // A left margin here would sit outside the scroller's own 100% width and
        // push the card wider than its column, spilling the plot out of the box.
        expect(scroller.style.marginLeft).toBe('');
        expect(scroller.className).not.toContain('w-full');

        // The gutter belongs to the wrapper, which reserves it from its own width.
        expect(scroller.parentElement?.style.paddingLeft).toBe('58px');
    });

    it('renders one chart per row at every width', () => {
        const { container } = render(
            <MemoryRouter>
                <AnalyticsPage />
            </MemoryRouter>,
        );

        for (const grid of container.querySelectorAll('.grid')) {
            expect(grid.className).not.toMatch(/grid-cols-/);
        }
    });
});
