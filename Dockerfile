ARG VARIANT="jdk17"
ARG JAVA_TARGETPLATFORM="linux/amd64"
FROM --platform=${JAVA_TARGETPLATFORM} public.ecr.aws/docker/library/gradle:jdk17 as base

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

RUN gradle assemble

FROM --platform=${JAVA_TARGETPLATFORM} public.ecr.aws/docker/library/gradle:jdk17 as cloud

# healthcheck deps
RUN apt-get update \
    && apt-get install -y mysql-client

# envs
ENV MYSQL_HOST=127.0.0.1

RUN useradd -ms /bin/bash app
RUN mkdir /app
RUN chown app /app
USER app
WORKDIR /app
COPY --from=base --chown=app:app /app/build/libs/*.jar /app/app.jar
COPY --chown=app:app ./infrastructure/docker-entrypoint.sh /app/docker-entrypoint.sh

RUN arch
RUN java -version

ENTRYPOINT ["/app/docker-entrypoint.sh"]
