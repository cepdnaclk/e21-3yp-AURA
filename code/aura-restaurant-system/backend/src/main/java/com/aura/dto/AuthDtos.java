package com.aura.dto;

import com.aura.model.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// ─── Inbound: Login ─────────────────────────────────────────────────────────

public class AuthDtos {

    /**
     * POST /api/auth/login
     * { "username": "admin", "password": "secret" }
     */
    public record LoginRequest(
            @NotBlank(message = "Username is required")
            String username,

            @NotBlank(message = "Password is required")
            String password
    ) {}

    /**
     * POST /api/auth/register
     * Admin use only — creates new staff accounts.
     */
    public record RegisterRequest(
            @NotBlank(message = "Username is required")
            @Size(min = 3, max = 50, message = "Username must be 3–50 characters")
            String username,

            @NotBlank(message = "Password is required")
            @Size(min = 8, message = "Password must be at least 8 characters")
            String password,

            User.Role role  // ADMIN | STAFF | KITCHEN — defaults to STAFF if null
    ) {}

    /**
     * Response for both login and register.
     * Returns the JWT token and basic user info.
     */
    public record AuthResponse(
            String token,
            String username,
            String role,
            long expiresIn   // seconds
    ) {}
}
