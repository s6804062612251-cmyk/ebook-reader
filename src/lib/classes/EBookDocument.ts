export class EBookDocument {
	title: string = '';
	content: string = '';
	pages: string[] = [];
	currentPage: number = 1;
	pageSize: number = 1000; // จำนวนตัวอักษรต่อ 1 หน้า

	loadContent(title: string, text: string) {
		this.title = title;
		this.content = text;
		this.splitPages();
		this.currentPage = 1;
	}

	private splitPages() {
		this.pages = [];
		for (let i = 0; i < this.content.length; i += this.pageSize) {
			this.pages.push(this.content.slice(i, i + this.pageSize));
		}
	}

	get isLoaded(): boolean {
		return this.pages.length > 0;
	}

	get totalPages(): number {
		return this.pages.length || 1;
	}

	get currentPageContent(): string {
		return this.pages[this.currentPage - 1] || '';
	}

	nextPage() {
		if (this.currentPage < this.totalPages) this.currentPage++;
	}

	prevPage() {
		if (this.currentPage > 1) this.currentPage--;
	}
}