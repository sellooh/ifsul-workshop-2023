ARG VARIANT="jdk17"
ARG JAVA_TARGETPLATFORM="linux/arm64/v8"
FROM --platform=${JAVA_TARGETPLATFORM} gradle:jdk17 as base

FROM --platform=${JAVA_TARGETPLATFORM} gradle:jdk17 AS cloud

# envs
ENV MYSQL_HOST=127.0.0.1

# user and app setup
RUN useradd -ms /bin/bash app
RUN mkdir /app
RUN chown app /app
USER app
WORKDIR /app

COPY --chown=app:app build.gradle /app/build.gradle
COPY --chown=app:app settings.gradle /app/settings.gradle
COPY --chown=app:app src /app/src
COPY --chown=app:app gradle /app/gradle

ENTRYPOINT ["/bin/bash"]
CMD ["/app/gradlew", "bootRun"]
