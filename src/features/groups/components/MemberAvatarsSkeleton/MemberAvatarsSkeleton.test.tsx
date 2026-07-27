import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MemberAvatarsSkeleton } from './MemberAvatarsSkeleton';

describe('MemberAvatarsSkeleton', () => {
    it('renders as decorative, hidden from assistive tech', () => {
        const { container } = render(<MemberAvatarsSkeleton />);

        expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    it('renders three placeholder avatars for the mobile row and six for desktop', () => {
        const { container } = render(<MemberAvatarsSkeleton />);

        const mobileRow = container.querySelector('.flex.-space-x-3.md\\:hidden');
        const desktopRow = container.querySelector('.hidden.-space-x-3.md\\:flex');

        expect(mobileRow?.children).toHaveLength(3);
        expect(desktopRow?.children).toHaveLength(6);
    });
});
