FROM python:3.8.13-alpine

# set working directory
WORKDIR /usr/src/api

# This allows imports in our API to be fully qualified, i.e. `from app.api`
# rather than `from api`.
ENV PYTHONPATH "/usr/src/api/${PYTHONPATH}"

# set environment varibles
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# add and install requirements
COPY ./requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

# run server
COPY *.py ./
CMD gunicorn -b 0.0.0.0:5000 manage:app
