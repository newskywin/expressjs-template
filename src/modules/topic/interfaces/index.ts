import { Paginated, PagingDTO } from "@shared/model/paging";
import { Topic, TopicCondDTO, TopicCreationDTO, TopicUpdateDTO } from "../model";

export interface ITopicRepository extends ITopicCommandRepository, ITopicQueryRepository {
  increaseTopicPostCount(id: string, field: string, step: number): Promise<boolean>
  decreaseTopicPostCount(id: string, field: string, step: number): Promise<boolean>
}

export interface ITopicUsecase {
  createTopic(data: TopicCreationDTO): Promise<string>;
  updateTopic(id: string, data: TopicUpdateDTO): Promise<boolean>;
  deleteTopic(id: string): Promise<boolean>;
  listTopic(condition: TopicCondDTO, paging: PagingDTO): Promise<Paginated<Topic>>;
  getTopicById(id: string): Promise<Topic | null>;
  listTopicByIds(ids: string[]): Promise<Topic[]>;
}
export interface ITopicCommandRepository {
  create(data: Topic): Promise<boolean>;
  update(id: string, data: TopicUpdateDTO): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

export interface ITopicQueryRepository {
  findById(id: string): Promise<Topic | null>;
  findByCond(condition: TopicCondDTO): Promise<Topic | null>;
  list(condition: TopicCondDTO, paging: PagingDTO): Promise<Paginated<Topic>>;
  findByIds(ids: string[]): Promise<Topic[]>;
}