#!/usr/bin/env python
import pika
import json
import threading
import functools
from config import LOG_PREFIX, CLASSIFICATION, RECOGNITION, \
                   MULTI_RECOGNITION, START_MODEL_TRAINING_QUEUE, HOST, MODELS_DIR, \
                   EX_MODEL, KEY_MODEL_TRAINING_SUCCEED, KEY_MODEL_TRAINING_FAILED, \
                   DATASETS_DIR
from core.train_yolov5 import train_yolov5
from pathlib import Path

conn_parameters = pika.ConnectionParameters(host=HOST,
                                            connection_attempts=20,
                                            retry_delay=5)

connection = pika.BlockingConnection(conn_parameters)

channel = connection.channel()
channel.queue_declare(queue=START_MODEL_TRAINING_QUEUE, durable=True)
channel.exchange_declare(exchange=EX_MODEL, exchange_type="topic", durable=True)

def raise_not_implemeted(task):
    raise RuntimeError(f"{task} inferer function is not implemented")

def ack_message(ch, delivery_tag):
    """Note that `channel` must be the same pika channel instance via which
    the message being ACKed was retrieved (AMQP protocol constraint).
    """
    if ch.is_open:
        ch.basic_ack(delivery_tag)
    else:
        # Channel is already closed, so we can't ACK this message;
        # log and/or do something that makes sense for your app in this case.
        pass

def start_training(conn, ch, delivery_tag, body):
    markup_result = json.loads(body.decode("utf-8"))
    print(LOG_PREFIX, "Got markup result", markup_result)

    markup_type = markup_result["type"]
    markup_items = markup_result["items"]
    markup_id = markup_result["markupId"]
    model_id = markup_result["modelId"]

    markup_items = [{ **item, "imageUrl": Path(DATASETS_DIR, item["imageUrl"]) } for item in markup_items]

    # Создаем папку, куда будут записаны веса обученной модели
    model_dir = Path(MODELS_DIR, model_id)
    model_dir.mkdir(parents=True, exist_ok=True)

    try:
        if markup_type == MULTI_RECOGNITION:
            train_yolov5(markup_items, model_dir)
        elif markup_type == CLASSIFICATION:
            raise RuntimeError(f"Training model for {markup_type} task is not implemented")
        elif markup_type == RECOGNITION:
            raise RuntimeError(f"Training model for {markup_type} task is not implemented")
        else:
            raise RuntimeError(f"Unknown markup type: {markup_type}")
    except Exception as e:
        print(e)
        message_body = { "markupId": markup_id,
                         "modelId": model_id,
                         "type": markup_type }
        routing_key = KEY_MODEL_TRAINING_FAILED
    else:
        message_body = { "markupId": markup_id,
                        "modelId": model_id,
                        "type": markup_type,
                        "weightsPath": str(model_dir) }
        routing_key = KEY_MODEL_TRAINING_SUCCEED

    publish_cb = functools.partial(ch.basic_publish,
                                   exchange=EX_MODEL,
                                   routing_key=routing_key,
                                   body=json.dumps(message_body))
    conn.add_callback_threadsafe(publish_cb)

    ack_cb = functools.partial(ack_message, channel, delivery_tag)
    conn.add_callback_threadsafe(ack_cb)
    # Рассылаем сообщение о том, что модель успешно обучилась
    # ch.basic_publish(exchange=EX_MODEL,
    #                  routing_key=routing_key,
    #                  body=json.dumps(message_body))

    # ch.basic_ack(delivery_tag=delivery_tag)

def on_message(channel, method, header, body, args):
    (connection, threads) = args
    delivery_tag = method.delivery_tag
    t = threading.Thread(target=start_training, args=(connection, channel, delivery_tag, body))
    t.start()
    threads.append(t)

channel.basic_qos(prefetch_count=1)

threads = []
on_message_callback = functools.partial(on_message, args=(connection, threads))
channel.basic_consume(queue=START_MODEL_TRAINING_QUEUE, on_message_callback=on_message_callback)

print(LOG_PREFIX, "Awaiting RPC requests")
try:
    channel.start_consuming()
except KeyboardInterrupt:
    channel.stop_consuming()

# Wait for all to complete
for thread in threads:
    thread.join()

connection.close()
