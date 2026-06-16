package com.aura.system.repositories;

import com.aura.system.entities.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    // Find payment for a specific order
    Optional<Payment> findByOrderOrderId(Integer orderId);

    // Find payments by method (e.g. "cash", "card", "online")
    List<Payment> findByPaymentMethod(String paymentMethod);

    // Find payments by status (e.g. "paid", "pending", "failed")
    List<Payment> findByPaymentStatus(String paymentStatus);

    // Find payments in a time range
    List<Payment> findByPaymentTimeBetween(LocalDateTime start, LocalDateTime end);

    // Custom query — total revenue collected in a date range
    @Query("SELECT SUM(p.amount) FROM Payment p " +
           "WHERE p.paymentStatus = 'paid' " +
           "AND p.paymentTime BETWEEN :start AND :end")
    Float calculateTotalRevenue(@Param("start") LocalDateTime start,
                                @Param("end") LocalDateTime end);


       // ── new: admin analytics ─────────────────────────────────────────────────

    /**
     * Total amount for any given payment status (e.g. "paid", "pending").
     * COALESCE returns 0.0 instead of null when no rows match.
     * Used by GET /admin/stats and GET /admin/revenue?status=
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0.0) FROM Payment p WHERE p.paymentStatus = :status")
    Float sumByPaymentStatus(@Param("status") String status);

    /**
     * Get total revenue by payment status.
     * Convenience method for dashboard stats.
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0.0) FROM Payment p WHERE LOWER(p.paymentStatus) = LOWER(:status)")
    Float getTotalRevenueByStatus(@Param("status") String status);
}
