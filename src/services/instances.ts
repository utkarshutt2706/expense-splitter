import { expenseRepository, groupRepository, paymentRepository, userRepository } from '@data/db';
import { ExpenseService } from './expenseService';
import { GroupService } from './groupService';
import { PaymentService } from './paymentService';
import { UserService } from './userService';

export const userService = new UserService(userRepository);
export const groupService = new GroupService(groupRepository);
export const expenseService = new ExpenseService(expenseRepository);
export const paymentService = new PaymentService(paymentRepository);
