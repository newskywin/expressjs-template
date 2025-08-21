import { Requester } from "@shared/interfaces";
import { CreatePostDTO, Post, PostCondDTO, UpdatePostDTO } from "../model";
import { Paginated, PagingDTO } from "@shared/model/paging";
import { Topic } from "../model/topic";

export interface IPostRepository
  extends IPostQueryRepository,
    IPostCommandRepository {
  increaseCount(id: string, field: string, step: number): Promise<boolean>;
  decreaseCount(id: string, field: string, step: number): Promise<boolean>;
}
export interface IPostUseCase {
  createPost(dto: CreatePostDTO): Promise<string>;
  updatePost(id: string, dto: UpdatePostDTO, requester: Requester): Promise<boolean>;
  deletePost(id: string, requester: Requester): Promise<boolean>;
  listPost(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>>;
  getPostById(id: string): Promise<Post | null>;
  listPostByIds(ids: string[]): Promise<Post[]>;
}

export interface IPostQueryRepository {
  findById(id: string): Promise<Post | null>;
  findByCond(cond: PostCondDTO): Promise<Post | null>;
  list(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>>;
  listByIds(ids: string[]): Promise<Post[]>;
}
export interface IPostCommandRepository {
  insert(dto: Post): Promise<boolean>;
  update(id: string, dto: UpdatePostDTO): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

export interface ITopicQueryRPC {
  findById(id: string): Promise<Topic | null>;
  findByIds(ids: string[]): Promise<Array<Topic>>;
}

export interface IPostLikedRPC {
  hasLikedId(userId: string, postId: string): Promise<boolean>;
  listPostIdsLiked(userId: string, postIds: string[]): Promise<Array<string>>;
}

export interface IPostSavedRPC {
  hasSavedId(userId: string, postId: string): Promise<boolean>;
  listPostIdsSaved(userId: string, postIds: string[]): Promise<Array<string>>;
}