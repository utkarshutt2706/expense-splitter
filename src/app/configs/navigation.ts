import {
    Activity,
    ChartNoAxesCombined,
    Handshake,
    LayoutDashboard,
    UsersRound,
} from 'lucide-react';
import type { ComponentType } from 'react';

export interface NavItem {
    to: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
}

// Groups leads because it is the landing page and the screen a daily user comes
// back to; the rest keep their previous relative order.
export const navItems: NavItem[] = [
    { to: '/groups', label: 'Groups', icon: UsersRound },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/friends', label: 'Friends', icon: Handshake },
    { to: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
    { to: '/activity', label: 'Activity', icon: Activity },
];

export const pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/friends': 'Friends',
    '/groups': 'Groups',
    '/analytics': 'Analytics',
    '/activity': 'Activity',
    '/settings': 'Settings',
};
