def rect_dict_to_arr(rect):
    return [rect["x1"], rect["y1"], rect["x2"], rect["y2"]]

def rect_arr_to_dict(rect):
    return { "x1": rect[0], "y1": rect[1], "x2": rect[2], "y2": rect[3] }
