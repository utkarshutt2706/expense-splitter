import { render, screen } from '@testing-library/react';
import { LineChart } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { ChartFrame } from './ChartFrame';

describe('ChartFrame', () => {
    it('labels the chart section and renders its description, icon, and content', () => {
        const { container } = render(
            <ChartFrame title="Spending trend" description="Changes over time" icon={LineChart}>
                <div>Chart content</div>
            </ChartFrame>,
        );
        expect(screen.getByRole('region', { name: 'Spending trend' })).toBeInTheDocument();
        expect(screen.getByText('Changes over time')).toBeInTheDocument();
        expect(screen.getByText('Chart content')).toBeInTheDocument();
        expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });
});
