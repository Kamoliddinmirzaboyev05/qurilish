export class AppError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  static badRequest(message: string, errors?: Record<string, string[]>) {
    return new AppError(400, message, errors);
  }
  static unauthorized(message = "Bu amalni bajarish uchun tizimga kiring.") {
    return new AppError(401, message);
  }
  static forbidden(message = "Sizda bu amal uchun ruxsat yo'q.") {
    return new AppError(403, message);
  }
  static notFound(message = "Ma'lumot topilmadi.") {
    return new AppError(404, message);
  }
  static conflict(message: string) {
    return new AppError(409, message);
  }
  static unprocessable(message: string, errors?: Record<string, string[]>) {
    return new AppError(422, message, errors);
  }
}
