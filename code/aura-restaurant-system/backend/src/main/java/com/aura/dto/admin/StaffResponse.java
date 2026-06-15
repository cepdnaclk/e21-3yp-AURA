package com.aura.dto.admin;

import lombok.Builder;

@Builder
public record StaffResponse(
        Long id,
        String username,
        String firstName,
        String lastName,
        String email,
        String phone,
        String role,
        boolean active
) {}