import { Activity, LayoutDashboard, Settings, Users, UsersRound } from 'lucide-react';
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
    { to: '/settings', label: 'Settings', icon: Settings },
];
