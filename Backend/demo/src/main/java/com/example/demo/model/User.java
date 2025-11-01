package com.example.demo.model;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.example.demo.enums.UserRole;
import com.example.demo.enums.UserStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@Entity
@Table(name = "users")
@NoArgsConstructor
@Getter @Setter
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;


    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Lob
    private byte[] avatar;

    private String phone;

    private String description;

    @Enumerated(EnumType.STRING)
    private UserStatus status;

    private String lookingfor;

    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_abbreviation")
    private Location location;



    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Trả về một danh sách các quyền của user
        // Spring Security thường yêu cầu quyền có tiền tố "ROLE_"
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getUsername() {
        // Spring Security sẽ dùng email làm "username" để đăng nhập
        return this.email;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public boolean isAccountNonExpired() {
        // Tài khoản không bao giờ hết hạn
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        // Tài khoản không bao giờ bị khóa
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        // Mật khẩu không bao giờ hết hạn
        return true;
    }

    @Override
    public boolean isEnabled() {
        // Tài khoản luôn được kích hoạt
        return true;
    }
}
