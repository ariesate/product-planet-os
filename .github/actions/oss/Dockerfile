FROM alpine:3.11

RUN apk add --update curl tar
RUN curl 'https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-arm64.tgz' | tar -xz -C /usr/local/bin

ADD entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]