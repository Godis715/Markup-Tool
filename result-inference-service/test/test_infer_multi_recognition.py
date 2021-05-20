import core.infer_multi_recognition as infer_module

rect = [0, 0, 1, 1]

def test_infer_object_rects_when_equal():
    rects = [rect, rect, rect]
    expected_rects = [rect]
    result_rects = infer_module._infer_object_rects(rects, "mean", eps=0.99, min_samples=3)
    assert expected_rects == result_rects

def test_infer_object_rects_when_too_few_rects():
    rects = [rect]
    expected_rects = []
    result_rects = infer_module._infer_object_rects(rects, "mean", eps=0.99, min_samples=3)
    assert expected_rects == result_rects

def test_infer_object_rects_when_overlaps():
    rects = [[0, 0, 1, 1], [0, 0, 3, 3]]
    expected_rects = [[0, 0, 2, 2]]
    result_rects = infer_module._infer_object_rects(rects, "mean", eps=0.99, min_samples=1)
    assert expected_rects == result_rects

def test_infer_object_rects_when_two_clusters():
    rects = [[0, 0, 1, 1], [0, 0, 3, 3], [-1, -1, 0, 0], [-3, -3, 0, 0]]
    expected_rects = [[0, 0, 2, 2], [-2, -2, 0, 0]]
    result_rects = infer_module._infer_object_rects(rects, "mean", eps=0.99, min_samples=1)
    assert expected_rects == result_rects
