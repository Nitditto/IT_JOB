package com.example.demo.dto.request;

import java.time.Instant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter @AllArgsConstructor
public class CVCreationRequest {
    @NotBlank(message = "Vui lòng điền tên của bạn!")
    private String name;
    @NotBlank(message = "Vui lòng điền số điện thoại của bạn!")
    @Pattern(regexp = "^[0-9+() -]{8,20}$", message = "Số điện thoại không hợp lệ!")
    private String phone;
    @NotBlank(message = "Vui lòng điền email của bạn!")
    @Email(message = "Email không đúng định dạng!")
    private String email;
    @NotBlank(message = "Vui lòng nộp file CV của bạn!")
    private String cvFile;

    private String referral;
    @Size(max = 5000, message = "Thư xin việc quá dài!")
    private String coverLetter;
    @Pattern(regexp = "^$|^https?://.+", message = "Portfolio phải là đường dẫn http(s)!")
    @Size(max = 500, message = "Đường dẫn quá dài!")
    private String portfolioUrl;
    @PositiveOrZero(message = "Mức lương mong muốn không được âm!")
    private Long expectedSalary;
    private Instant availableFrom;
}

