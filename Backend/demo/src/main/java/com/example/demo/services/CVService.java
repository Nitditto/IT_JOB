package com.example.demo.services;

import java.util.List;

import com.example.demo.dto.request.CVCreationRequest;
import com.example.demo.dto.response.CVResponse;
import com.example.demo.dto.request.CVEditRequest;
import com.example.demo.dto.request.UpdateCvStatusCommand;
import com.example.demo.model.CV;

public interface CVService {
    CV addCV(CVCreationRequest request, Long accountID, Long jobID);
    CV editCV(CVEditRequest request, Long accountID, Long jobID);
    void deleteCV(Long jobID, Long accountID);
    List<CV> getCVByUserID(Long userID);
    List<CV> getCVByJobID(Long jobID, Long companyId);
    CV getCVDetail(Long jobId, Long accountId);
    CV getCVDetailForCompany(Long jobId, Long accountId, Long companyId);
    CV updateCVStatus(UpdateCvStatusCommand command);
    CVResponse toDTO(CV cv);
    List<CVResponse> toDTOList(List<CV> cvs);
}

