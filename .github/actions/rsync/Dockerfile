FROM alpine:3.11

RUN apk add --update rsync openssh-client bash

ADD entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]