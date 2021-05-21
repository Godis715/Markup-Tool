import pika
import json
from config import LOG_PREFIX, CLASSIFICATION, RECOGNITION, \
                   MULTI_RECOGNITION, PREDICT_MODEL_QUEUE, HOST, \
                   MODELS_DIR, DATASETS_DIR
from core.predict_yolov5 import predict_yolov5
from pathlib import Path

conn_parameters = pika.ConnectionParameters(host=HOST,
                                            connection_attempts=20,
                                            retry_delay=5)

connection = pika.BlockingConnection(conn_parameters)

channel = connection.channel()
channel.queue_declare(queue=PREDICT_MODEL_QUEUE, durable=True)

def raise_not_implemeted(task):
    raise RuntimeError(f"{task} model is not implemented")

def process_dataset_items(dataset_items):
    return [{ **item,
              "imageUrl": str(Path(DATASETS_DIR, item["imageUrl"])) }
              for item in dataset_items]

def on_message(ch, method, props, body):
    prediction_request = json.loads(body.decode("utf-8"))
    print(LOG_PREFIX, "Got prediction request", prediction_request)

    markup_type = prediction_request["markupType"]
    dataset_items = prediction_request["datasetItems"]
    markup_id = prediction_request["markupId"]
    model_id = prediction_request["modelId"]
    weights_path = prediction_request["weightsPath"]

    dataset_items = process_dataset_items(dataset_items)
    weights_path = str(Path(MODELS_DIR, weights_path))

    try:
        if markup_type == MULTI_RECOGNITION:
            predictions = predict_yolov5(dataset_items, weights_path)
        elif markup_type == CLASSIFICATION:
            raise RuntimeError(f"Model for {markup_type} task is not implemented")
        elif markup_type == RECOGNITION:
            raise RuntimeError(f"Model for {markup_type} task is not implemented")
        else:
            raise RuntimeError(f"Unknown markup type: {markup_type}")
    except Exception as e:
        print(e)
    else:
        message_body = { "markupId": markup_id,
                         "modelId": model_id,
                         "markupType": markup_type,
                         "items": predictions }
        ch.basic_publish(exchange='',
                        routing_key=props.reply_to,
                        properties=pika.BasicProperties(correlation_id=props.correlation_id),
                        body=json.dumps(message_body))
        ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=1)

channel.basic_consume(queue=PREDICT_MODEL_QUEUE, on_message_callback=on_message)

print(LOG_PREFIX, "Awaiting RPC requests")
channel.start_consuming()
