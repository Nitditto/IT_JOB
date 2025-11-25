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
public class CVId implements Serializable {
    private Long accountID;
    private Long jobID;
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CVId cvId = (CVId) o;
        return Objects.equals(accountID, cvId.accountID) && Objects.equals(jobID, cvId.jobID);
    }

    @Override
    public int hashCode() {
        return Objects.hash(accountID, jobID);
    }
}
