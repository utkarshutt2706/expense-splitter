import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { PasswordInput } from './PasswordInput';

describe('PasswordInput', () => {
    it('masks the value by default', () => {
        render(<PasswordInput aria-label="Password" />);

        expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });

    it('reveals the value when the show button is clicked, and re-masks it on a second click', async () => {
        const user = userEvent.setup();
        render(<PasswordInput aria-label="Password" />);

        await user.click(screen.getByRole('button', { name: /show password/i }));

        expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');

        await user.click(screen.getByRole('button', { name: /hide password/i }));

        expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });

    it('forwards other input props such as id and autoComplete', () => {
        render(<PasswordInput id="login-password" autoComplete="current-password" />);

        const input = document.getElementById('login-password');
        expect(input).toHaveAttribute('autoComplete', 'current-password');
    });
});
