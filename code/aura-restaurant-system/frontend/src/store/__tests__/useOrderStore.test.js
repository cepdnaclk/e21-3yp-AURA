import { describe, it, expect, beforeEach } from 'vitest';
import useOrderStore from '../useOrderStore';

describe('useOrderStore', () => {
    beforeEach(() => {
        useOrderStore.setState({ orders: [] });
    });

    describe('addOrder', () => {
        it("creates order with generated ID (starts with 'ORD-')", () => {
            const { addOrder } = useOrderStore.getState();
            const newOrder = addOrder({ items: [] });
            expect(newOrder.id).toMatch(/^ORD-/);
        });
        it('calculates totalAmount correctly (price * quantity for each item)', () => {
            const { addOrder } = useOrderStore.getState();
            const order = addOrder({ items: [{ price: 100, quantity: 2 }, { price: 50, quantity: 3 }] });
            expect(order.totalAmount).toBe(350);
        });
        it("sets default tableNumber 'T1'", () => {
            const { addOrder } = useOrderStore.getState();
            const order = addOrder({ items: [] });
            expect(order.tableNumber).toBe('T1');
        });
        it("sets status to 'new'", () => {
            const { addOrder } = useOrderStore.getState();
            const order = addOrder({ items: [] });
            expect(order.status).toBe('new');
        });
        it('adds order to front of array', () => {
            const { addOrder } = useOrderStore.getState();
            addOrder({ items: [{ price: 10, quantity: 1 }], notes: 'first' });
            addOrder({ items: [{ price: 20, quantity: 1 }], notes: 'second' });
            const { orders } = useOrderStore.getState();
            expect(orders[0].notes).toBe('second');
            expect(orders[1].notes).toBe('first');
        });
    });

    describe('updateOrderStatus', () => {
        it('updates correct order status', () => {
            const { addOrder, updateOrderStatus } = useOrderStore.getState();
            const order = addOrder({ items: [] });
            updateOrderStatus(order.id, 'preparing');
            const { orders } = useOrderStore.getState();
            expect(orders[0].status).toBe('preparing');
        });
        it('does not affect other orders', () => {
            const { addOrder, updateOrderStatus } = useOrderStore.getState();
            const order1 = addOrder({ items: [] });
            const order2 = addOrder({ items: [] });
            updateOrderStatus(order2.id, 'ready');
            const { orders } = useOrderStore.getState();
            const updatedOrder1 = orders.find(o => o.id === order1.id);
            expect(updatedOrder1.status).toBe('new');
        });
    });

    describe('removeOrder', () => {
        it('removes order by ID', () => {
            const { addOrder, removeOrder } = useOrderStore.getState();
            const order = addOrder({ items: [] });
            removeOrder(order.id);
            const { orders } = useOrderStore.getState();
            expect(orders.length).toBe(0);
        });
        it('no effect for non-existent ID', () => {
            const { addOrder, removeOrder } = useOrderStore.getState();
            addOrder({ items: [] });
            removeOrder('fake-id');
            const { orders } = useOrderStore.getState();
            expect(orders.length).toBe(1);
        });
    });

    describe('getActiveOrders', () => {
        it("excludes 'completed' and 'cancelled'", () => {
            const { addOrder, updateOrderStatus, getActiveOrders } = useOrderStore.getState();
            const order1 = addOrder({ items: [] });
            const order2 = addOrder({ items: [] });
            const order3 = addOrder({ items: [] });
            updateOrderStatus(order2.id, 'completed');
            updateOrderStatus(order3.id, 'cancelled');
            
            const active = getActiveOrders();
            expect(active.length).toBe(1);
            expect(active[0].id).toBe(order1.id);
        });
    });

    describe('getOrdersByStatus', () => {
        it('filters correctly', () => {
            const { addOrder, updateOrderStatus, getOrdersByStatus } = useOrderStore.getState();
            const order = addOrder({ items: [] });
            updateOrderStatus(order.id, 'preparing');
            
            const preparing = getOrdersByStatus('preparing');
            expect(preparing.length).toBe(1);
            expect(preparing[0].id).toBe(order.id);
            
            const ready = getOrdersByStatus('ready');
            expect(ready.length).toBe(0);
        });
    });

    describe('getTotalRevenue', () => {
        it("sums only 'completed' orders", () => {
            const { addOrder, updateOrderStatus, getTotalRevenue } = useOrderStore.getState();
            const order1 = addOrder({ items: [{ price: 100, quantity: 1 }] });
            const order2 = addOrder({ items: [{ price: 200, quantity: 1 }] });
            updateOrderStatus(order1.id, 'completed');
            
            const revenue = getTotalRevenue();
            expect(revenue).toBe(100);
        });
        it('returns 0 when no completed orders', () => {
            const { addOrder, getTotalRevenue } = useOrderStore.getState();
            addOrder({ items: [{ price: 100, quantity: 1 }] });
            
            const revenue = getTotalRevenue();
            expect(revenue).toBe(0);
        });
    });

    describe('clearOrders', () => {
        it('resets to empty array', () => {
            const { addOrder, clearOrders } = useOrderStore.getState();
            addOrder({ items: [] });
            clearOrders();
            const { orders } = useOrderStore.getState();
            expect(orders.length).toBe(0);
        });
    });
});
