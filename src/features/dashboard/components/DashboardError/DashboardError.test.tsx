import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardError } from './DashboardError';

describe('DashboardError', () => {
    it('explains the safe failure state and retries on request', () => {
        const onRetry = vi.fn();
        render(<DashboardError onRetry={onRetry} />);
        expect(
            screen.getByRole('heading', { name: "We couldn't load your dashboard" }),
        ).toBeInTheDocument();
        expect(screen.getByText(/expenses have not been changed/i)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        expect(onRetry).toHaveBeenCalledOnce();
    });
});
