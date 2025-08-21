import { IAuthorRpc, Requester } from "@shared/interfaces";
import { IPostRepository, IPostUseCase, ITopicQueryRPC } from "../interfaces";
import { CreatePostDTO, createPostDTOSchema, Post, PostCondDTO, PostType, UpdatePostDTO, updatePostDTOSchema } from "../model";
import { ERROR_AUTHOR_NOT_FOUND, ERROR_POST_NOT_FOUND, ERROR_TOPIC_NOT_FOUND } from "../model/error";
import { v7 } from "uuid";
import { Paginated, PagingDTO } from "@shared/model/paging";

export class PostUsecase implements IPostUseCase {
  constructor(
    private readonly repository: IPostRepository,
    private readonly topicRPC: ITopicQueryRPC,
    private readonly userRPC: IAuthorRpc
  ) {}

  async createPost(dto: CreatePostDTO): Promise<string> {
    const data = createPostDTOSchema.parse(dto);

    const topicExist = await this.topicRPC.findById(data.topicId);

    if (!topicExist) {
      throw ERROR_TOPIC_NOT_FOUND;
    }

    const authorExist = await this.userRPC.findById(data.authorId);

    if (!authorExist) {
      throw ERROR_AUTHOR_NOT_FOUND;
    }

    const newId = v7();
    const post: Post = {
      ...data,
      id: newId,
      isFeatured: false,
      topicId: topicExist.id,
      image: data.image ?? "",
      type: data.image ? PostType.MEDIA : PostType.TEXT,
      commentCount: 0,
      likedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.repository.insert(post);

    // publish event

    return newId;
  }

  async updatePost(
    id: string,
    dto: UpdatePostDTO,
    requester: Requester
  ): Promise<boolean> {
    const data = updatePostDTOSchema.parse(dto);

    const postExist = await this.repository.findById(id);

    if (!postExist) {
      throw ERROR_POST_NOT_FOUND;
    }

    if (postExist.authorId !== requester.sub) {
      throw ERROR_POST_NOT_FOUND;
    }

    const updateDto: UpdatePostDTO = {
      ...data,
      type: data.image ? PostType.MEDIA : PostType.TEXT,
      updatedAt: new Date(),
    };

    const result = await this.repository.update(id, updateDto);

    return result;
  }

  async deletePost(id: string, requester: Requester): Promise<boolean> {
    const postExist = await this.repository.findById(id);

    if (!postExist) {
      throw ERROR_POST_NOT_FOUND;
    }

    if (postExist.authorId !== requester.sub) {
      throw ERROR_POST_NOT_FOUND;
    }

    const result = await this.repository.delete(id);

    // publish event

    return result;
  }

  async listPost(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>> {
    const result = await this.repository.list(cond, paging);
    return result;
  }

  async getPostById(id: string): Promise<Post | null> {
    const post = await this.repository.findById(id);
    if (!post) {
      throw ERROR_POST_NOT_FOUND;
    }
    return post;
  }

  async listPostByIds(ids: string[]): Promise<Post[]> {
    if (ids.length === 0) {
      return [];
    }
    const posts = await this.repository.listByIds(ids);
    return posts;
  }
}