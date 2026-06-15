package com.aura.system.dtos.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class PaymentDtos {

    public record CreatePaymentRequest(
            @NotNull(message = "Order ID is required")
            Integer orderId,

            @NotNull(message = "Amount is required")
            @Positive(message = "Amount must be positive")
            Float amount,

            @NotNull(message = "Payment method is required")
            String paymentMethod
    ) {}

    // PayHere gateway posts these fields as form data to /api/payments/callback
    public record PayHereCallbackRequest(
            String merchant_id,
            String order_id,
            String payment_id,
            String payhere_amount,
            String payhere_currency,
            String status_code,
            String md5sig,
            String status_message,
            String method,
            String card_holder_name,
            String card_no,
            String card_expiry
    ) {}
}
