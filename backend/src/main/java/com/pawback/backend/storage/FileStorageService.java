package com.pawback.backend.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

    private Cloudinary cloudinary;

    @Value("${cloudinary.url:${CLOUDINARY_URL:}}")
    private String cloudinaryUrl;

    @PostConstruct
    public void init() {
        if (cloudinaryUrl != null && !cloudinaryUrl.isEmpty()) {
            cloudinary = new Cloudinary(cloudinaryUrl);
            log.info("Cloudinary configured successfully.");
        } else {
            log.warn("CLOUDINARY_URL is not set. File uploads will fail.");
        }
    }

    public String uploadFile(MultipartFile file) {
        try {
            if (cloudinary == null) {
                throw new RuntimeException("Cloudinary is not configured");
            }
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
            return uploadResult.get("secure_url").toString();
        } catch (Exception e) {
            log.error("Failed to upload file to Cloudinary", e);
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    public InputStream getFile(String fileName) {
        // Not used with Cloudinary since we return absolute URLs directly
        throw new UnsupportedOperationException("getFile is not supported when using Cloudinary");
    }
}
