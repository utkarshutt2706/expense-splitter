import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';

describe('AnalyticsSkeleton', () => {
    it('announces analytics loading and renders the expected placeholders', () => {
        const { container } = render(<AnalyticsSkeleton />);
        expect(screen.getByRole('status', { name: 'Loading analytics' })).toBeInTheDocument();
        expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4);
    });
});
