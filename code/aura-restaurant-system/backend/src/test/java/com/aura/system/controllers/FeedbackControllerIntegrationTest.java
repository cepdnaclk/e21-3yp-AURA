package com.aura.system.controllers;

import com.aura.system.dtos.FeedbackSummaryResponse;
import com.aura.system.dtos.request.CreateFeedbackRequest;
import com.aura.system.entities.Feedback;
import com.aura.system.entities.Order;
import com.aura.system.services.FeedbackService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class FeedbackControllerIntegrationTest {

    private MockMvc mockMvc;

    @Mock
    private FeedbackService feedbackService;

    @InjectMocks
    private FeedbackController feedbackController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(feedbackController).build();
    }

    @Test
    @DisplayName("POST /api/feedback -> 201 CREATED with JSON response")
    void submitFeedback_returnsCreated() throws Exception {
        CreateFeedbackRequest request = new CreateFeedbackRequest(101, 5);
        Order order = Order.builder().orderId(101).build();
        Feedback mockSaved = Feedback.builder().feedbackId(1).order(order).rating(5).build();

        when(feedbackService.submitFeedback(any(CreateFeedbackRequest.class))).thenReturn(mockSaved);

        mockMvc.perform(post("/api/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.feedbackId").value(1))
                .andExpect(jsonPath("$.rating").value(5));

        verify(feedbackService).submitFeedback(any(CreateFeedbackRequest.class));
    }

    @Test
    @DisplayName("GET /api/feedback/summary -> 200 OK with rating calculation")
    void getSummary_returnsOk() throws Exception {
        FeedbackSummaryResponse summary = new FeedbackSummaryResponse(4.8, 25L);
        when(feedbackService.getSummary()).thenReturn(summary);

        mockMvc.perform(get("/api/feedback/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(4.8))
                .andExpect(jsonPath("$.totalCount").value(25));
    }
}
