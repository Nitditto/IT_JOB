package com.example.demo.services;

import java.security.Principal;
import java.util.List;

import com.example.demo.dto.response.AccountResponse;
import com.example.demo.dto.response.CompanyResponse;
import com.example.demo.dto.request.CompanyEditRequest;
import com.example.demo.dto.request.RegistrationRequest;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.dto.request.UserEditRequest;
import com.example.demo.enums.UserRole;
import com.example.demo.model.Account;

public interface UserService {
    Account register(RegistrationRequest request, UserRole role);
    UserResponse convertToUser(Account account);
    CompanyResponse convertToCompany(Account account);
    AccountResponse convertToBrief(Account account);
    Account getCurrentUser(Principal principal);
    Account getUserById(Long userID);
    List<Account> getUsersByRole(UserRole role);
    Account editUser(Long accountID, UserEditRequest request);
    Account editCompany(Long accountID, CompanyEditRequest request);
    List<CompanyResponse> getCompanyListSortedByJobs(Integer limit);
}
