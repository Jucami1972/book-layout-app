import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Hierarchical Book Structure", () => {
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  it("should create project with subtitle", async () => {
    const result = await caller.projects.create({
      title: "INDOMABLE",
      subtitle: "La ciencia de convertir el miedo en valentía",
      author: "Juan C Cabrera M",
      genre: "Desarrollo Personal",
    });

    expect(result.id).toBeDefined();

    const project = await caller.projects.get({ id: result.id });
    expect(project.title).toBe("INDOMABLE");
    expect(project.subtitle).toBe("La ciencia de convertir el miedo en valentía");
    expect(project.author).toBe("Juan C Cabrera M");
  });

  it("should support all chapter types including part and subchapter", async () => {
    const project = await caller.projects.create({
      title: "Test Book",
      author: "Test Author",
    });

    // Create a part
    const partId = await caller.chapters.create({
      projectId: project.id,
      title: "PARTE I: Introducción",
      content: "<p>Contenido de la parte</p>",
      type: "part",
      level: 1,
      orderIndex: 0,
    });

    // Create a chapter
    const chapterId = await caller.chapters.create({
      projectId: project.id,
      title: "Capítulo 1: Fundamentos",
      content: "<p>Contenido del capítulo</p>",
      type: "chapter",
      level: 2,
      orderIndex: 1,
    });

    // Create a subchapter (parentId is optional for now)
    const subchapterId = await caller.chapters.create({
      projectId: project.id,
      title: "1.1 Conceptos básicos",
      content: "<p>Contenido del subcapítulo</p>",
      type: "subchapter",
      level: 3,
      orderIndex: 2,
    });

    // Verify all were created
    expect(partId).toBeDefined();
    expect(chapterId).toBeDefined();
    expect(subchapterId).toBeDefined();

    // Verify the structure
    const chapters = await caller.chapters.list({ projectId: project.id });
    expect(chapters.length).toBe(3);
    
    const part = chapters.find(ch => ch.id === partId);
    const chapter = chapters.find(ch => ch.id === chapterId);
    const subchapter = chapters.find(ch => ch.id === subchapterId);

    expect(part?.type).toBe("part");
    expect(part?.level).toBe(1);
    
    expect(chapter?.type).toBe("chapter");
    expect(chapter?.level).toBe(2);
    
    expect(subchapter?.type).toBe("subchapter");
    expect(subchapter?.level).toBe(3);
  });

  it("should support frontmatter and backmatter sections", async () => {
    const project = await caller.projects.create({
      title: "Test Book",
    });

    const dedicatoriaId = await caller.chapters.create({
      projectId: project.id,
      title: "Dedicatoria",
      content: "<p>Para mi familia</p>",
      type: "frontmatter",
      level: 1,
      orderIndex: 0,
    });

    const bibliografiaId = await caller.chapters.create({
      projectId: project.id,
      title: "Bibliografía",
      content: "<p>Referencias</p>",
      type: "backmatter",
      level: 1,
      orderIndex: 1,
    });

    expect(dedicatoriaId).toBeDefined();
    expect(bibliografiaId).toBeDefined();

    const chapters = await caller.chapters.list({ projectId: project.id });
    expect(chapters.length).toBe(2);
    
    const dedicatoria = chapters.find(ch => ch.id === dedicatoriaId);
    const bibliografia = chapters.find(ch => ch.id === bibliografiaId);

    expect(dedicatoria?.type).toBe("frontmatter");
    expect(bibliografia?.type).toBe("backmatter");
  });
});
