import { Toaster as Sonner, toast } from "sonner";

const Toaster = (props: any) => {
  return <Sonner {...props} />;
};

export { Toaster, toast };