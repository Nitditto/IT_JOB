package com.example.demo.model;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import org.hibernate.annotations.CreationTimestamp;

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
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "jobs")
@NoArgsConstructor
@Getter
@Setter
@AllArgsConstructor
@Builder
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private Instant createdAt;

    private Long companyID;
    private String name;
    private Long minSalary;
    private Long maxSalary;

    @Enumerated(EnumType.STRING)
    private JobPosition position;

    @Enumerated(EnumType.STRING)
    private JobWorkstyle workstyle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_abbreviation")
    private Location location;

    private String address;

    @ElementCollection
    @CollectionTable(name = "job_tags", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "tag")
    private Set<String> tags;

    @ElementCollection
    @CollectionTable(name = "job_images", joinColumns = @JoinColumn(name = "job_id"))
    @Lob
    private Set<String> images;

    @Column(length = 2000)
    private String description;

    @Default
    private Integer appliedCount = 0;

    @Version
    private Long version;
}
