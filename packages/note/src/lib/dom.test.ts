import { describe, expect, it } from "vitest";
import { removeBrInsideStyleTag } from "./dom";

describe("removeBrInsideStyleTag", () => {
  it("should normalize br tags inside style blocks without touching other html", () => {
    const html = `
      <div>
        <style id="a">
          .a{color:red;}<br>.b{display:block;}<br />
        </style>
        <style media="screen">.c{font-weight:bold;}<br>.d{font-style:italic;}</style>
        <p>Hello<br>world</p>
      </div>
    `;

    const normalized = removeBrInsideStyleTag(html);

    expect(normalized).toContain('<style id="a">');
    expect(normalized).toContain('<style media="screen">');
    expect(normalized).toContain(".a{color:red;}\n.b{display:block;}\n");
    expect(normalized).toContain(".c{font-weight:bold;}\n.d{font-style:italic;}");
    expect(normalized).toContain("<p>Hello<br>world</p>");
  });

  it("should leave html without style tags unchanged", () => {
    const html = "<div>Hello<br>world</div>";

    expect(removeBrInsideStyleTag(html)).toBe(html);
  });
});
