import os
import yaml
import tempfile
from PIL import Image
from pathlib import Path
from shutil import copyfile

'''
    items: {
        id: string,
        result: {
            status: "SUCCESS",
            rectangles: Rect[]
        }[],
        # TODO: добавить это поле в выгрузку
        imageUrl: string,
        datasetItemId: string,
        imageUrl: string
    }[]
'''

# TODO: протестировать
def get_yolo_rect(rect, img_w, img_h):
    if isinstance(rect, list):
        x1, y1, x2, y2 = rect[0] / img_w, rect[1] / img_h, rect[2] / img_w, rect[3] / img_h
    else:
        x1, y1, x2, y2 = rect["x1"] / img_w, rect["y1"] / img_h, rect["x2"] / img_w, rect["y2"] / img_h

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

# NOTE: !!! items должны содержать локальный imageUrl
def create_image_labels(item, dest_path):
    rects = item["result"]["rectangles"]
    if len(rects) == 0:
        return
    
    img_w, img_h = get_image_dims(item["imageUrl"])
    lines = []
    for r in rects:
        cx, cy, w, h = get_yolo_rect(r, img_w, img_h)
        lines.append(f"0 {cx} {cy} {w} {h}")
    
    with open(dest_path, "w") as output_file:
        output_file.write("\n".join(lines))

def copy_images(items, dest_dir, using_cache=True):
    paths = []
    for item in items:
        image_source = item["imageUrl"]
        image_name = Path(item["imageUrl"]).stem
        image_filename = f"{image_name}.png"
        image_dest = Path(dest_dir, image_filename)
        paths.append(str(image_dest))

        # если изображение уже есть, то пропускаем его
        if using_cache and image_dest.exists():
            continue

        converted = Image.open(image_source)
        converted.save(image_dest, format="png")
    return paths

def create_labels(items, dest_dir):
    for item in items:
        image_name = Path(item["imageUrl"]).stem
        label_path = Path(dest_dir, f"{image_name}.txt")
        create_image_labels(item, label_path)

def create_dataset_yaml(dest_dir):
    dataset_yaml = {
        "train": str(Path(dest_dir, "images")),
        "val": str(Path(dest_dir, "images")),
        "nc": 1,
        "names": ["target object"]
    }

    dest_path = Path(dest_dir, "dataset.yaml")
    with open(dest_path, 'w') as outfile:
        yaml.dump(dataset_yaml, outfile, default_flow_style=False)
    
    return str(dest_path)

def prepare_data(dest_dir, items):
    images_dir = Path(dest_dir, "images")
    images_dir.mkdir(parents=True, exist_ok=True)
    new_paths = copy_images(items, images_dir)
    new_items = [
        { **item, "imageUrl": new_paths[i] }
        for i, item in enumerate(items)
    ]

    dataset_yaml_path = create_dataset_yaml(dest_dir)

    labels_dir = Path(dest_dir, "labels")
    labels_dir.mkdir(parents=True, exist_ok=True)
    create_labels(new_items, labels_dir)

    return dataset_yaml_path

EPOCHS = 1
BATCH_SIZE = 4
IMG_SIZE = 320

def train_yolov5(items, save_to_dir, model_type="s"):
    # https://github.com/ultralytics/yolov5/wiki/Train-Custom-Data

    dataset_dir = tempfile.TemporaryDirectory()
    project_dir = tempfile.TemporaryDirectory()

    dataset_dir_path = dataset_dir.name
    project_dir_path = project_dir.name

    dataset_yaml_path = prepare_data(dataset_dir_path, items)

    model_name = f'yolov5{model_type}.pt'
    weights_path = Path("weights", model_name)

    # try:
    #     process = Popen(["python",    "./deps/yolov5/train.py",
    #                      "--img",     "640",
    #                      "--batch",   "8",
    #                      "--epochs",  str(EPOCHS),
    #                      "--data",    dataset_yaml_path,
    #                      "--weights", weights_path,
    #                      "--project", project_dir_path,
    #                      "--name",    "result"],
    #                     stdout=PIPE)
    #     while True:
    #         output = process.stdout.readline()
    #         if process.poll() is not None:
    #             break
    #         if output:
    #             print(output.strip())
    # except CalledProcessError as e:
    #     print(e)
    #     raise e
    
    status_code = os.system(
        f"python -u ./deps/yolov5/train.py \
            --img {IMG_SIZE} \
            --batch {BATCH_SIZE} \
            --epochs {EPOCHS} \
            --data {dataset_yaml_path} \
            --weights {weights_path} \
            --project {project_dir_path} \
            --name result"
    )

    if status_code != 0:
        raise RuntimeError("Training failed")

    output_weights_path = Path(project_dir_path, "result", "weights", "best.pt")

    weights_save_to = Path(save_to_dir, "weights.pt")
    copyfile(output_weights_path, weights_save_to)

