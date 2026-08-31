import * as Popover from '@radix-ui/react-popover';
import { Copy, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

import { ResponsivePopoverContent } from '@shared/components';

function isMobileDevice(): boolean {
    const navigatorWithUserAgentData = navigator as Navigator & {
        userAgentData?: { mobile?: boolean };
    };
    if (typeof navigatorWithUserAgentData.userAgentData?.mobile === 'boolean') {
        return navigatorWithUserAgentData.userAgentData.mobile;
    }
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export type ContactActionProps = Readonly<{
    friendName: string;
    kind: 'email' | 'phone';
    value: string;
}>;

export function ContactAction({ friendName, kind, value }: ContactActionProps) {
    const mobile = isMobileDevice();
    const Icon = kind === 'email' ? Mail : Phone;
    const label =
        kind === 'email' ? `Email ${friendName} at ${value}` : `Call ${friendName} at ${value}`;
    const nativeAction = kind === 'email' ? `mailto:${value}` : `tel:${value}`;

    async function copyContact() {
        const contactLabel = kind === 'email' ? 'Email address' : 'Phone number';
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${contactLabel} copied to clipboard.`);
        } catch {
            toast.error(`Could not copy the ${contactLabel.toLocaleLowerCase()}.`);
        }
    }

    const trigger = (
        <button
            type="button"
            aria-label={mobile ? `${label}; choose an action` : `${label}; copy ${kind}`}
            onClick={mobile ? undefined : () => void copyContact()}
            className="hover:text-surface-foreground focus-visible:ring-brand-500 inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none sm:min-h-0"
        >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="min-w-0 break-all">{value}</span>
        </button>
    );

    if (!mobile) return trigger;

    return (
        <Popover.Root>
            <Popover.Trigger asChild>{trigger}</Popover.Trigger>
            <Popover.Portal>
                <ResponsivePopoverContent
                    align="start"
                    sideOffset={8}
                    aria-label={`Choose an action for ${value}`}
                    className="border-border bg-surface z-50 w-56 rounded-lg border p-2 shadow-lg"
                >
                    <button
                        type="button"
                        onClick={() => void copyContact()}
                        className="hover:bg-muted focus-visible:bg-muted flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left outline-none"
                    >
                        <Copy aria-hidden="true" className="size-4" />
                        Copy {kind}
                    </button>
                    <a
                        href={nativeAction}
                        className="hover:bg-muted focus-visible:bg-muted flex min-h-11 items-center gap-3 rounded-md px-3 outline-none"
                    >
                        <Icon aria-hidden="true" className="size-4" />
                        {kind === 'email' ? 'Send email' : 'Call phone'}
                    </a>
                </ResponsivePopoverContent>
            </Popover.Portal>
        </Popover.Root>
    );
}
