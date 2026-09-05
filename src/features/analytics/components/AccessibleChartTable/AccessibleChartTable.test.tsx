import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AccessibleChartTable } from './AccessibleChartTable';

describe('AccessibleChartTable', () => {
    it('renders the supplied caption, headers, and semantic rows', () => {
        render(
            <AccessibleChartTable
                caption="Spending values"
                headers={['Month', 'Amount']}
                rows={[
                    <tr key="aug">
                        <th>Aug 26</th>
                        <td>₹100.00</td>
                    </tr>,
                ]}
            />,
        );
        expect(screen.getByRole('table', { name: 'Spending values' })).toBeInTheDocument();
        expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
            'Month',
            'Amount',
            'Aug 26',
        ]);
        expect(screen.getByRole('cell', { name: '₹100.00' })).toBeInTheDocument();
    });
});
