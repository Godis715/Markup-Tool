FROM python:3

WORKDIR /usr/app

# https://stackoverflow.com/questions/55313610/importerror-libgl-so-1-cannot-open-shared-object-file-no-such-file-or-directo
RUN apt-get update
RUN apt-get install ffmpeg libsm6 libxext6  -y

COPY requirements.txt .

RUN pip install -r requirements.txt -f https://download.pytorch.org/whl/torch_stable.html

COPY . .

CMD ["python", "-u", "app.py"]
