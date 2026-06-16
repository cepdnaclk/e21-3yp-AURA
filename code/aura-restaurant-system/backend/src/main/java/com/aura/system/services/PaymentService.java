package com.aura.system.services;

import com.aura.system.dtos.request.PaymentDtos.CreatePaymentRequest;
import com.aura.system.dtos.response.BillResponse;
import com.aura.system.dtos.response.PaymentResponse;
import java.util.List;

public interface PaymentService {
    PaymentResponse recordPayment(CreatePaymentRequest request);
    List<BillResponse> getAllPendingBills();
    BillResponse getBillByTableId(Integer tableId);
}
