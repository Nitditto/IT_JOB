package com.example.demo.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

import com.example.demo.dto.request.JobCreationRequest;
import com.example.demo.enums.JobPosition;
import com.example.demo.enums.JobWorkstyle;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

class JobCreationRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private JobCreationRequest parse(final String json) throws Exception {
        return new ObjectMapper().findAndRegisterModules()
                .registerModule(new com.fasterxml.jackson.module.paramnames.ParameterNamesModule())
                .readValue(json, JobCreationRequest.class);
    }

    @Test
    void validRequestHasNoViolations() throws Exception {
        final JobCreationRequest request = this.parse(
                "{\"name\":\"Dev\",\"minSalary\":100,\"maxSalary\":200,\"position\":\"junior\",\"workstyle\":\"remote\",\"images\":[\"a.png\"]}");

        assertTrue(this.validator.validate(request).isEmpty());
        assertEquals(JobPosition.junior, request.getPosition());
        assertEquals(JobWorkstyle.remote, request.getWorkstyle());
    }

    @Test
    void missingRequiredFieldsAreReportedNotThrown() throws Exception {
        final JobCreationRequest request = this.parse("{\"name\":\"Dev\",\"minSalary\":100,\"maxSalary\":200,\"images\":[]}");

        final Set<ConstraintViolation<JobCreationRequest>> violations = this.validator.validate(request);

        assertEquals(List.of("images", "position", "workstyle"),
                violations.stream().map(v -> v.getPropertyPath().toString()).sorted().toList());
    }
}
