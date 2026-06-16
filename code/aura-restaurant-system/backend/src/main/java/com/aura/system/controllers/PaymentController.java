package com.aura.system.controllers;

import com.aura.system.dtos.request.PaymentDtos.CreatePaymentRequest;
import com.aura.system.dtos.response.BillResponse;
import com.aura.system.dtos.response.PaymentResponse;
import com.aura.system.services.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/payments")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<PaymentResponse> recordPayment(
            @Valid @RequestBody CreatePaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(paymentService.recordPayment(request));
    }

    @GetMapping("/bills")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<List<BillResponse>> getAllPendingBills() {
        return ResponseEntity.ok(paymentService.getAllPendingBills());
    }

    @GetMapping("/bills/{tableId}")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BillResponse> getBillByTableId(@PathVariable Integer tableId) {
        return ResponseEntity.ok(paymentService.getBillByTableId(tableId));
    }
}
