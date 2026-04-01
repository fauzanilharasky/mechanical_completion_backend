// swagger.js
export const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: { title: 'API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      { bearerAuth: [] },
    ],
  },
  apis: ['./routes/*.js'], // atau lokasi file anotasi
};