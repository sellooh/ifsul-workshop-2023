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

# envs
ENV MYSQL_HOST=127.0.0.1

RUN mkdir /app
WORKDIR /app
COPY --from=base /app/build/libs/*.jar /app/app.jar

RUN arch
RUN java -version
