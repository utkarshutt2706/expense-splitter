import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ExpenseDetailSkeleton } from './ExpenseDetailSkeleton';

describe('ExpenseDetailSkeleton', () => {
    it('renders two placeholder split rows', () => {
        const { container } = render(<ExpenseDetailSkeleton />);

        expect(container.querySelectorAll('li')).toHaveLength(2);
    });
});
