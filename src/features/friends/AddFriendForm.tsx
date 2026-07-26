import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const addFriendSchema = z.object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z
        .string()
        .trim()
        .min(1, 'Email is required')
        .email({ message: 'Enter a valid email address' }),
});

export type AddFriendFormValues = z.infer<typeof addFriendSchema>;

interface AddFriendFormProps {
    onSubmit: (values: AddFriendFormValues) => void;
    onCancel: () => void;
}

export function AddFriendForm({ onSubmit, onCancel }: AddFriendFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AddFriendFormValues>({ resolver: zodResolver(addFriendSchema) });

    const submit = handleSubmit((values) => {
        onSubmit(values);
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
                    <UserPlus className="size-4" />
                    Add friend
                </button>
            </div>
        </form>
    );
}
