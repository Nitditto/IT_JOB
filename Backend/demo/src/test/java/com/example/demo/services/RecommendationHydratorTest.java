package com.example.demo.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.demo.dto.response.JobCardResponse;
import com.example.demo.dto.response.JobRecommendationItemDto;
import com.example.demo.dto.response.JobRecommendationResponse;
import com.example.demo.model.Job;

@ExtendWith(MockitoExtension.class)
class RecommendationHydratorTest {

    @Mock
    private JobService jobService;

    @InjectMocks
    private RecommendationHydrator hydrator;

    private Job job101;
    private Job job102;
    private JobCardResponse card101;
    private JobCardResponse card102;

    @BeforeEach
    void setUp() {
        job101 = new Job();
        job101.setId(101L);
        job101.setCompanyID(1L);

        job102 = new Job();
        job102.setId(102L);
        job102.setCompanyID(1L);

        card101 = new JobCardResponse();
        card101.setId(101L);
        card101.setName("Job 101");

        card102 = new JobCardResponse();
        card102.setId(102L);
        card102.setName("Job 102");
    }

    @Test
    void hydrateRecommendations_ShouldPerformBulkLookupAndPreserveScoreOrdering() {
        List<JobRecommendationItemDto> items = List.of(
                new JobRecommendationItemDto(102L, 95.0),
                new JobRecommendationItemDto(101L, 88.0)
        );

        when(jobService.findAllByIds(List.of(102L, 101L))).thenReturn(List.of(job101, job102));
        when(jobService.toCardList(anyList())).thenReturn(List.of(card101, card102));

        List<JobRecommendationResponse> result = hydrator.hydrateRecommendations(items);

        assertEquals(2, result.size());
        assertEquals(102L, result.get(0).getJob().getId());
        assertEquals(95.0, result.get(0).getMatchPercentage());
        assertEquals(101L, result.get(1).getJob().getId());
        assertEquals(88.0, result.get(1).getMatchPercentage());

        verify(jobService).findAllByIds(List.of(102L, 101L));
    }

    @Test
    void hydrateRecommendations_EmptyItems_ShouldReturnEmptyList() {
        List<JobRecommendationResponse> result = hydrator.hydrateRecommendations(List.of());
        assertTrue(result.isEmpty());
    }
}
