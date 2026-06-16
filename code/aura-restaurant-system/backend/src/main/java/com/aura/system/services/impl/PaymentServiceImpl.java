package com.aura.system.services.impl;

import com.aura.system.dtos.request.PaymentDtos.CreatePaymentRequest;
import com.aura.system.dtos.response.BillResponse;
import com.aura.system.dtos.response.PaymentResponse;
import com.aura.system.entities.Order;
import com.aura.system.entities.Payment;
import com.aura.system.repositories.OrderRepository;
import com.aura.system.repositories.PaymentRepository;
import com.aura.system.services.PaymentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional
    public PaymentResponse recordPayment(CreatePaymentRequest request) {
        Order order = orderRepository.findById(request.orderId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Order not found with ID: " + request.orderId()));

        paymentRepository.findByOrderOrderId(request.orderId()).ifPresent(p -> {
            if ("paid".equals(p.getPaymentStatus())) {
                throw new IllegalStateException(
                        "Order " + request.orderId() + " is already paid");
            }
        });

        Payment payment = Payment.builder()
                .order(order)
                .amount(request.amount())
                .paymentMethod(request.paymentMethod())
                .paymentStatus("paid")
                .paymentTime(LocalDateTime.now())
                .build();

        Payment saved = paymentRepository.save(payment);
        order.setStatus("completed");
        orderRepository.save(order);

        log.info("Payment recorded for order {} — amount: {} via {}",
                order.getOrderId(), request.amount(), request.paymentMethod());

        return toPaymentResponse(saved);
    }

    @Override
    public List<BillResponse> getAllPendingBills() {
        return orderRepository.findByStatus("pending").stream()
                .map(this::toBillResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BillResponse getBillByTableId(Integer tableId) {
        List<Order> tableOrders = orderRepository.findByTableTableId(tableId);
        Order pendingOrder = tableOrders.stream()
                .filter(o -> "pending".equals(o.getStatus()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "No pending bill found for table: " + tableId));
        return toBillResponse(pendingOrder);
    }

    private PaymentResponse toPaymentResponse(Payment payment) {
        return new PaymentResponse(
                payment.getPaymentId(),
                payment.getOrder().getOrderId(),
                payment.getOrder().getTable().getTableId(),
                payment.getAmount(),
                payment.getPaymentMethod(),
                payment.getPaymentStatus(),
                payment.getPaymentTime()
        );
    }

    private BillResponse toBillResponse(Order order) {
        String paymentStatus = paymentRepository
                .findByOrderOrderId(order.getOrderId())
                .map(Payment::getPaymentStatus)
                .orElse("pending");
        return new BillResponse(
                order.getTable().getTableId(),
                order.getOrderId(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getOrderTime(),
                paymentStatus
        );
    }
}
