export function slugFromId(id: number): string {
  return String(id).padStart(5, "0");
}
