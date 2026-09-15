package com.aura.service;

import com.aura.dto.AuthDtos.AuthResponse;
import com.aura.dto.AuthDtos.ChangePasswordRequest;
import com.aura.dto.AuthDtos.CustomerRegisterRequest;
import com.aura.dto.AuthDtos.LoginRequest;
import com.aura.dto.AuthDtos.StaffCreateRequest;
import com.aura.exception.UsernameAlreadyExistsException;
import com.aura.system.entities.Account;
import com.aura.system.entities.Account.Role;
import com.aura.system.entities.Customer;
import com.aura.system.entities.Staff;
import com.aura.system.repositories.AccountRepository;
import com.aura.system.repositories.CustomerRepository;
import com.aura.system.repositories.StaffRepository;
import com.aura.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private StaffRepository staffRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private AuthenticationManager authenticationManager;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(accountRepository, customerRepository, staffRepository,
                passwordEncoder, jwtUtil, authenticationManager);
        ReflectionTestUtils.setField(authService, "expiryMs", 86400000L);
    }

    @Test
    @DisplayName("login with valid credentials returns AuthResponse")
    void login_withValidCredentials_returnsAuthResponse() {
        LoginRequest request = new LoginRequest("user1", "password");
        Account account = Account.builder()
                .username("user1")
                .role(Role.CUSTOMER)
                .build();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(accountRepository.findByUsername("user1")).thenReturn(Optional.of(account));
        when(jwtUtil.generateToken(account)).thenReturn("jwt.token.here");

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.token()).isEqualTo("jwt.token.here");
        assertThat(response.username()).isEqualTo("user1");
        assertThat(response.role()).isEqualTo("CUSTOMER");
        assertThat(response.expiresIn()).isEqualTo(86400L);
    }

    @Test
    @DisplayName("login with invalid credentials throws BadCredentialsException")
    void login_withInvalidCredentials_throwsBadCredentials() {
        LoginRequest request = new LoginRequest("user1", "wrongpassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid username or password"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid username or password");
    }

    @Test
    @DisplayName("register with new username creates account and customer")
    void register_withNewUsername_createsAccountAndCustomer() {
        CustomerRegisterRequest request = new CustomerRegisterRequest("newuser", "pass", "John", "Doe", "j@d.com", "123");

        when(accountRepository.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("pass")).thenReturn("encodedPass");
        
        Account account = Account.builder().username("newuser").role(Role.CUSTOMER).build();
        when(accountRepository.save(any(Account.class))).thenReturn(account);
        when(jwtUtil.generateToken(any(Account.class))).thenReturn("token");

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.token()).isEqualTo("token");
        verify(accountRepository).save(any(Account.class));
        verify(customerRepository).save(any(Customer.class));
    }

    @Test
    @DisplayName("register with existing username throws UsernameAlreadyExistsException")
    void register_withExistingUsername_throwsUsernameAlreadyExists() {
        CustomerRegisterRequest request = new CustomerRegisterRequest("existing", "pass", "John", "Doe", "j@d.com", "123");

        when(accountRepository.existsByUsername("existing")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(UsernameAlreadyExistsException.class);
        
        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("changePassword with correct old password updates password")
    void changePassword_withCorrectOldPassword_updatesPassword() {
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass", "newPass");
        Account account = Account.builder().username("user").passwordHash("encodedOldPass").build();

        when(accountRepository.findByUsername("user")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("oldPass", "encodedOldPass")).thenReturn(true);
        when(passwordEncoder.matches("newPass", "encodedOldPass")).thenReturn(false);
        when(passwordEncoder.encode("newPass")).thenReturn("encodedNewPass");

        authService.changePassword("user", request);

        verify(accountRepository).save(account);
        assertThat(account.getPasswordHash()).isEqualTo("encodedNewPass");
    }

    @Test
    @DisplayName("changePassword with incorrect old password throws BadCredentialsException")
    void changePassword_withIncorrectOldPassword_throwsBadCredentials() {
        ChangePasswordRequest request = new ChangePasswordRequest("wrongOld", "newPass");
        Account account = Account.builder().username("user").passwordHash("encodedOldPass").build();

        when(accountRepository.findByUsername("user")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("wrongOld", "encodedOldPass")).thenReturn(false);

        assertThatThrownBy(() -> authService.changePassword("user", request))
                .isInstanceOf(BadCredentialsException.class);
                
        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("changePassword with same new password throws IllegalArgumentException")
    void changePassword_withSameNewPassword_throwsIllegalArgument() {
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass", "oldPass");
        Account account = Account.builder().username("user").passwordHash("encodedOldPass").build();

        when(accountRepository.findByUsername("user")).thenReturn(Optional.of(account));
        when(passwordEncoder.matches("oldPass", "encodedOldPass")).thenReturn(true);
        when(passwordEncoder.matches("oldPass", "encodedOldPass")).thenReturn(true);

        assertThatThrownBy(() -> authService.changePassword("user", request))
                .isInstanceOf(IllegalArgumentException.class);

        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("registerStaff with valid role creates staff account")
    void registerStaff_withValidRole_createsStaffAccount() {
        StaffCreateRequest request = new StaffCreateRequest("staff1", "pass", "Jane", "Doe", "j@d.com", "123", Role.ADMIN);

        when(accountRepository.existsByUsername("staff1")).thenReturn(false);
        when(passwordEncoder.encode("pass")).thenReturn("encodedPass");
        
        Account account = Account.builder().username("staff1").role(Role.ADMIN).build();
        when(accountRepository.save(any(Account.class))).thenReturn(account);
        when(jwtUtil.generateToken(any(Account.class))).thenReturn("token");

        AuthResponse response = authService.registerStaff(request);

        assertThat(response).isNotNull();
        verify(accountRepository).save(any(Account.class));
        verify(staffRepository).save(any(Staff.class));
    }

    @Test
    @DisplayName("registerStaff with CUSTOMER role throws IllegalArgumentException")
    void registerStaff_withCustomerRole_throwsIllegalArgument() {
        StaffCreateRequest request = new StaffCreateRequest("staff1", "pass", "Jane", "Doe", "j@d.com", "123", Role.CUSTOMER);

        assertThatThrownBy(() -> authService.registerStaff(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid role");
    }

    @Test
    @DisplayName("registerStaff with null role throws IllegalArgumentException")
    void registerStaff_withNullRole_throwsIllegalArgument() {
        StaffCreateRequest request = new StaffCreateRequest("staff1", "pass", "Jane", "Doe", "j@d.com", "123", null);

        assertThatThrownBy(() -> authService.registerStaff(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Role is required");
    }

    @Test
    @DisplayName("registerStaff with existing username throws UsernameAlreadyExistsException")
    void registerStaff_withExistingUsername_throwsUsernameAlreadyExists() {
        StaffCreateRequest request = new StaffCreateRequest("existing", "pass", "Jane", "Doe", "j@d.com", "123", Role.ADMIN);

        when(accountRepository.existsByUsername("existing")).thenReturn(true);

        assertThatThrownBy(() -> authService.registerStaff(request))
                .isInstanceOf(UsernameAlreadyExistsException.class);
    }
}
