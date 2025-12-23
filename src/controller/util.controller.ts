import { toast } from "vue3-toastify";
export enum messageTypes {
  error = "error",
  success = "success",
  warning = "warning",
}
export const utilController = {
  toast: toast,
  toastId: "",
  snackbar(msg: string, type: messageTypes) {
    if (!this.toastId) {
      if (type === "error") {
        this.toast.error(msg);
      } else if (type === "success") {
        this.toast.success(msg);
      } else if (type === "warning") {
        this.toast.warning(msg);
      } else {
        this.toast.info(msg);
      }
      this.toastId = toast.name;
      setTimeout(() => {
        toast.clearAll();
        toast.remove();
        this.toastId = "";
      }, 3000);

      return this.toast.name;
    }
  },
};