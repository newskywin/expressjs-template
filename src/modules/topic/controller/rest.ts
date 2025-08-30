import { pagingDTOSchema } from "@shared/model/paging";
import { TopicUsecase } from "../service";
import { NextFunction, Request, Response, Router} from "express";
import { paginatedResponse, successResponse } from "@shared/ultils/reponses";
import { ERR_NOT_FOUND } from "@shared/ultils/error";
import { MdlFactory, UserRole } from "@shared/interfaces";
import { Permission } from "@shared/model/permissions";

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

  async listTopicByIdsAPI(req: Request, res: Response) {
    const { ids } = req.body;
    const data = await this.usecase.listTopicByIds(ids);

    res.status(200).json({ data });
  }

  getRoutes(mdlFactory: MdlFactory): Router {
    const router = Router();

    // Public read access
    router.get('/topics', this.listTopicsAPI.bind(this));
    router.get("/topics/:id", this.getTopicByIdAPI.bind(this));

    // Admin-only operations (using new permission system)
    router.post('/topics', 
      mdlFactory.auth, 
      mdlFactory.requirePermission(Permission.TOPIC_WRITE), 
      this.createTopicAPI.bind(this)
    );
    
    router.patch('/topics/:id', 
      mdlFactory.auth, 
      mdlFactory.requirePermission(Permission.TOPIC_WRITE), 
      this.updateTopicAPI.bind(this)
    );
    
    router.delete('/topics/:id', 
      mdlFactory.auth, 
      mdlFactory.requirePermission(Permission.TOPIC_DELETE), 
      this.deleteTopicAPI.bind(this)
    );

    // RPC APIs (internal use)
    router.post('/rpc/topics/list-by-ids', this.listTopicByIdsAPI.bind(this));
    router.get('/rpc/topics/:id', this.getTopicByIdAPI.bind(this));
    
    return router;
  }
}