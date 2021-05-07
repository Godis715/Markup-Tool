import os
import pathlib
import yaml
import random
import math
import uuid
from PIL import Image
from pathlib import Path
from shutil import copyfile
from deps.yolov5.utils.google_utils import attempt_download

'''
    items: {
        id: string,
        result: {
            status: "SUCCESS",
            rectangles: Rect[]
        }[],
        # TODO: добавить это поле в выгрузку
        imagePath: string,
        datasetItemId: string,
        imageUrl: string
    }[]
'''

# TODO: протестировать
def get_yolo_rect(rect, img_w, img_h):
    x1, y1, x2, y2 = rect[0] / img_w, rect[1] / img_h, rect[2] / img_w, rect[3] / img_h
    x1, x2 = min(x1, x2), max(x1, x2)
    y1, y2 = min(y1, y2), max(y1, y2)
    h = y2 - y1
    w = x2 - x1
    cx = x1 + w / 2
    cy = y1 + h / 2

    return cx, cy, w, h

def get_image_dims(image_path):
    im = Image.open(image_path)
    return im.size

# NOTE: !!! items должны содержать локальный imagePath
def create_image_labels(item, dest_path):
    rects = item["result"]["rectangles"]
    if len(rects) == 0:
        return
    
    img_w, img_h = get_image_dims(item["imagePath"])
    lines = []
    for r in rects:
        cx, cy, w, h = get_yolo_rect(r, img_w, img_h)
        lines.append(f"0 {cx} {cy} {w} {h}")
    
    with open(dest_path, "w") as output_file:
        output_file.write("\n".join(lines))

def copy_images(items, dest_dir, using_cache=True):
    paths = []
    for item in items:
        image_source = item["imagePath"]
        image_name = Path(item["imagePath"]).stem
        image_filename = f"{image_name}.png"
        image_dest = Path(dest_dir, image_filename)
        paths.append(str(image_dest))

        # если изображение уже есть, то пропускаем его
        if using_cache and image_dest.exists():
            continue

        # TODO: проверить, сработает ли то, что передается не строка, а Path (image_dest)
        converted = Image.open(image_source)
        converted.save(image_dest, format="png")
    return paths

def create_labels(items, dest_dir):
    for item in items:
        image_name = Path(item["imagePath"]).stem
        label_path = Path(dest_dir, f"{image_name}.txt")
        create_image_labels(item, label_path)

def create_dataset_yaml(items, dest_dir):
    dataset_yaml = {
        "train": str(Path(dest_dir, "images", "0")),
        "val": str(Path(dest_dir, "images", "0")),
        "nc": 1,
        "names": ["target object"]
    }

    dest_path = Path(dest_dir, "dataset.yaml")
    with open(dest_path, 'w') as outfile:
        yaml.dump(dataset_yaml, outfile, default_flow_style=False)
    
    return str(dest_path)

def prepare_data(dest_dir, items):
    images_dir = Path(dest_dir, "images", "0")
    images_dir.mkdir(parents=True, exist_ok=True)
    new_paths = copy_images(items, images_dir)
    new_items = [
        { **item, "imagePath": new_paths[i] }
        for i, item in enumerate(items)
    ]

    dataset_yaml_path = create_dataset_yaml(new_items, dest_dir)

    labels_dir = Path(dest_dir, "labels", "0")
    labels_dir.mkdir(parents=True, exist_ok=True)
    create_labels(new_items, labels_dir)

    return dataset_yaml_path

def train_yolov5(items, model_type="s"):
    # https://github.com/ultralytics/yolov5/wiki/Train-Custom-Data

    dataset_dir_name = str(uuid.uuid4())
    dataset_dir_path = Path("data", dataset_dir_name)
    dataset_dir_path.mkdir(parents=True, exist_ok=True)
    dataset_yaml_path = prepare_data(dataset_dir_path, items)

    model_name = f'yolov5{model_type}.pt'
    weights_path = Path("weights", model_name)

    if not weights_path.exists():
        attempt_download(weights_path)

    # ... All training results are saved to runs/train/ with incrementing run directories, i.e. runs/train/exp2, runs/train/exp3 etc. 
    os.system(f"python ./deps/yolov5/train.py --img 640 --batch 8 --epochs 100 --data {dataset_yaml_path} --weights {weights_path}")
