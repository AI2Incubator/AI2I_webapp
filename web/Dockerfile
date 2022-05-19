###########
# BUILDER #
###########

# base image
FROM node:16-alpine as builder

# set working directory
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /usr/src/app/package.json
COPY package-lock.json /usr/src/app/package-lock.json
COPY tsconfig.json /usr/src/app/tsconfig.json
RUN npm ci

# set environment variables
ARG REACT_APP_API_HOSTNAME
ENV REACT_APP_API_HOSTNAME $REACT_APP_API_HOSTNAME

ENV NODE_ENV production

# create build
COPY . /usr/src/app
RUN npm run build


#########
# FINAL #
#########

# base image
FROM nginx:1.20.2-alpine

# update nginx conf
RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx

# copy static files
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

# expose port
EXPOSE 80

# run nginx
CMD ["nginx", "-g", "daemon off;"]