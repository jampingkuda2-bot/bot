FROM ghcr.io/lavalink-devs/lavalink:4

# Official image expects application.yml at /opt/Lavalink/application.yml
COPY application.yml /opt/Lavalink/application.yml

# Cap JVM heap so Lavalink doesn't get OOM-killed on memory-limited plans.
# Adjust -Xmx if you upgrade your Railway plan and have more RAM available.
ENV JAVA_OPTS="-Xmx400m -Xms128m"

EXPOSE 2333

CMD ["java", "-Xmx400m", "-Xms128m", "-jar", "Lavalink.jar"]
