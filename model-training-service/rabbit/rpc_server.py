#!/usr/bin/env python
import pika
import json
from ..config import LOG_PREFIX, CLASSIFICATION, RECOGNITION, MULTI_RECOGNITION, START_MODEL_TRAINING_QUEUE, HOST

conn_parameters = pika.ConnectionParameters(host=HOST,
                                            connection_attempts=20,
                                            retry_delay=5)

connection = pika.BlockingConnection(conn_parameters)

channel = connection.channel()

channel.queue_declare(queue=QUEUE, durable=True)

match_task_inferer = {
    CLASSIFICATION: lambda x: raise_not_implemeted(CLASSIFICATION),
    RECOGNITION: lambda x: raise_not_implemeted(RECOGNITION),
    MULTI_RECOGNITION: infer_multi_recognition
}

def raise_not_implemeted(task):
    raise RuntimeError(f"{task} inferer function is not implemented")

def on_request(ch, method, props, body):
    markup_result = json.loads(body.decode("utf-8"))
    print("[RESULT-INFERENCE-SERVICE]: got markup result", markup_result)

    markup_type = markup_result["type"]
    markup_items = markup_result["items"]
    markup_id = markup_result["markupId"]

    inferred_result = match_task_inferer[markup_type](markup_items)
    
    print("[RESULT-INFERENCE-SERVICE]: inferred result", inferred_result)

    message_body = { "markupId": markup_id,
                     "items": inferred_result }

    ch.basic_publish(exchange='',
                     routing_key=props.reply_to,
                     properties=pika.BasicProperties(correlation_id=props.correlation_id),
                     body=json.dumps(message_body))

    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_qos(prefetch_count=1)
channel.basic_consume(queue=QUEUE, on_message_callback=on_request)

print("[RESULT-INFERENCE-SERVICE]: Awaiting RPC requests")
channel.start_consuming()
