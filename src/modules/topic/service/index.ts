import { ITopicRepository, ITopicUsecase } from "../interfaces";
import { Topic, TopicCondDTO, topicCondDTOSchema, TopicCreationDTO, topicCreationDTOSchema, TopicUpdateDTO } from "../model";
import { ERROR_TOPIC_NAME_ALREADY_EXISTS, ERROR_TOPIC_NOT_FOUND } from "../model/error";
import { v7 } from "uuid";
import { Paginated, PagingDTO } from "@shared/model/paging";

export class TopicUsecase implements ITopicUsecase {
  constructor(private readonly topicRepo: ITopicRepository) { }

  async createTopic(dto: TopicCreationDTO): Promise<string> {
    const data = topicCreationDTOSchema.parse(dto);

    const topicExist = await this.topicRepo.findByCond({ name: data.name });

    if (topicExist) {
      throw ERROR_TOPIC_NAME_ALREADY_EXISTS;
    }

    const newId = v7();
    const topic: Topic = {
      id: newId,
      name: data.name,
      postCount: 0,
      color: data.color,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.topicRepo.create(topic);

    return newId;
  }

  async updateTopic(id: string, data: TopicUpdateDTO): Promise<boolean> {
    const topicExist = await this.topicRepo.findById(id);

    if (!topicExist) {
      throw ERROR_TOPIC_NOT_FOUND;
    }

    await this.topicRepo.update(id, data);
    return true;

  }

  async deleteTopic(id: string): Promise<boolean> {
    const topic = await this.topicRepo.findById(id);
    if (!topic) {
      throw ERROR_TOPIC_NOT_FOUND;
    }
    await this.topicRepo.delete(id);


    return true;
  }

  async listTopic(condition: TopicCondDTO, paging: PagingDTO): Promise<Paginated<Topic>> {
    const dto = topicCondDTOSchema.parse(condition);
    return await this.topicRepo.list(dto, paging);
  }

  async getTopicById(id: string): Promise<Topic | null> {
    const topic = await this.topicRepo.findById(id);
    if (!topic) {
      throw ERROR_TOPIC_NOT_FOUND;
    }
    return topic;
  }

  async listTopicByIds(ids: string[]): Promise<Topic[]> {
    return await this.topicRepo.findByIds(ids);
  }
}