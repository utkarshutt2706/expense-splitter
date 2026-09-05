import {
    Activity,
    ChartNoAxesCombined,
    Handshake,
    LayoutDashboard,
    UsersRound,
} from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { navItems, pageTitles } from './navigation';

describe('navigation configuration', () => {
    it('keeps the primary navigation in its intended order', () => {
        expect(navItems.map(({ to, label }) => ({ to, label }))).toEqual([
            { to: '/groups', label: 'Groups' },
            { to: '/dashboard', label: 'Dashboard' },
            { to: '/friends', label: 'Friends' },
            { to: '/analytics', label: 'Analytics' },
            { to: '/activity', label: 'Activity' },
        ]);
    });

    it('associates each navigation destination with its intended icon', () => {
        expect(navItems.map(({ icon }) => icon)).toEqual([
            UsersRound,
            LayoutDashboard,
            Handshake,
            ChartNoAxesCombined,
            Activity,
        ]);
    });

    it('defines the page title for every navigable destination and settings', () => {
        expect(pageTitles).toEqual({
            '/dashboard': 'Dashboard',
            '/friends': 'Friends',
            '/groups': 'Groups',
            '/analytics': 'Analytics',
            '/activity': 'Activity',
            '/settings': 'Settings',
        });

        for (const { to, label } of navItems) {
            expect(pageTitles[to]).toBe(label);
        }
    });

    it('uses unique absolute destinations and labels', () => {
        const destinations = navItems.map(({ to }) => to);
        const labels = navItems.map(({ label }) => label);

        expect(new Set(destinations).size).toBe(destinations.length);
        expect(new Set(labels).size).toBe(labels.length);
        expect(destinations.every((destination) => destination.startsWith('/'))).toBe(true);
    });
});
