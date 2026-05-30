package com.aura.system.controllers;

import com.aura.system.dtos.request.PlaceOrderRequest;
import com.aura.system.dtos.request.UpdateStatusRequest;
import com.aura.system.dtos.response.OrderResponse;
import com.aura.system.services.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // POST /api/orders
    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(
            @Valid @RequestBody PlaceOrderRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(orderService.placeOrder(request));
    }
    // GET /api/orders
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // GET /api/orders/{id}
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(
            @PathVariable Integer id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    // GET /api/orders/table/{tableId}
    @GetMapping("/table/{tableId}")
    public ResponseEntity<List<OrderResponse>> getOrdersByTable(
            @PathVariable Integer tableId) {
        return ResponseEntity.ok(orderService.getOrdersByTable(tableId));
    }

    
    // PATCH /api/orders/{id}/status
    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(
                orderService.updateOrderStatus(id, request.getStatus()));
    }

    // GET /api/orders/history?range=24h
    @GetMapping("/history")
    public ResponseEntity<List<OrderResponse>> getDeliveredHistory(
            @RequestParam(defaultValue = "24") int hours) {
        return ResponseEntity.ok(orderService.getDeliveredHistory(hours));

    }
    // POST /api/orders/table/{tableId}/mark-paid
    @PostMapping("/table/{tableId}/mark-paid")
    public ResponseEntity<Void> markTableAsPaid(
            @PathVariable Integer tableId) {
        orderService.markTableAsPaid(tableId);
        return ResponseEntity.ok().build();
    }
}