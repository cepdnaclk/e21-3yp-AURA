package com.aura.system.services.impl;

import com.aura.exception.ReservationConflictException;
import com.aura.system.dtos.request.CreateReservationRequest;
import com.aura.system.dtos.response.ReservationResponse;
import com.aura.system.entities.Reservation;
import com.aura.system.entities.RestaurantTable;
import com.aura.system.repositories.ReservationRepository;
import com.aura.system.repositories.RestaurantTableRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservationServiceImplTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private RestaurantTableRepository tableRepository;

    private ReservationServiceImpl reservationService;

    @BeforeEach
    void setUp() {
        reservationService = new ReservationServiceImpl(reservationRepository, tableRepository);
    }

    @Test
    @DisplayName("createReservation with available table saves successfully")
    void createReservation_withAvailableTable_savesSuccessfully() {
        CreateReservationRequest request = new CreateReservationRequest();
        request.setCustomerName("John Doe");
        request.setTableNumber(5);
        request.setReservationTime(LocalDateTime.now().plusDays(1));

        RestaurantTable table = new RestaurantTable();
        table.setTableId(1);
        table.setTableNumber("5");

        when(tableRepository.findByTableNumber("5")).thenReturn(table);
        when(reservationRepository.findConflictingReservations(eq(1), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        Reservation savedReservation = Reservation.builder()
                .reservationId(100)
                .table(table)
                .customerName("John Doe")
                .status("CONFIRMED")
                .build();
        
        when(reservationRepository.save(any(Reservation.class))).thenReturn(savedReservation);

        ReservationResponse response = reservationService.createReservation(request);

        assertThat(response).isNotNull();
        assertThat(response.getReservationId()).isEqualTo(100);
        assertThat(response.getStatus()).isEqualTo("CONFIRMED");
        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    @DisplayName("createReservation with conflicting slot throws ReservationConflictException")
    void createReservation_withConflictingSlot_throwsConflictException() {
        CreateReservationRequest request = new CreateReservationRequest();
        request.setTableNumber(5);
        request.setReservationTime(LocalDateTime.now().plusDays(1));

        RestaurantTable table = new RestaurantTable();
        table.setTableId(1);
        table.setTableNumber("5");

        when(tableRepository.findByTableNumber("5")).thenReturn(table);
        when(reservationRepository.findConflictingReservations(eq(1), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(new Reservation()));

        assertThatThrownBy(() -> reservationService.createReservation(request))
                .isInstanceOf(ReservationConflictException.class)
                .hasMessageContaining("not available");

        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    @DisplayName("createReservation with nonexistent table throws EntityNotFoundException")
    void createReservation_withNonexistentTable_throwsEntityNotFound() {
        CreateReservationRequest request = new CreateReservationRequest();
        request.setTableNumber(99);
        request.setReservationTime(LocalDateTime.now().plusDays(1));

        when(tableRepository.findByTableNumber("99")).thenReturn(null);

        assertThatThrownBy(() -> reservationService.createReservation(request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Requested table not found: 99");

        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    @DisplayName("createReservation auto assigns table when no table number provided")
    void createReservation_autoAssign_whenNoTableNumberProvided() {
        CreateReservationRequest request = new CreateReservationRequest();
        request.setCustomerName("Jane Doe");
        request.setPartySize(4);
        request.setReservationTime(LocalDateTime.now().plusDays(1));

        RestaurantTable table = new RestaurantTable();
        table.setTableId(2);
        table.setTableNumber("10");
        table.setCapacity(4);

        when(tableRepository.findAll()).thenReturn(List.of(table));
        when(reservationRepository.findConflictingReservations(eq(2), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        Reservation savedReservation = Reservation.builder()
                .reservationId(101)
                .table(table)
                .customerName("Jane Doe")
                .status("CONFIRMED")
                .build();
        
        when(reservationRepository.save(any(Reservation.class))).thenReturn(savedReservation);

        ReservationResponse response = reservationService.createReservation(request);

        assertThat(response).isNotNull();
        assertThat(response.getReservationId()).isEqualTo(101);
        verify(reservationRepository).save(any(Reservation.class));
    }

    @Test
    @DisplayName("createReservation auto assign with no available table throws ReservationConflictException")
    void createReservation_autoAssign_noAvailableTable_throwsConflict() {
        CreateReservationRequest request = new CreateReservationRequest();
        request.setPartySize(4);
        request.setReservationTime(LocalDateTime.now().plusDays(1));

        RestaurantTable table = new RestaurantTable();
        table.setTableId(2);
        table.setTableNumber("10");
        table.setCapacity(4);

        when(tableRepository.findAll()).thenReturn(List.of(table));
        when(reservationRepository.findConflictingReservations(eq(2), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(new Reservation()));

        assertThatThrownBy(() -> reservationService.createReservation(request))
                .isInstanceOf(ReservationConflictException.class);

        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    @DisplayName("cancelReservation valid reservation sets status to CANCELLED")
    void cancelReservation_validReservation_setsStatusCancelled() {
        RestaurantTable table = new RestaurantTable();
        table.setTableId(1);
        table.setTableNumber("5");
        table.setCapacity(4);

        Reservation reservation = Reservation.builder()
                .reservationId(1)
                .table(table)
                .status("CONFIRMED")
                .build();

        when(reservationRepository.findById(1)).thenReturn(Optional.of(reservation));
        
        Reservation cancelledReservation = Reservation.builder()
                .reservationId(1)
                .table(table)
                .status("CANCELLED")
                .build();
        
        when(reservationRepository.save(any(Reservation.class))).thenReturn(cancelledReservation);

        ReservationResponse response = reservationService.cancelReservation(1);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo("CANCELLED");
        verify(reservationRepository).save(reservation);
        assertThat(reservation.getStatus()).isEqualTo("CANCELLED");
    }

    @Test
    @DisplayName("cancelReservation already cancelled throws IllegalStateException")
    void cancelReservation_alreadyCancelled_throwsIllegalState() {
        Reservation reservation = Reservation.builder()
                .reservationId(1)
                .status("CANCELLED")
                .build();

        when(reservationRepository.findById(1)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.cancelReservation(1))
                .isInstanceOf(IllegalStateException.class);

        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    @DisplayName("cancelReservation nonexistent id throws EntityNotFoundException")
    void cancelReservation_nonexistentId_throwsEntityNotFound() {
        when(reservationRepository.findById(99)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.cancelReservation(99))
                .isInstanceOf(EntityNotFoundException.class);

        verify(reservationRepository, never()).save(any(Reservation.class));
    }
}
