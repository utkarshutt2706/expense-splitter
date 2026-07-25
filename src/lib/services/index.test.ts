import { describe, expect, it } from 'vitest';
import { expenseService, groupService, userService } from './index';
import { ExpenseService } from './expenseService';
import { GroupService } from './groupService';
import { UserService } from './userService';

describe('service instances', () => {
    it('wires up services with the shared repositories', () => {
        expect(userService).toBeInstanceOf(UserService);
        expect(groupService).toBeInstanceOf(GroupService);
        expect(expenseService).toBeInstanceOf(ExpenseService);
    });
});
