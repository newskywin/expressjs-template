import compression from 'compression';
import cors from 'cors';
import express, { Application, json, NextFunction, Request, Response, urlencoded } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
function buildApp(): Application {
  const app: Application = express();

  app.use(urlencoded({ extended: true }));
  app.use(json());
  app.use(morgan('dev')); //dev, combine, common, short, tiny, 
  app.use(helmet());
  app.use(compression())
  // const corsOption = {
  //   origin: 'http://localhost:3000',
  //   methods: 'GET,POST,PUT,PATCH,HEAD,DELETE',
  //   credentials: true,
  //   optionScuccessStatus: 204
  // }
  // app.use(cors(corsOption))
  app.use(cors({ origin: '*' }));
  app.set('trust proxy', 1);

  app.use('/ping', (_: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      message: 'pong'
    });
  });

  return app;
}

export default buildApp();