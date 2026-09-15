import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatPrice, formatTime, formatDate, getTimeSince, getStatusColor } from '../helpers';

describe('helpers', () => {
    describe('formatPrice', () => {
        it('formats 1000 as LKR currency string', () => {
            const formatted = formatPrice(1000);
            expect(formatted).toMatch(/LKR|Rs\.?/i);
            expect(formatted).toContain('1,000');
        });
        it('formats 0 correctly', () => {
            expect(formatPrice(0)).toContain('0');
        });
        it('formats negative amount', () => {
            const formatted = formatPrice(-500);
            expect(formatted).toContain('500');
            expect(formatted).toMatch(/-|\(/);
        });
        it('formats decimal amount', () => {
            expect(formatPrice(150.5)).toContain('150.50');
        });
    });

    describe('formatTime', () => {
        it('formats ISO string to time (check it returns a string with AM/PM)', () => {
            const iso = new Date('2023-01-01T15:30:00Z').toISOString();
            const time = formatTime(iso);
            expect(time).toMatch(/AM|PM/i);
        });
    });

    describe('formatDate', () => {
        it('formats ISO string to date (check month, day, year present)', () => {
            const iso = new Date('2023-01-01T15:30:00Z').toISOString();
            const date = formatDate(iso);
            expect(date).toMatch(/Jan/i);
            expect(date).toContain('1');
            expect(date).toContain('2023');
        });
    });

    describe('getTimeSince', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));
        });
        afterEach(() => {
            vi.useRealTimers();
        });

        it("future date returns 'just now'", () => {
            const future = new Date('2023-01-01T12:01:00Z').toISOString();
            expect(getTimeSince(future)).toBe('just now');
        });
        it("30 seconds ago returns '30s ago'", () => {
            const past = new Date('2023-01-01T11:59:30Z').toISOString();
            expect(getTimeSince(past)).toBe('30s ago');
        });
        it("5 minutes ago returns '5m ago'", () => {
            const past = new Date('2023-01-01T11:55:00Z').toISOString();
            expect(getTimeSince(past)).toBe('5m ago');
        });
        it("2 hours ago returns '2h ago'", () => {
            const past = new Date('2023-01-01T10:00:00Z').toISOString();
            expect(getTimeSince(past)).toBe('2h ago');
        });
    });

    describe('getStatusColor', () => {
        it("'pending' returns correct colors object", () => {
            const colors = getStatusColor('pending');
            expect(colors.bg).toBe('bg-neon-cyan/10');
            expect(colors.text).toBe('text-neon-cyan');
        });
        it("'preparing' returns orange colors", () => {
            const colors = getStatusColor('preparing');
            expect(colors.bg).toContain('bg-neon-orange');
        });
        it("'ready' returns green colors", () => {
            const colors = getStatusColor('ready');
            expect(colors.bg).toContain('bg-neon-green');
        });
        it("'delivered' returns aura colors", () => {
            const colors = getStatusColor('delivered');
            expect(colors.bg).toContain('bg-aura-500');
        });
        it("'cancelled' returns red colors", () => {
            const colors = getStatusColor('cancelled');
            expect(colors.bg).toContain('bg-red-500');
        });
        it("unknown status returns default (new) colors", () => {
            const colors = getStatusColor('unknown_status');
            expect(colors.bg).toBe('bg-neon-cyan/10');
        });
        it("null/undefined returns default colors", () => {
            expect(getStatusColor(null).bg).toBe('bg-neon-cyan/10');
            expect(getStatusColor(undefined).bg).toBe('bg-neon-cyan/10');
        });
        it("case insensitive ('PENDING' works)", () => {
            const colors = getStatusColor('PENDING');
            expect(colors.bg).toBe('bg-neon-cyan/10');
        });
    });
});
