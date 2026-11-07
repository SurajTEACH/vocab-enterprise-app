# Stage 1: Build JAR using Maven and JDK 22
FROM maven:3.9.9-eclipse-temurin-22 AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies first for fast layer caching
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal Lightweight Runtime Image
FROM eclipse-temurin:22-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Cloud platform port (Render/Railway automatically passes $PORT)
ENV PORT=8085
EXPOSE 8085

ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "app.jar"]

