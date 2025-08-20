import { Paginated, PagingDTO } from "@shared/model/paging";
import { ITopicCommandRepository, ITopicQueryRepository, ITopicRepository } from "../interfaces";
import { Topic, TopicUpdateDTO } from "../model";
import { TopicPersistent } from "./dto-sequelize";
import { Op } from 'sequelize';
export class TopicSequelizeRepository implements ITopicRepository {
  constructor(
    private readonly queryRepository: ITopicQueryRepository,
    private readonly commandRepository: ITopicCommandRepository
  ){}
  async list(condition: { name?: string }, paging: PagingDTO): Promise<Paginated<Topic>> {
    return this.queryRepository.list(condition, paging);
  }

  async findById(id: string): Promise<Topic | null> {
    return this.queryRepository.findById(id);
  }

  async findByCond(condition: { name?: string }): Promise<Topic | null> {
    return this.queryRepository.findByCond(condition);
  }

  async findByIds(ids: string[]): Promise<Topic[]> {
    return this.queryRepository.findByIds(ids);
  }

  async create(topic: Topic): Promise<boolean> {
    return this.commandRepository.create(topic);
  }
  async update(id: string, dto: TopicUpdateDTO): Promise<boolean> {
    return this.commandRepository.update(id, dto);
  }
  async delete(id: string): Promise<boolean> {
    return this.commandRepository.delete(id);
  }

  async increaseTopicPostCount(id: string): Promise<boolean> {
    const topic = await TopicPersistent.findByPk(id);
    if (!topic) return false;
    topic.postCount = (topic.postCount || 0) + 1;
    await topic.save();
    return true;
  }

  async decreaseTopicPostCount(id: string): Promise<boolean> {
    const topic = await TopicPersistent.findByPk(id);
    if (!topic) return false;
    topic.postCount = Math.max((topic.postCount || 0) - 1, 0); // <-- FIXED
    await topic.save();
    return true;
  }

  
}

export class TopicSequelizeQueryRepository implements ITopicQueryRepository{
  async list(condition: { name?: string }, paging: PagingDTO): Promise<Paginated<Topic>> {
    const where: any = {};
    if (condition.name) {
      where.name = condition.name;
    }

    // Get total count
    const count = await TopicPersistent.count({ where });

    // Build order configuration
    const sortField = paging.sort || 'id';
    const sortOrder = (paging.order || 'ASC').toUpperCase() as 'ASC' | 'DESC';
    const order: any = [[sortField, sortOrder]];

    let rows: any[];

    if (paging.cursor) {
      // Cursor-based seeking: Use cursor to find starting point
      const cursorWhere = {
        ...where,
        // Add cursor condition based on sort field and order
        [sortField]: sortOrder === 'DESC' 
          ? { [Op.lt]: paging.cursor }
          : { [Op.gt]: paging.cursor }
      };

      rows = await TopicPersistent.findAll({
        where: cursorWhere,
        limit: paging.limit,
        order
      });
    } else {
      // Offset-based pagination for initial pages
      const offset = (paging.page - 1) * paging.limit;
      const limit = paging.limit;
      
      // For better performance, limit offset-based queries to reasonable ranges
      const maxOffsetPages = 100; // Adjust based on your needs
      const useOffset = paging.page <= maxOffsetPages;

      if (useOffset) {
        rows = await TopicPersistent.findAll({
          where,
          offset,
          limit,
          order
        });
      } else {
        // For deep pagination, use cursor-based approach
        // First, find an approximate starting point
        const approximateOffset = Math.max(0, offset - (paging.limit * 10)); // Go back a bit for safety
        
        const intermediateResults = await TopicPersistent.findAll({
          where,
          offset: approximateOffset,
          limit: paging.limit * 11, // Get extra records to find the right starting point
          order,
          attributes: [sortField] // Only select the sort field for efficiency
        });

        if (intermediateResults.length > 0) {
          const targetIndex = offset - approximateOffset;
          const cursorValue = (intermediateResults[Math.min(targetIndex, intermediateResults.length - 1)] as any)[sortField];
          
          const cursorWhere = {
            ...where,
            [sortField]: sortOrder === 'DESC' 
              ? { [Op.lte]: cursorValue }
              : { [Op.gte]: cursorValue }
          };

          rows = await TopicPersistent.findAll({
            where: cursorWhere,
            limit: paging.limit,
            order
          });
        } else {
          rows = [];
        }
      }
    }

    // Generate next cursor for subsequent requests
    let nextCursor: string | undefined;
    if (rows.length === paging.limit) {
      const lastItem = rows[rows.length - 1];
      nextCursor = (lastItem as any)[sortField]?.toString();
    }

    // Update paging info
    const updatedPaging: PagingDTO = {
      ...paging,
      cursor: nextCursor
    };

    return {
      data: rows.map((topic) => this._toModel(topic)),
      paging: updatedPaging,
      total: count,
    };
  }

  async findById(id: string): Promise<Topic | null> {
    const topic = await TopicPersistent.findByPk(id);
    return topic ? this._toModel(topic) : null;
  }

  async findByCond(condition: { name?: string }): Promise<Topic | null> {
    const where: any = {};
    if (condition.name) {
      where.name = condition.name;
    }
    const topic = await TopicPersistent.findOne({ where });
    return topic ? this._toModel(topic) : null;
  }

  async findByIds(ids: string[]): Promise<Topic[]> {
    const topics = await TopicPersistent.findAll({ where: { id: ids } });
    return topics.map((topic) => this._toModel(topic));
  }
  // DATA MAPPER
  private _toModel(topic: TopicPersistent): Topic {
    const { created_at, updated_at, ...data } = topic.get({ plain: true });

    return {
      // ...topic.get({ plain: true }),
      ...data,
      // viết như này mới cần declare ở dto
      // createdAt: topic.created_at,
      // updatedAt: topic.updated_at,
      // viết như này thì ko cần declare ở dto
      createdAt: created_at,
      updatedAt: updated_at,
    };
  }
}

export class TopicSequelizeCommandRepository implements ITopicCommandRepository{
  async create(topic: Topic): Promise<boolean> {
    try {
      await TopicPersistent.create(this._toPersistent(topic));
      return true;
    } catch (error) {
      return false;
    }
  }
  async update(id: string, dto: TopicUpdateDTO): Promise<boolean> {
    const [affectedRows] = await TopicPersistent.update(dto, { where: { id } });
    return affectedRows > 0;
  }
  async delete(id: string): Promise<boolean> {
    const deletedCount = await TopicPersistent.destroy({ where: { id } });
    return deletedCount > 0;
  }

  private _toPersistent(topic: Topic): any {
    const { createdAt, updatedAt, ...data } = topic;

    return {
      ...data,
      created_at: createdAt,
      updated_at: updatedAt,
    };
  }
}