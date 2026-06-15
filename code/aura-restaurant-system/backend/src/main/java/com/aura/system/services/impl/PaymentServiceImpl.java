package com.aura.system.services.impl;

import com.aura.system.dtos.request.PaymentDtos.CreatePaymentRequest;
import com.aura.system.dtos.request.PaymentDtos.PayHereCallbackRequest;
import com.aura.system.dtos.response.BillResponse;
import com.aura.system.dtos.response.PayHereInitResponse;
import com.aura.system.dtos.response.PaymentResponse;
import com.aura.system.entities.Order;
import com.aura.system.entities.Payment;
import com.aura.system.repositories.OrderRepository;
import com.aura.system.repositories.PaymentRepository;
import com.aura.system.services.PaymentService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    // application.properties වලින් load වෙනවා
    @Value("${payhere.merchant.id}")
    private String merchantId;

    @Value("${payhere.merchant.secret}")
    private String merchantSecret;

    @Value("${payhere.sandbox:true}")
    private boolean sandbox;

    // ─── 1. Cash Payment ───────────────────────────────────────────────────

    @Override
    @Transactional
    public PaymentResponse recordPayment(CreatePaymentRequest request) {
        Order order = findOrder(request.orderId());

        checkAlreadyPaid(request.orderId());

        Payment payment = Payment.builder()
                .order(order)
                .amount(request.amount())
                .paymentMethod(request.paymentMethod())
                .paymentStatus("PAID")
                .paymentTime(LocalDateTime.now())
                .build();

        Payment saved = paymentRepository.save(payment);
        order.setStatus("PAID");
        orderRepository.save(order);

        log.info("Cash payment recorded | orderId={} amount={}", order.getOrderId(), request.amount());
        return toPaymentResponse(saved);
    }

    // ─── 2. PayHere Initiate (Card / QR) ──────────────────────────────────

    @Override
    public PayHereInitResponse initiatePayHere(Integer orderId) {
        Order order = findOrder(orderId);
        checkAlreadyPaid(orderId);

        // PENDING payment record create කරනවා
        paymentRepository.findByOrderOrderId(orderId).orElseGet(() -> {
            Payment pending = Payment.builder()
                    .order(order)
                    .amount(order.getTotalAmount())
                    .paymentMethod("CARD")
                    .paymentStatus("PENDING")
                    .paymentTime(LocalDateTime.now())
                    .build();
            return paymentRepository.save(pending);
        });

        String amountFormatted = String.format("%.2f", order.getTotalAmount());
        String currency = "LKR";
        String hash = generatePayHereHash(merchantId, orderId.toString(),
                                          amountFormatted, currency, merchantSecret);

        log.info("PayHere initiated | orderId={} amount={}", orderId, amountFormatted);

        return new PayHereInitResponse(merchantId, orderId.toString(),
                                       amountFormatted, currency, hash, sandbox);
    }

    // ─── 3. PayHere Initiate — Combined Table Total ────────────────────────

    @Override
    public PayHereInitResponse initiatePayHereForTable(Integer tableId, List<Integer> orderIds) {
        List<Order> activeOrders;
        if (orderIds != null && !orderIds.isEmpty()) {
            activeOrders = orderRepository.findAllById(orderIds).stream()
                    .filter(o -> !"PAID".equals(o.getStatus()) && !"CANCELLED".equals(o.getStatus()))
                    .collect(Collectors.toList());
        } else {
            LocalDateTime startOfToday = LocalDateTime.now().toLocalDate().atStartOfDay();
            activeOrders = orderRepository.findActiveByTableId(tableId, startOfToday);
        }
        if (activeOrders.isEmpty()) {
            throw new IllegalArgumentException("No active orders for table: " + tableId);
        }

        float total = (float) activeOrders.stream()
                .mapToDouble(o -> o.getTotalAmount())
                .sum();

        // Use the first order's ID as the PayHere reference order
        Integer referenceOrderId = activeOrders.get(0).getOrderId();

        // Create PENDING payment records for all orders that don't have one yet
        for (Order order : activeOrders) {
            paymentRepository.findByOrderOrderId(order.getOrderId()).orElseGet(() ->
                paymentRepository.save(Payment.builder()
                    .order(order)
                    .amount(order.getTotalAmount())
                    .paymentMethod("CARD")
                    .paymentStatus("PENDING")
                    .paymentTime(LocalDateTime.now())
                    .build())
            );
        }

        String amountFormatted = String.format("%.2f", total);
        String currency = "LKR";
        String hash = generatePayHereHash(merchantId, referenceOrderId.toString(),
                                          amountFormatted, currency, merchantSecret);

        log.info("PayHere table initiate | tableId={} orders={} total={}", tableId, activeOrders.size(), amountFormatted);

        return new PayHereInitResponse(merchantId, referenceOrderId.toString(),
                                       amountFormatted, currency, hash, sandbox);
    }

    // ─── 4. PayHere Callback (Gateway calls this after payment) ───────────

    @Override
    @Transactional
    public void handlePayHereCallback(PayHereCallbackRequest cb) {
        // MD5 signature verify — security check
        String localHash = generatePayHereHash(merchantId, cb.order_id(),
                cb.payhere_amount(), cb.payhere_currency(), merchantSecret);

        if (!localHash.equalsIgnoreCase(cb.md5sig())) {
            log.warn("PayHere callback signature mismatch! orderId={}", cb.order_id());
            return;
        }

        Integer orderId = Integer.parseInt(cb.order_id());
        Order order = findOrder(orderId);

        Payment payment = paymentRepository.findByOrderOrderId(orderId)
                .orElse(Payment.builder()
                        .order(order)
                        .amount(Float.parseFloat(cb.payhere_amount()))
                        .paymentMethod("CARD")
                        .paymentTime(LocalDateTime.now())
                        .build());

        // status_code: 2 = success, 0 = pending, -1 = cancelled, -2 = failed
        String status = switch (cb.status_code()) {
            case "2"  -> "PAID";
            case "0"  -> "PENDING";
            case "-1" -> "CANCELLED";
            default   -> "FAILED";
        };

        payment.setPaymentStatus(status);
        payment.setTransactionId(cb.payment_id());
        paymentRepository.save(payment);

        if ("PAID".equals(status)) {
            // Mark only the orders belonging to the same walk-in session as PAID.
            // Falls back to marking just this single order if the session is unknown.
            Long sessionId = order.getWalkInSessionId();
            List<Order> toPay;
            if (sessionId != null) {
                toPay = orderRepository.findByWalkInSessionId(sessionId).stream()
                        .filter(o -> !"PAID".equals(o.getStatus()) && !"CANCELLED".equals(o.getStatus()))
                        .collect(Collectors.toList());
            } else {
                toPay = List.of(order);
            }
            toPay.forEach(o -> o.setStatus("PAID"));
            orderRepository.saveAll(toPay);
            log.info("PayHere payment SUCCESS | sessionId={} ordersMarkedPaid={} txnId={}",
                    sessionId, toPay.size(), cb.payment_id());
        } else {
            log.warn("PayHere payment {} | orderId={}", status, orderId);
        }
    }

    // ─── 4. Bill Queries ───────────────────────────────────────────────────

    @Override
    public List<BillResponse> getAllPendingBills() {
        return orderRepository.findByStatus("PENDING").stream()
                .map(this::toBillResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BillResponse getBillByTableId(Integer tableId) {
        List<Order> orders = orderRepository.findByTableTableId(tableId);
        Order pending = orders.stream()
                .filter(o -> "PENDING".equals(o.getStatus()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "No pending bill for table: " + tableId));
        return toBillResponse(pending);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    private Order findOrder(Integer orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
    }

    private void checkAlreadyPaid(Integer orderId) {
        paymentRepository.findByOrderOrderId(orderId).ifPresent(p -> {
            if ("PAID".equals(p.getPaymentStatus())) {
                throw new IllegalStateException("Order " + orderId + " is already paid");
            }
        });
    }

    // PayHere MD5 hash formula:
    // MD5( merchantId + orderId + amount + currency + MD5(merchantSecret).toUpperCase() )
    private String generatePayHereHash(String merchantId, String orderId,
                                        String amount, String currency, String secret) {
        try {
            String hashedSecret = md5(secret).toUpperCase();
            String raw = merchantId + orderId + amount + currency + hashedSecret;
            return md5(raw).toUpperCase();
        } catch (Exception e) {
            throw new RuntimeException("Hash generation failed", e);
        }
    }

    private String md5(String input) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        byte[] digest = md.digest(input.getBytes("UTF-8"));
        return String.format("%032x", new BigInteger(1, digest));
    }

    private PaymentResponse toPaymentResponse(Payment p) {
        return new PaymentResponse(
                p.getPaymentId(),
                p.getOrder().getOrderId(),
                p.getOrder().getTable().getTableId(),
                p.getAmount(),
                p.getPaymentMethod(),
                p.getPaymentStatus(),
                p.getPaymentTime()
        );
    }

    private BillResponse toBillResponse(Order order) {
        String payStatus = paymentRepository.findByOrderOrderId(order.getOrderId())
                .map(Payment::getPaymentStatus)
                .orElse("PENDING");
        return new BillResponse(
                order.getTable().getTableId(),
                order.getOrderId(),
                order.getTotalAmount(),
                order.getStatus(),
                order.getOrderTime(),
                payStatus
        );
    }
}