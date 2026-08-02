import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GroupDetailHeaderSkeleton } from './GroupDetailHeaderSkeleton';

describe('GroupDetailHeaderSkeleton', () => {
    it('renders the member avatars placeholder alongside the name and button placeholders', () => {
        const { container } = render(<GroupDetailHeaderSkeleton />);

        expect(container.querySelectorAll(':scope > *')).toHaveLength(3);
    });
});
