export function isNsfw(tags: string) {
  return tags
    .split(" ")
    .map((tag) => tag.toLowerCase())
    .includes("nsfw");
}
