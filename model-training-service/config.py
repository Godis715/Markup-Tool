import os

LOG_PREFIX = "[MODEL-TRAINING-SERVICE]: "

CLASSIFICATION      = "classification"
RECOGNITION         = "recognition"
MULTI_RECOGNITION   = "multi-recognition"

HOST = os.environ.get('RABBITMQ_HOST')
if not HOST:
    raise RuntimeError("RABBITMQ_HOST wasn't provided!")

MODELS_DIR = os.environ.get('MODELS_DIR')
if not MODELS_DIR:
    raise RuntimeError("MODELS_DIR wasn't provided!")

EX_MODEL = "model"
KEY_MODEL_TRAINING_SUCCEED = "model.training.finished.success"
KEY_MODEL_TRAINING_FAILED = "model.training.finished.failure"

START_MODEL_TRAINING_QUEUE = "model.training.start"
