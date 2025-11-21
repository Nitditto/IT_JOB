package com.example.demo.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.CVCreationRequest;
import com.example.demo.dto.CVDTO;
import com.example.demo.dto.CVEditRequest;
import com.example.demo.model.Account;
import com.example.demo.model.CV;
import com.example.demo.model.CVId;
import com.example.demo.repository.CVRepository;
import com.example.demo.services.CVServices;

import lombok.RequiredArgsConstructor;




@RestController
@RequiredArgsConstructor
@RequestMapping("/cv")
public class CVController {
    
    private final CVRepository cvRepository;
    private final CVServices cvServices;

    @GetMapping("/{jobId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getCVFromJob(@PathVariable Long jobID, @AuthenticationPrincipal Account user){
        try {
            CV cv = cvRepository.findById(new CVId(user.getId(), jobID)).orElseThrow(() -> new Exception("CV not found"));
            return ResponseEntity.ok(cv);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
    
    @PostMapping("/{id}/apply")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> apply(@PathVariable Long jobID, @RequestBody CVCreationRequest request, @AuthenticationPrincipal Account account) {
        try {
            CVDTO cvdto = new CVDTO(account.getId(), jobID, request.getName(), request.getPhone(), request.getCvFile(), request.getReferral());
            return ResponseEntity.ok(cvServices.addCV(cvdto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/edit")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> edit(@PathVariable Long jobID, @RequestBody CVEditRequest request, @AuthenticationPrincipal Account account) {
        try {
            CVDTO cvdto = new CVDTO(account.getId(), jobID, request.getName(), request.getPhone(), request.getCvFile(), request.getReferral());
            return ResponseEntity.ok(cvServices.editCV(cvdto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
    
    @GetMapping("/{id}/list")
    @PreAuthorize("hasRole('COMPANY')")
    public List<CV> getJobCV(@PathVariable("id") Long jobID) {
        return cvServices.getCVByJobID(jobID);
    }
    
    @GetMapping("/list")
    @PreAuthorize("hasRole('USER')")
    public List<CV> getUserCV(@PathVariable Long jobID, @AuthenticationPrincipal Account account) {
        return cvServices.getCVByUserID(account.getId());
    }
    
}
