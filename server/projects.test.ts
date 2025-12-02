import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    planType: "FREE",
    planActive: false,
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    stripeCustomerId: null,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("projects", () => {
  it("should create a new project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.projects.create({
      title: "Test Book",
      author: "Test Author",
      genre: "Novel",
      publicationType: "both",
      pageSize: "6x9",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("should list user projects", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const projects = await caller.projects.list();

    expect(Array.isArray(projects)).toBe(true);
  });

  it("should fail to create project without title", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.projects.create({
        title: "",
        publicationType: "both",
        pageSize: "6x9",
      })
    ).rejects.toThrow();
  });
});

describe("chapters", () => {
  it("should create a new chapter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a project
    const project = await caller.projects.create({
      title: "Test Book for Chapters",
      publicationType: "both",
      pageSize: "6x9",
    });

    // Then create a chapter
    const chapter = await caller.chapters.create({
      projectId: project.id,
      title: "Chapter 1",
      content: "<p>Test content</p>",
      type: "chapter",
      orderIndex: 0,
    });

    expect(chapter).toHaveProperty("id");
    expect(typeof chapter.id).toBe("number");
  });

  it("should list project chapters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a project
    const project = await caller.projects.create({
      title: "Test Book",
      publicationType: "both",
      pageSize: "6x9",
    });

    // Create a chapter
    await caller.chapters.create({
      projectId: project.id,
      title: "Chapter 1",
      content: "<p>Test</p>",
      type: "chapter",
      orderIndex: 0,
    });

    // List chapters
    const chapters = await caller.chapters.list({ projectId: project.id });

    expect(Array.isArray(chapters)).toBe(true);
    expect(chapters.length).toBeGreaterThan(0);
  });

  it("should update chapter content", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create project and chapter
    const project = await caller.projects.create({
      title: "Test Book",
      publicationType: "both",
      pageSize: "6x9",
    });

    const chapter = await caller.chapters.create({
      projectId: project.id,
      title: "Chapter 1",
      content: "<p>Original content</p>",
      type: "chapter",
      orderIndex: 0,
    });

    // Update chapter
    const result = await caller.chapters.update({
      id: chapter.id,
      content: "<p>Updated content</p>",
    });

    expect(result.success).toBe(true);
  });

  it("should delete a chapter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create project and chapter
    const project = await caller.projects.create({
      title: "Test Book",
      publicationType: "both",
      pageSize: "6x9",
    });

    const chapter = await caller.chapters.create({
      projectId: project.id,
      title: "Chapter to Delete",
      content: "<p>Content</p>",
      type: "chapter",
      orderIndex: 0,
    });

    // Delete chapter
    const result = await caller.chapters.delete({ id: chapter.id });

    expect(result.success).toBe(true);
  });
});
