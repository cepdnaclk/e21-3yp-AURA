package com.aura.system.dtos.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PublicReservationRequest {

    @NotBlank(message = "Name is required")
    private String customerName;

    @NotBlank(message = "Phone is required")
    private String phone;

    // Table ID — frontend sends table number, backend maps it
    @NotNull(message = "Table ID is required")
    private Integer tableId;

    @NotNull(message = "Reservation time is required")
    private LocalDateTime reservationTime;

    @NotNull(message = "Party size is required")
    @Min(value = 1, message = "Party size must be at least 1")
    private Integer partySize;

    // "BIRTHDAY", "ANNIVERSARY", "OTHER"
    @NotBlank(message = "Occasion is required")
    private String occasion;

    private String note;
}