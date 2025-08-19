import { paginatedResponse, successResponse } from "@shared/ultils/reponses";
import { UserUseCase } from "../service";
import {Response, Request, NextFunction, Router} from "express";
import { jwtProvider } from "@shared/components/jwt";
import { ERR_NOT_FOUND, ERR_UNAUTHORIZED } from "@shared/ultils/error";
import { Requester } from "@shared/interfaces";
import { pagingDTOSchema } from "@shared/model/paging";
import { UserCondDTO } from "../model";
export class UserHTTPService {
  constructor(private readonly usecase: UserUseCase) {}

  async registerAPI(req: Request, res: Response) {
    const data = await this.usecase.register(req.body);
    successResponse(data, res);
  }

  async loginAPI(req: Request, res: Response) {
    const data = await this.usecase.login(req.body);
    successResponse(data, res);
  }

  async profileAPI(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw ERR_UNAUTHORIZED.withMessage("Access token is missing");
    }

    const payload = await jwtProvider.verifyToken(token);

    if (!payload) {
      throw ERR_UNAUTHORIZED.withMessage("Invalid access token");
    }

    const { sub } = payload;

    const user = await this.usecase.profile(sub);

    const { salt, password, ...otherProps } = user;
    successResponse(otherProps, res);
  }

  async updateProfileAPI(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      throw ERR_UNAUTHORIZED.withMessage("Access token is missing");
    }

    const payload = await jwtProvider.verifyToken(token);

    if (!payload) {
      throw ERR_UNAUTHORIZED.withMessage("Invalid access token");
    }

    const requester = payload as Requester;

    await this.usecase.updateProfile(requester, req.body);

    successResponse(true, res);
  }

  async introspectAPI(req: Request, res: Response) {
    const { token } = req.body;
    const result = await this.usecase.verifyToken(token);
    successResponse(result, res);
  }

  async getDetailAPI(req: Request, res: Response) {
    const { id } = req.params;
    const result = await this.usecase.getDetail(id);

    if (!result) {
      throw ERR_NOT_FOUND;
    }

    const { salt, password, ...otherProps } = result;
    successResponse(otherProps, res);
  }

  async deleteAPI(req: Request, res: Response) {
    const { id } = req.params;
    await this.usecase.delete(id);
    successResponse(true, res);
  }

  // RPC API
  async getByIdAPI(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const data = await this.usecase.listByIds([id]);

    if (data.length === 0) {
      throw ERR_NOT_FOUND;
    }

    const { salt, password, ...otherProps } = data[0];
    successResponse(otherProps, res);
  }

  async listByIdsAPI(req: Request, res: Response) {
    const { ids } = req.body;
    const data = await this.usecase.listByIds(ids);

    const finalData = data.map(
      ({ salt, password, ...otherProps }) => otherProps
    );
    successResponse(finalData, res);
  }
  async listAPI(req: Request, res: Response) {
    const paging = pagingDTOSchema.parse(req.query);
    const result = await this.usecase.list(req.query as UserCondDTO, paging);
    const sanitizedData = {
      ...result,
      data: result.data.map(({ password, salt, ...rest }) => rest),
    };
    paginatedResponse(sanitizedData, {}, res);
  }
  getRoutes(): Router {
    const router = Router();
    router.post("/register", this.registerAPI.bind(this));
    router.post("/authenticate", this.loginAPI.bind(this));
    router.get("/profile", this.profileAPI.bind(this));
    router.patch("/profile", this.updateProfileAPI.bind(this));

    router.post("/users", this.registerAPI.bind(this));
    router.patch("/users/:id", this.updateProfileAPI.bind(this));
    router.delete("/users/:id", this.deleteAPI.bind(this));
    router.get("/users/:id", this.getDetailAPI.bind(this));
    router.get("/users", this.listAPI.bind(this));

    // RPC API (use internally)
    router.post("/rpc/introspect", this.introspectAPI.bind(this));
    router.post("/rpc/users/list-by-ids", this.listByIdsAPI.bind(this));
    router.get("/rpc/users/:id", this.getByIdAPI.bind(this));
    return router;
  }
}