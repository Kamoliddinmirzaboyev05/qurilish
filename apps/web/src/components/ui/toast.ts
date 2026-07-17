import toast, { Toaster } from "react-hot-toast";

export { Toaster };

export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
};
