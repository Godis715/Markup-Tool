import os

LOG_PREFIX = "[MODEL-TRAINING-SERVICE]: "

CLASSIFICATION      = "classification"
RECOGNITION         = "recognition"
MULTI_RECOGNITION   = "multi-recognition"

START_MODEL_TRAINING_QUEUE = "model.training.start"

HOST = os.environ.get('RABBITMQ_HOST')
if not HOST:
    raise RuntimeError("RABBITMQ_HOST wasn't provided!")
