import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FileViewer } from "../features/quizzes/components/FileViewer";
import { QuestionEditor } from "../features/quizzes/components/QuestionEditor";
import { tokenUsageApi } from "../features/quizzes/api/tokenUsage.api";

const renderWithClient = (ui) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {ui}
    </QueryClientProvider>,
  );

const underLimit = {
  embedding: { used: 12000, limit: 50000 },
  generation: { used: 48000, limit: 50000 },
};

const renderQuestionEditor = () =>
  renderWithClient(
    <QuestionEditor
      selectedQuestion={null}
      setSelectedQuestionId={() => {}}
      quizMetadata={null}
      onGenerationStart={() => {}}
      onGenerationComplete={() => {}}
    />,
  );

beforeEach(() => {
  vi.spyOn(tokenUsageApi, "get").mockResolvedValue(underLimit);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FileViewer header — embedding token usage", () => {
  it("shows the used/limit numbers under the daily limit", async () => {
    renderWithClient(<FileViewer selectedFile={null} />);

    const line = await screen.findByText(
      "Embedding: 12,000 / 50,000 tokens",
    );
    expect(line).toBeInTheDocument();
    expect(line).toHaveClass("text-muted");
    expect(line).not.toHaveClass("text-red-400");
  });

  it("turns red with an over-limit suffix once usage exceeds the limit", async () => {
    tokenUsageApi.get.mockResolvedValue({
      embedding: { used: 60000, limit: 50000 },
      generation: { used: 0, limit: 50000 },
    });
    renderWithClient(<FileViewer selectedFile={null} />);

    const line = await screen.findByText(
      "Embedding: 60,000 / 50,000 tokens — over daily limit",
    );
    expect(line).toHaveClass("text-red-400");
  });

  it("hides the numbers when the usage query fails, keeping the header", async () => {
    tokenUsageApi.get.mockRejectedValue(new Error("usage down"));
    renderWithClient(<FileViewer selectedFile={null} />);

    expect(screen.getByText("File viewer")).toBeInTheDocument();
    expect(screen.queryByText(/Embedding:/)).toBeNull();
  });
});

describe("QuestionEditor header — generation token usage", () => {
  it("shows the used/limit numbers under the daily limit", async () => {
    renderQuestionEditor();

    const line = await screen.findByText(
      "Generation: 48,000 / 50,000 tokens",
    );
    expect(line).toBeInTheDocument();
    expect(line).toHaveClass("text-muted");
  });

  it("turns red with an over-limit suffix once usage exceeds the limit", async () => {
    tokenUsageApi.get.mockResolvedValue({
      embedding: { used: 0, limit: 50000 },
      generation: { used: 75000, limit: 50000 },
    });
    renderQuestionEditor();

    const line = await screen.findByText(
      "Generation: 75,000 / 50,000 tokens — over daily limit",
    );
    expect(line).toHaveClass("text-red-400");
  });
});
