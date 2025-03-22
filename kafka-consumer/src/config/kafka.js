import { Kafka } from 'kafkajs';
import { config } from './env.js';

const kafka = new Kafka({
    brokers: [config.kafka.broker]
});

export const consumer = kafka.consumer({ groupId: config.kafka.groupId });
