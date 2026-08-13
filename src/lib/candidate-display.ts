export function maskName(fullName: string): string {
  return fullName
    .split(" ")
    .map((word) => (word.length > 0 ? word[0] + "*****" : ""))
    .join(" ");
}
