import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import prisma from '../lib/prisma';

export const load: PageServerLoad = async () => {
	let user = await prisma.user.findFirst({
		include: { 
			setting: true,
			books: { orderBy: { createdAt: 'desc' } } // ดึงรายการหนังสือทั้งหมด เรียงจากล่าสุด
		}
	});

	if (!user) {
		user = await prisma.user.create({
			data: {
				email: 'reader@example.com',
				name: 'Default Reader',
				setting: {
					create: {
						bgColor: '#fdf6e3',
						fontSize: 20,
						fontFamily: 'sans-serif',
						soundTrack: 'rain'
					}
				}
			},
			include: { 
				setting: true,
				books: true 
			}
		});
	}

	return { user };
};

export const actions: Actions = {
	updateSetting: async ({ request }) => {
		const data = await request.formData();
		const bgColor = data.get('bgColor')?.toString();
		const fontSize = Number(data.get('fontSize'));
		const fontFamily = data.get('fontFamily')?.toString();
		const soundTrack = data.get('soundTrack')?.toString();

		const user = await prisma.user.findFirst();
		if (!user) return fail(400, { message: 'User not found' });

		await prisma.readerSetting.update({
			where: { userId: user.id },
			data: { bgColor, fontSize, fontFamily, soundTrack }
		});

		return { success: true };
	},

	// Action สำหรับบันทึกหนังสือเล่มใหม่ลงชั้นหนังสือในฐานข้อมูล
	addBook: async ({ request }) => {
		const data = await request.formData();
		const title = data.get('title')?.toString();
		const content = data.get('content')?.toString();

		if (!title || !content) {
			return fail(400, { message: 'ข้อมูลหนังสือไม่ครบถ้วน' });
		}

		const user = await prisma.user.findFirst();
		if (!user) return fail(400, { message: 'User not found' });

		await prisma.book.create({
			data: {
				title,
				content,
				userId: user.id
			}
		});

		return { bookSaved: true };
	}
};