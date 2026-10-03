package com.example.demo.dto.request;

import com.example.demo.enums.CVStatus;

public record UpdateCvStatusCommand(Long jobId, Long candidateId, Long actorCompanyId, CVStatus newStatus) {
}
