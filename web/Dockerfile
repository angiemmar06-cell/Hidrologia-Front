FROM node:22.2.0-alpine

# Crear grupo y usuario con los mismos UID y GID que el host
#RUN adduser joamona

ARG USER_ID
ARG GROUP_ID
ARG USERNAME

# Crear grupo y usuario con los mismos UID y GID que el host
#RUN addgroup -g $GROUP_ID $USERNAME && \
#    adduser -D -u $USER_ID -G $USERNAME $USERNAME

WORKDIR /usr/src

RUN npm install -g @angular/cli@18.0.3

#USER $USERNAME
COPY . .
WORKDIR /usr/src/web

#USER root

RUN npm install

#USER $USERNAME
