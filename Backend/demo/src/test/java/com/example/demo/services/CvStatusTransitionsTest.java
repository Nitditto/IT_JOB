package com.example.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.EnumSet;
import java.util.Set;

import org.junit.jupiter.api.Test;

import com.example.demo.enums.CVStatus;
import com.example.demo.enums.CvActor;

class CvStatusTransitionsTest {

    private static Set<String> allowedPairs(final CvActor actor) {
        final Set<String> pairs = new java.util.TreeSet<>();
        for (final CVStatus from : CVStatus.values()) {
            for (final CVStatus to : CVStatus.values()) {
                if (from != to && CvStatusTransitions.isAllowed(actor, from, to)) {
                    pairs.add(from + ">" + to);
                }
            }
        }
        return pairs;
    }

    @Test
    void companyTransitionsMatchSpecTable() {
        assertEquals(Set.of(
                "PENDING>APPROVED", "PENDING>REJECTED",
                "APPROVED>REJECTED", "APPROVED>OFFERED",
                "INTERVIEW_SCHEDULED>INTERVIEW_DONE", "INTERVIEW_SCHEDULED>REJECTED",
                "INTERVIEW_DONE>OFFERED", "INTERVIEW_DONE>REJECTED"), allowedPairs(CvActor.COMPANY));
    }

    @Test
    void candidateCanOnlyWithdrawFromActiveStatuses() {
        assertEquals(Set.of(
                "PENDING>WITHDRAWN", "APPROVED>WITHDRAWN", "INTERVIEW_SCHEDULED>WITHDRAWN",
                "INTERVIEW_DONE>WITHDRAWN", "OFFERED>WITHDRAWN"), allowedPairs(CvActor.CANDIDATE));
    }

    @Test
    void systemOnlyTogglesInterviewScheduled() {
        assertEquals(Set.of("APPROVED>INTERVIEW_SCHEDULED", "INTERVIEW_SCHEDULED>APPROVED"),
                allowedPairs(CvActor.SYSTEM));
    }

    @Test
    void companyCannotWithdrawOrScheduleInterview() {
        for (final CVStatus from : CVStatus.values()) {
            if (from != CVStatus.WITHDRAWN) {
                assertFalse(CvStatusTransitions.isAllowed(CvActor.COMPANY, from, CVStatus.WITHDRAWN));
            }
            if (from != CVStatus.INTERVIEW_SCHEDULED) {
                assertFalse(CvStatusTransitions.isAllowed(CvActor.COMPANY, from, CVStatus.INTERVIEW_SCHEDULED));
            }
        }
    }

    @Test
    void finalStatusesNeverTransition() {
        for (final CvActor actor : CvActor.values()) {
            for (final CVStatus finalStatus : EnumSet.of(CVStatus.REJECTED, CVStatus.WITHDRAWN)) {
                for (final CVStatus to : CVStatus.values()) {
                    if (to != finalStatus) {
                        assertFalse(CvStatusTransitions.isAllowed(actor, finalStatus, to));
                    }
                }
            }
        }
    }

    @Test
    void sameStatusIsAlwaysAllowed() {
        for (final CvActor actor : CvActor.values()) {
            for (final CVStatus status : CVStatus.values()) {
                assertTrue(CvStatusTransitions.isAllowed(actor, status, status));
            }
        }
    }
}
