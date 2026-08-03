import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@app/stores';
import { register, type RegisterInput } from '@features/auth/api/authApi';

export function useRegister() {
    const commitSession = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: (input: RegisterInput) => register(input),
        onSuccess: ({ user, accessToken }) => {
            commitSession(user, accessToken);
        },
    });
}
