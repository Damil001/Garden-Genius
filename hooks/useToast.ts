// hooks/useToast.ts
import { useCallback } from "react";
import Toast from "react-native-toast-message";

// Define the possible toast types
type ToastType = "success" | "error" | "info";

// Define the function signature for showToast and other functions
interface UseToast {
  showToast: (type: ToastType, title: string, message: string) => void;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
}

const useToast = (): UseToast => {
  const showToast = useCallback((type: ToastType, title: string, message: string) => {
    Toast.show({
      type: type || "info", // "success" | "error" | "info"
      text1: title,
      text2: message,
      position: "top",
      visibilityTime: 4000,
      autoHide: true,
    });
  }, []);

  const showSuccess = useCallback((title: string, message: string) => {
    showToast("success", title, message);
  }, [showToast]);

  const showError = useCallback((title: string, message: string) => {
    showToast("error", title, message);
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string) => {
    showToast("info", title, message);
  }, [showToast]);

  return { showToast, showSuccess, showError, showInfo };
};

export default useToast;
