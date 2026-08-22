import { Course, CourseSlide, GurujiSlideContext, Module, RichBlock } from '@signalhub/types';

export class GurujiContextBuilder {
  private static courseKnowledgeCache: Map<string, any> = new Map();

  /**
   * Extract plain text and block summaries from a CourseSlide
   */
  public static extractSlideBlocksText(slide: CourseSlide): string {
    const parts: string[] = [];

    if (slide.body_markdown) {
      parts.push(slide.body_markdown);
    }

    if (slide.blocks && Array.isArray(slide.blocks)) {
      slide.blocks.forEach((block: RichBlock) => {
        const c = block.content || {};
        if (c.text) parts.push(c.text);
        if (c.items && Array.isArray(c.items)) parts.push(c.items.join(', '));
        if (c.headers && c.rows) {
          parts.push(`Table with columns: ${c.headers.join(', ')}`);
        }
        if (c.caption) parts.push(`Caption: ${c.caption}`);
        if (c.alt) parts.push(`Image: ${c.alt}`);
      });
    }

    return parts.join(' ').trim();
  }

  /**
   * Build complete GurujiSlideContext from active course player state
   */
  public static buildSlideContext(
    course: Course,
    module: Module,
    slide: CourseSlide,
    allSlidesInModule: CourseSlide[],
    currentSlideIdx: number
  ): GurujiSlideContext {
    const blocksText = this.extractSlideBlocksText(slide);

    let tablesSummary: string | undefined;
    const tableBlock = (slide.blocks || []).find((b: any) => b.type === 'table');
    if (tableBlock && tableBlock.content) {
      const { headers, rows } = tableBlock.content;
      tablesSummary = `${(headers || []).join(' | ')}\n${(rows || [])
        .map((r: string[]) => r.join(' | '))
        .slice(0, 4)
        .join('\n')}`;
    }

    const prevSlide = currentSlideIdx > 0 ? allSlidesInModule[currentSlideIdx - 1] : undefined;
    const nextSlide = currentSlideIdx < allSlidesInModule.length - 1 ? allSlidesInModule[currentSlideIdx + 1] : undefined;

    const imageUrls: string[] = [];
    if (slide.media_url && slide.content_type === 'image') {
      imageUrls.push(slide.media_url);
    }
    (slide.blocks || []).forEach((b: any) => {
      if (b.type === 'image' && b.content?.url) {
        imageUrls.push(b.content.url);
      }
    });

    return {
      courseId: course.id,
      courseTitle: course.title,
      courseSummary: course.summary || course.description,
      moduleId: module.id,
      moduleTitle: module.title,
      slideId: slide.id,
      slideNumber: slide.slide_number || currentSlideIdx + 1,
      slideTitle: slide.title,
      contentType: slide.content_type,
      bodyMarkdown: slide.body_markdown,
      codeSnippet: slide.code_snippet,
      blocksText,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      tablesSummary,
      notes: slide.notes,
      prevSlideTitle: prevSlide?.title,
      nextSlideTitle: nextSlide?.title,
    };
  }

  /**
   * Cache course scan knowledge in memory and localStorage
   */
  public static cacheCourseKnowledge(courseId: string, knowledge: any) {
    this.courseKnowledgeCache.set(courseId, knowledge);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`tg_guruji_knowledge_${courseId}`, JSON.stringify(knowledge));
      } catch (e) {}
    }
  }

  public static getCachedCourseKnowledge(courseId: string): any | null {
    if (this.courseKnowledgeCache.has(courseId)) {
      return this.courseKnowledgeCache.get(courseId);
    }
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`tg_guruji_knowledge_${courseId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.courseKnowledgeCache.set(courseId, parsed);
          return parsed;
        }
      } catch (e) {}
    }
    return null;
  }
}
