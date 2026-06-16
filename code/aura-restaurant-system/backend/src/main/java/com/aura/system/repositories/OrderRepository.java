package com.aura.system.repositories;

import com.aura.system.entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    // Find orders by status (e.g. "pending", "completed")
    List<Order> findByStatus(String status);

    // Find all orders for a specific table
    List<Order> findByTableTableId(Integer tableId);

    // Find orders placed between two timestamps
    List<Order> findByOrderTimeBetween(LocalDateTime start, LocalDateTime end);

    // Find orders above a certain total amount
    List<Order> findByTotalAmountGreaterThanEqual(Float amount);

    List<Order> findByWalkInSessionId(Long walkInSessionId);

    // Custom query — find today's orders
    @Query("SELECT o FROM Order o WHERE o.orderTime >= :startOfDay AND o.orderTime < :endOfDay")
    List<Order> findTodaysOrders(
        @Param("startOfDay") LocalDateTime startOfDay,
        @Param("endOfDay") LocalDateTime endOfDay
    );
    // Custom query — total revenue for a date range
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.orderTime BETWEEN :start AND :end")
    Float calculateRevenueBetween(@Param("start") LocalDateTime start,
                                  @Param("end") LocalDateTime end);
        
    // ── new: admin analytics ─────────────────────────────────────────────────

    /**
     * Counts orders whose status is PENDING or PREPARING.
     * These are the "in-flight" orders visible on the kitchen dashboard.
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.status IN ('pending', 'preparing')")
    long countActiveOrders();

    /**
     * Sums totalAmount for orders that have no matching PAID payment.
     * NOT EXISTS handles the case where the payment row is missing entirely.
     * COALESCE returns 0.0 instead of null when no unpaid orders exist.
     */
    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM Order o
        WHERE NOT EXISTS (
            SELECT 1 FROM Payment p
            WHERE p.order = o AND p.paymentStatus = 'paid'
        )
        """)
    Float sumUnpaidOrderTotals();

    @Query("""
    SELECT o FROM Order o
    WHERE o.status = 'DELIVERED'
    AND o.deliveredAt >= :since
    ORDER BY o.deliveredAt DESC
    """)
    List<Order> findDeliveredSince(@Param("since") LocalDateTime since);

    @Query("SELECT o FROM Order o WHERE o.table.tableId = :tableId AND o.status <> :status")
    List<Order> findUnpaidByTableId(
        @Param("tableId") Integer tableId,
        @Param("status") String status
    );

    
}
