import { EvtPostCreated, EvtPostDeleted, PostCreatedEvent, PostDeletedEvent } from "@shared/event/topic.evt";
import { ITopicRepository } from "../interfaces";
import { RedisClient } from "@shared/components/redis";

export class RedisTopicConsumer {
  constructor(private readonly repo: ITopicRepository) {}

  async handledPostCreated(evt: PostCreatedEvent) {
    this.repo.increaseTopicPostCount(evt.payload.topicId, "postCount", 1);
  }

  async handledPostDeleted(evt: PostDeletedEvent) {
    this.repo.decreaseTopicPostCount(evt.payload.topicId, "postCount", 1);
  }

  subcriber() {
    RedisClient.getInstance().subscribe(EvtPostCreated, (msg: string) => {
      const data = JSON.parse(msg);
      const evt = PostCreatedEvent.from(data);
      this.handledPostCreated(evt);
    });

    RedisClient.getInstance().subscribe(EvtPostDeleted, (msg: string) => {
      const data = JSON.parse(msg);
      const evt = PostDeletedEvent.from(data);
      this.handledPostDeleted(evt);
    });
  }
}