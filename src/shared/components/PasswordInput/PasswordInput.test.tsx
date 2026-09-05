import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
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

    it('forwards the input ref and custom class', () => {
        const ref = createRef<HTMLInputElement>();
        render(<PasswordInput ref={ref} aria-label="Password" className="custom-input" />);

        expect(ref.current).toBe(screen.getByLabelText('Password'));
        expect(ref.current).toHaveClass('custom-input');
    });

    it('disables visibility changes when the password input is disabled', async () => {
        const user = userEvent.setup();
        render(<PasswordInput aria-label="Password" disabled />);

        const toggle = screen.getByRole('button', { name: /show password/i });
        expect(toggle).toBeDisabled();
        await user.click(toggle);

        expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });
});
