package com.example.demo.redis.repository;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import com.example.demo.model.Job;
import com.example.demo.redis.core.repository.AbstractRedisRepository;
import com.example.demo.redis.core.sync.DbSyncService;
import com.example.demo.redis.entity.JobRedis;
import com.example.demo.repository.JobRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@Repository
public class JobRedisRepository extends AbstractRedisRepository<JobRedis, Long> {

    private final JobRepository jobRepository;

    public JobRedisRepository(RedisTemplate<String, Object> redisTemplate,
            @Qualifier("redisObjectMapper") ObjectMapper redisObjectMapper,
            DbSyncService dbSyncService,
            JobRepository jobRepository) {
        super(redisTemplate, redisObjectMapper, dbSyncService);
        this.jobRepository = jobRepository;
    }

    @Override
    protected Long generateId() {
        throw new UnsupportedOperationException(
                "Job.id sinh bởi DB sequence — JobRedis phải tạo từ Job đã lưu DB "
                        + "(JobRedis.fromJpaEntity(job) sau khi jobRepository.save()), không tự sinh ID được.");
    }

    @Override
    protected Optional<JobRedis> loadFromDb(Long id) {
        return jobRepository.findById(id).map(JobRedis::fromJpaEntity);
    }

    @Override
    protected Long convertId(Object rawId) {
        return rawId instanceof Long l ? l : Long.parseLong(rawId.toString());
    }
}
