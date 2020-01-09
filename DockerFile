FROM debian:9.6-slim

LABEL "com.github.actions.name"="Uppler PR workflow"
LABEL "com.github.actions.description"="Define the Uppler specific pull reques workflow"
LABEL "com.github.actions.icon"="arrow-up-right"
LABEL "com.github.actions.color"="gray-dark"
LABEL version="1.0.0"
LABEL repository="http://github.com/mathieumuller/pull-request-workflow"
LABEL homepage="http://github.com/mathieumuller/pull-request-workflow"
LABEL maintainer="Mathieu Muller <mathieu.muller@uppler.com>"

RUN apt-get update && apt-get install -y \
    curl \
    jq

ADD entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]