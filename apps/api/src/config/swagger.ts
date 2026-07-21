import swaggerJsdoc from "swagger-jsdoc";
import { env } from "./env.js";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BuildScience API",
      version: "1.0.0",
      description: "BuildScience platform backend API documentation",
    },
    servers: [
      {
        url: env.isProduction ? "https://your-production-url.com/api" : `http://localhost:${env.port}/api`,
        description: env.isProduction ? "Production server" : "Development server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: env.sessionCookieName,
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/*.routes.ts", "./src/modules/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
