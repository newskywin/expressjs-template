import { pagingDTOSchema } from "@shared/model/paging";
import { TopicUsecase } from "../service";
import { NextFunction, Request, Response, Router} from "express";
import { paginatedResponse, successResponse } from "@shared/ultils/reponses";
import { ERR_NOT_FOUND } from "@shared/ultils/error";

export class TopicHttpService {
  constructor(
    private readonly usecase: TopicUsecase,
  ) { }

  async createTopicAPI(req: Request, res: Response) {
    const data = await this.usecase.createTopic(req.body);
    successResponse(data, res);
  }

  async updateTopicAPI(req: any, res: any) {
    const { id } = req.params;
    const data = await this.usecase.updateTopic(id, req.body);
    successResponse(data, res);
  }

  async deleteTopicAPI(req: any, res: any) {
    const { id } = req.params;
    const data = await this.usecase.deleteTopic(id);
    successResponse(data, res);
  }

  async listTopicsAPI(req: Request, res: Response) {
    const paging = pagingDTOSchema.parse(req.query);
    const dto = req.query;

    const data = await this.usecase.listTopic(dto, paging);
    paginatedResponse(data, {}, res);
  }

  async getTopicByIdAPI(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const data = await this.usecase.getTopicById(id);

    if (!data) {
      next(ERR_NOT_FOUND.withDetail('id', id).withMessage(`Topic with id ${id} not found`));
      return;
    }

    res.status(200).json({ data });
  }

  getRoutes(): Router {
    const router = Router();

    router.post('/topics', this.createTopicAPI.bind(this));
    router.patch('/topics/:id', this.updateTopicAPI.bind(this));
    router.delete('/topics/:id', this.deleteTopicAPI.bind(this));
    router.get("/topics/:id", this.getTopicByIdAPI.bind(this));
    router.get('/topics', this.listTopicsAPI.bind(this));

    return router;
  }
}