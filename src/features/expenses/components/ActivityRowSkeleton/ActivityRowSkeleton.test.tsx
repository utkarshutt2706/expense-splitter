import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ActivityRowSkeleton } from './ActivityRowSkeleton';

describe('ActivityRowSkeleton', () => {
    it('renders inside a list item, ready to sit in an activity list', () => {
        const { container } = render(
            <ul>
                <ActivityRowSkeleton />
            </ul>,
        );

        expect(container.querySelector('li')).toBeInTheDocument();
    });
});
