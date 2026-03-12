package com.aura.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * Staff member entity — maps to the 'staff' table in PostgreSQL.
 * Implements UserDetails so Spring Security can use it directly for authentication.
 *
 * Roles:
 *   ADMIN   → full access (menu, staff management, reports)
 *   STAFF   → payments and table management
 *   KITCHEN → view and update order status only
 */
@Entity
@Table(name = "staff", uniqueConstraints = @UniqueConstraint(columnNames = "username"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User implements UserDetails {

    // Auto-generated primary key — named staff_id to match the ER diagram
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staff_id")
    private Long id;

    // Staff member's real name — used for display, not for login
    @NotBlank(message = "Name is required")
    @Column(nullable = false, length = 100)
    private String name;

    // Login username — must be unique across all staff
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    // BCrypt hashed password — NEVER stored as plaintext
    // Column named 'password' to match ER diagram, but we call it passwordHash in Java
    // as a reminder that it's always hashed before saving
    @NotBlank(message = "Password is required")
    @Column(name = "password", nullable = false)
    private String passwordHash;

    // Role stored as string in DB (e.g. "ADMIN") so it's human-readable
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    // Soft delete — set to false when staff leaves instead of deleting the record
    // This keeps order history intact. @Builder.Default ensures true when using builder
    @Column(name = "is_active")
    @Builder.Default
    private boolean active = true;

    // Auto-set on first save — never changes after that
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // ─── UserDetails (required by Spring Security) ───────────────────────────

    // Returns role as "ROLE_ADMIN", "ROLE_KITCHEN" etc.
    // This is what SecurityConfig checks with .hasRole("ADMIN")
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    // Spring Security uses this to compare the login password against the BCrypt hash
    @Override
    public String getPassword() {
        return passwordHash;
    }

    // Not implementing expiry or locking for now — return true means "no restrictions"
    // isEnabled() uses isActive so deactivated staff cannot log in
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return active; }

    // ─── Roles ───────────────────────────────────────────────────────────────

    public enum Role {
        ADMIN,    // Full system access
        STAFF,    // Payments and table management
        KITCHEN   // Order status updates only
    }
}