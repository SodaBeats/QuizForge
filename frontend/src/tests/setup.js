import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// With `globals: false`, RTL's auto-cleanup never registers — do it manually.
afterEach(() => cleanup());
