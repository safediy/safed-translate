const amqp = require("amqplib");

const RABBITMQ_ENABLED = process.env.RABBITMQ_ENABLED !== "false";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost:5672";
const RABBITMQ_QUEUE = process.env.RABBITMQ_QUEUE || "telegram_updates";
const RABBITMQ_PREFETCH = Number(process.env.UPDATE_QUEUE_PREFETCH || 10);

let connection = null;
let channel = null;
let initializing = null;

function isRabbitEnabled() {
    return RABBITMQ_ENABLED;
}

async function initRabbitMQ() {
    if (!RABBITMQ_ENABLED) return null;
    if (channel) return channel;
    if (initializing) return initializing;

    initializing = (async () => {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertQueue(RABBITMQ_QUEUE, { durable: true });
        await channel.prefetch(RABBITMQ_PREFETCH);

        connection.on("close", () => {
            connection = null;
            channel = null;
            initializing = null;
            console.error("RabbitMQ connection closed");
        });

        connection.on("error", (error) => {
            console.error("RabbitMQ connection error:", error.message);
        });

        console.log(`RabbitMQ connected. Queue: ${RABBITMQ_QUEUE}`);
        return channel;
    })();

    try {
        return await initializing;
    } finally {
        initializing = null;
    }
}

async function publishMessage(payload) {
    const mqChannel = await initRabbitMQ();
    if (!mqChannel) return false;

    return mqChannel.sendToQueue(
        RABBITMQ_QUEUE,
        Buffer.from(JSON.stringify(payload)),
        { persistent: true, contentType: "application/json" }
    );
}

async function consumeMessages(onMessage) {
    const mqChannel = await initRabbitMQ();
    if (!mqChannel) return false;

    await mqChannel.consume(RABBITMQ_QUEUE, async (msg) => {
        if (!msg) return;

        try {
            const payload = JSON.parse(msg.content.toString("utf8"));
            await onMessage(payload);
            mqChannel.ack(msg);
        } catch (error) {
            console.error("Queue message processing error:", error.message);
            mqChannel.nack(msg, false, true);
        }
    });

    return true;
}

module.exports = {
    RABBITMQ_QUEUE,
    isRabbitEnabled,
    initRabbitMQ,
    publishMessage,
    consumeMessages,
};