package com.example.demo.services;

import java.util.List;

import com.example.demo.dto.request.CVCreationRequest;
import com.example.demo.dto.response.CVResponse;
import com.example.demo.dto.request.CVEditRequest;
import com.example.demo.enums.CVStatus;
import com.example.demo.model.CV;

public interface CVService {
    CV addCV(CVCreationRequest request, Long accountID, Long jobID);
    CV editCV(CVEditRequest request, Long accountID, Long jobID);
    void deleteCV(Long jobID, Long accountID);
    List<CV> getCVByUserID(Long userID);
    List<CV> getCVByJobID(Long jobID);
    CV getCVDetail(Long jobId, Long accountId);
    CV updateCVStatus(Long jobId, Long accountId, CVStatus newStatus);
    CVResponse toDTO(CV cv);
}

