package com.aura.system.services.impl;

import com.aura.system.dtos.request.OrderItemRequest;
import com.aura.system.dtos.request.PlaceOrderRequest;
import com.aura.system.dtos.response.OrderItemResponse;
import com.aura.system.dtos.response.OrderResponse;
import com.aura.system.entities.*;
import com.aura.system.repositories.*;
import com.aura.system.services.OrderService;
import com.aura.system.services.DashboardStatsService;
import com.aura.system.services.RobotFleetService;
import com.aura.system.mqtt.MqttPublisher;
import com.aura.system.mqtt.MqttGateway;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.apache.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final RestaurantTableRepository tableRepository;
    private final MqttPublisher mqttPublisher;
    private final MqttGateway mqttGateway;
    private final ObjectMapper objectMapper;
    private final DashboardStatsService dashboardStatsService;
    private final RobotFleetService robotFleetService;

    // ── Place Order ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public OrderResponse placeOrder(PlaceOrderRequest request) {
        RestaurantTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new EntityNotFoundException("Table not found: " + request.getTableId()));

        Order order = Order.builder()
                .table(table)
                .status("PENDING")
                .totalAmount(0.0f)
                .orderTime(LocalDateTime.now())
                .walkInSessionId(request.getWalkInSessionId()) // ✅ walkInSessionId save වෙනවා
                .build();

        Order savedOrder = orderRepository.save(order);

        float total = 0.0f;
        List<OrderItem> savedItems = new ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new EntityNotFoundException("Menu item not found: " + itemReq.getMenuItemId()));

            float subtotal = menuItem.getPrice() * itemReq.getQuantity();
            total += subtotal;

            OrderItem orderItem = OrderItem.builder()
                    .order(savedOrder)
                    .menuItem(menuItem)
                    .quantity(itemReq.getQuantity())
                    .customization(itemReq.getCustomization())
                    .subtotal(subtotal)
                    .build();

            savedItems.add(orderItemRepository.save(orderItem));
        }

        savedOrder.setTotalAmount(total);
        orderRepository.save(savedOrder);

        try {
            String topic = "aura/kitchen/update-order";
            String payload = String.format(
                "{\"orderId\":%d,\"tableId\":%d,\"total\":%.2f,\"items\":%d}",
                savedOrder.getOrderId(), table.getTableId(), total, savedItems.size()
            );
            mqttPublisher.publish(topic, payload);
            log.info("Order placed & Kitchen notified | orderId={}", savedOrder.getOrderId());
            dashboardStatsService.publishDashboardStats();
        } catch (Exception e) {
            log.error("Failed to notify kitchen: {}", e.getMessage());
        }

        return buildResponse(savedOrder, savedItems);
    }

    // ── Update Status ──────────────────────────────────────────────────────────

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Integer orderId, String status) {
        Order order = findOrThrow(orderId);

        String oldStatus = order.getStatus();
        String newStatus = status.toUpperCase();
        order.setStatus(newStatus);

        if ("DELIVERED".equals(newStatus)) {
            order.setDeliveredAt(LocalDateTime.now());
        }
        orderRepository.save(order);

        log.info("Order {} status updated: {} → {}", orderId, oldStatus, newStatus);

        List<OrderItem> items = orderItemRepository.findByOrderOrderId(orderId);

        try {
            String kitchenTopic = "aura/kitchen/update-order";
            String kitchenPayload = String.format(
                "{\"orderId\":%d,\"tableId\":%d,\"total\":%.2f,\"status\":\"%s\"}",
                order.getOrderId(), order.getTable().getTableId(), order.getTotalAmount(), newStatus
            );
            mqttPublisher.publish(kitchenTopic, kitchenPayload);
            dashboardStatsService.publishDashboardStats();
        } catch (Exception e) {
            log.error("Kitchen MQTT fail: {}", e.getMessage());
        }

        try {
            String robotTopic = "aura/robot/" + order.getTable().getTableId() + "/status";

            Map<String, Object> payloadMap = new HashMap<>();
            payloadMap.put("orderId", order.getOrderId());
            payloadMap.put("tableId", order.getTable().getTableId());
            payloadMap.put("status", newStatus);

            String robotPayload = objectMapper.writeValueAsString(payloadMap);

            if ("DELIVERED".equals(newStatus)) {
                robotFleetService.incrementRobotDeliveryCount(1);
            }
            mqttGateway.sendToMqtt(robotPayload, robotTopic);

            log.info("MQTT notification sent to Robot on topic: {}", robotTopic);
        } catch (Exception e) {
            log.error("Failed to send MQTT status update to robot: {}", e.getMessage());
        }

        return buildResponse(order, items);
    }

    // ── Other Methods ──────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(order -> buildResponse(order, orderItemRepository.findByOrderOrderId(order.getOrderId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Integer orderId) {
        Order order = findOrThrow(orderId);
        return buildResponse(order, orderItemRepository.findByOrderOrderId(orderId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByTable(Integer tableId) {
        return orderRepository.findByTableTableId(tableId).stream()
                .map(order -> buildResponse(order, orderItemRepository.findByOrderOrderId(order.getOrderId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersBySession(Long sessionId) {
    return orderRepository.findByWalkInSessionId(sessionId)
            .stream()
            .map(order -> buildResponse(order, orderItemRepository.findByOrderOrderId(order.getOrderId())))
            .collect(Collectors.toList());
    }

    private Order findOrThrow(Integer orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));
    }

    // ── CHANGED: walkInSessionId දැන් response එකේ include වෙනවා ──────────────
    private OrderResponse buildResponse(Order order, List<OrderItem> items) {
        List<OrderItemResponse> itemResponses = items.stream()
                .map(item -> OrderItemResponse.builder()
                        .orderItemId(item.getOrderItemId())
                        .menuItemId(item.getMenuItem().getMenuItemId())
                        .menuItemName(item.getMenuItem().getName())
                        .quantity(item.getQuantity())
                        .customization(item.getCustomization())
                        .subtotal(item.getSubtotal())
                        .menuItemImageUrl(item.getMenuItem().getImageUrl())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .orderId(order.getOrderId())
                .tableId(order.getTable().getTableId())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .orderTime(order.getOrderTime())
                .deliveredAt(order.getDeliveredAt())
                .walkInSessionId(order.getWalkInSessionId()) // ✅ ADDED - නව line එක
                .items(itemResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getDeliveredHistory(int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return orderRepository.findDeliveredSince(since).stream()
                .map(order -> buildResponse(order, orderItemRepository.findByOrderOrderId(order.getOrderId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markTableAsPaid(Integer tableId) {
        List<Order> unpaidOrders = orderRepository.findUnpaidByTableId(tableId, "PAID");

        if (unpaidOrders.isEmpty()) {
            log.info("No unpaid orders found for table {}", tableId);
            return;
        }

        unpaidOrders.forEach(order -> order.setStatus("PAID"));
        orderRepository.saveAll(unpaidOrders);

        try {
            String topic = "aura/kitchen/update-order";
            String payload = String.format(
                "{\"tableId\":%d,\"status\":\"PAID\",\"orderCount\":%d}",
                tableId, unpaidOrders.size()
            );
            mqttPublisher.publish(topic, payload);
            log.info("Table {} marked as paid | {} orders updated", tableId, unpaidOrders.size());
            dashboardStatsService.publishDashboardStats();
        } catch (Exception e) {
            log.error("Failed to publish MQTT after marking table {} as paid: {}", tableId, e.getMessage());
        }
    }
}