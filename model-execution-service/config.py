import os

LOG_PREFIX = "[MODEL-EXECUTION-SERVICE]: "

CLASSIFICATION      = "classification"
RECOGNITION         = "recognition"
MULTI_RECOGNITION   = "multi-recognition"

HOST = os.environ.get('RABBITMQ_HOST')
if not HOST:
    raise RuntimeError("RABBITMQ_HOST wasn't provided!")

PREDICT_MODEL_QUEUE = "model.predict-raw"

MODELS_DIR = os.environ.get('MODELS_DIR')
if not MODELS_DIR:
    raise RuntimeError("MODELS_DIR wasn't provided!")


DATASETS_DIR = os.environ.get('DATASETS_DIR')
if not DATASETS_DIR:
    raise RuntimeError("DATASETS_DIR wasn't provided!")
