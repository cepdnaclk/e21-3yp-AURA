package com.aura.service;

import com.aura.dto.admin.AdminStatsResponse;
import com.aura.dto.admin.RevenueResponse;
import com.aura.dto.admin.StaffResponse;
import java.util.List;
public interface AdminAnalyticsService {

    /**
     * Returns a live snapshot of restaurant metrics:
     * confirmed revenue, pending order total, active order count,
     * and average delivery time in minutes.
     */
    AdminStatsResponse getStats();

    /**
     * Returns the total payment amount filtered by the given status.
     * Status is case-insensitive — "PAID", "paid", and "Paid" all work.
     *
     * @param status  payment status string (e.g. "paid", "pending")
     */
    RevenueResponse getRevenue(String status);
    List<StaffResponse> getStaffList();
}
