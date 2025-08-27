# Express Template

## Pub/Sub Configuration

This application supports both Redis and RabbitMQ for pub/sub messaging. You can easily toggle between them using environment variables.

### Configuration

Set the `PUBSUB_TYPE` environment variable to choose your pub/sub system:

```bash
# Use Redis (default)
PUBSUB_TYPE=redis

# Use RabbitMQ
PUBSUB_TYPE=rabbitmq
```

### Redis Configuration
```bash
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### RabbitMQ Configuration
```bash
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=events
RABBITMQ_EXCHANGE_TYPE=topic
```

### Events

The application publishes the following events:
- `PostCreated` - When a post is created
- `PostDeleted` - When a post is deleted

These events are consumed by the topic service to update post counts.

### Installation

```bash
pnpm install
```

### Running the Application

```bash
# Development
pnpm start:watch

# Production
pnpm start
```

Make sure you have either Redis or RabbitMQ running based on your configuration.
