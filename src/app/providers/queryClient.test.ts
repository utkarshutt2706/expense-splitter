import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { queryClient } from './queryClient';

describe('queryClient', () => {
    it('is a QueryClient instance', () => {
        expect(queryClient).toBeInstanceOf(QueryClient);
    });
});
