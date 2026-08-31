import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

export type BalanceDisclosureProps = Readonly<{
    value: string;
    label: string;
    description?: string;
    children: ReactNode;
}>;

export function BalanceDisclosure({ value, label, description, children }: BalanceDisclosureProps) {
    return (
        <Accordion.Root type="single" collapsible>
            <Accordion.Item value={value} className="border-border rounded-xl border">
                <Accordion.Header>
                    <Accordion.Trigger className="group focus-visible:ring-brand-500 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl p-3 text-left outline-none focus-visible:ring-2 sm:p-4">
                        <span>
                            <span className="text-lg font-semibold">{label}</span>
                            {description && (
                                <span className="text-muted-foreground mt-0.5 block text-sm">
                                    {description}
                                </span>
                            )}
                        </span>
                        <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
                    </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="border-border px-3 data-[state=open]:border-t sm:px-4">
                    {children}
                </Accordion.Content>
            </Accordion.Item>
        </Accordion.Root>
    );
}
