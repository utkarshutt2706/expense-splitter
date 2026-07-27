import { expenseRepository, groupRepository, userRepository } from '@data/db';
import { ExpenseService } from './expenseService';
import { GroupService } from './groupService';
import { UserService } from './userService';

export const userService = new UserService(userRepository);
export const groupService = new GroupService(groupRepository);
export const expenseService = new ExpenseService(expenseRepository);
