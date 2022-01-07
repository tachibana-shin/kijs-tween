import Tween from "../core/Tween";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default new Map<string, <T = any>(this: T, tween: Tween<T>) => void>();
