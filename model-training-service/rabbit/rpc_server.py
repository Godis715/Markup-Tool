#!/usr/bin/env python
import pika
import json
from ..config import (LOG_PREFIX, CLASSIFICATION, RECOGNITION,
                      MULTI_RECOGNITION, START_MODEL_TRAINING_QUEUE, HOST, MODELS_DIR,
                      EX_MODEL, KEY_MODEL_TRAINING_SUCCEED, KEY_MODEL_TRAINING_FAILED)
from core.train_yolov5 import train_yolov5

conn_parameters = pika.ConnectionParameters(host=HOST,
                                            connection_attempts=20,
                                            retry_delay=5)

connection = pika.BlockingConnection(conn_parameters)

channel = connection.channel()

channel.queue_declare(queue=START_MODEL_TRAINING_QUEUE, durable=True)
channel.exchange_declare(exchange=EX_MODEL, exchange_type="topic", durable=True)

def raise_not_implemeted(task):
    raise RuntimeError(f"{task} inferer function is not implemented")

def on_request(ch, method, props, body):
    markup_result = json.loads(body.decode("utf-8"))
    print(LOG_PREFIX, "Got markup result", markup_result)

    markup_type = markup_result["type"]
    markup_items = markup_result["items"]
    markup_id = markup_result["markupId"]
    model_id = markup_result["modelId"]

    # Создаем папку, куда будут записаны веса обученной модели
    model_dir = Path(MODELS_DIR, model_id)
    model_dir.mkdir(parents=True, exist_ok=True)

    if markup_type == MULTI_RECOGNITION:
        train_yolov5(markup_items, model_dir)
    elif markup_type == CLASSIFICATION:
        raise_not_implemeted(markup_type)
    elif markup_type == RECOGNITION:
        raise_not_implemeted(markup_type)
    else:
        raise RuntimeError(f"Unknown markup type: {markup_type}")

    message_body = { "markupId": markup_id,
                     "modelId": model_id,
                     "type": markup_type,
                     "weightsPath": model_dir }

    # Рассылаем сообщение о том, что модель успешно обучилась
    ch.basic_publish(exchange=EX_MODEL,
                     routing_key=KEY_MODEL_TRAINING_SUCCEED,
                     body=json.dumps(message_body))

    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue=START_MODEL_TRAINING_QUEUEц, on_message_callback=on_request)

print(LOG_PREFIX, "Awaiting RPC requests")
channel.start_consuming()
