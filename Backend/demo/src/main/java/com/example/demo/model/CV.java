package com.example.demo.model;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.example.demo.enums.CVStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cv")
@NoArgsConstructor @AllArgsConstructor
@Getter @Setter
public class CV {
    @EmbeddedId
    private CVId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("accountID")
    @JoinColumn(name = "accounts_id")
    @JsonIgnore
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("jobID")
    @JoinColumn(name = "jobs_id")
    @JsonIgnore
    private Job job;

    private String name;

    private String phone;

    private String email;

    @Column(columnDefinition = "TEXT")
    private String cvFile;

    @Column(columnDefinition = "TEXT")
    private String referral;

    @Column(columnDefinition = "TEXT")
    private String coverLetter;

    private String portfolioUrl;
    private Long expectedSalary;
    private Instant availableFrom;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant submittedAt;

    @UpdateTimestamp
    private Instant updatedAt;

    @Enumerated(EnumType.STRING)
    private CVStatus status = CVStatus.PENDING;

    @Version
    private Long version;
}

