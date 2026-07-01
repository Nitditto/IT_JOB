package com.example.demo.services.impl;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.response.AccountResponse;
import com.example.demo.dto.response.CompanyResponse;
import com.example.demo.dto.request.CompanyEditRequest;
import com.example.demo.dto.request.RegistrationRequest;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.dto.request.UserEditRequest;
import com.example.demo.enums.UserRole;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.model.Account;
import com.example.demo.model.Job;
import com.example.demo.repository.AccountRepository;
import com.example.demo.repository.JobRepository;
import com.example.demo.services.LocationService;
import com.example.demo.services.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final LocationService locationService;
    private final JobRepository jobRepository;

    @Override
    @Transactional
    public Account register(RegistrationRequest request, UserRole role) {
        log.info("Registering new user with email: {} and role: {}", request.getEmail(), role);
        
        if (accountRepository.findByEmail(request.getEmail()).isPresent()) {
            log.warn("Registration failed: Email {} already in use", request.getEmail());
            throw new BadRequestException("Email đã được sử dụng!");
        }

        Account account = new Account();
        account.setName(request.getName());
        account.setEmail(request.getEmail());
        account.setRole(role);
        String encryptedPassword = passwordEncoder.encode(request.getPassword());
        account.setPassword(encryptedPassword);

        Account savedAccount = accountRepository.save(account);
        log.info("User {} registered successfully with ID {}", savedAccount.getEmail(), savedAccount.getId());
        return savedAccount;
    }

    @Override
    public UserResponse convertToUser(Account account) {
        return new UserResponse(
            account.getId(),
            account.getName(),
            account.getEmail(),
            account.getAvatar(),
            account.getPhone(),
            account.getDescription(),
            account.getStatus(),
            account.getLookingfor(),
            account.getAddress(),
            account.getLocation()
        );
    }
    
    @Override
    public CompanyResponse convertToCompany(Account account) {
        return new CompanyResponse(
            account.getId(),
            account.getName(),
            account.getEmail(),
            account.getAvatar(),
            account.getPhone(),
            account.getDescription(),
            account.getAddress(),
            account.getLocation(),
            account.getModel(),
            account.getScale(),
            account.getStartWork(),
            account.getEndWork(),
            account.getHasOvertime()
        );
    }

    @Override
    public AccountResponse convertToBrief(Account account) {
        return new AccountResponse(
            account.getId(), 
            account.getName(), 
            account.getEmail(), 
            account.getRole(), 
            account.getAvatar()
        );
    }

    @Override
    public Account getCurrentUser(Principal principal) {
        String email = principal.getName();
        log.info("Fetching current authenticated user: {}", email);
        return accountRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("User not found with email: {}", email);
                    return new ResourceNotFoundException("Tài khoản không tồn tại!");
                });
    }

    @Override
    public Account getUserById(Long userID) {
        log.info("Fetching user by ID {}", userID);
        return accountRepository.findById(userID)
                .orElseThrow(() -> {
                    log.warn("User not found with ID {}", userID);
                    return new ResourceNotFoundException("Tài khoản không tồn tại!");
                });
    }

    @Override
    public List<Account> getUsersByRole(UserRole role) {
        log.info("Fetching users by role {}", role);
        return accountRepository.findByRole(role);
    }

    @Override
    @Transactional
    public Account editUser(Long accountID, UserEditRequest request) {
        log.info("Editing profile for user ID {}", accountID);
        Account account = accountRepository.findById(accountID)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại!"));
        
        account.setName(request.getName());
        account.setAddress(request.getAddress());
        account.setAvatar(request.getAvatar());
        account.setDescription(request.getDescription());
        account.setEmail(request.getEmail());
        account.setLookingfor(request.getLookingfor());
        account.setStatus(request.getStatus());
        account.setPhone(request.getPhone());
        
        if (request.getLocation() != null && !request.getLocation().trim().isEmpty()) {
            account.setLocation(locationService.getLocation(request.getLocation()));
        }
        
        return accountRepository.save(account);
    }

    @Override
    @Transactional
    public Account editCompany(Long accountID, CompanyEditRequest request) {
        log.info("Editing profile for company ID {}", accountID);
        Account account = accountRepository.findById(accountID)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại!"));
        
        account.setName(request.getName());
        account.setAddress(request.getAddress());
        account.setAvatar(request.getAvatar());
        account.setDescription(request.getDescription());
        account.setEmail(request.getEmail());
        
        if (request.getLocation() != null && !request.getLocation().trim().isEmpty()) {
            account.setLocation(locationService.getLocation(request.getLocation()));
        }
        
        account.setPhone(request.getPhone());
        account.setModel(request.getModel());
        account.setScale(request.getScale());
        account.setStartWork(request.getStartWork());
        account.setEndWork(request.getEndWork());
        account.setHasOvertime(request.getHasOvertime());
        
        return accountRepository.save(account);
    }

    @Override
    public List<CompanyResponse> getCompanyListSortedByJobs(Integer limit) {
        log.info("Fetching company list sorted by job count (limit={})", limit);
        List<Account> companies = accountRepository.findByRole(UserRole.ROLE_COMPANY);
        
        // Sắp xếp các công ty theo số lượng tin tuyển dụng (nhiều nhất xếp trước)
        companies.sort((a1, a2) -> {
            List<Job> a1Jobs = jobRepository.findByCompanyID(a1.getId());
            List<Job> a2Jobs = jobRepository.findByCompanyID(a2.getId());
            return Integer.compare(a2Jobs.size(), a1Jobs.size());
        });

        if (limit != null && limit > 0 && limit < companies.size()) {
            companies = companies.subList(0, limit);
        }
        
        return companies.stream()
                .map(this::convertToCompany)
                .collect(Collectors.toList());
    }
}
