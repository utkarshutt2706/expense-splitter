import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@app/stores';
import { login, type LoginInput } from '@features/auth/api/authApi';

export function useLogin() {
    const commitSession = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: (input: LoginInput) => login(input),
        onSuccess: ({ user, accessToken }) => {
            commitSession(user, accessToken);
        },
    });
}
