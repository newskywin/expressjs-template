import { Paginated, PagingDTO } from "@shared/model/paging";
import { ITopicRepository } from "../interfaces";
import { Topic, TopicUpdateDTO } from "../model";

var data: Topic[] = [
  {
    id: "0195655a-b870-729b-877f-840a608ca981",
    name: "Javascript",
    color: "yellow",
    createdAt: new Date(),
    updatedAt: new Date(),
    postCount: 0,
  },
  {
    id: "0198ace5-ddc5-753a-915f-6547fe4eaff9",
    name: "Golang",
    color: "Sky",
    createdAt: new Date(),
    updatedAt: new Date(),
    postCount: 0,
  },
  {
    id: "0198acff-cce6-7b80-a7cf-a29c27afc342",
    name: "Python",
    color: "Blue",
    createdAt: new Date(),
    updatedAt: new Date(),
    postCount: 0,
  },
  {
    id: "0198ad01-bf97-7407-bdbb-61f38e962685",
    name: "Rust",
    color: "Gach",
    createdAt: new Date(),
    updatedAt: new Date(),
    postCount: 0,
  },
];

export class TopicInMemoryRepository implements ITopicRepository {
  list(condition: { name?: string }, paging: PagingDTO): Promise<Paginated<Topic>> {
    let filtered = data;
    if (condition && condition.name && condition.name.length > 0) {
      filtered = filtered.filter(topic => condition.name ? topic.name.includes(condition.name) : true);
    }
    const total = filtered.length;
    let paginatedData: Topic[] = [];
    let cursor: string | undefined = undefined;
    // Seeking (cursor-based) pagination
    if (paging.cursor) {
      const cursorIndex = filtered.findIndex(topic => topic.id === paging.cursor);
      const start = cursorIndex >= 0 ? cursorIndex + 1 : 0;
      const limit = paging.limit;
      paginatedData = filtered.slice(start, start + limit);
      if (paginatedData.length > 0 && start + limit < filtered.length) {
        cursor = paginatedData[paginatedData.length - 1].id;
      }
      return Promise.resolve({
        data: paginatedData,
        paging: { ...paging, cursor, total },
        total,
      });
    } else {
      // Offset pagination
      const page = paging.page;
      const limit = paging.limit;
      const start = (page - 1) * limit;
      paginatedData = filtered.slice(start, start + limit);
      let nextCursor: string | undefined = undefined;
      if (paginatedData.length > 0 && start + limit < filtered.length) {

        nextCursor = paginatedData[paginatedData.length - 1].id;
      }
      return Promise.resolve({
        data: paginatedData,
        paging: { ...paging, page, limit, total, nextCursor },
        total,
      });
    }
  }
  
  findByCond(condition: { name?: string }): Promise<Topic | null> {
    if (condition && condition.name) {
      return Promise.resolve(data.find((topic) => topic.name === condition.name) || null);
    }
    return Promise.resolve(null);
  }

  findById(id: string): Promise<Topic | null> {
    return Promise.resolve(data.find((topic) => topic.id === id) || null);
  }

  findByIds(ids: string[]): Promise<Topic[]> {
    return Promise.resolve(data.filter((topic) => ids.includes(topic.id)));
  }

  create(topic: Topic): Promise<boolean> {
    data.push(topic);
    return Promise.resolve(true);
  }

  update(id: string, dto: TopicUpdateDTO): Promise<boolean> {
    const topic = data.find((topic) => topic.id === id);
    if (!topic) {
      return Promise.resolve(false);
    }

    topic.name = dto.name || topic.name;
    topic.color = dto.color || topic.color;
    topic.updatedAt = new Date();
    return Promise.resolve(true);
  }
  delete(id: string): Promise<boolean> {
    const initialLength = data.length;
    data = data.filter((topic) => topic.id !== id);
    return Promise.resolve(data.length < initialLength);
  }

  increateTopicPostCount(id: string): Promise<boolean> {
    const topic = data.find((topic) => topic.id === id);
    if (!topic) {
      return Promise.resolve(false);
    }
    topic.postCount += 1;
    topic.updatedAt = new Date();
    return Promise.resolve(true);
  }

  decreaseTopicPostCount(id: string): Promise<boolean> {
    const topic = data.find((topic) => topic.id === id);
    if (!topic) {
      return Promise.resolve(false);
    }
    topic.postCount = Math.max(0, topic.postCount - 1);
    topic.updatedAt = new Date();
    return Promise.resolve(true);
  }
}