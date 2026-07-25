import { Activity, LayoutDashboard, Users, UsersRound } from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
    to: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
}

export const navItems: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/friends', label: 'Friends', icon: Users },
    { to: '/groups', label: 'Groups', icon: UsersRound },
    { to: '/activity', label: 'Activity', icon: Activity },
];

export const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/friends': 'Friends',
    '/groups': 'Groups',
    '/activity': 'Activity',
    '/settings': 'Settings',
};
