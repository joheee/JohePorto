// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarChart, RankedBars, Stat } from "./Charts";

describe("BarChart", () => {
  const series = [
    { day: "2026-10-04", views: 0, visitors: 0 },
    { day: "2026-10-05", views: 10, visitors: 6 },
    { day: "2026-10-06", views: 40, visitors: 30 },
  ];

  it("is described as an image with the period and the total, and each day has a tooltip", () => {
    const { container } = render(<BarChart series={series} />);
    expect(screen.getByRole("img", { name: "Views per day from Oct 4 to Oct 6: 50 in total" })).toBeInTheDocument();
    expect([...container.querySelectorAll("title")].map((t) => t.textContent)).toEqual([
      "Oct 4: 0 views, 0 visitors",
      "Oct 5: 10 views, 6 visitors",
      "Oct 6: 40 views, 30 visitors",
    ]);
  });

  it("scales the bars to the busiest day, keeps a tiny day visible, and draws nothing for an empty one", () => {
    const { container } = render(<BarChart series={[...series, { day: "2026-10-07", views: 1, visitors: 1 }]} />);
    const heights = [...container.querySelectorAll("rect")].map((r) => Number(r.getAttribute("height")));
    expect(heights[0]).toBe(0); // views of the empty day
    expect(heights[2]).toBeCloseTo(25); // 10 of 40
    expect(heights[4]).toBe(100); // the busiest day
    expect(heights[6]).toBeGreaterThanOrEqual(2); // 1 of 40 is still a visible sliver
  });

  it("never draws more visitors than views", () => {
    const { container } = render(<BarChart series={[{ day: "2026-10-06", views: 5, visitors: 9 }]} />);
    const [views, visitors] = [...container.querySelectorAll("rect")].map((r) => Number(r.getAttribute("height")));
    expect(visitors).toBeLessThanOrEqual(views);
  });
});

describe("RankedBars", () => {
  it("lists each row with its count and share, labelled by the function it is given", () => {
    render(<RankedBars rows={[{ key: "id", count: 6, share: 0.75 }, { key: "us", count: 2, share: 0.25 }]} label={(k) => k.toUpperCase()} />);
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("ID");
    expect(items[0]).toHaveTextContent("6 · 75%");
    expect(items[1]).toHaveTextContent("US");
  });

  it("says so when there is nothing to rank", () => {
    render(<RankedBars rows={[]} empty="No project links clicked yet." />);
    expect(screen.getByText("No project links clicked yet.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
  });
});

describe("Stat", () => {
  it("shows the change with its sign, and says up or down in words for screen readers", () => {
    const { container } = render(<Stat label="Page views" value="730" change={18} previousLabel="vs the 30 days before" />);
    expect(screen.getByText("730")).toBeInTheDocument();
    expect(container).toHaveTextContent("+18%");
    expect(container.querySelector(".sr-only")).toHaveTextContent("up vs the 30 days before");
  });

  it("says nothing to compare with when there is no earlier period, and shows no change line without one", () => {
    const { container, rerender } = render(<Stat label="Visitors" value="3" change={null} />);
    expect(container.querySelector(".sr-only")).toHaveTextContent("nothing to compare with");
    rerender(<Stat label="Bots filtered" value="3" />);
    expect(container).not.toHaveTextContent("%");
  });
});
