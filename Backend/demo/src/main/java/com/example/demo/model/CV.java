package com.example.demo.model;

import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
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
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("jobID")
    @JoinColumn(name = "jobs_id")
    private Job job;

    private String name;

    private String phone;

    @Lob
    private String cvFile;

    @Lob
    private String referral;
}
