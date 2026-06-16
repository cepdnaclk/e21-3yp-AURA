package com.aura.system.controllers;

import com.aura.system.dtos.request.PaymentDtos.CreatePaymentRequest;
import com.aura.system.dtos.request.PaymentDtos.PayHereCallbackRequest;
import com.aura.system.dtos.response.BillResponse;
import com.aura.system.dtos.response.PayHereInitResponse;
import com.aura.system.dtos.response.PaymentResponse;
import com.aura.system.services.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // Cash payment
    @PostMapping("/cash")
    public ResponseEntity<PaymentResponse> cashPayment(@RequestBody CreatePaymentRequest request) {
        return ResponseEntity.ok(paymentService.recordPayment(request));
    }

    // PayHere initiate — single order (kept for compatibility)
    @PostMapping("/initiate/{orderId}")
    public ResponseEntity<PayHereInitResponse> initiatePayHere(@PathVariable Integer orderId) {
        return ResponseEntity.ok(paymentService.initiatePayHere(orderId));
    }

    // PayHere initiate — all unpaid orders for a table combined
    @PostMapping("/initiate/table/{tableId}")
    public ResponseEntity<PayHereInitResponse> initiatePayHereForTable(@PathVariable Integer tableId) {
        return ResponseEntity.ok(paymentService.initiatePayHereForTable(tableId));
    }

    // PayHere callback — PayHere gateway calls this automatically after payment
    // IMPORTANT: Security config එකේ permit කරන්න ඕනේ (JWT skip)
    @PostMapping("/callback")
    public ResponseEntity<String> payhereCallback(@ModelAttribute PayHereCallbackRequest callback) {
        paymentService.handlePayHereCallback(callback);
        return ResponseEntity.ok("OK");
    }

    // Bill by table
    @GetMapping("/bill/table/{tableId}")
    public ResponseEntity<BillResponse> getBill(@PathVariable Integer tableId) {
        return ResponseEntity.ok(paymentService.getBillByTableId(tableId));
    }

    // All pending bills
    @GetMapping("/pending")
    public ResponseEntity<List<BillResponse>> getAllPending() {
        return ResponseEntity.ok(paymentService.getAllPendingBills());
    }
}