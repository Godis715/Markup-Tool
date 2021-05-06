#syntax=docker/dockerfile:1.2

FROM python:3

WORKDIR /usr/app

RUN --mount=type=cache,target=/root/.cache/pip pip install --user virtualenv && \
    mkdir deps && \
    git clone https://github.com/ultralytics/yolov5.git
    # здесь также может быть скачивание и других репозиториев

COPY ./deps ./deps

# установка зависимостей Yolo v5
WORKDIR ./deps/yolov5

RUN --mount=type=cache,target=/root/.cache/pip \
    python -m venv venv && \
    . venv/bin/activate && \
    pip install -r requirements.txt && \
    deactivate

# здесь могут быть установки зависимостей для других реп

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY . .

# временная заглушка
CMD ["sleep","3600"]
