# Create image based off the official node 9 image
FROM node:9-alpine
# make the directory our code will be stored in
RUN mkdir -p /usr/src/app
# Set the working directory so future commands run in this directory
WORKDIR /usr/src/app
# Copy local files into the working directory
COPY . /usr/src/app

RUN ["chmod", "+x", "./run.sh"]
# Install dependencies
RUN npm install
EXPOSE 80

ENTRYPOINT ["./run.sh"]
