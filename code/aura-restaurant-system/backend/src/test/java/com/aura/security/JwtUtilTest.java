package com.aura.security;

import com.aura.model.User;
import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    // Valid Base64-encoded 256-bit key for tests
    private static final String TEST_SECRET =
            "dGVzdC1zZWNyZXQta2V5LXRoYXQtaXMtMzItY2hhcnMtbG9uZw==";

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtil, "expiryMs", 86400000L); // 24h
    }

    private User buildUser(String username, User.Role role) {
        return User.builder()
                .username(username)
                .passwordHash("$2a$12$ignored")
                .role(role)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Generated token contains correct username")
    void generateToken_containsUsername() {
        User user = buildUser("chef_bob", User.Role.KITCHEN);
        String token = jwtUtil.generateToken(user);

        assertThat(jwtUtil.extractUsername(token)).isEqualTo("chef_bob");
    }

    @Test
    @DisplayName("Generated token contains correct role claim")
    void generateToken_containsRoleClaim() {
        User user = buildUser("staff_jane", User.Role.STAFF);
        String token = jwtUtil.generateToken(user);

        assertThat(jwtUtil.extractRoles(token)).contains("ROLE_STAFF");
    }

    @Test
    @DisplayName("Valid token passes validation")
    void validateToken_validToken_returnsTrue() {
        User user = buildUser("admin", User.Role.ADMIN);
        String token = jwtUtil.generateToken(user);

        assertThat(jwtUtil.validateToken(token, user)).isTrue();
    }

    @Test
    @DisplayName("Token for different user fails validation")
    void validateToken_wrongUser_returnsFalse() {
        User admin = buildUser("admin", User.Role.ADMIN);
        User other = buildUser("other_user", User.Role.STAFF);

        String token = jwtUtil.generateToken(admin);

        assertThat(jwtUtil.validateToken(token, other)).isFalse();
    }

    @Test
    @DisplayName("Expired token throws ExpiredJwtException")
    void expiredToken_throwsException() {
        // Set expiry to -1ms so token is immediately expired
        ReflectionTestUtils.setField(jwtUtil, "expiryMs", -1L);
        User user = buildUser("admin", User.Role.ADMIN);
        String token = jwtUtil.generateToken(user);

        assertThatThrownBy(() -> jwtUtil.extractUsername(token))
                .isInstanceOf(ExpiredJwtException.class);
    }

    @Test
    @DisplayName("Tampered token fails validation")
    void tamperedToken_failsValidation() {
        User user = buildUser("admin", User.Role.ADMIN);
        String token = jwtUtil.generateToken(user) + "tampered";

        assertThat(jwtUtil.validateToken(token, user)).isFalse();
    }
}
