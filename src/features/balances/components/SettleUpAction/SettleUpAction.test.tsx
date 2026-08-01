import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { SettleUpAction } from './SettleUpAction';

describe('SettleUpAction', () => {
    it('links to the group balance page', () => {
        render(
            <MemoryRouter>
                <SettleUpAction groupId="group-1" />
            </MemoryRouter>,
        );

        expect(screen.getByRole('link', { name: 'Settle up' })).toHaveAttribute(
            'href',
            '/groups/group-1/balance',
        );
    });
});
