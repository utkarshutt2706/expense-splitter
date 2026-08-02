import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GroupBalanceListSkeleton } from './GroupBalanceListSkeleton';

describe('GroupBalanceListSkeleton', () => {
    it('renders three placeholder rows by default', () => {
        const { container } = render(<GroupBalanceListSkeleton />);

        expect(container.querySelectorAll(':scope > div')).toHaveLength(3);
    });

    it('renders the given number of placeholder rows', () => {
        const { container } = render(<GroupBalanceListSkeleton count={5} />);

        expect(container.querySelectorAll(':scope > div')).toHaveLength(5);
    });
});
