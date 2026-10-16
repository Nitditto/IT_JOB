package com.example.demo.dto.request;

import java.util.List;

import com.example.demo.enums.UserStatus;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class UserEditRequest {
    @NotBlank(message = "Vui lòng nhập tên!")
    private String name;
    @NotBlank(message = "Vui lòng nhập email!")
    @Email(message = "Email không đúng định dạng!")
    private String email;
    private String avatar;
    private String phone;
    private String description;
    private UserStatus status;
    private String lookingfor;
    private List<String> skills;
    private String address;
    private String location;
}

