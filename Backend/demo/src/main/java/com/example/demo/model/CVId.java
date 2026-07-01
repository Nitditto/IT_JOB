package com.example.demo.model;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Embeddable
@Data
@NoArgsConstructor      // ← constructor không tham số (Hibernate cần)
@AllArgsConstructor     // ← constructor có tham số (CVId(Long, Long))
public class CVId implements Serializable {
    private Long accountID;
    private Long jobID;
}
