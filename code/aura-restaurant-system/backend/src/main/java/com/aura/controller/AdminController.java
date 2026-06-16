package com.aura.controller;

import com.aura.dto.AuthDtos.AuthResponse;
import com.aura.dto.AuthDtos.StaffCreateRequest;
import com.aura.dto.admin.AdminStatsResponse;
import com.aura.dto.admin.RevenueResponse;
import com.aura.dto.admin.StaffResponse;
import com.aura.service.AdminAnalyticsService;
import com.aura.service.AuthService;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor // Automatically creates the constructor
public class AdminController {

    private final AdminAnalyticsService adminAnalyticsService;
    private final AuthService authService;

    @PostConstruct
    public void init() {
        System.out.println("✅ AdminController initialized with /staff endpoint");
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminAnalyticsService.getStats());
    }

    @GetMapping("/revenue")
    public ResponseEntity<RevenueResponse> getRevenue(@RequestParam(defaultValue = "PAID") String status) {
        return ResponseEntity.ok(adminAnalyticsService.getRevenue(status));
    }

    @GetMapping("/staff")
    public ResponseEntity<List<StaffResponse>> getAllStaff() {
        return ResponseEntity.ok(adminAnalyticsService.getStaffList());
    }

    @PostMapping("/staff/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<AuthResponse> createStaff(@Valid @RequestBody StaffCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerStaff(request));
    }
}