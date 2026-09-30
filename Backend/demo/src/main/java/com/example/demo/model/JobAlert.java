package com.example.demo.model;

import java.time.Instant;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.example.demo.enums.JobEmploymentType;
import com.example.demo.enums.JobPosition;
import com.example.demo.enums.JobWorkstyle;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "job_alerts")
@NoArgsConstructor
@Getter
@Setter
public class JobAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    private String name;
    private String query;
    private String location;
    private String category;
    private String industry;
    private Long minSalary;
    private Long maxSalary;
    private Boolean active = true;

    @Enumerated(EnumType.STRING)
    private JobPosition position;

    @Enumerated(EnumType.STRING)
    private JobWorkstyle workstyle;

    @Enumerated(EnumType.STRING)
    private JobEmploymentType employmentType;

    @ElementCollection
    @CollectionTable(name = "job_alert_tags", joinColumns = @JoinColumn(name = "job_alert_id"))
    @Column(name = "tag")
    private Set<String> tags;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
