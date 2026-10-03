package com.example.demo.services;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import com.example.demo.enums.CVStatus;
import com.example.demo.enums.CvActor;

/**
 * Nguồn duy nhất cho việc CV được phép chuyển từ trạng thái nào sang trạng thái nào và do ai.
 * Cùng trạng thái ({@code X → X}) luôn hợp lệ và là no-op, xử lý ở service.
 */
public final class CvStatusTransitions {

    private static final Map<CvActor, Map<CVStatus, Set<CVStatus>>> RULES = new EnumMap<>(CvActor.class);

    static {
        final Map<CVStatus, Set<CVStatus>> company = new EnumMap<>(CVStatus.class);
        company.put(CVStatus.PENDING, EnumSet.of(CVStatus.APPROVED, CVStatus.REJECTED));
        company.put(CVStatus.APPROVED, EnumSet.of(CVStatus.REJECTED, CVStatus.OFFERED));
        company.put(CVStatus.INTERVIEW_SCHEDULED, EnumSet.of(CVStatus.INTERVIEW_DONE, CVStatus.REJECTED));
        company.put(CVStatus.INTERVIEW_DONE, EnumSet.of(CVStatus.OFFERED, CVStatus.REJECTED));
        RULES.put(CvActor.COMPANY, company);

        final Map<CVStatus, Set<CVStatus>> candidate = new EnumMap<>(CVStatus.class);
        for (final CVStatus from : EnumSet.of(CVStatus.PENDING, CVStatus.APPROVED, CVStatus.INTERVIEW_SCHEDULED,
                CVStatus.INTERVIEW_DONE, CVStatus.OFFERED)) {
            candidate.put(from, EnumSet.of(CVStatus.WITHDRAWN));
        }
        RULES.put(CvActor.CANDIDATE, candidate);

        final Map<CVStatus, Set<CVStatus>> system = new EnumMap<>(CVStatus.class);
        system.put(CVStatus.APPROVED, EnumSet.of(CVStatus.INTERVIEW_SCHEDULED));
        system.put(CVStatus.INTERVIEW_SCHEDULED, EnumSet.of(CVStatus.APPROVED));
        RULES.put(CvActor.SYSTEM, system);
    }

    private CvStatusTransitions() {
    }

    public static boolean isAllowed(final CvActor actor, final CVStatus from, final CVStatus to) {
        if (from == to) {
            return true;
        }
        return RULES.get(actor).getOrDefault(from, EnumSet.noneOf(CVStatus.class)).contains(to);
    }
}
