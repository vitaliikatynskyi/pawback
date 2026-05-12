package com.pawback.backend.listing.dto;

import java.util.List;

public record EmbeddingRequest(List<Float> embedding, String petType) {}
