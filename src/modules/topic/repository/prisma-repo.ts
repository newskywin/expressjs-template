import { prisma } from "@shared/components/prisma";
import { ITopicRepository } from "../interfaces";
import { Topic, TopicCondDTO, TopicUpdateDTO } from "../model";
import { Paginated, PagingDTO } from "@shared/model/paging";

export class TopicPrismaRepository implements ITopicRepository {
  async create(data: Topic): Promise<boolean> {
    await prisma.topics.create({ data });
    return true;
  }

  async update(id: string, data: TopicUpdateDTO): Promise<boolean> {
    await prisma.topics.update({ where: { id }, data });
    return true;
  }

  async delete(id: string): Promise<boolean> {
    await prisma.topics.delete({ where: { id } });
    return true;
  }

  async findById(id: string): Promise<Topic | null> {
    const topic = await prisma.topics.findUnique({ where: { id } });
    if (!topic) {
        return null;
    }
    return topic as Topic;
  }

  async findByCond(condition: TopicCondDTO): Promise<Topic | null> {
    const topic = await prisma.topics.findFirst({ where: condition });
    return topic as Topic;
  }

  async list(condition: TopicCondDTO, paging: PagingDTO): Promise<Paginated<Topic>> {
    const total = await prisma.topics.count({ where: condition });

    // Build orderBy dynamically
    let orderBy: any = undefined;
    const sortField = paging.sort || 'id';
    const sortOrder = paging.order?.toLowerCase() === "desc" ? "desc" : "asc";
    
    orderBy = {
      [sortField]: sortOrder
    };

    let data: any[];

    if (paging.cursor) {
      // Cursor-based seeking: Use cursor to find starting point
      const cursorCondition = {
        ...condition,
        // Add cursor condition based on sort field and order
        ...(sortOrder === 'desc' 
          ? { [sortField]: { lt: paging.cursor } }
          : { [sortField]: { gt: paging.cursor } }
        )
      };

      data = await prisma.topics.findMany({
        where: cursorCondition,
        take: paging.limit,
        orderBy
      });
    } else {
      // Offset-based pagination: Use skip for initial pages
      const skip = (paging.page - 1) * paging.limit;
      
      // For better performance, limit offset-based queries to reasonable ranges
      const maxOffsetPages = 100; // Adjust based on your needs
      const useOffset = paging.page <= maxOffsetPages;

      if (useOffset) {
        data = await prisma.topics.findMany({
          where: condition,
          take: paging.limit,
          skip,
          orderBy
        });
      } else {
        // For deep pagination, fall back to cursor-based approach
        // This requires calculating an approximate cursor position
        const approximateSkip = Math.max(0, skip - (paging.limit * 10)); // Go back a bit for safety
        
        const intermediateResults = await prisma.topics.findMany({
          where: condition,
          take: paging.limit * 11, // Get extra records to find the right starting point
          skip: approximateSkip,
          orderBy,
          select: { [sortField]: true } // Only select the sort field for efficiency
        });

        if (intermediateResults.length > 0) {
          const targetIndex = skip - approximateSkip;
          const cursorValue = intermediateResults[Math.min(targetIndex, intermediateResults.length - 1)][sortField];
          
          const cursorCondition = {
            ...condition,
            [sortField]: sortOrder === 'desc' 
              ? { lte: cursorValue }
              : { gte: cursorValue }
          };

          data = await prisma.topics.findMany({
            where: cursorCondition,
            take: paging.limit,
            orderBy
          });
        } else {
          data = [];
        }
      }
    }

    // Generate next cursor for subsequent requests
    let nextCursor: string | undefined;
    if (data.length === paging.limit) {
      const lastItem = data[data.length - 1];
      nextCursor = lastItem[sortField]?.toString();
    }

    // Update paging info
    const updatedPaging: PagingDTO = {
      ...paging,
      cursor: nextCursor
  };

  return {
    data: data as Topic[],
    paging: updatedPaging,
    total
  };
}


  async increaseTopicPostCount(id: string, field: string, step: number): Promise<boolean> {
    await prisma.topics.update({
      where: {
        id
      },
      data: {
        [field]: {
          increment: step
        }
      }
    })
    return true;
  }

  async decreaseTopicPostCount(id: string, field: string, step: number): Promise<boolean> {
    await prisma.topics.update({
      where: {
        id
      },
      data: {
        [field]: {
          decrement: step
        }
      }

    })
    return true;
  };

  async findByIds(ids: string[]): Promise<Topic[]> {
    const topics = await prisma.topics.findMany({ where: { id: { in: ids } } });
    return topics as Topic[];
  }
}
