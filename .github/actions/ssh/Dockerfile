FROM alpine:3.11

RUN apk add --update openssh-client bash

ADD entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]