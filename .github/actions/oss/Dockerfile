FROM ubuntu:18.04

ARG BIN_URL='https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz'
RUN apt-get update && apt-get install -y curl tar
RUN curl "$BIN_URL" | tar -xz -C /usr/local/bin

ADD entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]