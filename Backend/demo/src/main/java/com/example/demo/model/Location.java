package com.example.demo.model;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "location")
@NoArgsConstructor
@AllArgsConstructor
@Getter @Setter
public class Location {
    @Id
    private String abbreviation;

    @Column(nullable = false, unique = true)
    private String name;
}
