#!/usr/bin/env python
import pika
import json
from ..core.infer_multi_recognition import infer_multi_recognition

QUEUE = "result_inference"
CLASSIFICATION = "classification"
RECOGNITION = "recognition"
MULTI_RECOGNITION = "multi-recognition"

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='localhost'))

channel = connection.channel()

channel.queue_declare(queue=QUEUE)

def on_request(ch, method, props, body):
    markup_result = json.load(str(body))
    markup_type = markup_result["type"]

    if markup_type == RECOGNITION:
        inferred_result = infer_multi_recognition(markup_result["items"])
    elif markup_type == CLASSIFICATION:
        raise Exception("Not implemented")
    elif markup_type == RECOGNITION:
        raise Exception("Not implemented")
    else:
        raise Exception(f"Unknown markup type: {markup_type}")

    ch.basic_publish(exchange='',
                     routing_key=props.reply_to,
                     properties=pika.BasicProperties(correlation_id=props.correlation_id),
                     body=json.dumps(inferred_result))
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue=QUEUE, on_message_callback=on_request)

print("[RESULT-INFERENCE-SERVICE]: Awaiting RPC requests")
channel.start_consuming()
