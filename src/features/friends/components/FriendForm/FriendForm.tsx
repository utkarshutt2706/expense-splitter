import { zodResolver } from '@hookform/resolvers/zod';
import { Check, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const friendFormSchema = z
    .object({
        name: z.string().trim().min(1, 'Name is required'),
        email: z.string().trim(),
        phone: z.string().trim(),
    })
    .superRefine((values, ctx) => {
        if (values.email && !z.email().safeParse(values.email).success) {
            ctx.addIssue({
                code: 'custom',
                message: 'Enter a valid email address',
                path: ['email'],
            });
        }
        if (!values.email && !values.phone) {
            const message = 'Enter an email or phone number';
            ctx.addIssue({ code: 'custom', message, path: ['email'] });
            ctx.addIssue({ code: 'custom', message, path: ['phone'] });
        }
    });

type FriendFormInput = z.infer<typeof friendFormSchema>;

export interface FriendFormValues {
    name: string;
    email?: string;
    phone?: string;
}

interface FriendFormProps {
    readonly mode: 'add' | 'edit';
    readonly initialValues?: FriendFormValues;
    readonly onSubmit: (values: FriendFormValues) => void;
    readonly onCancel: () => void;
}

export function FriendForm({ mode, initialValues, onSubmit, onCancel }: FriendFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FriendFormInput>({
        resolver: zodResolver(friendFormSchema),
        defaultValues: {
            name: initialValues?.name ?? '',
            email: initialValues?.email ?? '',
            phone: initialValues?.phone ?? '',
        },
    });

    const submit = handleSubmit((values) => {
        onSubmit({
            name: values.name,
            email: values.email || undefined,
            phone: values.phone || undefined,
        });
    });

    return (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="friend-name"
                    className="text-sm font-medium text-surface-foreground"
                >
                    Name
                </label>
                <input
                    id="friend-name"
                    type="text"
                    placeholder="Enter friend's name"
                    {...register('name')}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                />
                {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="friend-email"
                    className="text-sm font-medium text-surface-foreground"
                >
                    Email
                </label>
                <input
                    id="friend-email"
                    type="email"
                    placeholder="Enter friend's email"
                    {...register('email')}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
                <label
                    htmlFor="friend-phone"
                    className="text-sm font-medium text-surface-foreground"
                >
                    Phone
                </label>
                <input
                    id="friend-phone"
                    type="tel"
                    placeholder="Enter friend's phone number"
                    {...register('phone')}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                />
                {errors.phone && <p className="text-xs text-red-600">{errors.phone.message}</p>}
            </div>
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm font-medium text-surface-foreground hover:bg-muted"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                    {mode === 'add' ? (
                        <UserPlus className="size-4" />
                    ) : (
                        <Check className="size-4" />
                    )}
                    {mode === 'add' ? 'Add friend' : 'Save changes'}
                </button>
            </div>
        </form>
    );
}
