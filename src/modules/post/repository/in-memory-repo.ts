
import { Paginated, PagingDTO } from "@shared/model/paging";
import { IPostCommandRepository, IPostQueryRepository, IPostRepository } from "../interfaces";
import { Post, PostCondDTO, PostType, UpdatePostDTO } from "../model";

let data: Post[] = [
	{
		id: "01a1b2c3-d4e5-6789-0123-456789abcdef",
		content: "What is your favorite JavaScript framework?",
		image: "",
		topicId: "0195655a-b870-729b-877f-840a608ca981",
		authorId: "0198c85b-2389-75b7-acbe-95063cd926a0",
		isFeatured: true,
		type: PostType.TEXT,
		commentCount: 2,
		likedCount: 5,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: "02b2c3d4-e5f6-7890-1234-567890abcdef",
		content: "Check out this cool Python snippet!",
		image: "",
		topicId: "0198acff-cce6-7b80-a7cf-a29c27afc342",
		authorId: "01944fb2-efb1-73f8-83cf-2b8d93df2471",
		isFeatured: false,
		type: PostType.TEXT,
		commentCount: 1,
		likedCount: 3,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: "03c3d4e5-f6a7-8901-2345-678901abcdef",
		content: "Rust vs Golang: Which do you prefer for backend?",
		image: "",
		topicId: "0198ad01-bf97-7407-bdbb-61f38e962685",
		authorId: "0198c85b-2389-75b7-acbe-95063cd926a0",
		isFeatured: false,
		type: PostType.TEXT,
		commentCount: 0,
		likedCount: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	{
		id: "04d4e5f6-a7b8-9012-3456-789012abcdef",
		content: "Golang concurrency patterns explained.",
		image: "",
		topicId: "0198ace5-ddc5-753a-915f-6547fe4eaff9",
		authorId: "01944fb2-efb1-73f8-83cf-2b8d93df2471",
		isFeatured: true,
		type: PostType.TEXT,
		commentCount: 3,
		likedCount: 7,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
];

export class PostInMemoryRepository implements IPostRepository {
	constructor(
		private readonly queryRepository: IPostQueryRepository,
		private readonly commandRepository: IPostCommandRepository
	) {}

	findById(id: string): Promise<Post | null> {
		return this.queryRepository.findById(id);
	}

	findByCond(condition: PostCondDTO): Promise<Post | null> {
		return this.queryRepository.findByCond(condition);
	}

	list(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>> {
		return this.queryRepository.list(cond, paging);
	}

	listByIds(ids: string[]): Promise<Post[]> {
		return this.queryRepository.listByIds(ids);
	}

	insert(post: Post): Promise<boolean> {
		return this.commandRepository.insert(post);
	}

	update(id: string, dto: UpdatePostDTO): Promise<boolean> {
		return this.commandRepository.update(id, dto);
	}

	delete(id: string): Promise<boolean> {
		return this.commandRepository.delete(id);
	}

	increaseCount(id: string, field: string, step: number): Promise<boolean> {
		const post = data.find((post) => post.id === id);
		if (!post) return Promise.resolve(false);
		if (field === "commentCount" && typeof post.commentCount === "number") {
			post.commentCount += step;
			post.updatedAt = new Date();
			return Promise.resolve(true);
		}
		if (field === "likedCount" && typeof post.likedCount === "number") {
			post.likedCount += step;
			post.updatedAt = new Date();
			return Promise.resolve(true);
		}
		return Promise.resolve(false);
	}

	decreaseCount(id: string, field: string, step: number): Promise<boolean> {
		const post = data.find((post) => post.id === id);
		if (!post) return Promise.resolve(false);
		if (field === "commentCount" && typeof post.commentCount === "number") {
			post.commentCount = Math.max(0, post.commentCount - step);
			post.updatedAt = new Date();
			return Promise.resolve(true);
		}
		if (field === "likedCount" && typeof post.likedCount === "number") {
			post.likedCount = Math.max(0, post.likedCount - step);
			post.updatedAt = new Date();
			return Promise.resolve(true);
		}
		return Promise.resolve(false);
	}
}

export class PostInMemoryQueryRepository {
	findById(id: string): Promise<Post | null> {
		return Promise.resolve(data.find((post) => post.id === id) || null);
	}

	findByCond(condition: PostCondDTO): Promise<Post | null> {
		return Promise.resolve(
			data.find((post) => {
				if (condition.str && !(post.content && post.content.includes(condition.str))) {
					return false;
				}
				if (condition.userId && post.authorId !== condition.userId) {
					return false;
				}
				if (condition.topicId && post.topicId !== condition.topicId) {
					return false;
				}
				if (condition.isFeatured !== undefined && post.isFeatured !== condition.isFeatured) {
					return false;
				}
				if (condition.type && post.type !== condition.type) {
					return false;
				}
				return true;
			}) || null
		);
	}

	list(cond: PostCondDTO, paging: PagingDTO): Promise<Paginated<Post>> {
		let filtered = data;
		if (cond.str) {
			filtered = filtered.filter(post => post.content && post.content.includes(cond.str as string));
		}
		if (cond.userId) {
			filtered = filtered.filter(post => post.authorId === cond.userId);
		}
		if (cond.topicId) {
			filtered = filtered.filter(post => post.topicId === cond.topicId);
		}
		if (cond.isFeatured !== undefined) {
			filtered = filtered.filter(post => post.isFeatured === cond.isFeatured);
		}
		if (cond.type) {
			filtered = filtered.filter(post => post.type === cond.type);
		}
		const total = filtered.length;
		const page = paging.page;
		const limit = paging.limit;
		const start = (page - 1) * limit;
		const paginatedData = filtered.slice(start, start + limit);
		return Promise.resolve({
			data: paginatedData,
			paging: { ...paging, page, limit, total },
			total,
		});
	}

	listByIds(ids: string[]): Promise<Post[]> {
		return Promise.resolve(data.filter((post) => ids.includes(post.id)));
	}
}

export class PostInMemoryCommandRepository {
	insert(post: Post): Promise<boolean> {
		data.push(post);
		return Promise.resolve(true);
	}

	update(id: string, dto: UpdatePostDTO): Promise<boolean> {
		const post = data.find((post) => post.id === id);
		if (!post) return Promise.resolve(false);
		if (dto.content !== undefined) post.content = dto.content;
		if (dto.image !== undefined) post.image = dto.image;
		if (dto.topicId !== undefined) post.topicId = dto.topicId;
		if (dto.isFeatured !== undefined) post.isFeatured = dto.isFeatured;
		if (dto.type !== undefined) post.type = dto.type;
		if (dto.commentCount !== undefined) post.commentCount = dto.commentCount;
		if (dto.likedCount !== undefined) post.likedCount = dto.likedCount;
		post.updatedAt = new Date();
		return Promise.resolve(true);
	}

	delete(id: string): Promise<boolean> {
		const initialLength = data.length;
		data = data.filter((post) => post.id !== id);
		return Promise.resolve(data.length < initialLength);
	}

}
