/**
 * Shared formatting and status utility functions.
 *
 * [API ENDPOINT]: GET /api/v1/orders, GET /api/v1/admin/stats
 * [DATA SYNC]: Keep display formatting and status color mapping centralized
 * so Robot, Kitchen, and Admin render backend data consistently.
 */

export function formatPrice(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

export function formatTime(isoString) {
    return new Date(isoString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function getTimeSince(isoString) {
    const seconds = Math.floor((new Date() - new Date(isoString).getTime()) / 1000);
    console.log('Time since', isoString, 'is', seconds, 'seconds', 'now is', new Date());
    if(seconds < 0) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}

export function getStatusColor(status) {
    const normalized = String(status || '').toLowerCase();
    const colors = {
        pending: { bg: 'bg-neon-cyan/10', text: 'text-neon-cyan', dot: 'bg-neon-cyan' },
        new: { bg: 'bg-neon-cyan/10', text: 'text-neon-cyan', dot: 'bg-neon-cyan' },
        preparing: { bg: 'bg-neon-orange/10', text: 'text-neon-orange', dot: 'bg-neon-orange' },
        ready: { bg: 'bg-neon-green/10', text: 'text-neon-green', dot: 'bg-neon-green' },
        delivered: { bg: 'bg-aura-500/10', text: 'text-aura-400', dot: 'bg-aura-400' },
        completed: { bg: 'bg-aura-500/10', text: 'text-aura-400', dot: 'bg-aura-400' },
        cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
    };
    return colors[normalized] || colors.new;
}
