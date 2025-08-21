import { prisma } from "@shared/components/prisma";
import { IPostCommandRepository, IPostQueryRepository, IPostRepository } from "../interfaces";
import { Post, PostCondDTO, PostType, UpdatePostDTO } from "../model";
import { Paginated, PagingDTO } from "@shared/model/paging";

export class PostPrismaRepository implements IPostRepository {
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

  async increaseCount(
    id: string,
    field: string,
    step: number
  ): Promise<boolean> {
    await prisma.posts.update({
      where: { id },
      data: { [field]: { increment: step } },
    });
    return true;
  }
  async decreaseCount(
    id: string,
    field: string,
    step: number
  ): Promise<boolean> {
    await prisma.posts.update({
      where: { id },
      data: { [field]: { decrement: step } },
    });
    return true;
  }
}

export class PostPrismaQueryRepository implements IPostQueryRepository {
  async findById(id: string): Promise<Post | null> {
    const result = await prisma.posts.findFirst({ where: { id } });

    if (!result) return null;

    return {
      ...result,
      image: result.image ?? "",
      isFeatured: result.isFeatured ?? false,
      commentCount: result.commentCount ?? 0,
      likedCount: result.likedCount ?? 0,
      type: result.type as PostType,
    } as Post;
  }

  async findByCond(condition: PostCondDTO): Promise<Post | null> {
    const post = await prisma.posts.findFirst({ where: condition });
    return post as Post;
  }

  async list(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>> {
    const { str, userId, ...rest } = cond;

    let where = {
      ...rest,
    };

    if (userId) {
      where = {
        ...where,
        authorId: userId,
      } as PostCondDTO;
    }

    if (str) {
      where = {
        ...where,
        content: { contains: str },
      } as PostCondDTO;
    }

    const total = await prisma.posts.count({ where });

    const skip = (paging.page - 1) * paging.limit;

    const result = await prisma.posts.findMany({
      where,
      take: paging.limit,
      skip,
      orderBy: {
        id: "desc",
      },
    });

    return {
      data: result.map(
        (item) =>
          ({
            ...item,
            image: item.image ?? "",
            isFeatured: item.isFeatured ?? false,
            commentCount: item.commentCount ?? 0,
            likedCount: item.likedCount ?? 0,
            type: item.type as PostType,
          } as Post)
      ),
      paging,
      total,
    };
  }

  async listByIds(ids: string[]): Promise<Post[]> {
    const result = await prisma.posts.findMany({ where: { id: { in: ids } } });

    return result.map(
      (item) =>
        ({
          ...item,
          image: item.image ?? "",
          isFeatured: item.isFeatured ?? false,
          commentCount: item.commentCount ?? 0,
          likedCount: item.likedCount ?? 0,
          type: item.type as PostType,
        } as Post)
    );
  }
}

export class PostPrismaCommandRepository implements IPostCommandRepository{
  async insert(data: Post): Promise<boolean> {
    await prisma.posts.create({ data });

    return true;
  }
  async update(id: string, dto: UpdatePostDTO): Promise<boolean> {
    await prisma.posts.update({ where: { id }, data: dto });

    return true;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.posts.delete({ where: { id } });

    return true;
  }
}