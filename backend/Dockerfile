FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy gradle wrapper and config files
COPY gradle/ gradle/
COPY gradlew build.gradle.kts settings.gradle.kts ./

# Give execute permission to gradlew
RUN chmod +x gradlew

# Download dependencies (this layer will be cached)
RUN ./gradlew dependencies --no-daemon || true

# Copy source code
COPY src/ src/

# Build the application
RUN ./gradlew build -x test --no-daemon

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/build/libs/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
