import torch

def predict_yolov5(items, weights_path):
    model = torch.hub.load('ultralytics/yolov5', 'custom', path=weights_path)
    images = [item["imageUrl"] for item in items]
    model_result = model(images)

    result = []
    for i, item in enumerate(items):
        records = model_result.pandas().xyxy[i].to_dict("records")
        rects = [{
            "x1": r["xmin"],
            "y1": r["ymin"],
            "x2": r["xmax"],
            "y2": r["ymax"]
        } for r in records]

        result.append({
            "datasetItemId": item["datasetItemId"],
            "result": { "rectangles": rects }
        })
    return result
