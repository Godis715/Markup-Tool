from core.bbox_utils import bbox_overlaps_iou
import numpy as np

def test_iou_simple():
    bboxes = np.array([[0, 0, 1, 1], [0, 0, 1, 1]])
    expected = np.array([[1, 1], [1, 1]])
    result = bbox_overlaps_iou(bboxes, bboxes)
    assert np.all(expected == result)

def test_iou_overlaps():
    bboxes = np.array([[0, 0, 1, 1], [0, 0, 2, 2]])
    expected = np.array([[1, 0.25], [0.25, 1]])
    result = bbox_overlaps_iou(bboxes, bboxes)
    assert np.all(expected == result)

def test_iou_not_overlaps():
    bboxes = np.array([[0, 0, 1, 1], [-1, -1, 0, 0]])
    expected = np.array([[1, 0], [0, 1]])
    result = bbox_overlaps_iou(bboxes, bboxes)
    assert np.all(expected == result)
