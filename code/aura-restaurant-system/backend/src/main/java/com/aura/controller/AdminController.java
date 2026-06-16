package com.aura.controller;

import com.aura.dto.AuthDtos.AuthResponse;
import com.aura.dto.AuthDtos.StaffCreateRequest;
import com.aura.dto.admin.AdminStatsResponse;
import com.aura.dto.admin.RevenueResponse;
import com.aura.service.AdminAnalyticsService;
import com.aura.service.AuthService;

import io.swagger.v3.oas.annotations.Operation;
//import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
//@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminAnalyticsService adminAnalyticsService;
    private final AuthService authService;

    /**
     * GET /api/admin/stats
     *
     * Response:
     * {
     *   "confirmedRevenue": 12450.25,
     *   "pendingOrderTotal": 320.75,
     *   "activeOrders": 9,
     *   "avgDeliveryMins": 4.2
     * }
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminAnalyticsService.getStats());
    }

    /**
     * GET /api/admin/revenue?status=PAID
     *
     * status param is case-insensitive — PAID, paid, Paid all work.
     * Defaults to "PAID" if the param is omitted.
     *
     * Response:
     * {
     *   "total": 12450.25,
     *   "currency": "USD"
     * }
     */
    @GetMapping("/revenue")
    public ResponseEntity<RevenueResponse> getRevenue(
            @RequestParam(defaultValue = "PAID") String status) {

        return ResponseEntity.ok(adminAnalyticsService.getRevenue(status));
    }

    // ─── Staff Management ────────────────────────────────────────────────────

    /**
     * POST /api/admin/staff/register
     *
     * Creates a new STAFF, KITCHEN, or ADMIN account.
     * CUSTOMER and TABLE roles are rejected with 400.
     *
     * Request:
     * {
     *   "username":  "chef_bob",
     *   "password":  "secure123",
     *   "firstName": "Bob",
     *   "lastName":  "Chef",
     *   "email":     "bob@aura.com",
     *   "phone":     "123-456-7890",
     *   "role":      "KITCHEN"
     * }
     *
     * Response 201:
     * {
     *   "token":     "eyJ...",
     *   "username":  "chef_bob",
     *   "role":      "KITCHEN",
     *   "expiresIn": 86400
     * }
     */
    @PostMapping("/staff/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Admin — create a new staff account (STAFF, KITCHEN, or ADMIN)")
    public ResponseEntity<AuthResponse> createStaff(
            @Valid @RequestBody StaffCreateRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.registerStaff(request));
    }
}
