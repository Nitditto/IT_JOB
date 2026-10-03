package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Compact DTO đại diện cho 1 item gợi ý lưu trong Redis.
 *
 * <p>Thay vì lưu toàn bộ {@link JobRecommendationResponse} chứa DTO JobCardResponse cồng kềnh,
 * Redis chỉ lưu nhẹ {@code jobId} và {@code matchPercentage}. Chi tiết Job sẽ được hydrate
 * theo batch từ DB/Elasticsearch khi trả về client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobRecommendationItemDto {
    private Long jobId;
    private double matchPercentage;
}
