from core.bbox_utils import bbox_overlaps_iou
from sklearn.cluster import DBSCAN
import numpy as np
import math

MIN_EXPERTS_RATIO = 0.75

aggregations = {
    "median": lambda x: np.median(x, axis=0),
    "mean": lambda x: np.mean(x, axis=0)
}

def _infer_object_rects(rects, aggregate, eps=0.5, min_samples=3):
    agg_func = aggregations[aggregate]
    rects = np.array(rects)
    # iou - мера схожести, чтобы получить расстояние, вычитаем из единицы
    dist_mat = 1 - bbox_overlaps_iou(rects, rects)

    # кластеризация
    clustering = DBSCAN(eps, min_samples, metric="precomputed", algorithm="brute").fit(dist_mat)
    clusters = clustering.labels_

    # разбиение на группы и агрегация
    filtered_rects = []
    for j in range(max(clusters) + 1):
        mask = clusters == j
        filtered_rects.append(agg_func(rects[mask]))
    # преобразуем вложенные numpy массивы в обычные списки
    return list(map(list, filtered_rects))

def _rect_dict_to_arr(rect):
    return [rect["x1"], rect["y1"], rect["x2"], rect["y2"]]

def _rect_arr_to_dict(rect):
    return { "x1": rect[0], "y1": rect[1], "x2": rect[2], "y2": rect[3] }

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
        datasetItemId: string,
        imageUrl: string,
        result: {
            rectangles: { x1: number, y1: number, x2: number, y2: number }[]
        }
    }[]
    """
    # нужно, чтобы потом к результатам вывода добавить imageUrl
    img_urls = { res["datasetItemId"]: res["imageUrl"] for res in results }
    # нужно, чтобы понимать, сколько экспертов разметило каждый элемент датасета
    expert_counts = { res["datasetItemId"]: 0 for res in results }
    # группировка результатов разметки по элементам датасета
    agg_results = { res["datasetItemId"]: [] for res in results }

    for res in results:
        dataset_item_id = res["datasetItemId"]
        rects = res["result"]["rectangles"]
        agg_results[dataset_item_id] += [_rect_dict_to_arr(r_) for r_ in rects]
        expert_counts[dataset_item_id] += 1
    
    inferred_rects = {}
    for dataset_item_id, rects in agg_results.items():
        # Если элемент данных разметил 1 человек, тогда сразу кладем его разметку как итоговый результат
        expert_cnt = expert_counts[dataset_item_id]
        if expert_cnt == 1:
            inferred_rects[dataset_item_id] = rects
            continue
        
        # min_samples не меньше единицы и равно некоторой доле от общего количества экспертов, разметивших изображение
        min_samples = max(1, math.floor(expert_cnt * MIN_EXPERTS_RATIO))
        inferred_rects[dataset_item_id] = _infer_object_rects(rects,
                                                              aggregate=aggregate,
                                                              min_samples=min_samples)

    return [{ "datasetItemId": id_,
              "imageUrl": img_urls[id_],
              "result": { "rectangles": [_rect_arr_to_dict(r) for r in rects] }}
            for id_, rects in inferred_rects.items()]
