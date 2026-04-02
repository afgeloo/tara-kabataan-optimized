import "react";

declare module "react" {
  interface ImgHTMLAttributes<T> {
    fetchPriority?: "high" | "low" | "auto";
  }
}
