package com.example.demo.services;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.demo.dto.response.JobCardResponse;
import com.example.demo.dto.response.JobRecommendationResponse;
import com.example.demo.model.Account;
import com.example.demo.model.Job;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TfIdfRecommender {

    private final JobService jobService;

    /**
     * Recommends jobs for a candidate based on TF-IDF and Cosine Similarity.
     */
    public List<JobRecommendationResponse> recommendJobs(Account candidate, List<Job> jobs, int limit) {
        if (jobs == null || jobs.isEmpty() || candidate == null) {
            return new ArrayList<>();
        }

        // 1. Chuẩn bị văn bản cho ứng viên
        String candidateText = getCandidateText(candidate);
        List<String> candidateTokens = tokenize(candidateText);

        // 2. Chuẩn bị văn bản cho danh sách các Job
        Map<Long, List<String>> jobTokensMap = new HashMap<>();
        for (Job job : jobs) {
            String jobText = getJobText(job);
            jobTokensMap.put(job.getId(), tokenize(jobText));
        }

        // 3. Xây dựng từ điển từ vựng (Vocabulary) chung cho tất cả tài liệu
        Set<String> vocabulary = new HashSet<>();
        vocabulary.addAll(candidateTokens);
        for (List<String> tokens : jobTokensMap.values()) {
            vocabulary.addAll(tokens);
        }
        List<String> vocabList = new ArrayList<>(vocabulary);

        // 4. Tạo danh sách tất cả tài liệu để tính IDF
        List<List<String>> allDocuments = new ArrayList<>();
        allDocuments.add(candidateTokens);
        allDocuments.addAll(jobTokensMap.values());

        // 5. Tính IDF cho từng từ trong từ điển
        Map<String, Double> idfMap = calculateIdf(vocabList, allDocuments);

        // 6. Tính Vector TF-IDF cho ứng viên
        double[] candidateVector = calculateTfIdfVector(candidateTokens, vocabList, idfMap);

        // 7. Tính độ tương đồng Cosine Similarity cho từng Job
        List<JobRecommendationResponse> recommendations = new ArrayList<>();
        for (Job job : jobs) {
            List<String> jobTokens = jobTokensMap.get(job.getId());
            double[] jobVector = calculateTfIdfVector(jobTokens, vocabList, idfMap);

            double similarity = cosineSimilarity(candidateVector, jobVector);
            // Quy đổi sang phần trăm (làm tròn 2 chữ số thập phân)
            double matchPercentage = Math.round(similarity * 100.0 * 100.0) / 100.0;

            if (matchPercentage > 0) { // Chỉ gợi ý những việc có mức độ phù hợp > 0%
                JobCardResponse card = jobService.toCard(job);
                recommendations.add(new JobRecommendationResponse(card, matchPercentage));
            }
        }

        // 8. Sắp xếp giảm dần theo mức độ phù hợp (% match) và giới hạn số lượng trả về
        return recommendations.stream()
                .sorted((a, b) -> Double.compare(b.getMatchPercentage(), a.getMatchPercentage()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    private String getCandidateText(Account candidate) {
        StringBuilder sb = new StringBuilder();
        if (candidate.getName() != null) sb.append(candidate.getName()).append(" ");
        if (candidate.getLookingfor() != null) sb.append(candidate.getLookingfor()).append(" ");
        if (candidate.getDescription() != null) sb.append(candidate.getDescription()).append(" ");
        return sb.toString();
    }

    private String getJobText(Job job) {
        StringBuilder sb = new StringBuilder();
        if (job.getName() != null) sb.append(job.getName()).append(" ");
        if (job.getDescription() != null) sb.append(job.getDescription()).append(" ");
        if (job.getTags() != null) {
            sb.append(String.join(" ", job.getTags())).append(" ");
        }
        return sb.toString();
    }

    /**
     * Tách từ, chuyển về chữ thường và loại bỏ ký tự đặc biệt.
     */
    private List<String> tokenize(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new ArrayList<>();
        }
        // Thay thế các ký tự đặc biệt thành khoảng trắng và chuyển về lowercase
        String cleaned = text.toLowerCase().replaceAll("[^a-zA-Z0-9\\sáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]", " ");
        String[] tokens = cleaned.split("\\s+");
        
        // Danh sách stop-words cơ bản để lọc bỏ các từ không mang nhiều ý nghĩa
        Set<String> stopWords = new HashSet<>(Arrays.asList(
            "và", "của", "cho", "để", "với", "trong", "các", "những", "một", "có", "là", "đã", "đang", "sẽ", "được", "bị", "tại", "ra", "vào",
            "the", "and", "of", "to", "in", "for", "with", "a", "an", "is", "are", "on", "at", "by", "from"
        ));

        return Arrays.stream(tokens)
                .filter(t -> !t.isEmpty() && !stopWords.contains(t))
                .collect(Collectors.toList());
    }

    /**
     * Tính IDF (Inverse Document Frequency) cho từng từ trong từ điển.
     */
    private Map<String, Double> calculateIdf(List<String> vocabulary, List<List<String>> allDocuments) {
        Map<String, Double> idfMap = new HashMap<>();
        int totalDocs = allDocuments.size();

        for (String term : vocabulary) {
            int docsWithTerm = 0;
            for (List<String> doc : allDocuments) {
                if (doc.contains(term)) {
                    docsWithTerm++;
                }
            }
            // Áp dụng công thức IDF chuẩn (tránh chia cho 0 bằng cách +1)
            double idf = Math.log(1.0 + ((double) totalDocs / (1.0 + docsWithTerm)));
            idfMap.put(term, idf);
        }
        return idfMap;
    }

    /**
     * Tính toán vector TF-IDF cho một tài liệu.
     */
    private double[] calculateTfIdfVector(List<String> docTokens, List<String> vocabulary, Map<String, Double> idfMap) {
        double[] vector = new double[vocabulary.size()];
        if (docTokens.isEmpty()) {
            return vector;
        }

        // Tính tần suất xuất hiện của từ trong tài liệu (TF)
        Map<String, Integer> termCounts = new HashMap<>();
        for (String token : docTokens) {
            termCounts.put(token, termCounts.getOrDefault(token, 0) + 1);
        }

        for (int i = 0; i < vocabulary.size(); i++) {
            String term = vocabulary.get(i);
            if (termCounts.containsKey(term)) {
                double tf = (double) termCounts.get(term) / docTokens.size();
                double idf = idfMap.getOrDefault(term, 0.0);
                vector[i] = tf * idf;
            } else {
                vector[i] = 0.0;
            }
        }
        return vector;
    }

    /**
     * Tính toán độ tương đồng Cosine giữa hai vector.
     */
    private double cosineSimilarity(double[] vectorA, double[] vectorB) {
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += Math.pow(vectorA[i], 2);
            normB += Math.pow(vectorB[i], 2);
        }

        if (normA == 0.0 || normB == 0.0) {
            return 0.0; // Tránh chia cho 0
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}


