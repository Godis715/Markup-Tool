import core.train_yolov5 as train_yolov5
import pytest

def test_get_yolo_rect():
    # w h
    (img_w, img_h) = (200, 100)
    # x1 y1 x2 y2
    rect = [20, 20, 80, 80]
    # center is (50, 50)
    # x y w h
    expected = pytest.approx([0.25, 0.5, 0.3, 0.6], 1e-6)
    result = train_yolov5.get_yolo_rect(rect, img_w, img_h)

    assert expected == result


