import type { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, GET } from 'fastify-decorators';

import { WelcomeSchema } from './welcome.schema';

@Controller()
export default class {
  @GET({
    url: '',
    options: {
      schema: WelcomeSchema,
    },
  })
  async handle(_: FastifyRequest, response: FastifyReply): Promise<void> {
    return response.redirect('/documentation').send({
      message: 'LowCodeJs API',
    });
  }
}
