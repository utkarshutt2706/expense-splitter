import { useMutation } from '@tanstack/react-query';

import { changePassword, type ChangePasswordInput } from '@features/auth/api/authApi';

export function useChangePassword() {
    return useMutation({
        mutationFn: (input: ChangePasswordInput) => changePassword(input),
    });
}
