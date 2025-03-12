import datetime
import json
from confluent_kafka import Producer
from scrapy.exceptions import NotConfigured
from scrapy.utils.project import get_project_settings

class KafkaPipeline:
    def __init__(self):
        # Get the project settings
        self.settings = get_project_settings()
        
        # Retrieve Kafka configurations from settings
        self.kafka_config = {
            'bootstrap.servers': self.settings.get('KAFKA_BROKER'),
            'client.id': self.settings.get('KAFKA_CLIENT_ID'),
        }

        # Initialize the Kafka producer
        self.producer = Producer(self.kafka_config)
        
        # Kafka topic from the settings
        self.kafka_topic = self.settings.get('KAFKA_TOPIC')

        if not self.kafka_topic:
            raise NotConfigured("Kafka topic is not set in the settings")

    def process_item(self, item, spider):
        # Convert item to JSON
        try:
            item['timestamp'] = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')  # ISO format
            item_dict = dict(item)
            message = json.dumps(item_dict)
            
            # Send the message to the Kafka topic
            self.producer.produce(self.kafka_topic, key=item['domain'], value=message)
            self.producer.flush()  # Ensure the message is sent immediately
            spider.logger.info(f"Sent item to Kafka: {message}")
        except Exception as e:
            spider.logger.error(f"Error sending item to Kafka: {e}")
        
        return item