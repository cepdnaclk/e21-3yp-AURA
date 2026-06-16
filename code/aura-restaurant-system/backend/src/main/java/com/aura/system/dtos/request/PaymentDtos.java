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
}
