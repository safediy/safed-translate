const {
    isRabbitEnabled,
    publishMessage,
    consumeMessages,
} = require("./rabbitmq");

async function enqueueWebhookUpdate(update) {
    if (!isRabbitEnabled()) return false;
    return publishMessage(update);
}

async function startWebhookUpdateConsumer(bot) {
    if (!isRabbitEnabled()) {
        console.log("RabbitMQ is disabled. Webhook updates will be processed inline.");
        return false;
    }

    await consumeMessages(async (update) => {
        await bot.processUpdate(update);
    });

    console.log("Webhook update consumer started");
    return true;
}

module.exports = {
    enqueueWebhookUpdate,
    startWebhookUpdateConsumer,
};