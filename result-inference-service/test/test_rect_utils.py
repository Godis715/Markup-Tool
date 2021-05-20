from core.rect_utils import rect_dict_to_arr, rect_arr_to_dict

rect_arr = [0, 1, 2, 3]
rect_dict = { "x1": 0, "y1": 1, "x2": 2, "y2": 3 }

def test_rect_arr_to_dict():
    expected = rect_dict
    result = rect_arr_to_dict(rect_arr)
    assert expected == result

def test_rect_rect_dict_to_arr():
    expected = rect_arr
    result = rect_dict_to_arr(rect_dict)
    assert expected == result
