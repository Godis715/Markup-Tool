#syntax=docker/dockerfile:1.2

FROM python:3

WORKDIR /usr/app

# https://stackoverflow.com/questions/55313610/importerror-libgl-so-1-cannot-open-shared-object-file-no-such-file-or-directo
RUN apt-get update
RUN apt-get install ffmpeg libsm6 libxext6  -y

RUN mkdir ./deps && \
    git clone https://github.com/ultralytics/yolov5.git && \
    mv ./yolov5 ./deps
    # здесь также может быть скачивание и других репозиториев

# RUN --mount=type=cache,target=/root/.cache/pip \
RUN pip install -r ./deps/yolov5/requirements.txt

COPY requirements.txt ./
RUN pip install -r requirements.txt

# здесь могут быть установки зависимостей для других реп

COPY . .

CMD ["python", "-u", "app.py"]
