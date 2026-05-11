package com.pawback.backend.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        String url = fileStorageService.uploadFile(file);
        Map<String, String> response = new HashMap<>();
        response.put("url", url);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/download/{fileName}")
    public ResponseEntity<org.springframework.core.io.InputStreamResource> downloadFile(@PathVariable String fileName) {
        java.io.InputStream is = fileStorageService.getFile(fileName);
        String contentType = "application/octet-stream";
        if (fileName.toLowerCase().endsWith(".jpg") || fileName.toLowerCase().endsWith(".jpeg")) contentType = "image/jpeg";
        else if (fileName.toLowerCase().endsWith(".png")) contentType = "image/png";
        else if (fileName.toLowerCase().endsWith(".gif")) contentType = "image/gif";

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, contentType)
                .body(new org.springframework.core.io.InputStreamResource(is));
    }
}




 
 
 
 
