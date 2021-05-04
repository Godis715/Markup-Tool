from bbox_utils import bbox_overlaps_iou
from sklearn.cluster import DBSCAN
import numpy as np

aggregations = {
    "median": lambda x: np.median(x, axis=0),
    "mean": lambda x: np.mean(x, axis=0)
}

def _infer_object_rects(rects, aggregate, eps=0.5, min_samples=3):
    rects = np.array(rects)
    dist_mat = 1 - bbox_overlaps_iou(rects, rects)

    # кластеризация
    clustering = DBSCAN(eps, min_samples, metric="precomputed", algorithm="brute").fit(dist_mat)
    clusters = clustering.labels_

    # разбиение на группы и агрегация
    filtered_rects = []
    for j in range(max(clusters) + 1):
        mask = clusters == j
        filtered_rects.append(
            aggregations[aggregate](rects[mask])
        )
    return filtered_rects

def _rect_dict_to_arr(rect):
    return [rect["x1"], rect["y1"], rect["x2"], rect["y2"]]

def infer_multi_recognition(results, aggregate="median"):
    """
    Принимает на вход:
    {
        datasetItemId: string,
        imageUrl: string,
        result: {
            rectangles: { x1: number, y1: number, x2: number, y2: number }[]
        }
    }[]

    Возвращает:
    {
        imageUrl: string,
        result: {
            rectangles: [number, number, number, number][]
        }
    }[]
    """
    agg_results = { res["imageUrl"]: [] for res in results }

    for res in results:
        rects = res["result"]["rectangles"]
        arr_rects = [_rect_dict_to_arr(r_) for r_ in rects]
        agg_results[res["imageUrl"]] += arr_rects
    
    inferred_rects = {
        img_name: np.array(
            _infer_object_rects(rects, aggregate)
        ).tolist()
        for img_name, rects in agg_results.items()
    }

    return [{ "imageUrl": id_,
              "result": { "rectangles": rects }}
            for id_, rects in inferred_rects.items()]
