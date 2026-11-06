<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data, form } = $props();

	// Reactive States
	let bookContent = $state('');
	let fileName = $state('');
	let showBookshelf = $state(false);
	
	let bgColor = $state(data.user?.setting?.bgColor || '#fdf6e3');
	let fontSize = $state(data.user?.setting?.fontSize || 20);
	let fontFamily = $state(data.user?.setting?.fontFamily || 'sans-serif');
	let soundTrack = $state(data.user?.setting?.soundTrack || 'none');

	let viewMode = $state<'scroll' | 'page'>('scroll');
	let currentPage = $state(0);
	const charsPerPage = 2000;

	let bookPages = $derived(() => {
		if (!bookContent) return [];
		const pages: string[] = [];
		for (let i = 0; i < bookContent.length; i += charsPerPage) {
			pages.push(bookContent.slice(i, i + charsPerPage));
		}
		return pages;
	});

	function nextPage() {
		const pages = bookPages();
		if (currentPage < pages.length - 1) currentPage++;
	}

	function prevPage() {
		if (currentPage > 0) currentPage--;
	}

	function selectBook(title: string, content: string) {
		fileName = title;
		bookContent = content;
		currentPage = 0;
		showBookshelf = false;
	}

	async function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			const file = target.files[0];
			fileName = file.name;
			bookContent = await file.text();
			currentPage = 0;
		}
	}

	// Web Audio Synthesizer
	let audioCtx: AudioContext | null = null;
	let noiseNode: AudioNode | null = null;
	let gainNode: GainNode | null = null;

	function stopSound() {
		if (noiseNode) {
			try { (noiseNode as AudioScheduledSourceNode).stop(); } catch {}
			noiseNode.disconnect();
			noiseNode = null;
		}
	}

	function playSound(type: string) {
		stopSound();
		if (type === 'none') return;

		if (!audioCtx) {
			audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
		}
		if (audioCtx.state === 'suspended') {
			audioCtx.resume();
		}

		const bufferSize = audioCtx.sampleRate * 2;
		const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
		const output = buffer.getChannelData(0);

		for (let i = 0; i < bufferSize; i++) {
			output[i] = Math.random() * 2 - 1;
		}

		const whiteNoise = audioCtx.createBufferSource();
		whiteNoise.buffer = buffer;
		whiteNoise.loop = true;

		const filter = audioCtx.createBiquadFilter();
		gainNode = audioCtx.createGain();

		if (type === 'rain') {
			filter.type = 'lowpass';
			filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
			gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
		} else if (type === 'forest') {
			filter.type = 'bandpass';
			filter.frequency.setValueAtTime(800, audioCtx.currentTime);
			filter.Q.setValueAtTime(3, audioCtx.currentTime);
			gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
		} else if (type === 'fire') {
			filter.type = 'lowpass';
			filter.frequency.setValueAtTime(400, audioCtx.currentTime);
			gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
		}

		whiteNoise.connect(filter);
		filter.connect(gainNode);
		gainNode.connect(audioCtx.destination);
		whiteNoise.start();
		noiseNode = whiteNoise;
	}

	$effect(() => {
		playSound(soundTrack);
		return () => stopSound();
	});

	let textColor = $derived(bgColor === '#1e293b' || bgColor === '#0f172a' ? '#f8fafc' : '#1e293b');
</script>

<div class="min-h-screen w-full flex flex-col transition-colors duration-300" style="background-color: {bgColor}; font-family: {fontFamily}; color: {textColor};">
	
	<!-- Top Control Bar -->
	<header class="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-3 sticky top-0 z-50 shadow-sm flex flex-wrap items-center justify-between gap-4">
		<div class="flex items-center gap-3">
			<h1 class="text-lg font-bold tracking-tight">E-Book Reader</h1>
			<button 
				onclick={() => showBookshelf = true}
				class="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5">
				📚 ชั้นหนังสือ ({data.user?.books?.length || 0})
			</button>
			{#if fileName}
				<span class="text-xs opacity-60 font-mono hidden sm:inline">| 📖 {fileName}</span>
			{/if}
		</div>

		<!-- Controls -->
		<div class="flex flex-wrap items-center gap-3 text-xs">
			<div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
				<button type="button" onclick={() => viewMode = 'scroll'} class="px-3 py-1.5 rounded-md font-medium transition-all {viewMode === 'scroll' ? 'bg-indigo-600 text-white shadow-sm' : 'opacity-70 hover:opacity-100'}">📜 เลื่อนยาว</button>
				<button type="button" onclick={() => viewMode = 'page'} class="px-3 py-1.5 rounded-md font-medium transition-all {viewMode === 'page' ? 'bg-indigo-600 text-white shadow-sm' : 'opacity-70 hover:opacity-100'}">📖 ทีละหน้า</button>
			</div>

			<select bind:value={bgColor} class="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none font-medium">
				<option value="#fdf6e3">ถนอมสายตา (Sepia)</option>
				<option value="#ffffff">สว่าง (White)</option>
				<option value="#1e293b">มืด (Dark Slate)</option>
				<option value="#0f172a">มืดสนิท (Night)</option>
			</select>

			<div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg">
				<span>ขนาด:</span>
				<input type="range" min="14" max="36" bind:value={fontSize} class="w-20 accent-indigo-600 cursor-pointer" />
				<span class="w-6 text-right font-mono">{fontSize}px</span>
			</div>

			<select bind:value={fontFamily} class="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none font-medium">
				<option value="sans-serif">Sans-Serif</option>
				<option value="serif">Serif</option>
				<option value="monospace">Monospace</option>
			</select>

			<select bind:value={soundTrack} class="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none font-medium">
				<option value="none">🔇 ปิดเสียง</option>
				<option value="rain">🌧️ เสียงฝน</option>
				<option value="forest">🌲 เสียงป่า</option>
				<option value="fire">🔥 เสียงไฟ</option>
			</select>

			<form method="POST" action="?/updateSetting" use:enhance class="flex items-center">
				<input type="hidden" name="bgColor" value={bgColor} />
				<input type="hidden" name="fontSize" value={fontSize} />
				<input type="hidden" name="fontFamily" value={fontFamily} />
				<input type="hidden" name="soundTrack" value={soundTrack} />
				<button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3.5 py-1.5 rounded-lg transition-all shadow-sm active:scale-95">💾 บันทึก DB</button>
			</form>
		</div>
	</header>

	{#if form?.success}
		<div class="bg-emerald-500 text-white text-xs text-center py-1 font-medium">✓ บันทึกการตั้งค่าลงฐานข้อมูล PostgreSQL สำเร็จ!</div>
	{/if}

	<!-- Modal ชั้นหนังสือ (Bookshelf Drawer/Modal) -->
	{#if showBookshelf}
		<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 max-h-[85vh] flex flex-col">
				<div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
					<h2 class="text-lg font-bold flex items-center gap-2">📚 ชั้นหนังสือของคุณ</h2>
					<button onclick={() => showBookshelf = false} class="text-slate-400 hover:text-slate-600 text-lg font-bold px-2">✕</button>
				</div>

				<!-- ฟอร์มเพิ่มหนังสือเล่มใหม่เข้า DB พร้อมใช้ invalidateAll โหลดข้อมูลใหม่ -->
				<form 
					method="POST" 
					action="?/addBook" 
					use:enhance={() => {
						return async ({ result }) => {
							if (result.type === 'success') {
								await invalidateAll();
							}
						};
					}} 
					class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
					<h3 class="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">➕ เพิ่มหนังสือเล่มใหม่เข้าชั้นหนังสือ</h3>
					<div class="space-y-2">
						<input type="file" accept=".txt,.md" onchange={handleFileChange} class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer" />
						{#if fileName}
							<input type="hidden" name="title" value={fileName} />
							<input type="hidden" name="content" value={bookContent} />
							<div class="flex items-center justify-between pt-1">
								<span class="text-xs font-mono opacity-70">เลือกไฟล์: {fileName}</span>
								<button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-all">
									บันทึกเข้าชั้นหนังสือ DB
								</button>
							</div>
						{/if}
					</div>
				</form>

				<!-- รายการหนังสือใน DB -->
				<div class="flex-1 overflow-y-auto space-y-2 pr-1">
					<h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">📖 รายการหนังสือที่บันทึกไว้</h3>
					{#if data.user?.books && data.user.books.length > 0}
						<div class="grid grid-cols-1 gap-2">
							{#each data.user.books as book}
								<div class="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 bg-white dark:bg-slate-800/80 transition-all">
									<div>
										<h4 class="font-semibold text-sm">{book.title}</h4>
										<span class="text-[10px] opacity-50 font-mono">เพิ่มเมื่อ: {new Date(book.createdAt).toLocaleDateString()}</span>
									</div>
									<button 
										onclick={() => selectBook(book.title, book.content)}
										class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition-all">
										เปิดอ่าน
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-xs text-slate-400 text-center py-8">ยังไม่มีหนังสือในชั้นหนังสือ อัปโหลดไฟล์ด้านบนเพื่อบันทึกได้เลย</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Main Reader Area -->
	<main class="flex-1 w-full px-4 sm:px-12 md:px-20 py-8 flex flex-col">
		{#if bookContent}
			{#if viewMode === 'scroll'}
				<div class="w-full max-w-6xl mx-auto leading-relaxed whitespace-pre-wrap select-text space-y-4" style="font-size: {fontSize}px;">
					{bookContent}
				</div>
			{:else}
				<div class="flex-1 w-full max-w-6xl mx-auto flex flex-col justify-between">
					<div class="leading-relaxed whitespace-pre-wrap select-text flex-1" style="font-size: {fontSize}px;">
						{bookPages()[currentPage] || ''}
					</div>

					<div class="w-full flex items-center justify-between border-t border-slate-300/30 pt-4 mt-8">
						<button onclick={prevPage} disabled={currentPage === 0} class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all">← หน้าก่อนหน้า</button>
						<span class="text-xs font-mono opacity-70">หน้าที่ {currentPage + 1} จาก {bookPages().length}</span>
						<button onclick={nextPage} disabled={currentPage >= bookPages().length - 1} class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all">หน้าถัดไป →</button>
					</div>
				</div>
			{/if}
		{:else}
			<div class="flex-1 w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-400/40 rounded-2xl p-12 my-auto">
				<div class="text-center space-y-4">
					<p class="text-base font-medium opacity-80">ยังไม่ได้เลือกหนังสือ เปิด "ชั้นหนังสือ" เพื่อเลือกหนังสือหรืออัปโหลดไฟล์ใหม่</p>
					<button onclick={() => showBookshelf = true} class="inline-block bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-6 py-3 rounded-xl cursor-pointer transition-all shadow-lg active:scale-95">
						📚 เปิดชั้นหนังสือ
					</button>
				</div>
			</div>
		{/if}
	</main>
</div>