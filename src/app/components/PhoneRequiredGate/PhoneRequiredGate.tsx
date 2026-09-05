import { useMutation } from '@tanstack/react-query';
import { Loader2, Phone } from 'lucide-react';
import { type SubmitEvent, useState } from 'react';
import { z } from 'zod';

import { useAuthStore } from '@app/stores';
import { updateUser } from '@features/users/api/usersApi';
import { FormDialog } from '@shared/components';
import { sanitizePhoneInput } from '@shared/utils';

const phoneGateSchema = z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, {
        message: 'Enter a valid 10-digit number starting with 6, 7, 8, or 9',
    });

export function PhoneRequiredGate({ currentUserId }: Readonly<{ currentUserId: string }>) {
    const [phone, setPhone] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const updateCachedUser = useAuthStore((state) => state.updateCachedUser);
    const { mutateAsync, isPending } = useMutation({
        mutationFn: async (value: string) => updateUser(currentUserId, { phone: value }),
        onSuccess: (updatedUser) => {
            updateCachedUser({ phone: updatedUser.phone });
        },
    });

    const submit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        const sanitized = sanitizePhoneInput(phone);
        const result = phoneGateSchema.safeParse(sanitized);

        if (!result.success) {
            setFormError(result.error.issues[0]!.message);
            return;
        }

        setFormError(null);
        try {
            await mutateAsync(result.data);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Something went wrong.';
            setFormError(message);
        }
    };

    return (
        <FormDialog
            open
            onOpenChange={() => undefined}
            title="Add your phone number"
            description="We need your phone number before you can keep using Expense Splitter."
            showDescription
            isPending={isPending}
        >
            <form onSubmit={submit} noValidate className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="phone-required-input"
                        className="text-surface-foreground text-sm font-medium"
                    >
                        Phone
                    </label>
                    <input
                        id="phone-required-input"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                        value={phone}
                        onChange={(event) => {
                            const nextValue = sanitizePhoneInput(event.target.value);
                            setPhone(nextValue);
                            if (formError) setFormError(null);
                        }}
                        className="border-border bg-surface text-surface-foreground focus-visible:ring-brand-500 rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2"
                    />
                </div>

                {formError && <p className="text-xs text-red-600">{formError}</p>}

                <button
                    type="submit"
                    disabled={isPending}
                    className="bg-brand-600 hover:bg-brand-700 inline-flex cursor-pointer items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Phone className="size-4" />
                    )}
                    {isPending ? 'Saving…' : 'Save and continue'}
                </button>
            </form>
        </FormDialog>
    );
}
