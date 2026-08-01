import { describe, expect, it } from 'vitest';

import { ExpenseService } from './expenseService';
import { GroupService } from './groupService';
import { expenseService, groupService, paymentService, userService } from './instances';
import { PaymentService } from './paymentService';
import { UserService } from './userService';

describe('service instances', () => {
    it('wires up services with the shared repositories', () => {
        expect(userService).toBeInstanceOf(UserService);
        expect(groupService).toBeInstanceOf(GroupService);
        expect(expenseService).toBeInstanceOf(ExpenseService);
        expect(paymentService).toBeInstanceOf(PaymentService);
    });
});
