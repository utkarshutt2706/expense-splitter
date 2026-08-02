import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MemberListSkeleton } from './MemberListSkeleton';

describe('MemberListSkeleton', () => {
    it('renders as decorative, hidden from assistive tech', () => {
        const { container } = render(<MemberListSkeleton />);

        expect(container.querySelector('ul[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('renders three placeholder rows by default', () => {
        const { container } = render(<MemberListSkeleton />);

        expect(container.querySelectorAll('li')).toHaveLength(3);
    });

    it('renders the given number of placeholder rows', () => {
        const { container } = render(<MemberListSkeleton count={5} />);

        expect(container.querySelectorAll('li')).toHaveLength(5);
    });
});
