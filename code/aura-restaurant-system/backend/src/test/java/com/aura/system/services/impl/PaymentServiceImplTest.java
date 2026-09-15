package com.aura.system.services.impl;

import com.aura.system.dtos.request.PaymentDtos.CreatePaymentRequest;
import com.aura.system.dtos.response.BillResponse;
import com.aura.system.dtos.response.PaymentResponse;
import com.aura.system.entities.Order;
import com.aura.system.entities.Payment;
import com.aura.system.entities.RestaurantTable;
import com.aura.system.repositories.OrderRepository;
import com.aura.system.repositories.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    private PaymentServiceImpl paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentServiceImpl(paymentRepository, orderRepository);
    }

    @Test
    @DisplayName("recordPayment with valid order saves payment and completes order")
    void recordPayment_withValidOrder_savesPaymentAndCompletesOrder() {
        CreatePaymentRequest request = new CreatePaymentRequest(1, 100.50f, "CARD");
        
        RestaurantTable table = new RestaurantTable();
        table.setTableId(5);

        Order order = new Order();
        order.setOrderId(1);
        order.setTable(table);
        order.setStatus("pending");

        when(orderRepository.findById(1)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderOrderId(1)).thenReturn(Optional.empty());

        Payment savedPayment = Payment.builder()
                .paymentId(10)
                .order(order)
                .amount(100.50f)
                .paymentMethod("CARD")
                .paymentStatus("paid")
                .paymentTime(LocalDateTime.now())
                .build();

        when(paymentRepository.save(any(Payment.class))).thenReturn(savedPayment);

        PaymentResponse response = paymentService.recordPayment(request);

        assertThat(response).isNotNull();
        assertThat(response.paymentId()).isEqualTo(10);
        assertThat(response.paymentStatus()).isEqualTo("paid");
        
        verify(paymentRepository).save(any(Payment.class));
        verify(orderRepository).save(order);
        assertThat(order.getStatus()).isEqualTo("completed");
    }

    @Test
    @DisplayName("recordPayment with nonexistent order throws IllegalArgumentException")
    void recordPayment_withNonexistentOrder_throwsIllegalArgument() {
        CreatePaymentRequest request = new CreatePaymentRequest(99, 100.50f, "CARD");

        when(orderRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.recordPayment(request))
                .isInstanceOf(IllegalArgumentException.class);

        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    @DisplayName("recordPayment with already paid order throws IllegalStateException")
    void recordPayment_withAlreadyPaidOrder_throwsIllegalState() {
        CreatePaymentRequest request = new CreatePaymentRequest(1, 100.50f, "CARD");
        Order order = new Order();
        order.setOrderId(1);

        Payment existingPayment = Payment.builder().paymentStatus("paid").build();

        when(orderRepository.findById(1)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrderOrderId(1)).thenReturn(Optional.of(existingPayment));

        assertThatThrownBy(() -> paymentService.recordPayment(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already paid");

        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    @DisplayName("getAllPendingBills returns correct bills")
    void getAllPendingBills_returnsCorrectBills() {
        RestaurantTable table = new RestaurantTable();
        table.setTableId(5);
        
        Order order = new Order();
        order.setOrderId(1);
        order.setTable(table);
        order.setTotalAmount(50.0f);
        order.setStatus("pending");

        when(orderRepository.findByStatus("pending")).thenReturn(List.of(order));

        List<BillResponse> bills = paymentService.getAllPendingBills();

        assertThat(bills).hasSize(1);
        assertThat(bills.get(0).orderId()).isEqualTo(1);
        assertThat(bills.get(0).orderStatus()).isEqualTo("pending");
    }

    @Test
    @DisplayName("getBillByTableId with pending bill returns bill")
    void getBillByTableId_withPendingBill_returnsBill() {
        RestaurantTable table = new RestaurantTable();
        table.setTableId(5);
        
        Order order = new Order();
        order.setOrderId(1);
        order.setTable(table);
        order.setTotalAmount(75.0f);
        order.setStatus("pending");

        when(orderRepository.findByTableTableId(5)).thenReturn(List.of(order));

        BillResponse bill = paymentService.getBillByTableId(5);

        assertThat(bill).isNotNull();
        assertThat(bill.orderId()).isEqualTo(1);
        assertThat(bill.orderStatus()).isEqualTo("pending");
    }

    @Test
    @DisplayName("getBillByTableId with no pending bill throws IllegalArgumentException")
    void getBillByTableId_withNoPendingBill_throwsIllegalArgument() {
        Order completedOrder = new Order();
        completedOrder.setStatus("completed");

        when(orderRepository.findByTableTableId(5)).thenReturn(List.of(completedOrder));

        assertThatThrownBy(() -> paymentService.getBillByTableId(5))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
