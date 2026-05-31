# Safed Translate Bot

## RabbitMQ Integration (High Load)

Loyiha katta bosimda webhook requestlarni tez qabul qilib, keyin navbat asosida qayta ishlashi uchun RabbitMQ qo'shildi.

### Ishlash prinsipi

- Telegram webhook request kelganda update avval queue'ga yoziladi.
- HTTP endpoint update queue'ga yozilgach darhol `200` qaytaradi.
- Consumer queue'dan update olib `bot.processUpdate` orqali qayta ishlaydi.
- RabbitMQ o'chirilgan bo'lsa, tizim avtomatik ravishda oldingi kabi inline processing rejimiga o'tadi.

### Environment variables

- `RABBITMQ_ENABLED=true|false` - queue yoqish/o'chirish (default: `true`)
- `RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672` - RabbitMQ connection URL
- `RABBITMQ_QUEUE=telegram_updates` - update'lar queue nomi
- `UPDATE_QUEUE_PREFETCH=20` - bitta consumer uchun bir vaqtda olinadigan message limiti

### Docker

`docker-compose.yml` va `docker-compose-staging.yml` ga `rabbitmq` xizmati qo'shildi:

- Broker porti: `5672` (`staging` host tomonda `5673`)
- Management UI: `15672` (`staging` host tomonda `15673`)

Management UI orqali queue holatini kuzatishingiz mumkin.
