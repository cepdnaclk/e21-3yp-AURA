package com.aura.system.services.impl;

import com.aura.system.dtos.FeedbackSummaryResponse;
import com.aura.system.dtos.request.CreateFeedbackRequest;
import com.aura.system.entities.Feedback;
import com.aura.system.entities.Order;
import com.aura.system.repositories.FeedbackRepository;
import com.aura.system.repositories.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeedbackServiceImplTest {

    @Mock
    private FeedbackRepository feedbackRepository;

    @Mock
    private OrderRepository orderRepository;

    private FeedbackServiceImpl feedbackService;

    @BeforeEach
    void setUp() {
        feedbackService = new FeedbackServiceImpl(feedbackRepository, orderRepository);
    }

    @Test
    @DisplayName("submitFeedback with valid rating saves feedback successfully")
    void submitFeedback_withValidRating_savesFeedback() {
        CreateFeedbackRequest request = new CreateFeedbackRequest(1, 4);
        Order order = new Order();
        order.setOrderId(1);

        when(orderRepository.findById(1)).thenReturn(Optional.of(order));

        Feedback savedFeedback = Feedback.builder()
                .feedbackId(10)
                .order(order)
                .rating(4)
                .feedbackTime(LocalDateTime.now())
                .build();

        when(feedbackRepository.save(any(Feedback.class))).thenReturn(savedFeedback);

        Feedback result = feedbackService.submitFeedback(request);

        assertThat(result).isNotNull();
        assertThat(result.getFeedbackId()).isEqualTo(10);
        assertThat(result.getRating()).isEqualTo(4);
        verify(feedbackRepository).save(any(Feedback.class));
    }

    @Test
    @DisplayName("submitFeedback with rating below range throws IllegalArgumentException")
    void submitFeedback_withRatingBelowRange_throwsIllegalArgument() {
        CreateFeedbackRequest request = new CreateFeedbackRequest(1, 0);

        assertThatThrownBy(() -> feedbackService.submitFeedback(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Rating must be between 1 and 5");

        verify(orderRepository, never()).findById(any());
        verify(feedbackRepository, never()).save(any());
    }

    @Test
    @DisplayName("submitFeedback with rating above range throws IllegalArgumentException")
    void submitFeedback_withRatingAboveRange_throwsIllegalArgument() {
        CreateFeedbackRequest request = new CreateFeedbackRequest(1, 6);

        assertThatThrownBy(() -> feedbackService.submitFeedback(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Rating must be between 1 and 5");

        verify(orderRepository, never()).findById(any());
        verify(feedbackRepository, never()).save(any());
    }

    @Test
    @DisplayName("submitFeedback with null rating throws IllegalArgumentException")
    void submitFeedback_withNullRating_throwsIllegalArgument() {
        CreateFeedbackRequest request = new CreateFeedbackRequest(1, null);

        assertThatThrownBy(() -> feedbackService.submitFeedback(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Rating must be between 1 and 5");

        verify(orderRepository, never()).findById(any());
        verify(feedbackRepository, never()).save(any());
    }

    @Test
    @DisplayName("submitFeedback with nonexistent order throws IllegalArgumentException")
    void submitFeedback_withNonexistentOrder_throwsIllegalArgument() {
        CreateFeedbackRequest request = new CreateFeedbackRequest(99, 4);

        when(orderRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> feedbackService.submitFeedback(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Order not found");

        verify(feedbackRepository, never()).save(any());
    }

    @Test
    @DisplayName("getSummary with existing feedback returns correct average and count")
    void getSummary_withFeedback_returnsCorrectAverageAndCount() {
        when(feedbackRepository.findAverageRating()).thenReturn(4.5);
        when(feedbackRepository.count()).thenReturn(10L);

        FeedbackSummaryResponse response = feedbackService.getSummary();

        assertThat(response).isNotNull();
        assertThat(response.averageRating()).isEqualTo(4.5);
        assertThat(response.totalCount()).isEqualTo(10L);
    }

    @Test
    @DisplayName("getSummary with no feedback returns zero average and zero count")
    void getSummary_withNoFeedback_returnsZeroAverage() {
        when(feedbackRepository.findAverageRating()).thenReturn(null);
        when(feedbackRepository.count()).thenReturn(0L);

        FeedbackSummaryResponse response = feedbackService.getSummary();

        assertThat(response).isNotNull();
        assertThat(response.averageRating()).isEqualTo(0.0);
        assertThat(response.totalCount()).isEqualTo(0L);
    }
}
