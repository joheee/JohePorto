// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DateSelects from "./DateSelects";

describe("DateSelects", () => {
  it("offers 12 months and years from 5 years ahead down to 1970, newest first", () => {
    render(<DateSelects label="Start" month="" year="" onMonth={vi.fn()} onYear={vi.fn()} />);
    const months = screen.getByLabelText("Start month") as HTMLSelectElement;
    const years = screen.getByLabelText("Start year") as HTMLSelectElement;
    expect([...months.options].map((o) => o.text).slice(0, 3)).toEqual(["Month", "January", "February"]);
    expect(months.options).toHaveLength(13);
    const values = [...years.options].map((o) => o.value).filter(Boolean).map(Number);
    expect(values[0]).toBe(new Date().getFullYear() + 5);
    expect(values.at(-1)).toBe(1970);
  });

  it("reports the chosen month and year as strings", async () => {
    const onMonth = vi.fn();
    const onYear = vi.fn();
    const user = userEvent.setup();
    render(<DateSelects label="Start" month="" year="" onMonth={onMonth} onYear={onYear} />);
    await user.selectOptions(screen.getByLabelText("Start month"), "March");
    await user.selectOptions(screen.getByLabelText("Start year"), "2022");
    expect(onMonth).toHaveBeenCalledWith("3");
    expect(onYear).toHaveBeenCalledWith("2022");
  });

  it("marks both selects required", () => {
    render(<DateSelects label="Start" month="" year="" onMonth={vi.fn()} onYear={vi.fn()} />);
    expect(screen.getByLabelText("Start month")).toBeRequired();
    expect(screen.getByLabelText("Start year")).toBeRequired();
  });
});
