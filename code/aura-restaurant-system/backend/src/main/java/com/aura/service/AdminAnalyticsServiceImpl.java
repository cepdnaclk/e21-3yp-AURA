package com.aura.service;

import com.aura.dto.admin.AdminStatsResponse;
import com.aura.dto.admin.RevenueResponse;
import com.aura.system.repositories.OrderRepository;
import com.aura.system.repositories.PaymentRepository;
//import com.aura.service.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsServiceImpl implements AdminAnalyticsService {

    private static final String CURRENCY = "USD";

    private final OrderRepository   orderRepository;
    private final PaymentRepository paymentRepository;

    @Override
    public AdminStatsResponse getStats() {

        float  confirmedRevenue  = paymentRepository.sumByPaymentStatus("paid");
        float  pendingOrderTotal = orderRepository.sumUnpaidOrderTotals();
        long   activeOrders      = orderRepository.countActiveOrders();
        double avgDeliveryMins   = calcAvgDeliveryMins();

        return AdminStatsResponse.builder()
                .confirmedRevenue(round(confirmedRevenue))
                .pendingOrderTotal(round(pendingOrderTotal))
                .activeOrders(activeOrders)
                .avgDeliveryMins(round(avgDeliveryMins))
                .build();
    }

    @Override
    public RevenueResponse getRevenue(String status) {

        float total = paymentRepository.sumByPaymentStatus(status.toLowerCase());

        return RevenueResponse.builder()
                .total(round(total))
                .currency(CURRENCY)
                .build();
    }

    // ─── private helpers ──────────────────────────────────────────────────────

    /**
     * Average delivery time in minutes across all DELIVERED orders.
     *
     * Placeholder — returns 0.0 until you add a `deliveredAt` (LocalDateTime)
     * field to your Order entity. Once added:
     *
     * 1. Add this query to OrderRepository:
     *    @Query("SELECT AVG(FUNCTION('TIMESTAMPDIFF', MINUTE, o.orderTime, o.deliveredAt))
     *            FROM Order o WHERE o.status = 'delivered' AND o.deliveredAt IS NOT NULL")
     *    Double avgDeliveryMinutes();
     *
     * 2. Replace this method body with:
     *    Double avg = orderRepository.avgDeliveryMinutes();
     *    return avg != null ? avg : 0.0;
     *
     * 3. Set order.setDeliveredAt(LocalDateTime.now()) in OrderService
     *    when status changes to "delivered".
     */
    private double calcAvgDeliveryMins() {
        return 0.0;
    }

    /** Rounds to 2 decimal places for clean JSON output. */
    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
