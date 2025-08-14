import "module-alias/register";
import app from './app';
import { NextFunction, Request, Response } from 'express';
import { appConfig } from "@shared/components/config";
import { responseErr } from "@shared/ultils/error";
import Logger from "@shared/ultils/logger";
async function bootServer(port: number) {

  try {

    // error handling
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      responseErr(err, res);
      return next();
    });

    // const server = createServer(app);

    app.listen(port, () => {
      Logger.success(`Server is running on port ${port}`);
    });
  } catch (e) {
    Logger.error(`Failed to start server: ${(e as Error).message}`);
    process.exit(1);
  }
}

const port = parseInt(appConfig.port);
bootServer(port);