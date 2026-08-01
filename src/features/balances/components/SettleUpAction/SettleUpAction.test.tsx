import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SettleUpAction } from './SettleUpAction';

describe('SettleUpAction', () => {
    it('renders a disabled "Settle up" button', () => {
        render(<SettleUpAction />);

        expect(screen.getByRole('button', { name: 'Settle up' })).toBeDisabled();
    });
});
