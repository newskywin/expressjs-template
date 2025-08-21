import { Paginated, PagingDTO } from "@shared/model/paging";
import { IPostCommandRepository, IPostQueryRepository, IPostRepository } from "../interfaces";
import { Post, PostCondDTO, PostType, UpdatePostDTO } from "../model";
import { PostPersistent } from "./dto-sequelize";
import { Op } from "sequelize";

export class PostSequelizeRepository implements IPostRepository {
  constructor(
    private readonly queryRepo: IPostQueryRepository,
    private readonly commandRepo: IPostCommandRepository
  ) {}

  async findById(id: string): Promise<Post | null> {
    return this.queryRepo.findById(id);
  }

  async findByCond(condition: PostCondDTO): Promise<Post | null> {
    return this.queryRepo.findByCond(condition);
  }

  async list(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>> {
    return this.queryRepo.list(cond, paging);
  }

  async listByIds(ids: string[]): Promise<Post[]> {
    return this.queryRepo.listByIds(ids);
  }
  

  async insert(data: Post): Promise<boolean> {
    return this.commandRepo.insert(data);
  }

  async update(id: string, dto: UpdatePostDTO): Promise<boolean> {
    return this.commandRepo.update(id, dto);
  }

  async delete(id: string): Promise<boolean> {
    return this.commandRepo.delete(id);
  }

  async increaseCount(id: string, field: string, step: number): Promise<boolean> {
    const post = await PostPersistent.findByPk(id);
    if (!post) return false;
    // @ts-ignore
    post[field] = (post[field] || 0) + step;
    await post.save();
    return true;
  }

  async decreaseCount(id: string, field: string, step: number): Promise<boolean> {
    const post = await PostPersistent.findByPk(id);
    if (!post) return false;
    // @ts-ignore
    post[field] = Math.max((post[field] || 0) - step, 0);
    await post.save();
    return true;
  }
}

export class PostSequelizeQueryRepository implements IPostQueryRepository{
  async findById(id: string): Promise<Post | null> {
    const post = await PostPersistent.findByPk(id);
    return post ? this._toModel(post) : null;
  }

  async findByCond(condition: PostCondDTO): Promise<Post | null> {
    const where: any = { ...condition };
    const post = await PostPersistent.findOne({ where });
    return post ? this._toModel(post) : null;
  }

  async list(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>> {
    const { str, userId, ...rest } = cond;
    let where: any = { ...rest };
    if (userId) {
      where.authorId = userId;
    }
    if (str) {
      where.content = { [Op.like]: `%${str}%` };
    }
    const total = await PostPersistent.count({ where });
    const skip = (paging.page - 1) * paging.limit;
    const result = await PostPersistent.findAll({
      where,
      limit: paging.limit,
      offset: skip,
      order: [["id", "DESC"]],
    });
    return {
      data: result.map((item) => this._toModel(item)),
      paging,
      total,
    };
  }

  async listByIds(ids: string[]): Promise<Post[]> {
    const result = await PostPersistent.findAll({ where: { id: ids } });
    return result.map((item) => this._toModel(item));
  }
  private _toModel(post: PostPersistent): Post {
    const { created_at, updated_at, ...data } = post.get({ plain: true });
    return {
      ...data,
      image: data.image ?? "",
      isFeatured: data.isFeatured ?? false,
      commentCount: data.commentCount ?? 0,
      likedCount: data.likedCount ?? 0,
      type: data.type as PostType,
      createdAt: created_at,
      updatedAt: updated_at,
    };
  }
}

export class PostSequelizeCommandRepository implements IPostCommandRepository{
  async insert(data: Post): Promise<boolean> {
    try {
      await PostPersistent.create(this._toPersistent(data));
      return true;
    } catch {
      return false;
    }
  }

  async update(id: string, dto: UpdatePostDTO): Promise<boolean> {
    const [affectedRows] = await PostPersistent.update(dto, { where: { id } });
    return affectedRows > 0;
  }

  async delete(id: string): Promise<boolean> {
    const deletedCount = await PostPersistent.destroy({ where: { id } });
    return deletedCount > 0;
  }

  async increaseCount(id: string, field: string, step: number): Promise<boolean> {
    const post = await PostPersistent.findByPk(id);
    if (!post) return false;
    // @ts-ignore
    post[field] = (post[field] || 0) + step;
    await post.save();
    return true;
  }

  private _toPersistent(post: Post): any {
    const { createdAt, updatedAt, ...data } = post;
    return {
      ...data,
      created_at: createdAt,
      updated_at: updatedAt,
    };
  }
}