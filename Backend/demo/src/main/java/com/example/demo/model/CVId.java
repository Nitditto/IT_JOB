package com.example.demo.model;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Embeddable
@NoArgsConstructor @AllArgsConstructor @Getter @Setter
public class CVId {
    private Long accountID;
    private Long jobID;
}
