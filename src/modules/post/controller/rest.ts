import { IAuthorRpc, MdlFactory, Requester } from "@shared/interfaces";
import { IPostLikedRPC, IPostRepository, IPostSavedRPC, IPostUseCase, ITopicQueryRPC } from "../interfaces";
import { NextFunction, Request, Response, Router } from "express";
import { pagingDTOSchema } from "@shared/model/paging";
import { Post, postCondDTOSchema } from "../model";
import { PublicUser } from "@shared/model/public-user";
import { Topic } from "../model/topic";
import { paginatedResponse, successResponse } from "@shared/ultils/reponses";
import { ERR_NOT_FOUND } from "@shared/ultils/error";

export class PostHttpService {
  constructor(
    private readonly usecase: IPostUseCase,
    private readonly userRPC: IAuthorRpc,
    private readonly topicQueryRPC: ITopicQueryRPC,
    private readonly postLikeRPC: IPostLikedRPC,
    private readonly postSavedRPC: IPostSavedRPC
  ) {}

  async createPostAPI(req: Request, res: Response) {
    const requester = res.locals.requester as Requester;

    const dto = { ...req.body, authorId: requester.sub };

    const data = await this.usecase.createPost(dto);
    res.status(201).json({ data });
  }

  async listPostAPI(req: Request, res: Response) {
    const paging = pagingDTOSchema.parse(req.query);
    const dto = postCondDTOSchema.parse(req.query);

    const result = await this.usecase.listPost(dto, paging);

    const topicIds = result.data.map((item) => item.topicId);
    const authorIds = result.data.map((item) => item.authorId);
    const postIds = result.data.map((item) => item.id);

    const postLikeMap: Record<string, boolean> = {};
    const postSavedMap: Record<string, boolean> = {};

    if (res.locals.requester) {
      // when logged in
      const userId = res.locals.requester.sub;
      const postLikedIds = await this.postLikeRPC.listPostIdsLiked(
        userId,
        postIds
      );
      postLikedIds.forEach((item) => {
        postLikeMap[item] = true;
      });

      const postSavedIds = await this.postSavedRPC.listPostIdsSaved(
        userId,
        postIds
      );
      postSavedIds.forEach((item) => {
        postSavedMap[item] = true;
      });
    }

    const topics = await this.topicQueryRPC.findByIds(topicIds);
    const users = await this.userRPC.findByIds(authorIds);

    const authorMap: Record<string, PublicUser> = {};
    const topicMap: Record<string, Topic> = {};

    users.forEach((u: PublicUser) => {
      authorMap[u.id] = u;
    });

    topics.forEach((t: Topic) => {
      topicMap[t.id] = t;
    });

    result.data = result.data.map((item) => {
      const topic = topicMap[item.topicId];
      const user = authorMap[item.authorId];

      return {
        ...item,
        topic,
        author: user,
        hasLiked: postLikeMap[item.id] === true,
        hasSaved: postSavedMap[item.id] === true,
      } as Post;
    });

    paginatedResponse(result, dto, res);
  }

  async getPostAPI(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const result = await this.usecase.getPostById(id);

    if (!result) {
      next(ERR_NOT_FOUND);
      return;
    }

    const author = await this.userRPC.findById(result.authorId);
    const topic = await this.topicQueryRPC.findById(result.topicId);

    const { authorId, topicId, ...rest } = result;

    let hasLiked = false;
    let hasSaved = false;

    if (res.locals.requester) {
      const userId = res.locals.requester.sub;
      hasLiked = await this.postLikeRPC.hasLikedId(userId, result.id);
      hasSaved = await this.postSavedRPC.hasSavedId(userId, result.id);
    }

    const data = { ...rest, topic, author, hasLiked, hasSaved };

    successResponse(data, res);
  }

  async updatePostAPI(req: Request, res: Response) {
    const requester = res.locals.requester as Requester;
    const { id } = req.params;

    const result = await this.usecase.updatePost(id, req.body, requester);

    successResponse(result, res);
  }

  async deletePostAPI(req: Request, res: Response) {
    const requester = res.locals.requester as Requester;
    const { id } = req.params;

    const result = await this.usecase.deletePost(id, requester);

    successResponse(result, res);
  }

  // RPC API (use internally)
  async listPostByIdsAPI(req: Request, res: Response) {
    const { ids } = req.body;

    const result = await this.usecase.listPostByIds(ids);

    successResponse(result, res);
  }

  async getByIdAPI(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const data = await this.usecase.getPostById(id);

    if (!data) {
      next(ERR_NOT_FOUND);
      return;
    }

    res.status(200).json({ data });
  }

  getRoutes(mdlFactory: MdlFactory): Router {
    const router = Router();

    router.post("/posts", mdlFactory.auth, this.createPostAPI.bind(this));
    router.get("/posts", this.listPostAPI.bind(this));
    router.get("/posts/:id", this.getPostAPI.bind(this));
    router.patch("/posts/:id", mdlFactory.auth, this.updatePostAPI.bind(this));
    router.delete("/posts/:id", mdlFactory.auth, this.deletePostAPI.bind(this));

    // RPC API (use internally)
    router.post("/rpc/posts/list-by-ids", this.listPostByIdsAPI.bind(this));
    router.get("/rpc/posts/:id", this.getByIdAPI.bind(this));

    return router;
  }
}