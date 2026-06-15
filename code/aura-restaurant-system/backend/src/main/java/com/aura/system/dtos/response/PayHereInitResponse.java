package com.aura.system.dtos.response;

// Frontend এ PayHere popup open කිරීමට අවශ්‍ය data
public record PayHereInitResponse(
    String merchantId,
    String orderId,
    String amount,
    String currency,
    String hash,
    boolean sandbox
) {}