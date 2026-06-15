package com.aura.system.services;

import com.aura.system.dtos.request.PaymentDtos.CreatePaymentRequest;
import com.aura.system.dtos.request.PaymentDtos.PayHereCallbackRequest;
import com.aura.system.dtos.response.BillResponse;
import com.aura.system.dtos.response.PayHereInitResponse;
import com.aura.system.dtos.response.PaymentResponse;
import java.util.List;

public interface PaymentService {
    PaymentResponse recordPayment(CreatePaymentRequest request);          // Cash
    PayHereInitResponse initiatePayHere(Integer orderId);                 // Card/QR — single order
    PayHereInitResponse initiatePayHereForTable(Integer tableId);         // Card/QR — combined table total
    void handlePayHereCallback(PayHereCallbackRequest callback);          // Gateway callback
    List<BillResponse> getAllPendingBills();
    BillResponse getBillByTableId(Integer tableId);
}