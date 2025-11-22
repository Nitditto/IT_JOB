package com.example.demo.services;

import java.security.Principal;

import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.dto.AccountDTO;
import com.example.demo.dto.CompanyDTO;
import com.example.demo.dto.CompanyEditRequest;
import com.example.demo.dto.RegistrationRequest;
import com.example.demo.dto.UserDTO;
import com.example.demo.dto.UserEditRequest;
import com.example.demo.enums.UserRole;
import com.example.demo.model.Account;
import com.example.demo.repository.AccountRepository;
import com.example.demo.repository.LocationRepository;

import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class UserServices {
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final LocationRepository locationRepository;
    private final LocationServices locationServices;
    public Account register(RegistrationRequest request, UserRole role) {
        // Check if email already exists
        if (!accountRepository.findByEmail(request.getEmail()).isEmpty()) {
            throw new IllegalStateException("Email đã được sử dụng!");
        }

        // Create account
        Account account = new Account();
        account.setName(request.getName());
        account.setEmail(request.getEmail());
        account.setRole(role);
        // Encrypt password before setting it
        String encryptedPassword = passwordEncoder.encode(request.getPassword());
        account.setPassword(encryptedPassword);

        return accountRepository.save(account);
    }

    public UserDTO convertToUser(Account account) {
        return new UserDTO(
            account.getId(),
            account.getName(),
            account.getEmail(),
            account.getRole(),
            account.getAvatar(),
            account.getPhone(),
            account.getDescription(),
            account.getStatus(),
            account.getLookingfor(),
            account.getAddress(),
            account.getLocation()
        );
    }
    
    public CompanyDTO convertToCompany(Account account) {
        return new CompanyDTO(
            account.getId(),
            account.getName(),
            account.getEmail(),
            account.getRole(),
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

    public AccountDTO convertToBrief(Account account) {
        return new AccountDTO(account.getId(), account.getName(), account.getEmail(), account.getRole(), account.getAvatar());
    }
    public Account getCurrentUser(Principal principal) {
        String email = principal.getName();

        Account account = accountRepository.findByEmail(email)
        .orElseThrow(()->new UsernameNotFoundException("Username not found"));
        return account;
    }

    public Account getUserById(Long userID) {
        Account account = accountRepository.findById(userID)
        .orElseThrow(()-> new UsernameNotFoundException("Username not found"));
        return account;
    }

    public Account editUser(Long accountID, UserEditRequest request) {
        Account account = accountRepository.findById(accountID).get();
        
        account.setName(request.getName());
        account.setAddress(request.getAddress());
        account.setAvatar(request.getAvatar());
        account.setDescription(request.getDescription());
        account.setEmail(request.getEmail());
        // account.setLocation(request.getLocation());
        account.setLookingfor(request.getLookingfor());
        account.setStatus(request.getStatus());
        account.setPhone(request.getPhone());
        account.setLocation(locationServices.getLocation(request.getLocation()));
        // if (request.getLocation() != null && request.getLocation().getAbbreviation() != null) { 
             
        //      // 1. Lấy String mã vùng (ví dụ "HN") từ Object
        //      String abbr = request.getLocation().getAbbreviation();

        //      // 2. Truyền String vào hàm tìm kiếm
        //      // (Nếu không tìm thấy mã vùng mới, giữ nguyên mã vùng cũ)
        //      Location loc = locationRepository.findByAbbreviation(abbr)
        //          .orElse(account.getLocation());
             
        //      account.setLocation(loc);
        // }
        return accountRepository.save(account);
    }

        public Account editCompany(Long accountID, CompanyEditRequest request) {
        Account account = accountRepository.findById(accountID).get();
        account.setName(request.getName());
        account.setAddress(request.getAddress());
        account.setAvatar(request.getAvatar());
        account.setDescription(request.getDescription());
        account.setEmail(request.getEmail());
        account.setLocation(locationServices.getLocation(request.getLocation()));
        account.setPhone(request.getPhone());
        
        // if (request.getLocation() != null && request.getLocation().getAbbreviation() != null) {
            
        //     // Lấy mã vùng từ object request
        //     String abbr = request.getLocation().getAbbreviation();
            
        //     // Tìm trong DB để đảm bảo dữ liệu chính xác
        //     Location loc = locationRepository.findByAbbreviation(abbr)
        //         .orElse(account.getLocation()); // Nếu không tìm thấy thì giữ nguyên cũ
            
        //     account.setLocation(loc);
        // }
        account.setModel(request.getModel());
        account.setScale(request.getScale());
        account.setStartWork(request.getStartWork());
        account.setEndWork(request.getEndWork());
        account.setHasOvertime(request.getHasOvertime());
        return accountRepository.save(account);
    }
}
