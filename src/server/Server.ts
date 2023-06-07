import { LoggerService } from '../services';
import express, { Application, NextFunction, Request, Response } from 'express';
import { createHandler } from 'graphql-http/lib/handler';
import routes from './routes';
import schema from './Schema';

interface ServerConfig {
  port: number;
  authorization: string;
}

class _Server {
  /**
   * The Express Application instance.
   * @access private
   */
  private _app: Application = express();

  /**
   * @access private
   */
  private _config: ServerConfig = {
    port: 0,
    authorization: '',
  };

  /**
   * Launches the server
   * @returns void
   */
  public async launch(): Promise<void> {
    return new Promise((resolve) => {
      this._app.listen(this._config.port, () => {
        LoggerService.info(`Server started`);
        resolve();
      });
    });
  }
  /**
   * Constructs the server
   * @param config ServerConfig
   * @returns void
   */
  public construct(config: ServerConfig) {
    this._config = config;

    this._app.use('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.get('Authorization') !== this._config.authorization) {
        res.status(403).json({
          error: {
            status: 403,
            message: 'Unauthorized',
          },
          data: null,
        });
      } else {
        next('route');
      }
    });

    routes.forEach((route) => {
      this._app.use(route.path, route.handlers);
    });

    this._app.use('/graphql/:path:/', createHandler({ schema }));

    this._app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: {
          status: 404,
          message: 'Route not found.',
        },
        data: null,
      });
    });
  }
}

export const Server = new _Server();
