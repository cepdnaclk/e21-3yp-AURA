package com.aura.system.controllers;

import com.aura.system.dtos.request.OrderItemRequest;
import com.aura.system.dtos.request.PlaceOrderRequest;
import com.aura.system.dtos.request.UpdateStatusRequest;
import com.aura.system.dtos.response.OrderResponse;
import com.aura.system.services.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class OrderControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(orderController).build();
    }

    @Test
    @DisplayName("POST /api/orders -> 201 CREATED with order details")
    void placeOrder_returnsCreated() throws Exception {
        OrderItemRequest item = new OrderItemRequest();
        item.setMenuItemId(10);
        item.setQuantity(2);
        item.setCustomization("Extra spicy");

        PlaceOrderRequest request = new PlaceOrderRequest();
        request.setTableId(3);
        request.setItems(List.of(item));

        OrderResponse response = OrderResponse.builder()
                .orderId(501)
                .tableId(3)
                .status("PENDING")
                .totalAmount(1800.0f)
                .orderTime(LocalDateTime.now())
                .build();

        when(orderService.placeOrder(any(PlaceOrderRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").value(501))
                .andExpect(jsonPath("$.tableId").value(3))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.totalAmount").value(1800.0));

        verify(orderService).placeOrder(any(PlaceOrderRequest.class));
    }

    @Test
    @DisplayName("POST /api/orders -> 400 BAD REQUEST when items list is empty (Bean Validation)")
    void placeOrder_emptyItems_returnsBadRequest() throws Exception {
        PlaceOrderRequest request = new PlaceOrderRequest();
        request.setTableId(3);
        request.setItems(List.of()); // Violates @NotEmpty

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/orders/{id} -> 200 OK with order details")
    void getOrderById_returnsOk() throws Exception {
        OrderResponse response = OrderResponse.builder()
                .orderId(501)
                .tableId(3)
                .status("PREPARING")
                .totalAmount(1800.0f)
                .build();

        when(orderService.getOrderById(501)).thenReturn(response);

        mockMvc.perform(get("/api/orders/501"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(501))
                .andExpect(jsonPath("$.status").value("PREPARING"));

        verify(orderService).getOrderById(501);
    }

    @Test
    @DisplayName("PATCH /api/orders/{id}/status -> 200 OK with updated status")
    void updateStatus_returnsUpdatedOrder() throws Exception {
        UpdateStatusRequest request = new UpdateStatusRequest();
        request.setStatus("READY");

        OrderResponse updated = OrderResponse.builder()
                .orderId(501)
                .tableId(3)
                .status("READY")
                .totalAmount(1800.0f)
                .build();

        when(orderService.updateOrderStatus(eq(501), eq("READY"))).thenReturn(updated);

        mockMvc.perform(patch("/api/orders/501/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(501))
                .andExpect(jsonPath("$.status").value("READY"));

        verify(orderService).updateOrderStatus(501, "READY");
    }

    @Test
    @DisplayName("GET /api/orders/table/{tableId} -> 200 OK with list of active table orders")
    void getOrdersByTable_returnsList() throws Exception {
        OrderResponse o1 = OrderResponse.builder().orderId(1).tableId(2).status("PENDING").build();
        OrderResponse o2 = OrderResponse.builder().orderId(2).tableId(2).status("PREPARING").build();

        when(orderService.getActiveOrdersByTable(2)).thenReturn(List.of(o1, o2));
        when(orderService.getOrdersByTable(2)).thenReturn(List.of(o1, o2));

        mockMvc.perform(get("/api/orders/table/2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].orderId").value(1))
                .andExpect(jsonPath("$[1].orderId").value(2));

        verify(orderService).getActiveOrdersByTable(2);
        verify(orderService).getOrdersByTable(2);
    }
}
