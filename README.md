# Library Management System

This repository contains the LMS backend and frontend scaffold.

See src/main/resources for static frontend files and src/main/java for backend code.

Run with Docker Compose:
1. mvn clean package -DskipTests
2. docker-compose up --build

Bootstrap admin (one-time): set ADMIN_INIT_KEY in environment and call /api/admin/bootstrap
