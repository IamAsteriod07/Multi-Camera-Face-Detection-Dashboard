import os
import json
import threading


class MockS3Client:
    """A minimal mock S3 client that writes objects to a local directory.
    Used for CI/tests without external S3.
    """
    def __init__(self, base_dir=None):
        self.base_dir = base_dir or os.path.join(os.getcwd(), 'worker', 'mock_s3')
        os.makedirs(self.base_dir, exist_ok=True)

    def put_object(self, Bucket, Key, Body, ACL=None):
        bucket_dir = os.path.join(self.base_dir, Bucket)
        os.makedirs(bucket_dir, exist_ok=True)
        full_path = os.path.join(bucket_dir, Key)
        d = os.path.dirname(full_path)
        os.makedirs(d, exist_ok=True)
        with open(full_path, 'wb') as f:
            f.write(Body)
        # Return a minimal response-like dict
        return {'ETag': '"mocked"', 'Location': full_path}


class MockMQChannel:
    def __init__(self):
        self.published = []

    def basic_publish(self, exchange, routing_key, body):
        self.published.append({'exchange': exchange, 'routing_key': routing_key, 'body': body})

    def exchange_declare(self, exchange, exchange_type='direct', durable=True):
        # no-op for mock
        return True


class MockMQConnection:
    def __init__(self):
        self.channel_obj = MockMQChannel()

    def channel(self):
        return self.channel_obj

    def close(self):
        pass
