import type { ReactNode } from 'react';

export type AccessibleChartTableProps = Readonly<{
    caption: string;
    headers: string[];
    rows: ReactNode[];
}>;
export function AccessibleChartTable({ caption, headers, rows }: AccessibleChartTableProps) {
    return (
        <div className="fixed top-0 left-0 size-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)]">
            <table>
                <caption>{caption}</caption>
                <thead>
                    <tr>
                        {headers.map((header) => (
                            <th key={header}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>{rows}</tbody>
            </table>
        </div>
    );
}
