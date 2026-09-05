import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContributionTooltip } from './ContributionTooltip';

describe('ContributionTooltip', () => {
    it('renders nothing while inactive or without a datum', () => {
        const view = render(<ContributionTooltip active={false} />);
        expect(view.container).toBeEmptyDOMElement();
        view.rerender(<ContributionTooltip active />);
        expect(view.container).toBeEmptyDOMElement();
    });

    it.each([
        [120, 50, /you are owed/i],
        [40, 90, /you owe/i],
        [75, 75, /level with your share/i],
    ])(
        'shows paid, share, and balance details for %s paid and %s share',
        (paid, share, balance) => {
            render(
                <ContributionTooltip
                    active
                    label="Aug 26"
                    payload={[{ payload: { name: 'Aug 26', paid, share } }]}
                />,
            );
            expect(screen.getByText('Aug 26')).toBeInTheDocument();
            expect(screen.getByText(balance)).toBeInTheDocument();
            expect(screen.getByText(/paid by you/i).nextElementSibling).toHaveTextContent(
                String(paid),
            );
            expect(screen.getByText(/^your share$/i).nextElementSibling).toHaveTextContent(
                String(share),
            );
        },
    );
});
