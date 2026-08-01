 FROM ghcr.io/lavalink-devs/lavalink:4

COPY application.yml /opt/Lavalink/application.yml

ENV JAVA_OPTS="-Xmx220m -Xms64m"

EXPOSE 2333

CMD ["java", "-Xmx220m", "-Xms64m", "-XX:+UseSerialGC", "-XX:MaxMetaspaceSize=96m", "-XX:MaxDirectMemorySize=64m", "-jar", "Lavalink.jar"]
