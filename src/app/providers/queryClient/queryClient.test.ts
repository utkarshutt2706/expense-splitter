import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it } from 'vitest';

import { queryClient } from './queryClient';

describe('queryClient', () => {
    afterEach(() => {
        queryClient.clear();
    });

    it('is a QueryClient instance', () => {
        expect(queryClient).toBeInstanceOf(QueryClient);
    });

    it('serves as a shared cache for application query data', () => {
        const key = ['current-user'] as const;

        queryClient.setQueryData(key, { id: 'user-1' });

        expect(queryClient.getQueryData(key)).toEqual({ id: 'user-1' });
    });
});
