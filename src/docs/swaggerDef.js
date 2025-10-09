import { version } from '../../package.json';
import config from '../config/config';

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Routes',
    version,
    license: {
      name: 'MIT',
      url: 'https://github.com/maearon/sample_app_nodejs/blob/master/LICENSE',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/v1`,
    },
  ],
};

export default swaggerDef;
